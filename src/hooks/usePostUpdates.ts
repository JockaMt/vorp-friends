'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePostUpdatesOptions {
    intervalMs?: number;
    enabled?: boolean;
    currentFirstPostId?: string; // ID do primeiro post atualmente exibido
    pauseAfterUserAction?: boolean; // Pausar verificações após ação do usuário
}

interface PostUpdate {
    hasNewPosts: boolean;
    newPostsCount: number;
    latestPostDate: Date | null;
}

export function usePostUpdates({ intervalMs = 3 * 60 * 1000, enabled = true, currentFirstPostId, pauseAfterUserAction = false }: UsePostUpdatesOptions = {}) {
    const [lastCheckDate, setLastCheckDate] = useState<Date>(new Date());
    const [updateInfo, setUpdateInfo] = useState<PostUpdate>({
        hasNewPosts: false,
        newPostsCount: 0,
        latestPostDate: null
    });

    // Reset do estado quando o primeiro post mudar (ex: usuário criou um novo post)
    useEffect(() => {
        if (currentFirstPostId) {
            setUpdateInfo({
                hasNewPosts: false,
                newPostsCount: 0,
                latestPostDate: null
            });
            setLastCheckDate(new Date());
        }
    }, [currentFirstPostId]);

    const checkForUpdates = useCallback(async () => {
        try {
            // Buscar o post mais recente do banco de dados
            const response = await fetch('/api/posts/feed?limit=1');
            if (!response.ok) return;

            const data = await response.json();
            const posts = data.data || [];

            if (posts.length > 0) {
                const latestPostInDb = posts[0];
                const latestPostId = latestPostInDb.id;

                // Se o primeiro post exibido é o mesmo que o último do banco,
                // não há novos posts para mostrar
                if (currentFirstPostId && currentFirstPostId === latestPostId) {
                    // Não exibir notificação - o usuário já está vendo o post mais recente
                    setUpdateInfo({
                        hasNewPosts: false,
                        newPostsCount: 0,
                        latestPostDate: null
                    });
                    return;
                }

                // Verificar se há posts mais recentes que a última verificação
                const sinceResponse = await fetch(`/api/posts/feed?limit=50&since=${lastCheckDate.toISOString()}`);
                if (!sinceResponse.ok) return;

                const sinceData = await sinceResponse.json();
                const newPosts = sinceData.data || [];

                if (newPosts.length > 0) {
                    // Há posts mais recentes e o primeiro post exibido não é o mais recente
                    const latestDate = new Date(latestPostInDb.createdAt);

                    setUpdateInfo({
                        hasNewPosts: true,
                        newPostsCount: newPosts.length,
                        latestPostDate: latestDate
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao verificar atualizações de posts:', error);
        }
    }, [lastCheckDate, currentFirstPostId]);

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
        if (!enabled || pauseAfterUserAction) return;

        const interval = setInterval(checkForUpdates, intervalMs);
        return () => clearInterval(interval);
    }, [checkForUpdates, intervalMs, enabled, pauseAfterUserAction]);

    return {
        ...updateInfo,
        markAsChecked,
        refreshPage
    };
}