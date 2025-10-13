'use client';

import { Post } from '@/components/features/Post';
import { usePosts } from '@/contexts/PostsContext';
import type { Post as PostType } from '@/types/post';

interface PostPageClientProps {
    postData: PostType;
}

export function PostPageClient({ postData }: PostPageClientProps) {
    const { actions } = usePosts();

    const handleLike = async () => {
        try {
            if (postData.isLiked) {
                await actions.unlikePost(postData.id);
            } else {
                await actions.likePost(postData.id);
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
            // Após deletar, redirecionar para o perfil do autor ou home
            window.location.href = `/profile/${postData.author.username || postData.author.id}`;
        } catch (err) {
            console.error('Erro ao deletar post:', err);
        }
    };

    return (
        <Post
            id={postData.id}
            avatar={postData.author.avatar}
            owner={postData.author.displayName}
            userIdentifier={postData.author.username}
            authorId={postData.authorId}
            likes={postData.likesCount}
            commentsCount={postData.commentsCount}
            shares={0}
            date={new Date(postData.createdAt).toISOString()}
            text={postData.content}
            image={postData.images?.[0]}
            location={postData.location}
            isLiked={postData.isLiked}
            onLike={handleLike}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    );
}