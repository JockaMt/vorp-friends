import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserInfo } from '@/lib/user-utils';
import type { PostDocument, PostData } from '@/lib/models';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { postId } = await params;

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'ID do post inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo do post é obrigatório' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Conteúdo do post não pode ter mais de 500 caracteres' }, { status: 400 });
    }

    const db = await getDatabase();
    const postsCollection = db.collection<PostDocument>('posts');

    // Verificar se o post existe e se o usuário é o autor
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: 'Apenas o autor pode editar o post' }, { status: 403 });
    }

    // Atualizar o post
    const updatedPost = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      {
        $set: {
          content: content.trim(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedPost) {
      return NextResponse.json({ error: 'Erro ao atualizar post' }, { status: 500 });
    }

    // Buscar informações do autor
    const author = await getUserInfo(userId);

    // Retornar o post atualizado
    const postData: PostData = {
      id: updatedPost._id!.toString(),
      content: updatedPost.content,
      authorId: updatedPost.authorId,
      author,
      location: updatedPost.location ?? null,
      images: updatedPost.images || [],
      likesCount: updatedPost.likesCount,
      commentsCount: updatedPost.commentsCount,
      isLiked: updatedPost.likes.includes(userId),
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt
    };

    return NextResponse.json({ data: postData });
  } catch (error) {
    console.error('Erro ao editar post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { postId } = await params;

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'ID do post inválido' }, { status: 400 });
    }

    const db = await getDatabase();
    const postsCollection = db.collection('posts');
    const commentsCollection = db.collection('comments');

    // Verificar se o post existe e se o usuário é o autor
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: 'Apenas o autor pode deletar o post' }, { status: 403 });
    }

    // Se houver imagens associadas, tentar deletá-las primeiro no serviço de imagens (vorpng)
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      const vorpngToken = process.env.VORPNG_API_TOKEN;
      if (!vorpngToken) {
        console.error('VORPNG_API_TOKEN não configurado; não é possível remover imagens do serviço externo. Abortando delete do post.');
        return NextResponse.json({ error: 'Não é possível deletar imagens sem VORPNG_API_TOKEN configurado' }, { status: 500 });
      }

      const failures: Array<{ image: string; tried: string[]; status?: number; body?: string }> = [];

      // Tentar deletar cada imagem. Se qualquer deleção falhar, abortar a operação.
      for (const img of post.images) {
        if (!img) continue;

        // img can be a string (legacy) or an object { uuid, url }
        let raw = img as any;
        let candidateUrl: string | undefined;
        let id = '';

        if (typeof raw === 'string') {
          candidateUrl = raw;
        } else if (raw && typeof raw === 'object') {
          if (typeof raw.url === 'string') candidateUrl = raw.url;
          id = raw.uuid || raw.id || '';
        }

        if (!id) {
          if (candidateUrl) {
            try {
              const parsed = new URL(candidateUrl);
              const parts = parsed.pathname.split('/').filter(Boolean);
              id = parts[parts.length - 1] || candidateUrl;
            } catch (e) {
              id = candidateUrl;
            }
          } else {
            id = String(raw);
          }
        }

        // remover extensão se existir
        const baseId = id.split('.').slice(0, -1).join('.') || id;

        const candidates = [
          `https://vorpng.caiots.dev/images/${encodeURIComponent(baseId)}`,
          `https://vorpng.caiots.dev/images/${encodeURIComponent(baseId)}/download`,
          `https://vorpng.caiots.dev/images/${encodeURIComponent(baseId)}/`,
        ];

        let deleted = false;
        const tried: string[] = [];

        for (const url of candidates) {
          tried.push(url);
          // tentar com 2 tentativas em caso de erro transitório
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const resp = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${vorpngToken}` }
              });

              if (resp.ok) {
                deleted = true;
                break;
              }

              const body = await resp.text().catch(() => '');
              // se 404, tentar próxima candidate
              if (resp.status === 404) {
                break;
              }

              // se 401/403 => problema de auth/token -> abortar com erro
              if (resp.status === 401 || resp.status === 403) {
                console.error('Autorização falhou ao deletar imagem no vorpng:', url, resp.status, body);
                return NextResponse.json({ error: 'Falha de autorização ao deletar imagens externas' }, { status: 500 });
              }

              // para outros códigos 5xx, tentar novamente
              if (resp.status >= 500 && attempt === 0) {
                // wait small backoff
                await new Promise(r => setTimeout(r, 200));
                continue;
              }

              // para outros erros não transitórios, registrar e passar à próxima candidate
              failures.push({ image: img, tried, status: resp.status, body });
              break;
            } catch (err) {
              console.error('Erro de rede ao deletar imagem no vorpng:', url, err);
              // tentar novamente uma vez
              if (attempt === 0) {
                await new Promise(r => setTimeout(r, 200));
                continue;
              }
              failures.push({ image: img, tried, body: String(err) });
            }
          }

          if (deleted) break;
        }

        if (!deleted) {
          // se já temos falhas coletadas, reportar
          const f = failures.find(x => x.image === img);
          console.error('Não foi possível deletar imagem:', img, f || tried);
          return NextResponse.json({ error: 'Falha ao deletar imagens associadas ao post', details: f || { image: img, tried } }, { status: 500 });
        }
      }
    }

    // Deletar comentários do post
    await commentsCollection.deleteMany({ postId });

    // Deletar o post
    await postsCollection.deleteOne({ _id: new ObjectId(postId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}