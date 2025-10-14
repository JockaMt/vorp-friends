'use client'
import React from 'react';
import { useNotifications } from '@/hooks';
import { formatTime } from '@/utils';
import { Notification } from '@/types';
import styles from './notificationsPanel.module.css';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
    const { notifications, markAsRead, markAllAsRead, hasUnread } = useNotifications();

    if (!isOpen) return null;

    const handleMarkAsSeen = async (notificationId: string, type: string) => {
        try {
            await markAsRead(notificationId, type);
        } catch (error) {
            console.error('Erro ao marcar notificação como vista:', error);
        }
    };

    const handleMarkAllAsSeen = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como vistas:', error);
        }
    };

    const renderNotification = (notification: Notification) => {
        switch (notification.type) {
            case 'poke':
                return (
                    <div key={notification._id} className={styles.notificationItem}>
                        <div className={styles.notificationContent}>
                            <div className={styles.notificationIcon}>👈</div>
                            <div>
                                <strong>{notification.fromUsername}</strong> cutucou você
                            </div>
                        </div>
                        <div className={styles.notificationMeta}>
                            <span className={styles.time}>
                                {formatTime(new Date(notification.createdAt))}
                            </span>
                            {!notification.seen && (
                                <button
                                    className={styles.markSeenButton}
                                    onClick={() => handleMarkAsSeen(notification._id, notification.type)}
                                    title="Marcar como visto"
                                >
                                    ✓
                                </button>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Notificações</h3>
                    <div className={styles.headerActions}>
                        {hasUnread && (
                            <button
                                className={styles.markAllButton}
                                onClick={handleMarkAllAsSeen}
                                title="Marcar todas como vistas"
                            >
                                Marcar todas
                            </button>
                        )}
                        <button className={styles.closeButton} onClick={onClose}>
                            ×
                        </button>
                    </div>
                </div>

                <div className={styles.content}>
                    {notifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className={styles.notificationsList}>
                            {notifications.map(renderNotification)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}