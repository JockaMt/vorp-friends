'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./post.module.css";
import { FaHeart, FaComment, FaShare, FaUserCircle, FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import Comments from '@/components/features/Comments';
import { postService } from '@/services/posts';
import { formatTimeAgo } from "@/utils/formatters";

interface PostType {
    id?: string; // ID do post para operações
    avatar?: string; // URL do avatar do usuário
    owner: string;
    userIdentifier?: string; // Username, ID ou identificador do usuário para link do perfil
    authorId?: string; // ID do autor para verificar permissões
    likes?: number;
    comments?: [];
    commentsCount?: number;
    shares?: number;
    date?: string;
    text: string;
    image?: string | { uuid?: string; url?: string };
    video?: string;
    location?: string | { name?: string; address?: string; coordinates?: { lat: number; lng: number } } | null;
    isLiked?: boolean;
    onLike?: () => void;
    onEdit?: (postId: string, newContent: string) => void;
    onDelete?: (postId: string) => void;
}

export function Post(props: PostType) {
    const { id, avatar, owner, userIdentifier, authorId, likes, date, text, image, video, location, isLiked, onLike, onEdit, onDelete, commentsCount: initialCommentsCount = 0 } = props;
    const [commentsCount, setCommentsCount] = useState<number>(() => {
        return initialCommentsCount ?? (props.comments ? props.comments.length : 0);
    });
    const [showComments, setShowComments] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(text);
    const [showOptions, setShowOptions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { userId } = useAuth();
    const optionsRef = useRef<HTMLDivElement>(null);

    // Verificar se o usuário atual é o autor do post
    const isAuthor = userId === authorId;

    // Fechar menu de opções quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };

        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    const handleLike = async () => {
        if (isLiking || !onLike) return;
        setIsLiking(true);
        try {
            await onLike();
        } finally {
            setIsLiking(false);
        }
    };

    const handleEdit = async () => {
        if (!onEdit || !id || editContent.trim() === text) {
            setIsEditing(false);
            return;
        }

        try {
            await onEdit(id, editContent.trim());
            setIsEditing(false);
            setShowOptions(false);
        } catch (error) {
            console.error('Erro ao editar post:', error);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !id) return;

        if (window.confirm('Tem certeza que deseja deletar este post?')) {
            setIsDeleting(true);
            try {
                await onDelete(id);
            } catch (error) {
                console.error('Erro ao deletar post:', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };


    const handleCancelEdit = () => {
        setEditContent(text);
        setIsEditing(false);
    };

    return (
        <div className={styles.postContainer}>
            <div className={styles.postHeader}>
                <Image
                    src={avatar || '/default-avatar.png'}
                    alt={`${owner}'s avatar`}
                    className={styles.avatar}
                    width={40}
                    height={40}
                />
                <div className={styles.headerInfo}>
                    <div className={styles.ownerInfo}>
                        {userIdentifier ? (
                            <Link href={`/profile/${userIdentifier}`} className={styles.ownerName}>
                                {owner}
                            </Link>
                        ) : (
                            <div className={styles.ownerName}>{owner}</div>
                        )}
                        {location && (
                            <div className={styles.location}>
                                <span>—</span>
                                <FaLocationDot className={styles.locationIcon} size={12} />{' '}
                                {typeof location === 'string' ? location : (location.name || location.address || '')}
                            </div>
                        )}
                    </div>
                    <div className={styles.postDate}>
                        {formatTimeAgo(date)}
                    </div>
                </div>
                {isAuthor && (
                    <div className={styles.postOptions} ref={optionsRef}>
                        <button
                            className={styles.optionsButton}
                            onClick={() => setShowOptions(!showOptions)}
                        >
                            <FaEllipsisV />
                        </button>
                        {showOptions && (
                            <div className={styles.optionsMenu}>
                                <button
                                    className={styles.optionItem}
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowOptions(false);
                                    }}
                                >
                                    <FaEdit /> Editar
                                </button>
                                <button
                                    className={styles.optionItem}
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    <FaTrash /> {isDeleting ? 'Deletando...' : 'Deletar'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className={styles.postText}>
                {isEditing ? (
                    <div className={styles.editContainer}>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={styles.editTextarea}
                            maxLength={500}
                            rows={3}
                        />
                        <div className={styles.editActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCancelEdit}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.saveButton}
                                onClick={handleEdit}
                                disabled={editContent.trim().length === 0}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                ) : (
                    text
                )}
                {video && (
                    <div className={styles.mediaContainer}>
                        <video controls className={styles.postVideo}>
                            <source src={video} type="video/mp4" />
                            Seu navegador não suporta a tag de vídeo.
                        </video>
                    </div>
                )}
                {image && (
                    <div className={styles.mediaContainer}>
                        {/* Support either a string URL or an object { uuid, url } */}
                        {/* Use server-side proxy when we have a uuid so token isn't exposed to client */}
                        <img
                            src={
                                typeof image === 'string'
                                    ? image
                                    : (image?.uuid ? `/api/images/${encodeURIComponent(image.uuid)}` : image?.url)
                            }
                            alt="Post Image"
                            className={styles.postImage}
                        />
                    </div>
                )}
            </div>
            <div className={styles.postActions}>
                <button
                    className={`${styles.postActionButton} ${isLiked ? styles.liked : ''}`}
                    onClick={handleLike}
                    disabled={isLiking}
                >
                    <FaHeart /> <span className={styles.count}>{likes || 0}</span>
                </button>
                <button className={styles.postActionButton} onClick={() => setShowComments(s => !s)}>
                    <FaComment /> <span className={styles.count}>{commentsCount || 0}</span>
                </button>
                <button className={styles.postActionButton} onClick={async () => {
                    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${id}` : `/post/${id}`;
                    try {
                        await navigator.clipboard.writeText(postUrl);
                        // feedback mínimo
                        alert('Link do post copiado');
                    } catch (e) {
                        // fallback: abrir a caixa de seleção
                        const ta = document.createElement('textarea');
                        ta.value = postUrl;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        ta.remove();
                        alert('Link do post copiado');
                    }
                }}>
                    <FaShare /> <span className={styles.count}>{props.shares || 0}</span>
                </button>
            </div>
            <div className={styles.postFooter}>
                <div className={styles.commentSection}>
                </div>
                {showComments && (
                    <Comments
                        postId={id!}
                        load={showComments}
                        onCreateTopComment={() => setCommentsCount(c => c + 1)}
                        onDeleteTopComment={() => setCommentsCount(c => Math.max(0, c - 1))}
                    />
                )}
            </div>

            
        </div>
    )
}