'use client';

import { useState, useEffect, useCallback } from 'react';
import { postService } from '@/services';
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

  const loadPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: PaginatedResponse<Post> = await postService.getFeed(pageNum);
      
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
  }, []);

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
      const newPost = await postService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      throw err;
    }
  };

  const likePost = async (postId: string) => {
    try {
      await postService.likePost(postId);
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
      await postService.unlikePost(postId);
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