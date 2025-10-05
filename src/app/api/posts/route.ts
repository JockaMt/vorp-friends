import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserInfo } from '@/lib/user-utils';
import type { PostDocument, PostData } from '@/lib/models';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é FormData (com imagens) ou JSON
    const contentType = request.headers.get('content-type') || '';
    let content: string;
    let images: string[] = [];

    let location: { name?: string; address?: string; coordinates?: { lat: number; lng: number } } | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = formData.get('content') as string;
      const locationField = formData.get('location');
      if (locationField && typeof locationField === 'string') {
        try {
          location = JSON.parse(locationField);
        } catch {}
      }
      
      // TODO: Implementar upload de imagens
      // Por enquanto, ignoramos as imagens até implementar storage
      // const imageFiles = formData.getAll('images') as File[];
      // images = await uploadImages(imageFiles);
    } else {
      const body = await request.json();
      content = body.content;
      if (body.location) {
        const loc = body.location;
        // basic validation
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
    
    if (!result.insertedId) {
      return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
    }

    // Buscar informações do autor
    const author = await getUserInfo(userId);

    // Retornar o post criado
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

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = await getDatabase();
    const postsCollection = db.collection<PostDocument>('posts');

    const post = await postsCollection.findOne({ _id: new ObjectId(params.postId), authorId: userId });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado ou você não tem permissão para deletá-lo' }, { status: 404 });
    }

    await postsCollection.deleteOne({ _id: new ObjectId(params.postId) });

    return NextResponse.json({ message: 'Post deletado com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}