'use client';

import { useState, useEffect } from 'react';
import styles from './postUpdateToast.module.css';
import { FaSyncAlt, FaTimes } from 'react-icons/fa';

interface PostUpdateToastProps {
  show: boolean;
  newPostsCount: number;
  onRefresh: () => void;
  onDismiss: () => void;
}

export function PostUpdateToast({ show, newPostsCount, onRefresh, onDismiss }: PostUpdateToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  const handleAnimationEnd = () => {
    if (!show) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`${styles.toast} ${show ? styles.show : styles.hide}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.content}>
        <div className={styles.icon}>
          <FaSyncAlt />
        </div>
        <div className={styles.message}>
          <strong>
            {newPostsCount === 1 
              ? 'Novo post disponível!' 
              : `${newPostsCount} novos posts disponíveis!`}
          </strong>
          <span>Atualize a página para ver as novidades</span>
        </div>
      </div>
      <div className={styles.actions}>
        <button 
          onClick={onRefresh}
          className={styles.refreshButton}
          title="Atualizar página"
        >
          Atualizar
        </button>
        <button 
          onClick={onDismiss}
          className={styles.dismissButton}
          title="Dispensar"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}