'use client';
import '@/styles/globals.css';
import { Post } from '@/components/features/Post';
import styles from './postFeed.module.css';
import { usePosts } from '@/contexts/PostsContext';
import { useEffect, useRef, useCallback } from 'react';

interface PostsFeedProps {
  filter?: 'all' | 'friends';
}

export function PostsFeed({ filter = 'all' }: PostsFeedProps) {
  const { state, actions } = usePosts();
  const { posts, isLoading, error } = state;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const first = entries[0];
    if (first.isIntersecting) {
      if (state.hasMore && !state.isLoading) {
        actions.loadMore();
      }
    }
  }, [actions, state.hasMore, state.isLoading]);

  useEffect(() => {
    if (!lastElementRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });

    const el = lastElementRef.current;
    if (el) observerRef.current.observe(el);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver, posts.length]);

  // Atualizar o filtro quando a prop muda
  useEffect(() => {
    if (state.filter !== filter) {
      actions.setFilter(filter);
    }
  }, [filter, state.filter, actions]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await actions.unlikePost(postId);
      } else {
        await actions.likePost(postId);
      }
    } catch (err) {
      console.error('Erro ao curtir post:', err);
    }
  };

  const handleEdit = async (postId: string, newContent: string) => {
    try {
      await actions.editPost(postId, newContent);
    } catch (err) {
      console.error('Erro ao editar post:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await actions.deletePost(postId);
    } catch (err) {
      console.error('Erro ao deletar post:', err);
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className={styles.loading}>
        <p>Carregando posts...</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className={styles.error}>
        <p>Erro: {error}</p>
        <button 
          onClick={() => actions.refresh()}
          style={{ marginTop: '1rem' }}
          className="buttonPrimary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.postsFeed}>
      {posts.length === 0 ? (
        <div className={styles.noPosts}>
          <p>Nenhum post ainda!</p>
          <small>Seja o primeiro a postar algo.</small>
        </div>
      ) : (
        <>
          {posts.map((post, index) => {
            // ref on the wrapper of the last item
            const isLast = index === posts.length - 1;
            return (
              <div key={post.id} ref={isLast ? lastElementRef : null}>
                <Post
                  id={post.id}
                  avatar={post.author.avatar}
                  owner={post.author.displayName}
                  userIdentifier={post.author.username}
                  authorId={post.authorId}
                  likes={post.likesCount}
                  commentsCount={post.commentsCount}
                  comments={[]}
                  shares={0}
                  date={new Date(post.createdAt).toISOString()}
                  text={post.content}
                  image={post.images?.[0]}
                  location={post.location}
                  isLiked={post.isLiked}
                  onLike={() => handleLike(post.id, post.isLiked || false)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            );
          })}

          {state.hasMore && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <button 
                onClick={actions.loadMore}
                disabled={isLoading}
                className="buttonPrimary"
              >
                {isLoading ? 'Carregando...' : 'Carregar mais posts'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}