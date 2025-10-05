'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./profileSidebar.module.css";
import Image from "next/image";
import { FaUserCircle, FaUserFriends } from "react-icons/fa";
import { MdGroups } from "react-icons/md";
import { TbGlassFullFilled, TbHandFinger } from "react-icons/tb";
import { FaPen } from "react-icons/fa6";
import { useUser } from "@clerk/nextjs";
import type { SerializedUser } from "@/types/serializedUser";

export function ProfileSidebar({ profileUser }: { profileUser?: SerializedUser }) {
    const { user, isLoaded } = useUser();
    const [editing, setEditing] = useState(false);
    const [bioValue, setBioValue] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
                        <a href="#" className={styles.statsItem}><FaUserFriends className={styles.statsIcon} /> 250</a>      {/*Amigos*/}
                        <a href="#" className={styles.statsItem}><MdGroups className={styles.statsIcon} /> 5</a>           {/*Grupos*/}
                        <a href="#" className={styles.statsItem}><TbHandFinger className={styles.statsIcon} /> 20</a>       {/*Cutucadas*/}
                        <a href="#" className={styles.statsItem}><TbGlassFullFilled className={styles.statsIcon} /> 1k</a> {/*Fans*/}
                    </div>
                </div>
                {/* Mostrar ações apenas quando NÃO for o próprio usuário */}
                {!isSelf ? (
                    <div className={styles.profileActions}>
                        <button className="buttonPrimary">Adicionar Amigo</button>
                        <button className="buttonSecondary">Seguir</button>
                        <button className="buttonSecondary">Mensagem</button>
                        <button className="buttonSecondary">Cutucar</button>
                    </div>
                ) : (
                    <div className={styles.profileActions}>
                        {profileIdentifier ? (
                            <Link className="buttonPrimary" style={{display: 'flex', textDecoration: 'none', width: '100%', justifyContent: 'center'}} href={`/profile/${profileIdentifier}`}>
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
                    <li>
                        <a href="#" className={styles.friendItem}>
                            <span className={styles.friendName}>Amigo 1</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" className={styles.friendItem}>
                            <span className={styles.friendName}>Amigo 2</span>
                        </a>
                    </li>
                </ul>
            </div>
        </aside>
    )
}