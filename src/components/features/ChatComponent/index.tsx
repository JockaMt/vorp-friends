'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { friendshipService } from '@/services/friendship';
import type { Friendship } from '@/types/friendship';
import styles from './chat.module.css';
import { FaPaperPlane, FaPaperclip, FaSmile, FaComments } from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';

export function ChatComponent() {
    const { userId } = useAuth();
    const [open, setOpen] = useState(false);
    const [friends, setFriends] = useState<Array<{
        id: string;
        name: string;
        username: string;
        avatar?: string;
        online: boolean;
    }>>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

    const messages = [
        { id: 1, from: 'friend', text: 'Oi! Tudo bem?', time: '09:10' },
        { id: 2, from: 'me', text: 'Tudo e você? Estou testando o chat visual.', time: '09:11' },
        { id: 3, from: 'friend', text: 'Legal! Parece bom.', time: '09:12' },
    ];

    // Carregar amigos quando o chat abrir
    useEffect(() => {
        if (open && userId && friends.length === 0) {
            loadFriends();
        }
    }, [open, userId]);

    const loadFriends = async () => {
        if (!userId) return;
        
        setLoading(true);
        try {
            const data = await friendshipService.getFriends('accepted');
            const friendsList = (data.friendships || []).map((friendship: Friendship) => {
                // Determinar qual usuário mostrar (o que não é o usuário atual)
                const friend = friendship.requesterId === userId 
                    ? friendship.addressee 
                    : friendship.requester;
                
                return {
                    id: friend.id,
                    name: friend.displayName,
                    username: friend.username,
                    avatar: friend.avatar,
                    online: Math.random() > 0.5 // Por enquanto status aleatório
                };
            });
            setFriends(friendsList);
        } catch (error) {
            console.error('Erro ao carregar amigos para chat:', error);
        } finally {
            setLoading(false);
        }
    };

    function openWithFriend(id: string) {
        setSelectedFriend(id);
    }

    return (
        <div className={styles.chatWidget}>
            {!(open) && (
                <button
                    className={styles.floatingButton}
                    aria-label={open ? 'Fechar chat' : 'Abrir chat'}
                    onClick={() => setOpen(v => !v)}
                >
                    <FaComments size={24} />
                </button>
            )}

            {open && (
                <div className={styles.chatShell} role="dialog" aria-label="Chat de amigos">
                    {/* Two separate screens: friends list screen or chat screen */}
                    {selectedFriend == null ? (
                        <div className={styles.friendsScreen}>
                            <div className={styles.friendsHeader}>Amigos 
                                <button className={styles.minimizeButton} onClick={() => {
                                    setOpen(false)
                                    }} aria-label="Minimizar chat">—</button>
                                </div>
                            {loading ? (
                                <div className={styles.loading}>Carregando amigos...</div>
                            ) : friends.length === 0 ? (
                                <div className={styles.noFriends}>
                                    <p>Você ainda não tem amigos para conversar.</p>
                                    <p>Adicione amigos nos perfis de usuários!</p>
                                </div>
                            ) : (
                                <ul className={styles.friendsList}>
                                    {friends.map(f => (
                                        <li key={f.id} className={styles.friendItem} onClick={() => openWithFriend(f.id)}>
                                            <span className={`${styles.statusDot} ${f.online ? styles.online : styles.offline}`}></span>
                                            <div className={styles.friendInfo}>
                                                <span className={styles.friendName}>{f.name}</span>
                                                <span className={styles.friendUsername}>@{f.username}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className={styles.chatScreen}>
                            <header className={styles.chatHeader}>
                                <div className={styles.chatHeaderLeft}>
                                    <button className={styles.backButton} onClick={() => setSelectedFriend(null)}><IoIosArrowBack size={16} /></button>
                                    <div className={styles.chatTitle}>{friends.find(f => f.id === selectedFriend)?.name}</div>
                                    <span className={`${styles.statusDot} ${friends.find(f => f.id === selectedFriend)?.online ? styles.online : styles.offline}`}></span>
                                </div>
                                <button className={styles.minimizeButton} onClick={() => setOpen(false)} aria-label="Minimizar chat">—</button>
                            </header>

                            <div className={styles.messages}>
                                {messages.map(m => (
                                    <div key={m.id} className={`${styles.messageRow} ${m.from === 'me' ? styles.me : styles.friend}`}>
                                        <div className={styles.bubble}>
                                            <div className={styles.messageText}>{m.text}</div>
                                            <div className={styles.messageTime}>{m.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.chatInputRow}>
                                <button className={styles.iconButton}><FaPaperclip /></button>
                                <button className={styles.iconButton}><FaSmile /></button>
                                <div className={styles.inputWrapper}>
                                    <div contentEditable className={styles.input} data-placeholder="Escreva uma mensagem..."></div>
                                </div>
                                <button className={styles.sendButton}><FaPaperPlane /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ChatMessage() {
    return null; // UI-only; individual messages are rendered in ChatComponent
}

export function ChatInput() {
    return null; // UI-only
}