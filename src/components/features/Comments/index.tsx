'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './comments.module.css';
import { postService } from '@/services/posts';
import type { Comment } from '@/types/post';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';

interface CommentsProps {
  postId: string;
  load?: boolean;
  // callback to notify parent that a top-level comment was created
  onCreateTopComment?: () => void;
  // callback to notify parent that a top-level comment was deleted
  onDeleteTopComment?: () => void;
}

export default function Comments({ postId, load = false, onCreateTopComment, onDeleteTopComment }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const { userId } = useAuth();

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await postService.getComments(postId, 1, 50); // load some comments
      // ensure chronological order: oldest first, newest last
      const fetched = res.data || [];
      fetched.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setComments(fetched);
    } catch (err) {
      console.error('Erro ao carregar comentários', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (load) {
      loadComments();
    }
  }, [postId, load]);

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setReplyText('');
  }

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      const newComment = await postService.createComment({ postId, content: replyText.trim(), parentId });
      // append replies so newest are at the bottom
      setComments(prev => [...prev, newComment]);
      setReplyingTo(null);
      setReplyText('');
      // replies do not change the post commentsCount
    } catch (err) {
      console.error('Erro ao enviar reply', err);
    }
  }

  const submitNewComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      const created = await postService.createComment({ postId, content: newCommentText.trim(), parentId: null });
      // append new top-level comment so newest is at the bottom
      setComments(prev => [...prev, created]);
      setNewCommentText('');
  // notify parent that a top-level comment was created
  if (typeof onCreateTopComment === 'function') onCreateTopComment();
    } catch (err) {
      console.error('Erro ao criar comentário', err);
    }
  }

  const startEdit = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingText(currentContent);
  }

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  }

  const submitEdit = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      const updated = await postService.editComment(postId, commentId, editingText.trim());
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      cancelEdit();
    } catch (err) {
      console.error('Erro ao editar comentário', err);
    }
  }

  const removeComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja apagar este comentário?')) return;
    try {
      await postService.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      // if the deleted comment was a top-level comment, notify parent to decrement
      const deleted = comments.find(c => c.id === commentId);
      if (deleted && !deleted.parentId && typeof onDeleteTopComment === 'function') {
        onDeleteTopComment();
      }
    } catch (err) {
      console.error('Erro ao deletar comentário', err);
    }
  }

  if (loading) return <div className={styles.loading}>Carregando comentários...</div>

  const renderedComments = comments.map(comment => {
    const parent = comment.parentId ? comments.find(c => c.id === comment.parentId) : undefined;

    return (
      <div key={comment.id} className={styles.commentItem}>
        <div className={styles.commentAvatar}>
          <Image src={comment.author.avatar || '/default-avatar.png'} alt={comment.author.displayName} width={32} height={32} />
        </div>
        <div className={styles.commentContent}>
          <div className={styles.commentAuthor}>
            <Link 
              href={`/profile/${comment.author.username || comment.author.id}`} 
              className={styles.authorName}
            >
              {comment.author.displayName}
            </Link>
            {comment.parentId && parent && (
              <span className={styles.replyIndicator}>
                <span>•</span>
                <span className={styles.replyTo}>resposta a 
                <Link 
                  href={`/profile/${parent.author.username || parent.author.id}`}
                  className={styles.mentionedUser}
                >
                  {parent.author.displayName}
                </Link></span>
              </span>
            )}
          </div>
          {editingCommentId === comment.id ? (
            <div>
              <input className={styles.replyInput} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
              <div>
                <button onClick={() => submitEdit(comment.id)}>Salvar</button>
                <button onClick={cancelEdit}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className={styles.commentText}>{comment.content}</div>
          )}
          <div>
            <button className={styles.replyButton} onClick={() => handleReply(comment.id)}>Responder</button>
            {comment.authorId === userId && (
              <>
                <button className={styles.replyButton} onClick={() => startEdit(comment.id, comment.content)}>Editar</button>
                <button className={styles.replyButton} onClick={() => removeComment(comment.id)}>Apagar</button>
              </>
            )}
          </div>
          {replyingTo === comment.id && (
            <div className={styles.replyForm}>
              <input className={styles.replyInput} placeholder='Adicionar uma resposta...' value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <button className={styles.sendReplyButton} onClick={() => submitReply(comment.id)}>Enviar</button>
            </div>
          )}
        </div>
      </div>
    )
  })

  return (
    <div className={styles.commentsContainer}>
      {/* New top-level comment form */}
      <div className={styles.replyForm} style={{ marginBottom: '0.5rem' }}>
        <input className={styles.replyInput} placeholder="Adicionar um comentário..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} />
        <button className={styles.sendReplyButton} onClick={submitNewComment} disabled={!userId || !newCommentText.trim()}>Enviar</button>
      </div>

      {renderedComments}
      {comments.length === 0 && !loading && (
        <div className={styles.noComments}>Nenhum comentário ainda. Seja o primeiro a comentar!</div>
      )}
    </div>
  )
}
