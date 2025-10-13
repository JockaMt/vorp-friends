'use client';

import React, { createContext, useContext, useCallback, useReducer, useEffect, useRef } from 'react';
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
      // Filtragem adicional no reducer para prevenir duplicatas
      const existingIds = new Set(state.posts.map(post => post.id));
      const filteredNewPosts = action.payload.filter((post: Post) => !existingIds.has(post.id));

      return {
        ...state,
        posts: [...state.posts, ...filteredNewPosts],
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
    createPost: (postData: { content: string; images?: File[]; location?: { name?: string; address?: string; coordinates?: { lat: number; lng: number } } }) => Promise<void>;
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

  // Refs para evitar dependências circulares
  const filterRef = React.useRef(state.filter);
  const authorIdRef = React.useRef(state.authorId);
  const postsRef = React.useRef(state.posts);
  const loadingRef = React.useRef(false); // Flag para controlar carregamento

  // Atualizar refs quando o estado muda
  React.useEffect(() => {
    filterRef.current = state.filter;
  }, [state.filter]);

  React.useEffect(() => {
    authorIdRef.current = state.authorId;
  }, [state.authorId]);

  React.useEffect(() => {
    postsRef.current = state.posts;
  }, [state.posts]);

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

    // Prevenir múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log('Bloqueando carregamento - já está carregando');
      return;
    }

    try {
      loadingRef.current = true; // Marcar como carregando
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Usar refs para evitar dependências circulares
      const data = await fetchPosts(page, filterRef.current, authorIdRef.current);

      if (append) {
        // Ao carregar mais, filtrar posts duplicados antes de adicionar
        const existingPostIds = new Set(postsRef.current.map(post => post.id));
        const newPosts = data.data.filter((post: Post) => !existingPostIds.has(post.id));

        if (newPosts.length > 0) {
          dispatch({ type: 'ADD_POSTS', payload: newPosts });
        }

        // Se não há novos posts únicos, não há mais posts para carregar
        dispatch({
          type: 'SET_HAS_MORE',
          payload: newPosts.length > 0 && page < data.pagination.totalPages
        });
      } else {
        // Ao carregar nova página, substituir todos os posts
        dispatch({ type: 'SET_POSTS', payload: data.data });
        dispatch({ type: 'SET_HAS_MORE', payload: page < data.pagination.totalPages });
      }

      dispatch({ type: 'SET_PAGE', payload: page });
    } catch (error) {
      console.error('Error loading posts:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro desconhecido' });
    } finally {
      loadingRef.current = false; // Liberar o lock
    }
  }, [isSignedIn, fetchPosts]);

  // Criar um ref para loadPosts para evitar dependências circulares
  const loadPostsRef = useRef(loadPosts);
  loadPostsRef.current = loadPosts;

  const loadMore = useCallback(async () => {
    // Verificação tripla para evitar carregamentos desnecessários
    if (!state.hasMore || state.isLoading || loadingRef.current) {
      console.log('LoadMore bloqueado:', {
        hasMore: state.hasMore,
        isLoading: state.isLoading,
        lockRef: loadingRef.current
      });
      return;
    }

    await loadPostsRef.current(state.page + 1, true);
  }, [state.hasMore, state.isLoading, state.page]);

  const createPost = useCallback(async (postData: { content: string; images?: File[]; location?: { name?: string; address?: string; coordinates?: { lat: number; lng: number } } }) => {
    if (!isSignedIn) {
      throw new Error('Você precisa estar logado para postar');
    }

    try {
      let response: Response;
      if (postData.images && postData.images.length > 0) {
        const form = new FormData();
        form.append('content', postData.content);
        if (postData.location) form.append('location', JSON.stringify(postData.location as any));
        postData.images.forEach(img => form.append('images', img));

        response = await fetch('/api/posts', {
          method: 'POST',
          body: form,
        });
      } else {
        response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: postData.content, location: postData.location }),
        });
      }

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
    await loadPostsRef.current(1);
  }, []);

  // Carregar posts apenas quando necessário
  useEffect(() => {
    if (isSignedIn && state.posts.length === 0) {
      loadPostsRef.current(1);
    }
  }, [isSignedIn, state.posts.length]);

  // Recarregar quando o filtro ou authorId muda
  useEffect(() => {
    if (isSignedIn) {
      dispatch({ type: 'RESET' });
      // Usar setTimeout para evitar conflitos com outros useEffects
      setTimeout(() => {
        loadPostsRef.current(1);
      }, 0);
    }
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