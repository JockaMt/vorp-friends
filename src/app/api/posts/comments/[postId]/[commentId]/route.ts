import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserInfo } from '@/lib/user-utils';
import { ObjectId } from 'mongodb';
import type { CommentData, CommentDocument } from '@/lib/models';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { postId, commentId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo do comentário é obrigatório' }, { status: 400 });
    }

    const db = await getDatabase();
    const commentsCollection = db.collection<CommentDocument>('comments');
    const postsCollection = db.collection('posts');

    // Buscar comentário
    if (!ObjectId.isValid(commentId)) {
      // commentId is stored as ObjectId in _id
      // but param may not be valid ObjectId
    }

    const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    if (comment.authorId !== userId) {
      return NextResponse.json({ error: 'Apenas o autor pode editar o comentário' }, { status: 403 });
    }

    // Atualizar conteúdo
    const updateResult = await commentsCollection.updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { content: content.trim(), updatedAt: new Date() } }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Erro ao atualizar comentário' }, { status: 500 });
    }

    const updated = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
    if (!updated) {
      return NextResponse.json({ error: 'Comentário não encontrado após atualização' }, { status: 404 });
    }

    // Buscar informações do autor
    const author = await getUserInfo(updated.authorId);

    const commentData: CommentData = {
      id: updated._id!.toString(),
      content: updated.content,
      postId: updated.postId,
      parentId: updated.parentId ?? null,
      authorId: updated.authorId,
      author,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };

    return NextResponse.json({ data: commentData });
  } catch (error) {
    console.error('Erro ao editar comentário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { postId, commentId } = await params;

    const db = await getDatabase();
    const commentsCollection = db.collection<CommentDocument>('comments');
    const postsCollection = db.collection('posts');

    // Buscar comentário
    const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
    }

    if (comment.authorId !== userId) {
      return NextResponse.json({ error: 'Apenas o autor pode deletar o comentário' }, { status: 403 });
    }

    // Deletar o comentário e suas respostas
    await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });
    await commentsCollection.deleteMany({ parentId: commentId });

    // Se for comentário de topo, decrementar contador no post
    if (!comment.parentId) {
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { commentsCount: -1 }, $set: { updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
