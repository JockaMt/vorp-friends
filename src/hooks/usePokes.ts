'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PokeNotification, PokeStats } from '@/types';

export function usePokes() {
    const { userId } = useAuth();
    const [pokeStats, setPokeStats] = useState<PokeStats>({ received: 0, sent: 0 });
    const [notifications, setNotifications] = useState<PokeNotification[]>([]);
    const [unseenCount, setUnseenCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Buscar estatísticas de cutucadas
    const fetchPokeStats = async () => {
        if (!userId) return;

        try {
            const response = await fetch('/api/pokes?type=stats');
            if (response.ok) {
                const data = await response.json();
                setPokeStats(data);
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas de cutucadas:', error);
        }
    };

    // Buscar notificações de cutucadas
    const fetchNotifications = async () => {
        if (!userId) return;

        try {
            const response = await fetch('/api/pokes?type=notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.pokes || []);
                setUnseenCount(data.unseenCount || 0);
            }
        } catch (error) {
            console.error('Erro ao buscar notificações de cutucadas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Verificar se pode cutucar um usuário
    const canPokeUser = async (targetUserId: string) => {
        if (!userId || userId === targetUserId) return { canPoke: false };

        try {
            const response = await fetch(`/api/pokes?type=canPoke&targetUserId=${targetUserId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao verificar se pode cutucar:', error);
        }
        return { canPoke: false };
    };

    // Enviar cutucada
    const sendPoke = async (targetUserId: string) => {
        if (!userId) throw new Error('Usuário não autenticado');

        const response = await fetch('/api/pokes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetUserId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao enviar cutucada');
        }

        // Atualizar estatísticas após enviar cutucada
        await fetchPokeStats();

        return data;
    };

    // Marcar todas as cutucadas como vistas
    const markAllSeen = async () => {
        if (!userId) return;

        try {
            const response = await fetch('/api/pokes', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'markAllSeen' }),
            });

            if (response.ok) {
                setUnseenCount(0);
                setNotifications(prev => prev.map(poke => ({ ...poke, seen: true })));
            }
        } catch (error) {
            console.error('Erro ao marcar cutucadas como vistas:', error);
        }
    };

    // Carregar dados iniciais
    useEffect(() => {
        if (userId) {
            fetchPokeStats();
            fetchNotifications();
        }
    }, [userId]);

    // Atualizar notificações periodicamente
    useEffect(() => {
        if (userId) {
            const interval = setInterval(fetchNotifications, 30000); // A cada 30 segundos
            return () => clearInterval(interval);
        }
    }, [userId]);

    return {
        pokeStats,
        notifications,
        unseenCount,
        loading,
        canPokeUser,
        sendPoke,
        markAllSeen,
        refreshStats: fetchPokeStats,
        refreshNotifications: fetchNotifications,
    };
}