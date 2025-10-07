import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { FriendshipDocument } from '@/lib/models';

// PUT /api/friends/[friendshipId] - Responder solicitação de amizade
export async function PUT(
  request: NextRequest,
  { params }: { params: { friendshipId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { friendshipId } = params;
    const { action } = await request.json(); // 'accept', 'reject', ou 'block'

    if (!['accept', 'reject', 'block'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const db = await getDatabase();
    const friendshipsCollection = db.collection<FriendshipDocument>('friendships');

    // Buscar a solicitação de amizade
    const friendship = await friendshipsCollection.findOne({
      _id: new ObjectId(friendshipId),
      addresseeId: userId, // Apenas o destinatário pode responder
      status: 'pending'
    });

    if (!friendship) {
      return NextResponse.json({ 
        error: 'Solicitação de amizade não encontrada ou você não tem permissão' 
      }, { status: 404 });
    }

    // Atualizar status da amizade
    const statusMap: Record<string, 'accepted' | 'rejected' | 'blocked'> = {
      accept: 'accepted',
      reject: 'rejected',
      block: 'blocked'
    };

    const result = await friendshipsCollection.updateOne(
      { _id: new ObjectId(friendshipId) },
      {
        $set: {
          status: statusMap[action],
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 });
    }

    const messages = {
      accept: 'Solicitação de amizade aceita',
      reject: 'Solicitação de amizade rejeitada',
      block: 'Usuário bloqueado'
    };

    return NextResponse.json({
      success: true,
      message: messages[action as keyof typeof messages]
    });
  } catch (error) {
    console.error('Erro ao responder solicitação de amizade:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/friends/[friendshipId] - Remover amizade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { friendshipId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { friendshipId } = params;

    const db = await getDatabase();
    const friendshipsCollection = db.collection<FriendshipDocument>('friendships');

    // Verificar se o usuário faz parte desta amizade
    const friendship = await friendshipsCollection.findOne({
      _id: new ObjectId(friendshipId),
      $or: [
        { requesterId: userId },
        { addresseeId: userId }
      ]
    });

    if (!friendship) {
      return NextResponse.json({ 
        error: 'Amizade não encontrada ou você não tem permissão' 
      }, { status: 404 });
    }

    // Remover amizade
    const result = await friendshipsCollection.deleteOne({
      _id: new ObjectId(friendshipId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Erro ao remover amizade' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Amizade removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover amizade:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}