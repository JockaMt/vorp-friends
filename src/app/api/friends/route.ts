import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';
import { getUsersInfo } from '@/lib/user-utils';
import type { FriendshipDocument, FriendshipData } from '@/lib/models';

// GET /api/friends - Buscar amigos do usuário
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'accepted';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const targetUserId = searchParams.get('userId') || null;
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const friendshipsCollection = db.collection<FriendshipDocument>('friendships');

    // Determinar para qual usuário buscar as amizades: targetUserId (query) ou o usuário autenticado
    const subjectId = targetUserId || userId;

    // Buscar amizades onde o subjectId é requester ou addressee
    const filter: any = {
      $or: [
        { requesterId: subjectId, status },
        { addresseeId: subjectId, status }
      ]
    };

    const friendships = await friendshipsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Obter IDs dos usuários envolvidos
    const userIds = new Set<string>();
    friendships.forEach(friendship => {
      userIds.add(friendship.requesterId);
      userIds.add(friendship.addresseeId);
    });

    // Buscar informações dos usuários
    const users = await getUsersInfo(Array.from(userIds));
    const usersMap = new Map(users.map(user => [user.id, user]));

    // Converter para formato da API
    const friendshipsData: FriendshipData[] = friendships.map(friendship => ({
      id: friendship._id!.toString(),
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
      status: friendship.status,
      requester: usersMap.get(friendship.requesterId) || {
        id: friendship.requesterId,
        username: 'user',
        displayName: 'Usuário',
      },
      addressee: usersMap.get(friendship.addresseeId) || {
        id: friendship.addresseeId,
        username: 'user',
        displayName: 'Usuário',
      },
      createdAt: friendship.createdAt,
      updatedAt: friendship.updatedAt,
    }));

    const total = await friendshipsCollection.countDocuments(filter);

    return NextResponse.json({
      success: true,
      friendships: friendshipsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Erro ao buscar amigos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/friends - Enviar solicitação de amizade
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { addresseeId } = await request.json();

    if (!addresseeId) {
      return NextResponse.json({ error: 'ID do destinatário é obrigatório' }, { status: 400 });
    }

    if (addresseeId === userId) {
      return NextResponse.json({ error: 'Você não pode adicionar a si mesmo' }, { status: 400 });
    }

    const db = await getDatabase();
    const friendshipsCollection = db.collection<FriendshipDocument>('friendships');

    // Verificar se já existe uma amizade entre esses usuários
    const existingFriendship = await friendshipsCollection.findOne({
      $or: [
        { requesterId: userId, addresseeId },
        { requesterId: addresseeId, addresseeId: userId }
      ]
    });

    if (existingFriendship) {
      return NextResponse.json({ 
        error: 'Já existe uma solicitação de amizade entre vocês' 
      }, { status: 400 });
    }

    // Criar nova solicitação de amizade
    const now = new Date();
    const friendship: FriendshipDocument = {
      requesterId: userId,
      addresseeId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const result = await friendshipsCollection.insertOne(friendship);

    return NextResponse.json({
      success: true,
      friendshipId: result.insertedId.toString(),
      message: 'Solicitação de amizade enviada'
    });
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}