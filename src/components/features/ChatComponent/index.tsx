'use client';
import { useState } from 'react';
import styles from './chat.module.css';
import { FaPaperPlane, FaPaperclip, FaSmile, FaComments } from 'react-icons/fa';
import { IoIosArrowBack } from 'react-icons/io';

export function ChatComponent() {
    const [open, setOpen] = useState(false);

    const messages = [
        { id: 1, from: 'friend', text: 'Oi! Tudo bem?', time: '09:10' },
        { id: 2, from: 'me', text: 'Tudo e você? Estou testando o chat visual.', time: '09:11' },
        { id: 3, from: 'friend', text: 'Legal! Parece bom.', time: '09:12' },
    ];

    const friends = [
        { id: 1, name: 'Amigo 1', online: true },
        { id: 2, name: 'Amigo 2', online: false },
        { id: 3, name: 'Amigo 3', online: true },
        { id: 4, name: 'Amigo 4', online: true },
        { id: 5, name: 'Amigo 5', online: true },
        { id: 6, name: 'Amigo 6', online: true },
        { id: 7, name: 'Amigo 7', online: true },
        { id: 8, name: 'Amigo 8', online: true },
        { id: 9, name: 'Amigo 9', online: true },
        { id: 10, name: 'Amigo 10', online: true },
        { id: 11, name: 'Amigo 11', online: true },
    ];

    const [selectedFriend, setSelectedFriend] = useState<number | null>(null);

    function openWithFriend(id: number) {
        setSelectedFriend(id);
        setOpen(true);
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
                            <ul className={styles.friendsList}>
                                {friends.map(f => (
                                    <li key={f.id} className={styles.friendItem} onClick={() => openWithFriend(f.id)}>
                                        <span className={`${styles.statusDot} ${f.online ? styles.online : styles.offline}`}></span>
                                        <span className={styles.friendName}>{f.name}</span>
                                    </li>
                                ))}
                            </ul>
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