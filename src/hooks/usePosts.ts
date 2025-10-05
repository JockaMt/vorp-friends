'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import type { Post, PaginatedResponse, CreatePostData } from '@/types';

interface UsePostsReturn {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  createPost: (postData: CreatePostData) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { authenticatedFetch } = useAuthenticatedFetch();

  const loadPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: PaginatedResponse<Post> = await authenticatedFetch(
        `/api/posts/feed?page=${pageNum}&limit=10`
      );
      
      if (append) {
        setPosts(prev => [...prev, ...response.data]);
      } else {
        setPosts(response.data);
      }
      
      setHasMore(pageNum < response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const loadMore = async () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      await loadPosts(nextPage, true);
    }
  };

  const createPost = async (postData: CreatePostData) => {
    try {
      const formData = new FormData();
      formData.append('content', postData.content);
      
      if (postData.images) {
        postData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await authenticatedFetch<{ data: Post }>(
        '/api/posts',
        {
          method: 'POST',
          body: formData,
          headers: {}, // Não definir Content-Type para FormData
        }
      );
      
      setPosts(prev => [response.data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      throw err;
    }
  };

  const likePost = async (postId: string) => {
    try {
      await authenticatedFetch(`/api/posts/like/${postId}`, {
        method: 'POST',
      });
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, isLiked: true, likesCount: post.likesCount + 1 }
          : post
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      await authenticatedFetch(`/api/posts/like/${postId}`, {
        method: 'DELETE',
      });
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, isLiked: false, likesCount: post.likesCount - 1 }
          : post
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlike post');
    }
  };

  const refresh = async () => {
    setPage(1);
    await loadPosts(1);
  };

  return {
    posts,
    isLoading,
    hasMore,
    error,
    loadMore,
    createPost,
    likePost,
    unlikePost,
    refresh,
  };
}