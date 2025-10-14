'use client'
import React, { useState } from 'react';
import { Header } from '../Header';
import { BottomNav } from '@/components/ui';
import { ChatComponent, NotificationsPanel } from '@/components/features';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
  };

  const handleCloseNotifications = () => {
    setIsNotificationsOpen(false);
  };

  return (
    <>
      <Header onOpenChat={handleOpenChat} onOpenNotifications={handleOpenNotifications} />
      {children}
      <BottomNav onOpenChat={handleOpenChat} />
      {isChatOpen && <ChatComponent isOpen={isChatOpen} onClose={handleCloseChat} />}
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={handleCloseNotifications} />
    </>
  );
}