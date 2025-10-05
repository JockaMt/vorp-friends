'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(
    async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
      const token = await getToken();
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(endpoint, config);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    [getToken]
  );

  return { authenticatedFetch };
}