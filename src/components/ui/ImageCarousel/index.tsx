'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './imageCarousel.module.css';

interface ImageCarouselProps {
    images: Array<{ uuid?: string; url: string }> | Array<string>;
    onImageClick?: (index: number) => void;
}

// Helper function para normalizar URLs das imagens
const getImageUrl = (image: { uuid?: string; url: string } | string): string => {
    if (typeof image === 'string') {
        return image;
    }
    return image.uuid ? `/api/images/${encodeURIComponent(image.uuid)}` : image.url;
};

// Helper function para obter a key única da imagem
const getImageKey = (image: { uuid?: string; url: string } | string, index: number): string => {
    if (typeof image === 'string') {
        return `img-${index}`;
    }
    return image.uuid || `img-${index}`;
};

export function ImageCarousel({ images, onImageClick }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
    const [errorImages, setErrorImages] = useState<Set<number>>(new Set());
    const carouselRef = useRef<HTMLDivElement>(null);
    const slideContainerRef = useRef<HTMLDivElement>(null);

    // Estados para controle de swipe
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Mínima distância de swipe (em pixels)
    const minSwipeDistance = 50;

    // Reset ao mudar as imagens
    useEffect(() => {
        setCurrentIndex(0);
        setLoadedImages(new Set());
        setErrorImages(new Set());
    }, [images]);

    // Precarregar todas as imagens quando o componente monta
    useEffect(() => {
        const preloadImages = async () => {
            const imagePromises = images.map((image, index) => {
                return new Promise<void>((resolve) => {
                    const img = new Image();
                    const url = getImageUrl(image);

                    img.onload = () => {
                        setLoadedImages(prev => new Set([...prev, index]));
                        resolve();
                    };

                    img.onerror = () => {
                        setErrorImages(prev => new Set([...prev, index]));
                        resolve();
                    };

                    img.src = url;
                });
            });

            await Promise.allSettled(imagePromises);
        };

        preloadImages();
    }, [images]);

    const goToNext = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % images.length);

        setTimeout(() => setIsTransitioning(false), 300);
    };

    const goToPrevious = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

        setTimeout(() => setIsTransitioning(false), 300);
    };

    const goToSlide = (index: number) => {
        if (isTransitioning || index === currentIndex) return;

        setIsTransitioning(true);
        setCurrentIndex(index);

        setTimeout(() => setIsTransitioning(false), 300);
    };

    const handleImageClick = (index: number) => {
        // Prevenir click durante swipe
        if (isSwiping) return;

        if (onImageClick) {
            onImageClick(index);
        }
    };

    // Funções de controle de swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsSwiping(false);
        setDragOffset(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStart === null) return;

        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        setTouchEnd(currentTouch);
        setDragOffset(diff);

        const distance = Math.abs(diff);
        if (distance > 10) {
            setIsSwiping(true);
        }
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) {
            setDragOffset(0);
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && images.length > 1) {
            goToNext();
        } else if (isRightSwipe && images.length > 1) {
            goToPrevious();
        }

        // Reset estados
        setDragOffset(0);
        setTimeout(() => {
            setIsSwiping(false);
            setTouchStart(null);
            setTouchEnd(null);
        }, 100);
    };

    // Funções de controle de mouse (desktop)
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setTouchEnd(null);
        setTouchStart(e.clientX);
        setIsDragging(true);
        setIsSwiping(false);
        setDragOffset(0);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || touchStart === null) return;

        const currentMouse = e.clientX;
        const diff = currentMouse - touchStart;

        setTouchEnd(currentMouse);
        setDragOffset(diff);

        const distance = Math.abs(diff);
        if (distance > 10) {
            setIsSwiping(true);
        }
    };

    const onMouseUp = () => {
        if (!isDragging) return;

        setIsDragging(false);

        if (!touchStart || !touchEnd) {
            setDragOffset(0);
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && images.length > 1) {
            goToNext();
        } else if (isRightSwipe && images.length > 1) {
            goToPrevious();
        }

        // Reset estados
        setDragOffset(0);
        setTimeout(() => {
            setIsSwiping(false);
            setTouchStart(null);
            setTouchEnd(null);
        }, 100);
    };

    const onMouseLeave = () => {
        if (isDragging) {
            onMouseUp();
        }
    };

    // Se só há uma imagem, renderizar sem carrossel
    if (images.length === 1) {
        const imageUrl = getImageUrl(images[0]);
        const isLoaded = loadedImages.has(0);
        const hasError = errorImages.has(0);

        return (
            <div
                className={styles.singleImageContainer}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
            >
                {hasError ? (
                    <div className={styles.errorPlaceholder}>
                        <span>Erro ao carregar imagem</span>
                    </div>
                ) : !isLoaded ? (
                    <div className={styles.loadingPlaceholder}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        alt="Post Image"
                        className={styles.singleImage}
                        onClick={() => handleImageClick(0)}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className={`${styles.carouselContainer} ${isSwiping ? styles.swiping : ''}`}
            ref={carouselRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            {/* Container de slides */}
            <div className={styles.imageWrapper}>
                <div
                    className={styles.slidesContainer}
                    ref={slideContainerRef}
                    style={{
                        transform: `translateX(${-currentIndex * 100 + Math.max(-20, Math.min(20, (dragOffset / (carouselRef.current?.offsetWidth || 1)) * 100))}%)`,
                        transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                >
                    {images.map((image, index) => {
                        const imageUrl = getImageUrl(image);
                        const isLoaded = loadedImages.has(index);
                        const hasError = errorImages.has(index);

                        return (
                            <div
                                key={getImageKey(image, index)}
                                className={styles.slide}
                            >
                                {hasError ? (
                                    <div className={styles.errorPlaceholder}>
                                        <span>Erro ao carregar imagem</span>
                                    </div>
                                ) : !isLoaded ? (
                                    <div className={styles.loadingPlaceholder}>
                                        <div className={styles.spinner}></div>
                                    </div>
                                ) : (
                                    <img
                                        src={imageUrl}
                                        alt={`Post Image ${index + 1}`}
                                        className={styles.carouselImage}
                                        onClick={() => handleImageClick(index)}
                                        draggable={false}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Contador de imagens */}
                <div className={styles.imageCounter}>
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Botões de navegação */}
                {images.length > 1 && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.prevButton}`}
                            onClick={goToPrevious}
                            disabled={isTransitioning}
                            aria-label="Imagem anterior"
                        >
                            <FaChevronLeft />
                        </button>

                        <button
                            className={`${styles.navButton} ${styles.nextButton}`}
                            onClick={goToNext}
                            disabled={isTransitioning}
                            aria-label="Próxima imagem"
                        >
                            <FaChevronRight />
                        </button>
                    </>
                )}
            </div>

            {/* Indicadores (dots) */}
            {images.length > 1 && images.length <= 10 && (
                <div className={styles.indicators}>
                    {images.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                            onClick={() => goToSlide(index)}
                            disabled={isTransitioning}
                            aria-label={`Ir para imagem ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Thumbnails para muitas imagens */}
            {images.length > 10 && (
                <div className={styles.thumbnailsContainer}>
                    <div className={styles.thumbnails}>
                        {images.map((img, index) => {
                            const imageUrl = getImageUrl(img);
                            const isLoaded = loadedImages.has(index);
                            const hasError = errorImages.has(index);

                            return (
                                <button
                                    key={getImageKey(img, index)}
                                    className={`${styles.thumbnail} ${index === currentIndex ? styles.activeThumbnail : ''}`}
                                    onClick={() => goToSlide(index)}
                                    disabled={isTransitioning}
                                >
                                    {hasError ? (
                                        <div className={styles.thumbnailError}>!</div>
                                    ) : !isLoaded ? (
                                        <div className={styles.thumbnailLoading}></div>
                                    ) : (
                                        <img
                                            src={imageUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            className={styles.thumbnailImage}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}