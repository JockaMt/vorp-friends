import React from 'react';
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getDatabase } from '@/lib/mongodb';
import type { PostDocument } from '@/lib/models';
import { ObjectId } from 'mongodb';
import { getUsersInfo } from '@/lib/user-utils';
import styles from "@/app/page.module.css";
import { ProfileSidebar } from "@/components/features/ProfileSidebar";
import { PostPageClient } from './PostPageClient';
import type { SerializedUser } from "@/types/serializedUser";
import type { User } from "@clerk/nextjs/server";

// Função para serializar dados do usuário para componentes cliente
function serializeUser(user: User): SerializedUser {
    return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        hasImage: user.hasImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        emailAddresses: user.emailAddresses?.map(email => ({
            id: email.id,
            emailAddress: email.emailAddress,
        })) || [],
        publicMetadata: user.publicMetadata,
    };
}

interface PageProps {
    params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { postId } = await params;
    if (!ObjectId.isValid(postId)) return {};

    const db = await getDatabase();
    const postsCollection = db.collection<PostDocument>('posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return {};

    const authorInfo = (await getUsersInfo([post.authorId]))[0] || { id: post.authorId, username: '', displayName: '', avatar: undefined } as any;

    // Construir URL absoluta para imagens (assumindo que process.env.VERCEL_URL ou NEXTAUTH_URL está definido)
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXTAUTH_URL
            ? process.env.NEXTAUTH_URL
            : 'http://localhost:3000';

    let imageUrl: string | undefined;
    if (post.images && post.images.length > 0) {
        const firstImage = post.images[0];
        if (firstImage.url && firstImage.url.startsWith('http')) {
            // URL já é absoluta
            imageUrl = firstImage.url;
        } else if (firstImage.uuid) {
            // Construir URL absoluta para o proxy
            imageUrl = `${baseUrl}/api/images/${encodeURIComponent(firstImage.uuid)}`;
        }
    } else if (authorInfo.avatar) {
        // Usar avatar do autor como fallback
        imageUrl = authorInfo.avatar.startsWith('http') ? authorInfo.avatar : `${baseUrl}${authorInfo.avatar}`;
    }

    const title = `${authorInfo.displayName || authorInfo.username} — Post`;
    const description = post.content?.slice(0, 160) || `Post de ${authorInfo.displayName || authorInfo.username} no Vorp Friends`;
    const postUrl = `${baseUrl}/post/${postId}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: postUrl,
            siteName: 'Vorp Friends',
            type: 'article',
            images: imageUrl ? [{
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: `Post de ${authorInfo.displayName || authorInfo.username}`
            }] : undefined,
            locale: 'pt_BR'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: imageUrl ? [imageUrl] : undefined
        }
    } as any;
}

export default async function PostPage({ params }: PageProps) {
    const { postId } = await params;
    const { userId: currentUserId } = await auth();

    // Se não estiver logado, redireciona para login
    if (!currentUserId) {
        redirect('/sign-in');
    }

    if (!ObjectId.isValid(postId)) {
        notFound();
    }

    const db = await getDatabase();
    const postsCollection = db.collection<PostDocument>('posts');
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
        notFound();
    }

    // Buscar dados completos do autor via Clerk
    let authorUser;
    try {
        authorUser = await (await clerkClient()).users.getUser(post.authorId);
    } catch (error) {
        console.error('Erro ao buscar dados do autor:', error);
        notFound();
    }

    const serializedAuthor = serializeUser(authorUser);

    // Converter post para formato esperado pelo componente Post
    const postData = {
        id: postId,
        content: post.content,
        authorId: post.authorId,
        author: {
            id: serializedAuthor.id,
            username: serializedAuthor.username || '',
            displayName: serializedAuthor.fullName || serializedAuthor.firstName || 'Usuário',
            avatar: serializedAuthor.imageUrl
        },
        location: post.location || null,
        images: post.images || [],
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        isLiked: post.likes?.includes(currentUserId) || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
    };

    return (
        <div className={styles.page}>
            <div className={styles.mainContent}>
                <ProfileSidebar profileUser={serializedAuthor} />
                <main className={styles.content}>
                    <PostPageClient postData={postData} />
                </main>
                <div className={styles.aside}>
                    <aside>
                        <h3>Post Individual</h3>
                        <p style={{ fontSize: '14px', color: 'var(--gray-alpha-600)' }}>
                            Você está visualizando um post específico de {serializedAuthor.fullName || serializedAuthor.username}.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
}
