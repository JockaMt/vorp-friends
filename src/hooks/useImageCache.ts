'use client';

import { useState, useEffect, useRef } from 'react';

// Cache global de imagens
const imageCache = new Map<string, string>();
const loadingImages = new Set<string>();

interface UseImageCacheOptions {
    enabled?: boolean;
}

export function useImageCache(imageUrls: string[], options: UseImageCacheOptions = {}) {
    const { enabled = true } = options;
    const [loadedImages, setLoadedImages] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection Observer para detectar quando o elemento está visível
    useEffect(() => {
        if (!enabled || !elementRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            {
                rootMargin: '50px', // Começar a carregar um pouco antes de ficar visível
                threshold: 0.1
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [enabled, isVisible]);

    // Pré-carregar imagens quando o elemento fica visível
    useEffect(() => {
        if (!enabled || !isVisible || imageUrls.length === 0) return;

        const loadImages = async () => {
            setIsLoading(true);
            const newLoadedImages = new Map<string, string>();

            // Copiar imagens já em cache
            imageUrls.forEach(url => {
                if (imageCache.has(url)) {
                    newLoadedImages.set(url, imageCache.get(url)!);
                }
            });

            // Carregar imagens que não estão em cache
            const imagesToLoad = imageUrls.filter(url => !imageCache.has(url) && !loadingImages.has(url));

            if (imagesToLoad.length === 0) {
                setLoadedImages(newLoadedImages);
                setIsLoading(false);
                return;
            }

            // Marcar como carregando
            imagesToLoad.forEach(url => loadingImages.add(url));

            try {
                const loadPromises = imagesToLoad.map(async (url) => {
                    try {
                        // Criar uma nova Promise para carregar a imagem
                        const blob = await fetch(url).then(r => r.blob());
                        const objectUrl = URL.createObjectURL(blob);

                        // Adicionar ao cache global
                        imageCache.set(url, objectUrl);
                        newLoadedImages.set(url, objectUrl);

                        return { url, objectUrl };
                    } catch (error) {
                        console.warn(`Erro ao carregar imagem ${url}:`, error);
                        // Em caso de erro, usar a URL original
                        imageCache.set(url, url);
                        newLoadedImages.set(url, url);
                        return { url, objectUrl: url };
                    } finally {
                        loadingImages.delete(url);
                    }
                });

                await Promise.allSettled(loadPromises);
                setLoadedImages(new Map(newLoadedImages));
            } catch (error) {
                console.error('Erro ao carregar imagens:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadImages();
    }, [enabled, isVisible, imageUrls]);

    // Cleanup: revogar URLs de objeto quando o componente for desmontado
    useEffect(() => {
        return () => {
            // Só revogar URLs que criamos (object URLs)
            loadedImages.forEach((objectUrl, originalUrl) => {
                if (objectUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(objectUrl);
                }
            });
        };
    }, []);

    // Função para obter URL da imagem (cached ou original)
    const getImageUrl = (originalUrl: string): string => {
        return loadedImages.get(originalUrl) || originalUrl;
    };

    // Função para verificar se uma imagem está carregada
    const isImageLoaded = (url: string): boolean => {
        return loadedImages.has(url);
    };

    return {
        elementRef,
        isVisible,
        isLoading,
        getImageUrl,
        isImageLoaded,
        loadedCount: loadedImages.size,
        totalCount: imageUrls.length
    };
}