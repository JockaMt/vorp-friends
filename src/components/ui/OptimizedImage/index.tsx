'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './optimizedImage.module.css';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
    placeholder?: string;
    onLoad?: () => void;
    onError?: () => void;
}

export function OptimizedImage({
    src,
    alt,
    className,
    onClick,
    style,
    placeholder,
    onLoad,
    onError
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [cachedSrc, setCachedSrc] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer para lazy loading
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Carregar e cachear a imagem quando ela fica visível
    useEffect(() => {
        if (!isVisible || !src || src.trim() === '') return;

        console.log('OptimizedImage: Tentando carregar imagem:', src);

        let cancelled = false;

        const loadImage = async () => {
            try {
                // TEMPORÁRIO: Desabilitar cache para debug
                // const cachedUrl = sessionStorage.getItem(`img_cache_${src}`);
                // if (cachedUrl && cachedUrl.startsWith('blob:')) {
                //   console.log('OptimizedImage: Imagem encontrada em cache:', src);
                //   setCachedSrc(cachedUrl);
                //   setIsLoaded(true);
                //   onLoad?.();
                //   return;
                // }

                console.log('OptimizedImage: Fazendo fetch da imagem:', src);
                // Carregar a imagem
                const response = await fetch(src);
                console.log('OptimizedImage: Response status:', response.status, response.statusText);
                console.log('OptimizedImage: Response headers:', Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Erro desconhecido');
                    console.error('OptimizedImage: Response error body:', errorText);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const blob = await response.blob();
                console.log('OptimizedImage: Blob criado, tamanho:', blob.size, 'tipo:', blob.type);

                if (cancelled) return;

                const objectUrl = URL.createObjectURL(blob);
                console.log('OptimizedImage: Object URL criado:', objectUrl);

                // TEMPORÁRIO: Desabilitar cache para debug
                // sessionStorage.setItem(`img_cache_${src}`, objectUrl);

                console.log('OptimizedImage: Imagem carregada com sucesso:', src);
                setCachedSrc(objectUrl);
                setIsLoaded(true);
                onLoad?.();
            } catch (error) {
                if (cancelled) return;

                console.error(`OptimizedImage: Erro ao carregar imagem ${src}:`, error);
                setIsError(true);
                setCachedSrc(src); // Fallback para URL original
                onError?.();
            }
        };

        loadImage();

        return () => {
            cancelled = true;
        };
    }, [isVisible, src, onLoad, onError]);

    // Cleanup: remover URLs de objeto quando o componente for desmontado
    useEffect(() => {
        return () => {
            if (cachedSrc && cachedSrc.startsWith('blob:')) {
                URL.revokeObjectURL(cachedSrc);
            }
        };
    }, [cachedSrc]);

    const handleImageLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleImageError = () => {
        setIsError(true);
        onError?.();
    };

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${className || ''}`}
            style={style}
            onClick={onClick}
        >
            {!src || src.trim() === '' ? (
                // Placeholder para src inválida
                <div className={`${styles.placeholder} ${styles.error}`}>
                    <span className={styles.errorText}>URL de imagem inválida</span>
                </div>
            ) : !isVisible ? (
                // Placeholder enquanto não está visível
                <div className={styles.placeholder}>
                    {placeholder && <span className={styles.placeholderText}>{placeholder}</span>}
                </div>
            ) : (
                <>
                    {/* Placeholder durante carregamento */}
                    {!isLoaded && !isError && (
                        <div className={`${styles.placeholder} ${styles.loading}`}>
                            <div className={styles.spinner}></div>
                        </div>
                    )}

                    {/* Imagem real */}
                    {cachedSrc && (
                        <img
                            ref={imgRef}
                            src={cachedSrc}
                            alt={alt}
                            className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            loading="lazy"
                        />
                    )}

                    {/* Fallback para erro */}
                    {isError && (
                        <div className={`${styles.placeholder} ${styles.error}`}>
                            <span className={styles.errorText}>Erro ao carregar imagem</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}