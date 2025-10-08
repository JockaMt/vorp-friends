'use client'
import React, { useEffect, useState } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import styles from './headerNav.module.css';
import { UserSearch } from '@/components/features';
import { FaSearch } from 'react-icons/fa';
import { FaMessage } from 'react-icons/fa6';

interface HeaderProps {
    onOpenChat?: () => void;
    onOpenNotifications?: () => void;
}

export default function HeaderNav({ onOpenChat, onOpenNotifications }: HeaderProps) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const [mounted, setMounted] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isSearchOpen) {
            // Auto focus the search input when search mode is activated
            const timer = setTimeout(() => {
                const searchInput = document.querySelector(`.${styles.headerSearchInput} input`);
                if (searchInput) {
                    (searchInput as HTMLInputElement).focus();
                }
            }, 100);

            // Close search on escape key
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    closeSearch();
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            
            return () => {
                clearTimeout(timer);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isSearchOpen]);

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
    };

    return (
        <>
            <div className={styles.headerContainer}>
                {/* Mobile Header */}
                <div className={styles.mobileHeader}>
                    {!isSearchOpen ? (
                        <>
                            <h1 className={styles.headerTitle}>VORP Friends</h1>
                            
                            {mounted && isSignedIn && (
                                <button
                                    className={styles.actionButton}
                                    onClick={toggleSearch}
                                    aria-label="Buscar"
                                >
                                    <FaSearch size={18} />
                                </button>
                            )}
                        </>
                    ) : (
                        <div className={styles.searchMode}>
                            <UserSearch
                                placeholder="Buscar usuários..."
                                className={styles.headerSearchInput}
                            />
                            <button
                                className={styles.cancelButton}
                                onClick={closeSearch}
                                aria-label="Cancelar busca"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {/* Desktop Navigation - unchanged for desktop */}
                <nav className={`${styles.headerNav} ${styles.desktopNav}`}>
                    <h1 className={styles.headerTitle}>VORP Friends</h1>
                    
                    {mounted && isSignedIn &&
                        <ul className={styles.headerNavList}>
                            <li className={styles.headerNavItem}>
                                <a className={styles.active} href="/">Início</a>
                            </li>
                            <li className={styles.headerNavItem}>
                                <a href={user ? `/profile/${user.username ?? user.id}` : '/profile'}>Perfil</a>
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

                {/* Desktop Right Nav */}
                {mounted && isSignedIn ? (
                    <nav className={`${styles.headerNav} ${styles.desktopRightNav}`}>
                        <UserSearch
                            placeholder="Pesquisar usuários..."
                            className={styles.searchInput}
                        />
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
        </>
    )
}