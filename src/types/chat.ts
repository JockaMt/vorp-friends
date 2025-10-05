export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageData {
  content: string;
  receiverId: string;
}