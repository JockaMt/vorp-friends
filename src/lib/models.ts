import { ObjectId } from 'mongodb';

export interface PostDocument {
  _id?: ObjectId;
  content: string;
  authorId: string;
  location?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  } | null;
  images?: { uuid: string; url: string }[];
  likes: string[]; // Array de IDs dos usuários que curtiram
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDocument {
  _id?: ObjectId;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendshipDocument {
  _id?: ObjectId;
  requesterId: string; // ID do usuário que enviou a solicitação
  addresseeId: string; // ID do usuário que recebeu a solicitação
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para a API (sem campos internos do MongoDB)
export interface PostData {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  location?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  } | null;
  images?: { uuid: string; url: string }[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentData {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendshipData {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requester: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  addressee: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}