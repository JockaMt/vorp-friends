import React from 'react';
import styles from './header.module.css';
import { RiNotificationBadgeFill } from "react-icons/ri";
import { FaMessage } from "react-icons/fa6";
import { IoLogOut } from "react-icons/io5";

interface HeaderProps {
  user?: {
    username: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
}

export function Header({ user, onLogout, onOpenChat, onOpenNotifications }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <nav className={styles.headerNav}>
          <h1 className={styles.headerTitle}>VORP Friends</h1>
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
        </nav>
        <nav className={styles.headerNav}>
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
          <button 
            className={styles.navButton}
            onClick={onLogout}
            aria-label="Sair"
          >
            <IoLogOut size={19} />
          </button>
        </nav>
      </div>
    </header>
  );
}