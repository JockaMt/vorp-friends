'use client';
import '@/styles/globals.css';
import { Post } from '@/components/features/Post';
import { SkeletonPost } from '@/components/ui/Skeleton';
import { PostUpdateToast } from '@/components/ui/PostUpdateToast';
import styles from './postFeed.module.css';
import { usePosts } from '@/contexts/PostsContext';
import { usePostUpdates } from '@/hooks/usePostUpdates';
import { useEffect, useRef, useCallback } from 'react';

interface PostsFeedProps {
  filter?: 'all' | 'friends';
}

export function PostsFeed({ filter = 'all' }: PostsFeedProps) {
  const { state, actions } = usePosts();
  const { posts, isLoading, error } = state;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false); // Flag para prevenir múltiplas chamadas

  // Sistema de polling para atualizações
  const { hasNewPosts, newPostsCount, markAsChecked, refreshPage } = usePostUpdates({
    intervalMs: 5 * 60 * 1000, // 5 minutos
    enabled: true
  });

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const first = entries[0];

    // Verificação rigorosa para evitar múltiplas chamadas
    if (first.isIntersecting &&
      state.hasMore &&
      !state.isLoading &&
      !loadingRef.current) {

      loadingRef.current = true; // Bloquear novas chamadas

      actions.loadMore().finally(() => {
        // Liberar após 1 segundo para evitar chamadas muito rápidas
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      });
    }
  }, [actions.loadMore, state.hasMore, state.isLoading]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '50px', // Aumentar margem para carregamento antecipado
      threshold: 0.3, // Aumentar threshold para ser menos sensível
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver]);

  // Observar o último elemento sempre que posts mudarem
  useEffect(() => {
    if (lastElementRef.current && observerRef.current) {
      // Desconectar observações anteriores
      observerRef.current.disconnect();

      // Observar apenas o último elemento
      observerRef.current.observe(lastElementRef.current);
    }
  }, [posts.length]);

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
      <div className={styles.postsFeed}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonPost key={index} />
        ))}
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
    <>
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
                {isLoading ? (
                  <SkeletonPost />
                ) : (
                  <p>Carregando mais posts...</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast de atualizações */}
      <PostUpdateToast
        show={hasNewPosts}
        newPostsCount={newPostsCount}
        onRefresh={refreshPage}
        onDismiss={markAsChecked}
      />
    </>
  );
}