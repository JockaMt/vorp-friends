'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { friendshipService } from '@/services/friendship';
import { FriendButton } from '@/components/features/FriendButton';
import { ProfileSidebar } from '@/components/features/ProfileSidebar';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Friendship } from '@/types/friendship';
import styles from '@/app/page.module.css'; // Usar o mesmo estilo da página principal
import friendsStyles from './friends.module.css';
import { FaUser, FaUserFriends, FaUserClock, FaUserTimes, FaCheck, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function FriendsPage() {
    const { userId } = useAuth();
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
    const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFriends();
        loadPendingRequests();
    }, []);

    const loadFriends = async () => {
        try {
            const data = await friendshipService.getFriends('accepted');
            setFriends(data.friendships || []);
        } catch (err) {
            console.error('Erro ao carregar amigos:', err);
            setError('Erro ao carregar amigos');
        }
    };

    const loadPendingRequests = async () => {
        try {
            const data = await friendshipService.getFriends('pending');
            setPendingRequests(data.friendships || []);
        } catch (err) {
            console.error('Erro ao carregar solicitações:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFriendshipUpdate = () => {
        // Recarregar listas quando houver mudança
        loadFriends();
        loadPendingRequests();
    };

    // Se o usuário não estiver logado, não renderizar nada
    if (!userId) {
        return (
            <div className={styles.page}>
                <div className={styles.mainContent}>
                    <main className={styles.content}>
                        <div className={friendsStyles.emptyState}>
                            <FaUser className={friendsStyles.emptyIcon} />
                            <h3>Acesso negado</h3>
                            <p>Você precisa estar logado para ver seus amigos.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.mainContent}>
                    <ProfileSidebar />

                    <main className={styles.content}>
                        <h1 className={friendsStyles.pageTitle}>
                            <FaUserFriends className={friendsStyles.titleIcon} />
                            Meus Amigos
                        </h1>

                        <div className={friendsStyles.tabs}>
                            <button className={`${friendsStyles.tab} ${friendsStyles.activeTab}`}>
                                <FaUserFriends />
                                Amigos (...)
                            </button>
                            <button className={friendsStyles.tab}>
                                <FaUserClock />
                                Pendentes (...)
                            </button>
                        </div>

                        <div className={friendsStyles.friendsList}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonCard key={index} />
                            ))}
                        </div>
                    </main>

                    <div className={friendsStyles.rightSidebar}>
                        <aside className={friendsStyles.rightAside}>
                            <h3 className={friendsStyles.rightAsideTitle}>Sugestões</h3>
                            <p className={friendsStyles.rightAsideText}>
                                Use a busca no topo da página para encontrar novos amigos!
                            </p>
                        </aside>
                        <aside className={friendsStyles.rightAside}>
                            <h3 className={friendsStyles.rightAsideTitle}>Estatísticas</h3>
                            <div className={friendsStyles.rightAsideText}>
                                <p><strong>Total de amigos:</strong> ...</p>
                                <p><strong>Solicitações pendentes:</strong> ...</p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.mainContent}>
                <ProfileSidebar />

                <main className={styles.content}>
                    {/* Navegação das abas movida para o topo do conteúdo principal */}
                    <h1 className={friendsStyles.pageTitle}>
                        <FaUserFriends className={friendsStyles.titleIcon} />
                        Meus Amigos
                    </h1>

                    <div className={friendsStyles.tabs}>
                        <button
                            className={`${friendsStyles.tab} ${activeTab === 'friends' ? friendsStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('friends')}
                        >
                            <FaUserFriends />
                            Amigos ({friends.length})
                        </button>
                        <button
                            className={`${friendsStyles.tab} ${activeTab === 'pending' ? friendsStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            <FaUserClock />
                            Pendentes ({pendingRequests.length})
                        </button>
                    </div>

                    {error && (
                        <div className={friendsStyles.error}>
                            <FaUserTimes />
                            {error}
                        </div>
                    )}

                    <div className={friendsStyles.content}>
                        {activeTab === 'friends' && (
                            <div className={friendsStyles.friendsList}>
                                {friends.length === 0 ? (
                                    <div className={friendsStyles.emptyState}>
                                        <FaUser className={friendsStyles.emptyIcon} />
                                        <h3>Você ainda não tem amigos</h3>
                                        <p>Use a busca para encontrar e adicionar amigos!</p>
                                    </div>
                                ) : (
                                    friends.map((friendship) => {
                                        // Determinar qual usuário mostrar (o que não é o usuário atual)
                                        const friend = friendship.requesterId === userId
                                            ? friendship.addressee
                                            : friendship.requester;

                                        return (
                                            <div key={friendship.id} className={friendsStyles.friendCard}>
                                                <Link href={`/profile/${friend.username}`} className={friendsStyles.friendLink}>
                                                    <div className={friendsStyles.friendInfo}>
                                                        <div className={friendsStyles.avatar}>
                                                            {friend.avatar ? (
                                                                <Image
                                                                    src={friend.avatar}
                                                                    alt={friend.displayName}
                                                                    width={48}
                                                                    height={48}
                                                                    className={friendsStyles.avatarImage}
                                                                />
                                                            ) : (
                                                                <FaUser className={friendsStyles.avatarPlaceholder} />
                                                            )}
                                                        </div>
                                                        <div className={friendsStyles.details}>
                                                            <h3 className={friendsStyles.name}>{friend.displayName}</h3>
                                                            <p className={friendsStyles.username}>@{friend.username}</p>
                                                            <p className={friendsStyles.date}>
                                                                Amigos desde {new Date(friendship.createdAt).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className={friendsStyles.actions}>
                                                    <FriendButton
                                                        userId={friend.id}
                                                        username={friend.username}
                                                        onStatusChange={handleFriendshipUpdate}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'pending' && (
                            <div className={friendsStyles.friendsList}>
                                {pendingRequests.length === 0 ? (
                                    <div className={friendsStyles.emptyState}>
                                        <FaUserClock className={friendsStyles.emptyIcon} />
                                        <h3>Nenhuma solicitação pendente</h3>
                                        <p>Você não tem solicitações de amizade pendentes.</p>
                                    </div>
                                ) : (
                                    pendingRequests.map((friendship) => {
                                        // Para solicitações pendentes, mostrar a pessoa que enviou (se eu recebi) ou que recebeu (se eu enviei)
                                        const otherUser = friendship.requesterId === userId
                                            ? friendship.addressee
                                            : friendship.requester;

                                        const isReceived = friendship.addresseeId === userId;

                                        return (
                                            <div key={friendship.id} className={friendsStyles.friendCard}>
                                                <Link href={`/profile/${otherUser.username}`} className={friendsStyles.friendLink}>
                                                    <div className={friendsStyles.friendInfo}>
                                                        <div className={friendsStyles.avatar}>
                                                            {otherUser.avatar ? (
                                                                <Image
                                                                    src={otherUser.avatar}
                                                                    alt={otherUser.displayName}
                                                                    width={48}
                                                                    height={48}
                                                                    className={friendsStyles.avatarImage}
                                                                />
                                                            ) : (
                                                                <FaUser className={friendsStyles.avatarPlaceholder} />
                                                            )}
                                                        </div>
                                                        <div className={friendsStyles.details}>
                                                            <h3 className={friendsStyles.name}>{otherUser.displayName}</h3>
                                                            <p className={friendsStyles.username}>@{otherUser.username}</p>
                                                            <p className={friendsStyles.date}>
                                                                {isReceived
                                                                    ? `Enviado em ${new Date(friendship.createdAt).toLocaleDateString('pt-BR')}`
                                                                    : `Solicitação enviada em ${new Date(friendship.createdAt).toLocaleDateString('pt-BR')}`
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className={friendsStyles.actions}>
                                                    <FriendButton
                                                        userId={otherUser.id}
                                                        username={otherUser.username}
                                                        onStatusChange={handleFriendshipUpdate}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </main>

                <div className={friendsStyles.rightSidebar}>
                    {pendingRequests.length > 0 && (
                        <aside className={friendsStyles.rightAside}>
                            <h3 className={friendsStyles.rightAsideTitle}>
                                <FaUserClock style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }} />
                                Solicitações Pendentes
                            </h3>
                            <div className={friendsStyles.pendingRequestsContainer}>
                                {pendingRequests.slice(0, 3).map((friendship) => {
                                    const otherUser = friendship.requesterId === userId 
                                        ? friendship.addressee 
                                        : friendship.requester;
                                    const isReceived = friendship.addresseeId === userId;
                                    
                                    return (
                                        <div key={friendship.id} className={friendsStyles.miniRequestCard}>
                                            <Link href={`/profile/${otherUser.username}`} className={friendsStyles.miniRequestInfo}>
                                                <div className={friendsStyles.miniAvatar}>
                                                    {otherUser.avatar ? (
                                                        <Image
                                                            src={otherUser.avatar}
                                                            alt={otherUser.displayName}
                                                            width={32}
                                                            height={32}
                                                            className={friendsStyles.miniAvatarImage}
                                                        />
                                                    ) : (
                                                        <FaUser className={friendsStyles.miniAvatarPlaceholder} />
                                                    )}
                                                </div>
                                                <div className={friendsStyles.miniDetails}>
                                                    <div className={friendsStyles.miniName}>{otherUser.displayName}</div>
                                                    <div className={friendsStyles.miniUsername}>@{otherUser.username}</div>
                                                </div>
                                            </Link>
                                            {isReceived && (
                                                <div className={friendsStyles.miniActions}>
                                                    <button
                                                        className={`${friendsStyles.miniButton} ${friendsStyles.miniAcceptButton}`}
                                                        onClick={() => {
                                                            // Aceitar solicitação
                                                            friendshipService.respondToFriendRequest(friendship.id, 'accept')
                                                                .then(() => handleFriendshipUpdate())
                                                                .catch(err => console.error('Erro ao aceitar:', err));
                                                        }}
                                                        title="Aceitar solicitação"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        className={`${friendsStyles.miniButton} ${friendsStyles.miniRejectButton}`}
                                                        onClick={() => {
                                                            // Rejeitar solicitação
                                                            friendshipService.respondToFriendRequest(friendship.id, 'reject')
                                                                .then(() => handleFriendshipUpdate())
                                                                .catch(err => console.error('Erro ao rejeitar:', err));
                                                        }}
                                                        title="Rejeitar solicitação"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {pendingRequests.length > 3 && (
                                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                        <button
                                            className={friendsStyles.miniButton}
                                            onClick={() => setActiveTab('pending')}
                                            style={{ 
                                                background: 'var(--color-secondary)',
                                                color: 'var(--color-text-primary)',
                                                borderColor: 'var(--color-border)',
                                                fontSize: '0.75rem',
                                                padding: '0.4rem 0.8rem'
                                            }}
                                        >
                                            Ver todas ({pendingRequests.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}
                    
                    <aside className={friendsStyles.rightAside}>
                        <h3 className={friendsStyles.rightAsideTitle}>Sugestões</h3>
                        <p className={friendsStyles.rightAsideText}>
                            Use a busca no topo da página para encontrar novos amigos!
                        </p>
                    </aside>
                    <aside className={friendsStyles.rightAside}>
                        <h3 className={friendsStyles.rightAsideTitle}>Estatísticas</h3>
                        <div className={friendsStyles.rightAsideText}>
                            <p><strong>Total de amigos:</strong> {friends.length}</p>
                            <p><strong>Solicitações pendentes:</strong> {pendingRequests.length}</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}