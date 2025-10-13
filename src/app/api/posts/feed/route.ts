import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUsersInfo } from '@/lib/user-utils';
import type { PostDocument, PostData } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const authorId = searchParams.get('authorId') || undefined;
  const since = searchParams.get('since'); // Nova funcionalidade para polling

    const db = await getDatabase();
    const postsCollection = db.collection<PostDocument>('posts');

    // Construir filtro (opcionalmente filtrar por author e/ou data)
    const filter: any = {};
    if (authorId) {
      filter.authorId = authorId;
    }
    if (since) {
      // Filtrar posts criados após a data especificada
      filter.createdAt = { $gt: new Date(since) };
    }

    // Buscar posts ordenados por data de criação (mais recentes primeiro)
    const posts = await postsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Buscar informações dos autores
    const authorIds = [...new Set(posts.map(post => post.authorId))];
    const authors = await getUsersInfo(authorIds);
    const authorsMap = new Map(authors.map(author => [author.id, author]));

    // Converter para formato da API
    const postsData: PostData[] = posts.map(post => ({
      id: post._id!.toString(),
      content: post.content,
      authorId: post.authorId,
      author: authorsMap.get(post.authorId) || {
        id: post.authorId,
        username: 'user',
        displayName: 'Usuário',
        avatar: undefined
      },
      // Incluir location para que o frontend possa renderizar localizações marcadas nos posts
      location: post.location ?? null,
      images: post.images || [],
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isLiked: post.likes.includes(userId),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    // Contar total de posts para paginação
  const total = await postsCollection.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: postsData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao buscar feed:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}