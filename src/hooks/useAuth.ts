'use client';

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { clerkUserToUser } from '@/types';
import type { User } from '@/types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  userId: string | null;
}

export function useAuth(): UseAuthReturn {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded, userId, signOut } = useClerkAuth();

  const isLoading = !userLoaded || !authLoaded;
  const isAuthenticated = !!userId;

  const user = clerkUser ? clerkUserToUser(clerkUser) : null;

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    userId: userId || null,
  };
}