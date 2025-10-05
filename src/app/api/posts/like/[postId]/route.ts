import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
    
    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'ID do post inválido' }, { status: 400 });
    }

    const db = await getDatabase();
    const postsCollection = db.collection('posts');

    // Verificar se o post existe
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário já curtiu o post
    if (post.likes && post.likes.includes(userId)) {
      return NextResponse.json({ error: 'Post já foi curtido' }, { status: 400 });
    }

    // Adicionar like
    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao curtir post:', error);
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

    // Verificar se o post existe
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário curtiu o post
    if (!post.likes || !post.likes.includes(userId)) {
      return NextResponse.json({ error: 'Post não foi curtido' }, { status: 400 });
    }

    // Remover like
    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      {
        $pull: { likes: userId } as any,
        $inc: { likesCount: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao descurtir post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}