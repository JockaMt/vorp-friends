'use client';

import React, { useState, useEffect } from 'react';
import { Post } from '@/components/features/Post';
import { usePosts } from '@/contexts/PostsContext';
import styles from './userPosts.module.css';

interface UserPostsProps {
  authorId: string;
}

export function UserPosts({ authorId }: UserPostsProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { actions } = usePosts();

  // Buscar posts do usuário
  const fetchUserPosts = async (pageNum = 1, reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/posts/feed?authorId=${encodeURIComponent(authorId)}&page=${pageNum}&limit=10`);
      if (!response.ok) throw new Error('Erro ao carregar posts');
      
      const data = await response.json();
      
      if (reset) {
        setPosts(data.data);
      } else {
        setPosts(prev => [...prev, ...data.data]);
      }
      
      setHasMore(pageNum < data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar posts iniciais quando authorId mudar
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchUserPosts(1, true);
  }, [authorId]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchUserPosts(page + 1);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, isLiked: !isLiked, likesCount: (p.likesCount || 0) + (isLiked ? -1 : 1) } 
        : p
    ));
    
    try {
      if (isLiked) {
        await actions.unlikePost(postId);
      } else {
        await actions.likePost(postId);
      }
    } catch (err) {
      console.error('Erro ao curtir/descurtir:', err);
      // Revert on error
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isLiked: isLiked, likesCount: (p.likesCount || 0) + (isLiked ? 1 : -1) } 
          : p
      ));
    }
  };

  const handleEdit = async (postId: string, newContent: string) => {
    try {
      await actions.editPost(postId, newContent);
      // Atualizar post local
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, content: newContent } : p
      ));
    } catch (err) {
      console.error('Erro ao editar post:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await actions.deletePost(postId);
      // Remover post local
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Erro ao deletar post:', err);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Posts</h2>
      
      {posts.length === 0 && !isLoading ? (
        <div className={styles.noPosts}>
          <p>Nenhum post ainda!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {posts.map(p => (
            <Post
              key={p.id}
              id={p.id}
              avatar={p.author.avatar}
              owner={p.author.displayName}
              userIdentifier={p.author.username}
              authorId={p.authorId}
              likes={p.likesCount}
              comments={[]}
              commentsCount={typeof p.commentsCount === 'number' ? p.commentsCount : Number(p.commentsCount) || 0}
              shares={0}
              date={new Date(p.createdAt).toISOString()}
              text={p.content}
              image={p.images?.[0]}
              location={p.location}
              isLiked={p.isLiked}
              onLike={() => handleLike(p.id, !!p.isLiked)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {hasMore && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <button 
                className="buttonPrimary" 
                onClick={handleLoadMore} 
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}