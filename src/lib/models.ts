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
  images?: string[];
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
  images?: string[];
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
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}