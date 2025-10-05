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