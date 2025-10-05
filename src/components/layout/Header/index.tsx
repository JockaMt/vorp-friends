import React from 'react';
import styles from './header.module.css';
import HeaderNav from '@/components/ui/HeaderNav';

interface HeaderProps {
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
}

export function Header({ onOpenChat, onOpenNotifications }: HeaderProps) {

  return (
    <header className={styles.header}>
      <HeaderNav onOpenChat={onOpenChat} onOpenNotifications={onOpenNotifications} />
    </header>
  );
}