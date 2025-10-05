'use client';

import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import type { Post } from '@/types/post';
import { useAuth } from '@clerk/nextjs';

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  filter: 'all' | 'friends';
  authorId?: string; // Para filtrar por autor específico
}

type PostsAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: { id: string; updates: Partial<Post> } }
  | { type: 'REMOVE_POST'; payload: string }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'friends' }
  | { type: 'SET_AUTHOR_ID'; payload: string | undefined }
  | { type: 'RESET' };

const initialState: PostsState = {
  posts: [],
  isLoading: true,
  hasMore: true,
  error: null,
  page: 1,
  filter: 'all',
  authorId: undefined
};

function postsReducer(state: PostsState, action: PostsAction): PostsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_POSTS':
      return { ...state, posts: action.payload, isLoading: false, error: null };
    case 'ADD_POSTS':
      return { 
        ...state, 
        posts: [...state.posts, ...action.payload], 
        isLoading: false, 
        error: null 
      };
    case 'ADD_POST':
      return { 
        ...state, 
        posts: [action.payload, ...state.posts],
        error: null 
      };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id 
            ? { ...post, ...action.payload.updates }
            : post
        )
      };
    case 'REMOVE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      };
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_AUTHOR_ID':
      return { ...state, authorId: action.payload };
    case 'RESET':
      return { ...initialState, filter: state.filter, authorId: state.authorId };
    default:
      return state;
  }
}

interface PostsContextType {
  state: PostsState;
  actions: {
    loadPosts: (page?: number, append?: boolean) => Promise<void>;
    loadMore: () => Promise<void>;
    createPost: (content: string, location?: { name?: string; address?: string; coordinates?: { lat: number; lng: number } }) => Promise<void>;
    editPost: (postId: string, content: string) => Promise<void>;
    likePost: (postId: string) => Promise<void>;
    unlikePost: (postId: string) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    setFilter: (filter: 'all' | 'friends') => void;
    setAuthorId: (authorId?: string) => void;
    refresh: () => Promise<void>;
  };
}

const PostsContext = createContext<PostsContextType | null>(null);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(postsReducer, initialState);
  const { isSignedIn } = useAuth();

  const fetchPosts = useCallback(async (page: number, filter: string, authorId?: string) => {
    let url = `/api/posts/feed?page=${page}&limit=10&filter=${filter}`;
    if (authorId) {
      url += `&authorId=${encodeURIComponent(authorId)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erro ao carregar posts');
    }
    return response.json();
  }, []);

  const loadPosts = useCallback(async (page = 1, append = false) => {
    if (!isSignedIn) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const data = await fetchPosts(page, state.filter, state.authorId);
      
      if (append) {
        // Ao carregar mais, adicionar aos posts existentes
        dispatch({ type: 'ADD_POSTS', payload: data.data });
      } else {
        // Ao carregar nova página, substituir todos os posts
        dispatch({ type: 'SET_POSTS', payload: data.data });
      }
      
      dispatch({ type: 'SET_HAS_MORE', payload: page < data.pagination.totalPages });
      dispatch({ type: 'SET_PAGE', payload: page });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  }, [isSignedIn, state.filter, fetchPosts]);

  const loadMore = useCallback(async () => {
    if (state.hasMore && !state.isLoading) {
      await loadPosts(state.page + 1, true);
    }
  }, [state.hasMore, state.isLoading, state.page, loadPosts]);

  const createPost = useCallback(async (content: string, location?: { name?: string; address?: string; coordinates?: { lat: number; lng: number } }) => {
    if (!isSignedIn) {
      throw new Error('Você precisa estar logado para postar');
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, location }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar post');
      }

      const result = await response.json();
      
      // Adicionar o novo post no início da lista (cache otimista)
      dispatch({ type: 'ADD_POST', payload: result.data });
      
      // Limpar erro após sucesso
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao criar post' });
      throw error;
    }
  }, [isSignedIn]);

  const editPost = useCallback(async (postId: string, content: string) => {
    if (!isSignedIn) {
      throw new Error('Você precisa estar logado para editar posts');
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao editar post');
      }

      const result = await response.json();
      
      // Atualizar o post no cache
      dispatch({ 
        type: 'UPDATE_POST', 
        payload: { 
          id: postId, 
          updates: { 
            content: result.data.content,
            updatedAt: result.data.updatedAt
          } 
        } 
      });
      
      // Limpar erro após sucesso
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao editar post' });
      throw error;
    }
  }, [isSignedIn]);

  const likePost = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/like/${postId}`, { method: 'POST' });
      if (!response.ok) throw new Error('Erro ao curtir post');
      
      dispatch({ 
        type: 'UPDATE_POST', 
        payload: { 
          id: postId, 
          updates: { 
            isLiked: true, 
            likesCount: state.posts.find(p => p.id === postId)?.likesCount! + 1 
          } 
        } 
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao curtir post' });
    }
  }, [state.posts]);

  const unlikePost = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/like/${postId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao descurtir post');
      
      dispatch({ 
        type: 'UPDATE_POST', 
        payload: { 
          id: postId, 
          updates: { 
            isLiked: false, 
            likesCount: state.posts.find(p => p.id === postId)?.likesCount! - 1 
          } 
        } 
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao descurtir post' });
    }
  }, [state.posts]);

  const deletePost = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar post');
      
      dispatch({ type: 'REMOVE_POST', payload: postId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao deletar post' });
    }
  }, []);

  const setFilter = useCallback((filter: 'all' | 'friends') => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setAuthorId = useCallback((authorId?: string) => {
    dispatch({ type: 'SET_AUTHOR_ID', payload: authorId });
  }, []);

  const refresh = useCallback(async () => {
    dispatch({ type: 'RESET' });
    await loadPosts(1);
  }, [loadPosts]);

  // Carregar posts apenas quando necessário
  useEffect(() => {
    if (isSignedIn && state.posts.length === 0) {
      loadPosts(1);
    }
  }, [isSignedIn, loadPosts]);

  // Recarregar quando o filtro ou authorId muda
  useEffect(() => {
    if (isSignedIn) {
      dispatch({ type: 'RESET' });
      loadPosts(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filter, state.authorId, isSignedIn]);

  const contextValue: PostsContextType = {
    state,
    actions: {
      loadPosts,
      loadMore,
      createPost,
      editPost,
      likePost,
      unlikePost,
      deletePost,
      setFilter,
      setAuthorId,
      refresh,
    },
  };

  return (
    <PostsContext.Provider value={contextValue}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts deve ser usado dentro de um PostsProvider');
  }
  return context;
}