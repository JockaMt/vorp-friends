import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const { userId: currentUserId } = await auth();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { targetUserId } = await request.json();
        if (!targetUserId) {
            return NextResponse.json({ error: 'ID do usuário alvo é obrigatório' }, { status: 400 });
        }

        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: 'Você não pode cutucar a si mesmo' }, { status: 400 });
        }

        const db = await getDatabase();
        const pokesCollection = db.collection('pokes');

        // Verificar se existe uma cutucada recente (últimos 30 minutos)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const recentPoke = await pokesCollection.findOne({
            fromUserId: currentUserId,
            toUserId: targetUserId,
            createdAt: { $gte: thirtyMinutesAgo }
        });

        if (recentPoke) {
            const remainingTime = Math.ceil((recentPoke.createdAt.getTime() + 30 * 60 * 1000 - Date.now()) / 60000);
            return NextResponse.json({
                error: 'Você precisa aguardar antes de cutucar novamente',
                remainingMinutes: remainingTime
            }, { status: 429 });
        }

        // Criar nova cutucada
        const newPoke = {
            fromUserId: currentUserId,
            toUserId: targetUserId,
            createdAt: new Date(),
            seen: false
        };

        const result = await pokesCollection.insertOne(newPoke);

        return NextResponse.json({
            success: true,
            pokeId: result.insertedId,
            message: 'Cutucada enviada com sucesso!'
        }, { status: 201 });

    } catch (error) {
        console.error('Erro ao enviar cutucada:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const targetUserId = searchParams.get('targetUserId');

        const db = await getDatabase();
        const pokesCollection = db.collection('pokes');

        if (type === 'stats') {
            // Apenas cutucadas recebidas (como solicitado)
            const receivedCount = await pokesCollection.countDocuments({ toUserId: userId });
            return NextResponse.json({ received: receivedCount });
        }

        if (type === 'canPoke' && targetUserId) {
            // Verificar se pode cutucar um usuário específico
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const recentPoke = await pokesCollection.findOne({
                fromUserId: userId,
                toUserId: targetUserId,
                createdAt: { $gte: thirtyMinutesAgo }
            });

            if (recentPoke) {
                const remainingTime = Math.ceil((recentPoke.createdAt.getTime() + 30 * 60 * 1000 - Date.now()) / 60000);
                return NextResponse.json({
                    canPoke: false,
                    remainingMinutes: remainingTime
                });
            }

            return NextResponse.json({ canPoke: true });
        }

        if (type === 'notifications') {
            // Cutucadas recebidas para notificações
            const pokes = await pokesCollection
                .find({ toUserId: userId })
                .sort({ createdAt: -1 })
                .limit(20)
                .toArray();

            const unseenCount = await pokesCollection.countDocuments({
                toUserId: userId,
                seen: false
            });

            return NextResponse.json({ pokes, unseenCount });
        }

        return NextResponse.json({ error: 'Tipo de consulta inválido' }, { status: 400 });

    } catch (error) {
        console.error('Erro ao buscar cutucadas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { action } = await request.json();

        const db = await getDatabase();
        const pokesCollection = db.collection('pokes');

        if (action === 'markAllSeen') {
            // Marcar todas as cutucadas recebidas como visualizadas
            await pokesCollection.updateMany(
                { toUserId: userId, seen: false },
                { $set: { seen: true } }
            );

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

    } catch (error) {
        console.error('Erro ao atualizar cutucadas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}