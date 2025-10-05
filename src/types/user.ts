import type { User as ClerkUser } from '@clerk/nextjs/server';
import type { UserResource } from '@clerk/types';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  lastSeen?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

// Função helper para converter User do Clerk para nosso User
export function clerkUserToUser(clerkUser: UserResource): User {
  return {
    id: clerkUser.id,
    username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 'user',
    email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '',
    displayName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Usuário',
    avatar: clerkUser.imageUrl,
    bio: clerkUser.publicMetadata?.bio as string || undefined,
    lastSeen: null,
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : new Date(),
  };
}

// Função helper para converter User do Clerk server para nosso User
export function clerkServerUserToUser(clerkUser: ClerkUser): User {
  return {
    id: clerkUser.id,
    username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 'user',
    email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '',
    displayName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Usuário',
    avatar: clerkUser.imageUrl,
    bio: clerkUser.publicMetadata?.bio as string || undefined,
    lastSeen: null,
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : new Date(),
  };
}