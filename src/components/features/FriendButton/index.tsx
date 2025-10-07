'use client'
import { useState } from 'react';
import { friendshipService } from '@/services/friendship';
import type { FriendshipStatus } from '@/types/friendship';
import styles from './friendButton.module.css';

interface FriendButtonProps {
  userId: string;
  username: string;
  className?: string;
  onStatusChange?: (status: FriendshipStatus) => void;
}

export function FriendButton({ userId, username, className, onStatusChange }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Carregar status inicial
  const loadStatus = async () => {
    if (initialized) return;
    
    try {
      setLoading(true);
      const friendshipStatus = await friendshipService.getFriendshipStatus(userId);
      setStatus(friendshipStatus);
      setInitialized(true);
      onStatusChange?.(friendshipStatus);
    } catch (error) {
      console.error('Erro ao carregar status de amizade:', error);
      // mark initialized to avoid retry loops and show fallback UI
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  // Enviar solicitação de amizade
  const sendRequest = async () => {
    try {
      setLoading(true);
      await friendshipService.sendFriendRequest(userId);
      
      // Atualizar status
      const newStatus: FriendshipStatus = {
        status: 'sent',
        message: 'Solicitação enviada',
        canSendRequest: false,
        canRespond: false
      };
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  // Responder solicitação
  const respondRequest = async (action: 'accept' | 'reject') => {
    if (!status?.friendshipId) return;

    try {
      setLoading(true);
      await friendshipService.respondToFriendRequest(status.friendshipId, action);
      
      // Atualizar status
      const newStatus: FriendshipStatus = {
        status: action === 'accept' ? 'accepted' : 'rejected',
        message: action === 'accept' ? 'Amigos' : 'Solicitação rejeitada',
        canSendRequest: action === 'reject',
        canRespond: false
      };
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Erro ao responder solicitação:', error);
      alert(error instanceof Error ? error.message : 'Erro ao responder solicitação');
    } finally {
      setLoading(false);
    }
  };

  // Remover amizade
  const removeFriend = async () => {
    if (!status?.friendshipId) return;
    
    if (!confirm(`Tem certeza que deseja remover ${username} dos seus amigos?`)) {
      return;
    }

    try {
      setLoading(true);
      await friendshipService.removeFriendship(status.friendshipId);
      
      // Atualizar status
      const newStatus: FriendshipStatus = {
        status: 'none',
        message: 'Nenhuma amizade',
        canSendRequest: true,
        canRespond: false
      };
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Erro ao remover amizade:', error);
      alert(error instanceof Error ? error.message : 'Erro ao remover amizade');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar quando o componente for montado
  if (!initialized && !loading) {
    loadStatus();
  }

  if (loading) {
    return (
      <button 
        className={`${styles.friendButton} ${styles.loading} ${className || ''}`}
        disabled
      >
        Carregando...
      </button>
    );
  }

  if (!status && initialized) {
    // Failed to load status — show small retry affordance
    return (
      <button
        className={`${styles.friendButton} ${styles.loading} ${className || ''}`}
        onClick={() => { setInitialized(false); loadStatus(); }}
        title="Falha ao carregar status. Clique para tentar novamente."
      >
        —
      </button>
    );
  }

  if (!status) return null;

  // Se for o próprio usuário
  if (status.status === 'self') {
    return null;
  }

  // Botões baseados no status
  switch (status.status) {
    case 'none':
      return (
        <button 
          className={`${styles.friendButton} ${styles.addFriend} ${className || ''}`}
          onClick={sendRequest}
          disabled={loading}
        >
          Adicionar amigo
        </button>
      );

    case 'sent':
      return (
        <button 
          className={`${styles.friendButton} ${styles.pending} ${className || ''}`}
          disabled
        >
          Solicitação enviada
        </button>
      );

    case 'received':
      return (
        <div className={`${styles.buttonGroup} ${className || ''}`}>
          <button 
            className={`${styles.friendButton} ${styles.accept}`}
            onClick={() => respondRequest('accept')}
            disabled={loading}
          >
            Aceitar
          </button>
          <button 
            className={`${styles.friendButton} ${styles.reject}`}
            onClick={() => respondRequest('reject')}
            disabled={loading}
          >
            Rejeitar
          </button>
        </div>
      );

    case 'accepted':
      return (
        <button 
          className={`${styles.friendButton} ${styles.friends} ${className || ''}`}
          onClick={removeFriend}
          disabled={loading}
          title={`Remover ${username} dos seus amigos`}
          aria-label={`Remover ${username}`}
        >
          <span className={styles.label}>Amigos</span>
        </button>
      );

    case 'rejected':
      return status.canSendRequest ? (
        <button 
          className={`${styles.friendButton} ${styles.addFriend} ${className || ''}`}
          onClick={sendRequest}
          disabled={loading}
        >
          Enviar novamente
        </button>
      ) : (
        <button 
          className={`${styles.friendButton} ${styles.rejected} ${className || ''}`}
          disabled
        >
          Rejeitado
        </button>
      );

    case 'blocked':
      return (
        <button 
          className={`${styles.friendButton} ${styles.blocked} ${className || ''}`}
          disabled
        >
          Bloqueado
        </button>
      );

    default:
      return null;
  }
}