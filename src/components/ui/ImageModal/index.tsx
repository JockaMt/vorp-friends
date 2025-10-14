'use client';

import { useState, useEffect } from 'react';
import styles from './imageModal.module.css';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ImageModalProps {
  images: Array<{ uuid?: string; url?: string } | string>;
  initialIndex?: number;
  onClose: () => void;
}

export function ImageModal({ onClose, images, initialIndex = 0 }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    // Bloquear scroll do body quando modal está montado
    document.body.style.overflow = 'hidden';

    // Cleanup ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  const getImageSrc = (image: { uuid?: string; url?: string } | string) => {
    if (typeof image === 'string') {
      return image;
    }
    return image?.uuid ? `/api/images/${encodeURIComponent(image.uuid)}` : image?.url;
  };

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageSrc = getImageSrc(currentImage);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header com botão de fechar */}
        <div className={styles.header}>
          <div className={styles.counter}>
            {images.length > 1 && (
              <span>{currentIndex + 1} de {images.length}</span>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Fechar (ESC)"
          >
            <FaTimes />
          </button>
        </div>

        {/* Container da imagem */}
        <div className={styles.imageContainer}>
          <img
            src={imageSrc}
            alt={`Imagem ${currentIndex + 1}`}
            className={styles.image}
            onLoad={(e) => {
              // Garantir que a imagem seja exibida corretamente
              const img = e.target as HTMLImageElement;
              img.style.opacity = '1';
            }}
          />
        </div>

        {/* Controles de navegação (apenas se houver múltiplas imagens) */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={goToPrevious}
              title="Imagem anterior (←)"
            >
              <FaChevronLeft />
            </button>
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={goToNext}
              title="Próxima imagem (→)"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        {/* Indicadores de página (apenas se houver múltiplas imagens) */}
        {images.length > 1 && (
          <div className={styles.indicators}>
            {images.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                onClick={() => setCurrentIndex(index)}
                title={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}