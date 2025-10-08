'use client'
import React, { useState } from 'react';
import { Header } from '../Header';
import { BottomNav } from '@/components/ui';
import { ChatComponent } from '@/components/features/ChatComponent';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <Header onOpenChat={handleOpenChat} />
      {children}
      <BottomNav onOpenChat={handleOpenChat} />
      {isChatOpen && <ChatComponent isOpen={isChatOpen} onClose={handleCloseChat} />}
    </>
  );
}