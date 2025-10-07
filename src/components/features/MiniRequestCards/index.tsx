import React from 'react';
import Link from 'next/link';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { friendshipService } from '@/services/friendship';
import type { Friendship } from '@/types/friendship';
import styles from './miniRequestCards.module.css';

interface MiniRequestCardsProps {
    requests: Friendship[];
    onUpdate: () => void;
    maxVisible?: number;
}

export default function MiniRequestCards({ requests, onUpdate, maxVisible = 5 }: MiniRequestCardsProps) {
    const visibleRequests = requests.slice(0, maxVisible);

    const handleAccept = async (friendshipId: string) => {
        try {
            await friendshipService.respondToFriendRequest(friendshipId, 'accept');
            onUpdate();
        } catch (err) {
            console.error('Erro ao aceitar:', err);
        }
    };

    const handleReject = async (friendshipId: string) => {
        try {
            await friendshipService.respondToFriendRequest(friendshipId, 'reject');
            onUpdate();
        } catch (err) {
            console.error('Erro ao rejeitar:', err);
        }
    };

    if (!requests || requests.length === 0) {
        return (
            <p className={styles.noRequests}>
                Você não tem pedidos de amizade novos.
            </p>
        );
    }

    return (
        <ul className={styles.requestList}>
            {visibleRequests.map((friendship) => {
            const requester = friendship.requester as any;
            const profileIdentifier = requester.username || requester.id || requester.displayName || undefined;

                return (
                    <li key={friendship.id} className={styles.requestItem}>
                        <Link
                            href={profileIdentifier ? `/profile/${profileIdentifier}` : '#'}
                            className={styles.requestLink}
                            title={requester.displayName || requester.username || 'Ver perfil'}
                        >
                            <div className={styles.avatarContainer}>
                                {requester.avatar ? (
                                    // use next/image when avatar is provided
                                    // keep simple img fallback to avoid layout issues in minimal list
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={requester.avatar} alt={requester.displayName || requester.username || 'avatar'} className={styles.avatarImage} />
                                ) : (
                                    <div className={styles.avatarPlaceholder} aria-hidden>
                                        { (requester.displayName || requester.username || '?').charAt(0).toUpperCase() }
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className={styles.actions}>
                            <button
                                className={`${styles.miniButton} ${styles.miniAcceptButton}`}
                                onClick={() => handleAccept(friendship.id)}
                                title="Aceitar solicitação"
                                aria-label="Aceitar solicitação"
                            >
                                <FaCheck />
                            </button>
                            <button
                                className={`${styles.miniButton} ${styles.miniRejectButton}`}
                                onClick={() => handleReject(friendship.id)}
                                title="Rejeitar solicitação"
                                aria-label="Rejeitar solicitação"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </li>
                );
            })}

            {requests.length > maxVisible && (
                <li className={styles.moreRequests}>+{requests.length - maxVisible} mais</li>
            )}
        </ul>
    );
}