'use client'
import React, { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import styles from './headerNav.module.css';
import { UserSearch } from '@/components/features';
import { RiNotificationBadgeFill } from 'react-icons/ri';
import { FaMessage } from 'react-icons/fa6';

interface HeaderProps {
    onOpenChat?: () => void;
    onOpenNotifications?: () => void;
}

export default function HeaderNav({ onOpenChat, onOpenNotifications }: HeaderProps) {
    const { isSignedIn } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={styles.headerContainer}>
            <nav className={styles.headerNav}>
                <h1 className={styles.headerTitle}>VORP Friends</h1>
                {mounted && isSignedIn &&
                    <ul className={styles.headerNavList}>
                        <li className={styles.headerNavItem}>
                            <a className={styles.active} href="/">Início</a>
                        </li>
                        <li className={styles.headerNavItem}>
                            <a href="/profile">Perfil</a>
                        </li>
                        <li className={styles.headerNavItem}>
                            <a href="/friends">Amigos</a>
                        </li>
                        <li className={styles.headerNavItem}>
                            <a href="/groups">Grupos</a>
                        </li>
                        <li className={styles.headerNavItem}>
                            <a href="/messages">Recados</a>
                        </li>
                    </ul>
                }
            </nav>
            {mounted && isSignedIn ? (
            <nav className={styles.headerNav}>
                <UserSearch
                    placeholder="Pesquisar usuários..."
                    className={styles.searchInput}
                />
                <button
                    className={styles.navButton}
                    onClick={onOpenNotifications}
                    aria-label="Notificações"
                >
                    <RiNotificationBadgeFill size={17} />
                </button>
                <button
                    className={styles.navButton}
                    onClick={onOpenChat}
                    aria-label="Mensagens"
                >
                    <FaMessage size={14} />
                </button>
                <div className={styles.userButton}>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8",
                                userButtonPopoverCard: "shadow-lg",
                                userButtonPopoverActionButton: "hover:bg-gray-100"
                            }
                        }}
                        showName={false}
                        afterSignOutUrl="/sign-in"
                    />
                </div>
            </nav>
        ) : (
            <p className={styles.headerNavItem}>Conecte-se e faça novos amigos.</p>
        )}
        </div>
    )
}