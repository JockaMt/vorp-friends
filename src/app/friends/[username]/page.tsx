'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { friendshipService } from '@/services/friendship';
import { ProfileSidebar } from '@/components/features/ProfileSidebar';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Friendship } from '@/types/friendship';
import type { SerializedUser } from '@/types/serializedUser';
import styles from '@/app/page.module.css';
import friendsStyles from '../friends.module.css';
import { FaUser, FaUserFriends, FaArrowLeft, FaUserClock, FaCheck, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function UserFriendsPage() {
    const { userId: currentUserId } = useAuth();
    const params = useParams();
    const username = params.username as string;

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [profileUser, setProfileUser] = useState<SerializedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);    useEffect(() => {
        if (username) {
            loadProfileUser();
        }
    }, [username]);

  useEffect(() => {
    if (profileUser) {
      loadFriends();
      // Se for o próprio usuário, carrega as solicitações pendentes
      if (currentUserId === profileUser.id) {
        loadPendingRequests();
      }
    }
  }, [profileUser, currentUserId]);    const loadProfileUser = async () => {
        try {
            // Primeiro tenta buscar por username exato
            let response = await fetch(`/api/users/search?q=${username}&exact=true`);
            let data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Usuário não encontrado');
            }

            if (data.users && data.users.length > 0) {
                setProfileUser(data.users[0]);
                return;
            }

            // Se não encontrou por username, tenta buscar por ID
            response = await fetch(`/api/users/search?q=${username}&exact=true`);
            data = await response.json();

            if (data.users && data.users.length > 0) {
                setProfileUser(data.users[0]);
            } else {
                throw new Error('Usuário não encontrado');
            }
        } catch (err) {
            console.error('Erro ao carregar usuário:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar usuário');
            setLoading(false);
        }
    };

  const loadFriends = async () => {
    if (!profileUser) return;
    
    try {
      const data = await friendshipService.getFriends('accepted', 1, 50, profileUser.id);
      setFriends(data.friendships || []);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
      setError('Erro ao carregar amigos');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!profileUser) return;
    
    try {
      const data = await friendshipService.getFriends('pending', 1, 20, profileUser.id);
      setPendingRequests(data.friendships || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    }
  };

  const handleFriendshipUpdate = () => {
    // Recarregar listas quando houver mudança
    loadFriends();
    if (currentUserId === profileUser?.id) {
      loadPendingRequests();
    }
  };    // Se não estiver logado
    if (!currentUserId) {
        return (
            <div className={styles.page}>
                <div className={styles.mainContent}>
                    <main className={styles.content}>
                        <div className={friendsStyles.emptyState}>
                            <FaUser className={friendsStyles.emptyIcon} />
                            <h3>Acesso negado</h3>
                            <p>Você precisa estar logado para ver esta página.</p>
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
                    <ProfileSidebar profileUser={profileUser || undefined} />

                    <main className={styles.content}>
                        <div className={friendsStyles.friendsList}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonCard key={index} />
                            ))}
                        </div>
                    </main>

                    <div className={friendsStyles.rightSidebar}>
                        <aside className={friendsStyles.rightAside}>
                            <h3 className={friendsStyles.rightAsideTitle}>Carregando...</h3>
                        </aside>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profileUser) {
        return (
            <div className={styles.page}>
                <div className={styles.mainContent}>
                    <main className={styles.content}>
                        <div className={friendsStyles.emptyState}>
                            <FaUser className={friendsStyles.emptyIcon} />
                            <h3>Erro</h3>
                            <p>{error || 'Usuário não encontrado'}</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUserId === profileUser.id;
    const displayName = profileUser.fullName || profileUser.firstName || profileUser.username;

    return (
        <div className={styles.page}>
            <div className={styles.mainContent}>
                <ProfileSidebar profileUser={profileUser || undefined} />
                <main className={styles.content}>
                    <h1 className={friendsStyles.pageTitle}>
                        <FaUserFriends className={friendsStyles.titleIcon} />
                        {isOwnProfile ? 'Meus Amigos' : `Amigos de ${displayName}`}
                    </h1>
                    <div className={friendsStyles.content}>
                        <div className={friendsStyles.friendsList}>
                            {friends.length === 0 ? (
                                <div className={friendsStyles.emptyState}>
                                    <FaUser className={friendsStyles.emptyIcon} />
                                    <h3>
                                        {isOwnProfile ? 'Você ainda não tem amigos' : 'Este usuário não tem amigos públicos'}
                                    </h3>
                                    <p>
                                        {isOwnProfile
                                            ? 'Use a busca para encontrar e adicionar amigos!'
                                            : 'Nenhum amigo para exibir no momento.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                friends.map((friendship) => {
                                    // Determinar qual usuário mostrar (o que não é o profileUser)
                                    const friend = friendship.requesterId === profileUser.id
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
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </main>

                <div className={friendsStyles.rightSidebar}>
                    {isOwnProfile && pendingRequests.length > 0 && (
                        <aside className={friendsStyles.rightAside}>
                            <h3 className={friendsStyles.rightAsideTitle}>
                                <FaUserClock style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }} />
                                Solicitações Pendentes
                            </h3>
                            <div className={friendsStyles.pendingRequestsContainer}>
                                {pendingRequests.slice(0, 3).map((friendship) => {
                                    const otherUser = friendship.requesterId === currentUserId 
                                        ? friendship.addressee 
                                        : friendship.requester;
                                    const isReceived = friendship.addresseeId === currentUserId;
                                    
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
                                                            friendshipService.respondToFriendRequest(friendship.id, 'accept')
                                                                .then(() => handleFriendshipUpdate())
                                                                .catch(err => console.error('Erro ao aceitar:', err));
                                                        }}
                                                        title="Aceitar solicitação"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className={`${friendsStyles.miniButton} ${friendsStyles.miniRejectButton}`}
                                                        onClick={() => {
                                                            friendshipService.respondToFriendRequest(friendship.id, 'reject')
                                                                .then(() => handleFriendshipUpdate())
                                                                .catch(err => console.error('Erro ao rejeitar:', err));
                                                        }}
                                                        title="Rejeitar solicitação"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {pendingRequests.length > 3 && (
                                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                        <Link 
                                            href="/friends"
                                            className={friendsStyles.miniButton}
                                            style={{ 
                                                background: 'var(--color-secondary)',
                                                color: 'var(--color-text-primary)',
                                                borderColor: 'var(--color-border)',
                                                fontSize: '0.75rem',
                                                padding: '0.4rem 0.8rem',
                                                textDecoration: 'none',
                                                display: 'inline-block'
                                            }}
                                        >
                                            Ver todas ({pendingRequests.length})
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}
                    
                    <aside className={friendsStyles.rightAside}>
                        <h3 className={friendsStyles.rightAsideTitle}>Informações</h3>
                        <div className={friendsStyles.rightAsideText}>
                            <p><strong>Total de amigos:</strong> {friends.length}</p>
                            <p><strong>Perfil:</strong> {displayName}</p>
                        </div>
                    </aside>

                    {isOwnProfile && (
                        <aside className={friendsStyles.rightAside}>
                            <h3 className={friendsStyles.rightAsideTitle}>Sugestões</h3>
                            <p className={friendsStyles.rightAsideText}>
                                Use a busca no topo da página para encontrar novos amigos!
                            </p>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}