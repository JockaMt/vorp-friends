import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUsersInfo, getUserInfo } from '@/lib/user-utils';
import { ObjectId } from 'mongodb';
import type { CommentDocument, CommentData } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { postId } = await params;
    const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
  const parentId = searchParams.get('parentId') || null; // if provided, fetch replies for this parent

    const db = await getDatabase();
    const commentsCollection = db.collection<CommentDocument>('comments');

    // Buscar comentários do post
    const query: any = { postId };
    if (parentId === 'root') {
      query.parentId = { $in: [null, undefined] };
    } else if (parentId) {
      query.parentId = parentId;
    }

    const comments = await commentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Buscar informações dos autores
    const authorIds = [...new Set(comments.map(comment => comment.authorId))];
    const authors = await getUsersInfo(authorIds);
    const authorsMap = new Map(authors.map(author => [author.id, author]));

    // Converter para formato da API
    const commentsData: CommentData[] = comments.map(comment => ({
      id: comment._id!.toString(),
      content: comment.content,
      postId: comment.postId,
      authorId: comment.authorId,
      parentId: comment.parentId ?? null,
      author: authorsMap.get(comment.authorId) || {
        id: comment.authorId,
        username: 'user',
        displayName: 'Usuário',
        avatar: undefined
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    }));

    // Contar total de comentários para paginação
    const total = await commentsCollection.countDocuments({ postId });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: commentsData,
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
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

  const { postId } = await params;
  const body = await request.json();
  const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo do comentário é obrigatório' }, { status: 400 });
    }

    if (content.length > 300) {
      return NextResponse.json({ error: 'Comentário não pode ter mais de 300 caracteres' }, { status: 400 });
    }

    const db = await getDatabase();
    const postsCollection = db.collection('posts');
    const commentsCollection = db.collection<CommentDocument>('comments');

    // Verificar se o post existe
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const commentDocument: CommentDocument = {
      content: content.trim(),
      postId,
      authorId: userId,
      parentId: parentId ?? null,
      createdAt: now,
      updatedAt: now
    };

    const result = await commentsCollection.insertOne(commentDocument);
    
    if (!result.insertedId) {
      return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 });
    }

    // Incrementar contador de comentários no post apenas para comentários de nível superior
    if (!parentId) {
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        {
          $inc: { commentsCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // Buscar informações do autor
    const author = await getUserInfo(userId);

    // Retornar o comentário criado
    const commentData: CommentData = {
      id: result.insertedId.toString(),
      content: commentDocument.content,
      postId: commentDocument.postId,
      authorId: commentDocument.authorId,
      parentId: commentDocument.parentId ?? null,
      author,
      createdAt: commentDocument.createdAt,
      updatedAt: commentDocument.updatedAt
    };

    return NextResponse.json({ data: commentData }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}