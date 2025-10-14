'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SkeletonAvatar, SkeletonText } from "@/components/ui/Skeleton";
import styles from "./profileSidebar.module.css";
import Image from "next/image";
import { FaUserCircle, FaUserFriends } from "react-icons/fa";
import { MdGroups } from "react-icons/md";
import { TbGlassFullFilled, TbHandFinger } from "react-icons/tb";
import { FaPen } from "react-icons/fa6";
import { useUser } from "@clerk/nextjs";
import type { SerializedUser } from "@/types/serializedUser";
import { FriendButton } from "../FriendButton";
import { friendshipService } from '@/services/friendship';
import type { Friendship } from '@/types/friendship';
import { usePokes } from '@/hooks/usePokes';

export function ProfileSidebar({ profileUser }: { profileUser?: SerializedUser }) {
    const { user, isLoaded } = useUser();
    const { pokeStats, canPokeUser, sendPoke } = usePokes();
    const [editing, setEditing] = useState(false);
    const [bioValue, setBioValue] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pokingUser, setPokingUser] = useState(false);
    const [pokeMessage, setPokeMessage] = useState('');
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        // Inicializa bio quando o usuário estiver carregado ou quando um profileUser for recebido
        const viewed = profileUser ?? user;
        if (viewed) {
            const initial = String(viewed?.publicMetadata?.bio ?? 'Short bio about yourself.');
            setBioValue(initial);
        }
    }, [isLoaded, user, profileUser]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            // mover cursor para o fim
            const val = inputRef.current.value;
            inputRef.current.value = '';
            inputRef.current.value = val;
        }
    }, [editing]);

    // Se um `profileUser` for passado, renderizamos os dados dele; caso contrário, renderizamos o usuário logado
    const viewed = profileUser ?? user;
    const displayName = viewed?.fullName || viewed?.firstName || viewed?.username || 'Usuário';
    const displayImage = viewed?.imageUrl || '';
    const isSelf = Boolean(user && viewed && user.id === viewed.id);

    // Gera um identificador para o link do perfil (username, ID ou email)
    const profileIdentifier = viewed?.username || viewed?.id || viewed?.emailAddresses?.[0]?.emailAddress?.split('@')[0];

    async function saveBio(newBio: string) {
        // Apenas o próprio usuário pode salvar sua bio
        if (!isSelf) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/user/update-bio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: newBio })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Erro ao salvar bio');
            setBioValue(data.bio ?? newBio);
            setEditing(false);
        } catch (err: any) {
            setError(err?.message || 'Erro desconhecido');
        } finally {
            setSaving(false);
        }
    }

    async function handlePoke() {
        if (!viewed?.id || pokingUser || !canPokeUser(viewed.id)) return;

        try {
            await sendPoke(viewed.id);
            setPokeMessage('Cutucada enviada!');
            setTimeout(() => setPokeMessage(''), 3000);
        } catch (error) {
            setPokeMessage('Erro ao enviar cutucada');
            setTimeout(() => setPokeMessage(''), 3000);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const v = bioValue.trim();
            saveBio(v);
        } else if (e.key === 'Escape') {
            setEditing(false);
            // reset to current saved bio
            const initial = String(user?.publicMetadata?.bio ?? 'Short bio about yourself.');
            setBioValue(initial);
        }
    }

    // Friends list state (limited preview)
    const [friends, setFriends] = useState<Array<{ id: string; username?: string; displayName?: string; avatar?: string }>>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [totalFriends, setTotalFriends] = useState<number | null>(null);

    // Formata números grandes para 1k, 2.5k, 4M, etc.
    function formatNumber(n: number | null | undefined) {
        if (n == null) return '0';
        if (n < 1000) return String(n);
        const units = [
            { value: 1e9, symbol: 'B' },
            { value: 1e6, symbol: 'M' },
            { value: 1e3, symbol: 'k' },
        ];
        for (const u of units) {
            if (n >= u.value) {
                const v = n / u.value;
                // mostra uma casa decimal quando necessário (e.g., 2.5k), senão sem decimal (e.g., 12k)
                const formatted = v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
                return `${formatted}${u.symbol}`;
            }
        }
        return String(n);
    }

    useEffect(() => {
        // Load accepted friends for either the profile being viewed (profileUser) or the logged-in user
        let mounted = true;
        async function load() {
            setFriendsLoading(true);
            try {
                const subjectId = profileUser?.id ?? user?.id;
                // request friends for the subjectId (profileUser when viewing someone else's profile) - limit to 5 for preview
                const data = await friendshipService.getFriends('accepted', 1, 5, subjectId);
                if (!mounted) return;
                const list: Array<{ id: string; username?: string; displayName?: string; avatar?: string }> = (data.friendships || []).map((f: Friendship) => {
                    // determine which side of the friendship is the friend relative to the subject
                    const friend = f.requesterId === subjectId ? f.addressee : f.requester;
                    return { id: friend.id, username: friend.username, displayName: friend.displayName, avatar: friend.avatar };
                });
                setFriends(list);
                setTotalFriends(data.pagination?.total ?? (list.length || 0));
            } catch (err) {
                console.error('Erro ao carregar amigos no sidebar:', err);
            } finally {
                if (mounted) setFriendsLoading(false);
            }
        }

        // Load when we have either the profileUser info or the authenticated user info
        if (profileUser || isLoaded) load();

        return () => { mounted = false; };
    }, [isLoaded, user, profileUser]);

    // Se ainda não carregou os dados do usuário, mostra skeleton
    if (!isLoaded && !profileUser) {
        return (
            <aside className={`${styles.aside} ${styles.loading}`}>
                <div className={styles.profileContainer}>
                    <div className={styles.profileImageContainer}>
                        <SkeletonAvatar size={100} className={styles.skeletonAvatar} />
                        <div className={styles.skeletonContent}>
                            <SkeletonText lines={1} className={styles.skeletonName} />
                            <SkeletonText lines={2} className={styles.skeletonBio} />
                        </div>
                    </div>
                </div>
                <nav className={styles.nav}>
                    <div className={styles.skeletonNav}>
                        <SkeletonText lines={4} />
                    </div>
                </nav>
            </aside>
        );
    }

    return (
        <aside className={styles.aside}>
            <div className={styles.profileContainer}>
                <div className={styles.profileImageContainer}>
                    {displayImage ? (
                        <div className={styles.profileImageWrapper}>
                            <Image
                                src={displayImage}
                                alt="Profile Picture"
                                width={100}
                                height={100}
                                className={styles.profileImage}
                            />
                        </div>) : (
                        <FaUserCircle size={100} opacity={0.3} className={styles.profileImagePlaceholder} />
                    )}
                    {profileIdentifier ? (
                        <Link href={`/profile/${profileIdentifier}`} className={styles.profileLink}>
                            <h1 className={styles.profileName}>{displayName}</h1>
                        </Link>
                    ) : (
                        <h1 className={styles.profileName}>{displayName}</h1>
                    )}
                    <div className={styles.profileBio}>
                        {!editing ? (
                            // Só permite entrar em modo de edição se for o próprio usuário
                            <p onClick={() => { if (isSelf) setEditing(true); }} title={isSelf ? "Clique para editar" : undefined} className={styles.bioText} style={{ cursor: isSelf ? 'pointer' : 'default' }}>
                                {bioValue ? bioValue : <span style={{ color: 'var(--gray-alpha-600)' }}>{isSelf ? 'Clique para adicionar uma bio.' : 'Sem bio.'} <FaPen style={{ verticalAlign: 'middle', opacity: 0.5 }} /></span>}
                            </p>
                        ) : (
                            <>
                                <input
                                    ref={(el) => { inputRef.current = el as any }}
                                    type="text"
                                    value={bioValue}
                                    onChange={(e) => setBioValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const v = bioValue.trim();
                                            saveBio(v);
                                        } else if (e.key === 'Escape') {
                                            setEditing(false);
                                            const initial = String((profileUser ?? user)?.publicMetadata?.bio ?? 'Short bio about yourself.');
                                            setBioValue(initial);
                                        }
                                    }}
                                    className={styles.bioEditor}
                                    aria-label="Editar bio"
                                    maxLength={40}
                                />
                                {error && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{error}</p>}
                                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--gray-alpha-600)' }}>Pressione Enter para salvar (máx 20 caracteres)</small>
                            </>
                        )}
                    </div>
                    <div className={styles.profileStats}>
                        <Link
                            href={profileIdentifier ? `/friends/${profileIdentifier}` : '/friends'}
                            className={styles.statsItem}
                            aria-label={friendsLoading ? 'Carregando número de amigos' : `${totalFriends ?? 0}`}
                        >
                            <FaUserFriends className={styles.statsIcon} />
                            <div className={styles.statsContent}>
                                <span className={styles.statsNumber}>
                                    {friendsLoading ? (
                                        <span>—</span>
                                    ) : (
                                        <span>{formatNumber(totalFriends)}</span>
                                    )}
                                </span>
                            </div>
                        </Link>      {/*Amigos*/}
                        <a href="#" className={styles.statsItem}><MdGroups className={styles.statsIcon} /> 5</a>           {/*Grupos*/}
                        <a href="#" className={styles.statsItem}><TbHandFinger className={styles.statsIcon} /> {pokeStats.received}</a>       {/*Cutucadas*/}
                        <a href="#" className={styles.statsItem}><TbGlassFullFilled className={styles.statsIcon} /> 1k</a> {/*Fans*/}
                    </div>
                </div>
                {/* Mostrar ações apenas quando NÃO for o próprio usuário */}
                {(!isSelf && profileUser) ? (
                    <div className={styles.profileActions}>
                        <FriendButton
                            userId={profileUser.id}
                            username={profileUser.username || profileUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Usuário'}
                        />
                        <button className="buttonSecondary">Seguir</button>
                        <button className="buttonSecondary">Mensagem</button>
                        <button
                            className="buttonSecondary"
                            onClick={handlePoke}
                            disabled={pokingUser || !canPokeUser(viewed?.id || '')}
                        >
                            {pokingUser ? 'Cutucando...' : 'Cutucar'}
                        </button>
                        {pokeMessage && (
                            <div style={{
                                marginTop: '10px',
                                padding: '8px',
                                borderRadius: '4px',
                                backgroundColor: pokeMessage.includes('Erro') ? '#fee' : '#efe',
                                color: pokeMessage.includes('Erro') ? '#c33' : '#373',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                {pokeMessage}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.profileActions}>
                        {profileIdentifier ? (
                            <Link className="buttonPrimary" style={{ display: 'flex', fontSize: '1rem', textDecoration: 'none', width: '100%', justifyContent: 'center' }} href={`/profile/${profileIdentifier}`}>
                                Ver Perfil
                            </Link>
                        ) : (
                            <button className="buttonPrimary" disabled>Ver Perfil</button>
                        )}
                        <button className="buttonSecondary">Configurações</button>
                    </div>
                )}
            </div>
            <div className={styles.friendSection}>
                <h3 className={styles.sectionTitle}>Amigos</h3>
                <ul className={styles.friendList}>
                    {friendsLoading ? (
                        // show simple skeleton lines while loading
                        Array.from({ length: 4 }).map((_, i) => (
                            <li key={i} className={styles.friendItem}>
                                <SkeletonAvatar size={36} className={styles.skeletonAvatarSmall} />
                                <div className={styles.skeletonContentSmall}>
                                    <SkeletonText lines={1} className={styles.skeletonNameSmall} />
                                </div>
                            </li>
                        ))
                    ) : friends.length === 0 ? (
                        <li className={styles.emptyState}>
                            <p className={styles.emptyStateText}>Nenhum amigo encontrado.</p>
                        </li>
                    ) : (
                        friends.map(f => (
                            <li key={f.id}>
                                <Link href={`/profile/${f.username ?? f.id}`} className={styles.friendItem}>
                                    <div className={styles.friendPreview}>
                                        {f.avatar ? (
                                            <Image src={f.avatar} alt={f.displayName || f.username || "avatar"} width={36} height={36} className={styles.friendAvatar} />
                                        ) : (
                                            <FaUserCircle className={styles.friendAvatarPlaceholder} />
                                        )}
                                        <div className={styles.friendMeta}>
                                            <div className={styles.friendName}>{f.displayName ?? f.username ?? 'Usuário'}</div>
                                            {f.username && <div className={styles.friendUsername}>@{f.username}</div>}
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
                {friends.length > 5 && (
                    <div className={styles.showMore}>
                        <Link href={profileIdentifier ? `/friends/${profileIdentifier}` : '/friends'} className={styles.showMoreButton}>
                            Mostrar mais
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    )
}