'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Notification } from '@/types';
import { usePokes } from './usePokes';

export function useNotifications() {
    const { userId } = useAuth();
    const { notifications: pokeNotifications, markAllSeen } = usePokes();
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

    // Combina todas as notificações de diferentes fontes
    useEffect(() => {
        const combined: Notification[] = [
            ...pokeNotifications.map(poke => ({
                ...poke,
                type: 'poke' as const
            }))
            // Aqui você pode adicionar outras fontes de notificação no futuro
            // ...messageNotifications,
            // ...friendRequestNotifications,
        ];

        // Ordena por data de criação (mais recente primeiro)
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setAllNotifications(combined);
    }, [pokeNotifications]);

    const unreadCount = allNotifications.filter(n => !n.seen).length;

    const markAsRead = useCallback(async (notificationId: string, type: string) => {
        switch (type) {
            case 'poke':
                await markAllSeen(); // Para cutucadas, marcar todas como vistas
                break;
            // Adicionar outros tipos conforme necessário
            default:
                console.warn(`Tipo de notificação não suportado: ${type}`);
        }
    }, [markAllSeen]);

    const markAllAsRead = useCallback(async () => {
        // Para cutucadas, usar a função existente
        await markAllSeen();
    }, [markAllSeen]);

    return {
        notifications: allNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        hasUnread: unreadCount > 0
    };
}