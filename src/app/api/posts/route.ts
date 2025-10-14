import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserInfo } from '@/lib/user-utils';
import type { PostDocument, PostData } from '@/lib/models';
import { ObjectId } from 'mongodb';

async function extractImageRefsFromVorpngResponse(uplJson: any): Promise<{ uuid: string; url: string }[]> {
  const refs: { uuid: string; url: string }[] = [];

  if (!uplJson) return refs;

  // Prioridade: uplJson.image.uuid
  if (uplJson.image && (uplJson.image.uuid || uplJson.image.id)) {
    const id = uplJson.image.uuid || uplJson.image.id;
    const url = uplJson.image.downloadUrl || uplJson.image.url || `https://vorpng.caiots.dev/images/${id}`;
    refs.push({ uuid: String(id), url });
    return refs;
  }

  // data[]
  if (Array.isArray(uplJson.data)) {
    for (const i of uplJson.data) {
      if (!i) continue;
      if (i.uuid) refs.push({ uuid: String(i.uuid), url: i.downloadUrl || i.url || `https://vorpng.caiots.dev/images/${i.uuid}` });
      else if (i.id) refs.push({ uuid: String(i.id), url: i.downloadUrl || i.url || `https://vorpng.caiots.dev/images/${i.id}` });
      else if (i.url) {
        try {
          const parsed = new URL(i.url);
          const parts = parsed.pathname.split('/').filter(Boolean);
          let id = parts[parts.length - 1] || i.url;
          id = id.split('.').slice(0, -1).join('.') || id;
          refs.push({ uuid: id, url: i.url });
        } catch (e) {
          // ignore
        }
      }
    }
    if (refs.length) return refs;
  }

  // images[]
  if (Array.isArray(uplJson.images)) {
    for (const it of uplJson.images) {
      if (!it) continue;
      if (typeof it === 'string') {
        try {
          const parsed = new URL(it);
          const parts = parsed.pathname.split('/').filter(Boolean);
          let id = parts[parts.length - 1] || it;
          id = id.split('.').slice(0, -1).join('.') || id;
          refs.push({ uuid: id, url: it });
        } catch (e) {
          refs.push({ uuid: it, url: it });
        }
      } else if (typeof it === 'object' && (it.uuid || it.id)) {
        const id = it.uuid || it.id;
        refs.push({ uuid: String(id), url: it.downloadUrl || it.url || `https://vorpng.caiots.dev/images/${id}` });
      }
    }
    if (refs.length) return refs;
  }

  // single url
  if (typeof uplJson.url === 'string') {
    try {
      const parsed = new URL(uplJson.url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      let id = parts[parts.length - 1] || uplJson.url;
      id = id.split('.').slice(0, -1).join('.') || id;
      refs.push({ uuid: id, url: uplJson.url });
      return refs;
    } catch (e) {
      // ignore
    }
  }

  // fallback: image.url
  if (uplJson.image && typeof uplJson.image === 'object' && typeof uplJson.image.url === 'string') {
    try {
      const parsed = new URL(uplJson.image.url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      let id = parts[parts.length - 1] || uplJson.image.url;
      id = id.split('.').slice(0, -1).join('.') || id;
      refs.push({ uuid: id, url: uplJson.image.url });
    } catch (e) {
      // ignore
    }
  }

  return refs;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let content = '';
    let images: { uuid: string; url: string }[] = [];
    let location: { name?: string; address?: string; coordinates?: { lat: number; lng: number } } | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const contentField = formData.get('content');
      content = typeof contentField === 'string' ? contentField : '';

      const locationField = formData.get('location');
      if (locationField && typeof locationField === 'string') {
        try { location = JSON.parse(locationField); } catch { }
      }

      // collect File entries from the incoming FormData
      const files: File[] = [];
      for (const [k, v] of formData.entries()) {
        if (v instanceof File) files.push(v);
      }

      if (files.length > 0) {
        const vorpngToken = process.env.VORPNG_API_TOKEN;
        if (!vorpngToken) {
          console.error('VORPNG_API_TOKEN not set; skipping image upload');
        } else {
          // Upload each image individually to ensure compatibility
          const uploadedImages: { uuid: string; url: string }[] = [];

          for (const file of files) {
            let uploadSuccessful = false;
            const tryFieldNames = ['file', 'files', 'image', 'images'];

            for (const fieldName of tryFieldNames) {
              const singleFileForm = new FormData();
              singleFileForm.append(fieldName, file);

              try {
                const uploadResp = await fetch('https://vorpng.caiots.dev/images/upload', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${vorpngToken}` },
                  body: singleFileForm as any
                });

                if (uploadResp.ok) {
                  const uplJson = await uploadResp.json();
                  const refs = await extractImageRefsFromVorpngResponse(uplJson);
                  if (refs.length > 0) {
                    uploadedImages.push(refs[0]); // Take the first (and should be only) image
                    uploadSuccessful = true;
                    console.log(`Successfully uploaded image with field name '${fieldName}':`, refs[0]);
                    break;
                  }
                } else {
                  const bodyText = await uploadResp.text().catch(() => '');
                  if (uploadResp.status === 400 && /Unexpected field/i.test(bodyText)) {
                    console.warn(`vorpng rejected field '${fieldName}' for file ${file.name}, trying next`);
                    continue;
                  }
                  console.warn(`Upload failed for ${file.name} with field '${fieldName}':`, uploadResp.status, bodyText);
                  break;
                }
              } catch (e) {
                console.error(`Erro ao conectar ao vorpng para arquivo ${file.name}:`, e);
                break;
              }
            }

            if (!uploadSuccessful) {
              console.warn(`Failed to upload file: ${file.name}`);
              // Continue with other files even if one fails
            }
          }

          images = uploadedImages;
          console.log(`Successfully uploaded ${uploadedImages.length} out of ${files.length} images`);
        }
      }
    } else {
      const body = await request.json();
      content = body.content || '';
      if (body.location) {
        const loc = body.location;
        if (typeof loc === 'object') {
          location = {
            name: typeof loc.name === 'string' ? loc.name : undefined,
            address: typeof loc.address === 'string' ? loc.address : undefined,
            coordinates: loc.coordinates && typeof loc.coordinates.lat === 'number' && typeof loc.coordinates.lng === 'number' ? { lat: loc.coordinates.lat, lng: loc.coordinates.lng } : undefined
          };
        }
      }
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo do post é obrigatório' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'Conteúdo do post não pode ter mais de 500 caracteres' }, { status: 400 });
    }

    const db = await getDatabase();
    const postsCollection = db.collection<PostDocument>('posts');

    const now = new Date();
    const postDocument: PostDocument = {
      content: content.trim(),
      authorId: userId,
      location,
      images,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const result = await postsCollection.insertOne(postDocument);
    if (!result.insertedId) return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });

    const author = await getUserInfo(userId);

    const postData: PostData = {
      id: result.insertedId.toString(),
      content: postDocument.content,
      authorId: postDocument.authorId,
      author,
      location: postDocument.location ?? null,
      images: postDocument.images || [],
      likesCount: postDocument.likesCount,
      commentsCount: postDocument.commentsCount,
      isLiked: false,
      createdAt: postDocument.createdAt,
      updatedAt: postDocument.updatedAt
    };

    return NextResponse.json({ data: postData }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}