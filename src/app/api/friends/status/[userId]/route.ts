import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import type { FriendshipDocument } from '@/lib/models';

// GET /api/friends/status/[userId] - Verificar status de amizade com um usuário
export async function GET(request: NextRequest, context: any) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

  const { userId: targetUserId } = context.params as { userId: string };

    if (currentUserId === targetUserId) {
      return NextResponse.json({
        success: true,
        status: 'self',
        message: 'Você mesmo'
      });
    }

    const db = await getDatabase();
    const friendshipsCollection = db.collection<FriendshipDocument>('friendships');

    // Buscar amizade entre os usuários
    const friendship = await friendshipsCollection.findOne({
      $or: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId }
      ]
    });

    if (!friendship) {
      return NextResponse.json({
        success: true,
        status: 'none',
        message: 'Nenhuma amizade'
      });
    }

    // Determinar o status específico do ponto de vista do usuário atual
    let status: string = friendship.status;
    let message = '';
    let canSendRequest = false;
    let canRespond = false;

    switch (friendship.status) {
      case 'pending':
        if (friendship.requesterId === currentUserId) {
          message = 'Solicitação enviada';
          status = 'sent';
        } else {
          message = 'Solicitação recebida';
          status = 'received';
          canRespond = true;
        }
        break;
      case 'accepted':
        message = 'Amigos';
        break;
      case 'rejected':
        message = 'Solicitação rejeitada';
        canSendRequest = friendship.requesterId !== currentUserId;
        break;
      case 'blocked':
        if (friendship.requesterId === currentUserId) {
          message = 'Você bloqueou este usuário';
        } else {
          message = 'Usuário te bloqueou';
        }
        break;
      default:
        canSendRequest = true;
    }

    return NextResponse.json({
      success: true,
      status,
      message,
      friendshipId: friendship._id?.toString(),
      canSendRequest,
      canRespond,
      friendship: {
        requesterId: friendship.requesterId,
        addresseeId: friendship.addresseeId,
        createdAt: friendship.createdAt,
        updatedAt: friendship.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status de amizade:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}