'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePostUpdatesOptions {
  intervalMs?: number;
  enabled?: boolean;
}

interface PostUpdate {
  hasNewPosts: boolean;
  newPostsCount: number;
  latestPostDate: Date | null;
}

export function usePostUpdates({ intervalMs = 5 * 60 * 1000, enabled = true }: UsePostUpdatesOptions = {}) {
  const [lastCheckDate, setLastCheckDate] = useState<Date>(new Date());
  const [updateInfo, setUpdateInfo] = useState<PostUpdate>({
    hasNewPosts: false,
    newPostsCount: 0,
    latestPostDate: null
  });

  const checkForUpdates = useCallback(async () => {
    try {
      // Verificar se há posts mais recentes que a última verificação
      const response = await fetch(`/api/posts/feed?limit=1&since=${lastCheckDate.toISOString()}`);
      if (!response.ok) return;

      const data = await response.json();
      const posts = data.data || [];
      
      if (posts.length > 0) {
        // Há posts mais recentes
        const latestPost = posts[0];
        const latestDate = new Date(latestPost.createdAt);
        
        // Verificar quantos posts novos há aproximadamente
        const countResponse = await fetch(`/api/posts/feed?limit=50&since=${lastCheckDate.toISOString()}`);
        const countData = await countResponse.json();
        const newPostsCount = countData.data?.length || 1;

        setUpdateInfo({
          hasNewPosts: true,
          newPostsCount,
          latestPostDate: latestDate
        });
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações de posts:', error);
    }
  }, [lastCheckDate]);

  const markAsChecked = useCallback(() => {
    setLastCheckDate(new Date());
    setUpdateInfo({
      hasNewPosts: false,
      newPostsCount: 0,
      latestPostDate: null
    });
  }, []);

  const refreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(checkForUpdates, intervalMs);
    return () => clearInterval(interval);
  }, [checkForUpdates, intervalMs, enabled]);

  return {
    ...updateInfo,
    markAsChecked,
    refreshPage
  };
}