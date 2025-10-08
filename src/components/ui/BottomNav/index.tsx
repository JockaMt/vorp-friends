'use client'
import React from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './bottomNav.module.css';
import { FaHome, FaUser, FaUsers, FaEnvelope } from 'react-icons/fa';
import { FaMessage } from 'react-icons/fa6';

interface BottomNavProps {
    onOpenChat?: () => void;
}

export default function BottomNav({ onOpenChat }: BottomNavProps) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const pathname = usePathname();

    if (!isSignedIn) return null;

    const navItems = [
        {
            href: '/',
            icon: FaHome,
            label: 'Início',
            isActive: pathname === '/'
        },
        {
            href: '/friends',
            icon: FaUsers,
            label: 'Amigos',
            isActive: pathname.startsWith('/friends')
        },
        // Chat button will be in the center
        {
            href: user ? `/profile/${user.username ?? user.id}` : '/profile',
            icon: FaUser,
            label: 'Perfil',
            isActive: pathname.startsWith('/profile')
        },
        {
            href: '/messages',
            icon: FaEnvelope,
            label: 'Recados',
            isActive: pathname.startsWith('/messages')
        }
    ];

    return (
        <nav className={styles.bottomNav}>
            <div className={styles.navContainer}>
                {navItems.slice(0, 2).map((item) => (
                    <Link 
                        key={item.href} 
                        href={item.href} 
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''}`}
                    >
                        <div className={styles.iconContainer}>
                            <item.icon size={18} />
                        </div>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                ))}
                
                {/* Central Chat Button */}
                <button 
                    className={styles.chatButton}
                    onClick={onOpenChat}
                    aria-label="Chat"
                >
                    <FaMessage size={20} />
                </button>
                
                {navItems.slice(2).map((item) => (
                    <Link 
                        key={item.href} 
                        href={item.href} 
                        className={`${styles.navItem} ${item.isActive ? styles.active : ''}`}
                    >
                        <div className={styles.iconContainer}>
                            <item.icon size={18} />
                        </div>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}