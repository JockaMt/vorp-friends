'use client';
import { useRef, useEffect, useState } from "react";
import styles from "./postInput.module.css";
import { CustomSelect } from "../CustomSelect";
import { EmojiPicker } from "../EmojiPicker";
import { LocationPicker } from "../LocationPicker";
import { FaCamera, FaMapMarkerAlt, FaSmile, FaYoutube, FaUserFriends, FaTimes } from 'react-icons/fa';
import { FaGlobe } from "react-icons/fa6";
import { useAuth } from "@clerk/nextjs";
import { usePosts } from "@/contexts/PostsContext";

interface Location {
  id: string;
  name: string;
  address: string;
  type: 'recent' | 'popular' | 'search';
    coordinates?: { lat: number; lng: number } | null;
}

export function PostInput() {
    const divRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const locationButtonRef = useRef<HTMLButtonElement>(null);
    const maxLength = 500;
    const [length, setLength] = useState(0);
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const { isSignedIn } = useAuth();
    const { actions } = usePosts();

    useEffect(() => {
        const el = divRef.current;
        if (!el) return;
        // inicializa a classe vazia conforme o conteúdo atual
        if ((el.textContent || "").trim().length === 0) el.classList.add(styles.empty);
        else el.classList.remove(styles.empty);
    }, []);

    const handleInput = () => {
        const el = divRef.current;
        if (!el) return;

        const content = el.textContent || "";
        // toggle placeholder class sem re-renderizar
        if (content.trim().length === 0) el.classList.add(styles.empty);
        else el.classList.remove(styles.empty);

        setLength(content.length <= maxLength ? content.length : maxLength);

        if (content.length > maxLength) {
            // truncar mantendo o caret no final
            const truncated = content.slice(0, maxLength);
            el.textContent = truncated;
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    };

    const handleSubmit = async () => {
        if (!isSignedIn) {
            setError('Você precisa estar logado para postar');
            return;
        }

        const el = divRef.current;
        if (!el) return;

        const content = (el.textContent || "").trim();
        if (content.length === 0) {
            setError('Digite algo para postar');
            return;
        }

        setIsPosting(true);
        setError(null);

            try {
                // include location if selected
                const locationPayload = selectedLocation ? {
                    name: selectedLocation.name,
                    address: selectedLocation.address,
                    coordinates: selectedLocation.coordinates ? { lat: selectedLocation.coordinates.lat, lng: selectedLocation.coordinates.lng } : undefined
                } : undefined;

                // Pass images to createPost (service will send FormData)
                await actions.createPost({ content, images: selectedImages.length ? selectedImages : undefined });
            
            // Limpar o conteúdo após sucesso
            el.textContent = '';
            el.classList.add(styles.empty);
            setLength(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar post');
        } finally {
            setIsPosting(false);
        }
    };

    const handleFilesSelected = (files: FileList | null) => {
        if (!files) return;
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        // limit to 4 images for now
        const limited = arr.slice(0, 4);
        setSelectedImages(limited);
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleEmojiSelect = (emoji: string) => {
        const el = divRef.current;
        if (!el) return;

        // Obter posição atual do cursor
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Verificar se o cursor está dentro do elemento editável
            if (el.contains(range.commonAncestorContainer)) {
                // Inserir emoji na posição do cursor
                const emojiNode = document.createTextNode(emoji);
                range.deleteContents();
                range.insertNode(emojiNode);
                
                // Mover cursor para após o emoji
                range.setStartAfter(emojiNode);
                range.setEndAfter(emojiNode);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Se não há cursor válido, adicionar no final
                el.textContent = (el.textContent || '') + emoji;
                
                // Mover cursor para o final
                const newRange = document.createRange();
                newRange.selectNodeContents(el);
                newRange.collapse(false);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        } else {
            // Se não há seleção, adicionar no final
            el.textContent = (el.textContent || '') + emoji;
            
            // Mover cursor para o final
            const newSelection = window.getSelection();
            const newRange = document.createRange();
            newRange.selectNodeContents(el);
            newRange.collapse(false);
            newSelection?.removeAllRanges();
            newSelection?.addRange(newRange);
        }

        // Focar no elemento e atualizar contador
        el.focus();
        handleInput();
        
        // Remover classe empty se necessário
        if (el.textContent && el.textContent.trim().length > 0) {
            el.classList.remove(styles.empty);
        }
    };

    const handleLocationSelect = (location: Location) => {
        setSelectedLocation(location);
        setShowLocationPicker(false);
    };

    const removeLocation = () => {
        setSelectedLocation(null);
    };

    return (
        <div className={styles.postInputContainer}>
            {selectedLocation && (
                <div className={styles.selectedLocation}>
                    <div className={styles.locationTag}>
                        
                        <span className={styles.locationTagText}>{selectedLocation.name}</span>
                        <button
                            onClick={removeLocation}
                            className={styles.removeLocationButton}
                            type="button"
                            title="Remover localização"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}
            <div
                ref={divRef}
                className={styles.postEditable}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handleInput}
                data-placeholder="O que você está pensando hoje?"
            ></div>
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
            <div className={styles.postActions}>
                <div className={styles.iconActions}>
                    <div className={styles.emojiContainer}>
                        <button 
                            ref={emojiButtonRef}
                            className={styles.iconButton}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            type="button"
                        >
                            <FaSmile />
                        </button>
                        <EmojiPicker
                            isOpen={showEmojiPicker}
                            onClose={() => setShowEmojiPicker(false)}
                            onEmojiSelect={handleEmojiSelect}
                            buttonRef={emojiButtonRef}
                        />
                    </div>
                    <label className={`${styles.iconButton} ${styles.fileLabel}`} title="Adicionar imagem">
                        <FaCamera />
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className={styles.fileInput}
                            onChange={(e) => handleFilesSelected(e.target.files)}
                        />
                    </label>
                    <div className={styles.locationContainer}>
                        <button 
                            ref={locationButtonRef}
                            className={`${styles.iconButton} ${selectedLocation ? styles.active : ''}`}
                            onClick={() => setShowLocationPicker(!showLocationPicker)}
                            type="button"
                            title={selectedLocation ? selectedLocation.name : "Adicionar localização"}
                        >
                            <FaMapMarkerAlt />
                        </button>
                        <LocationPicker
                            isOpen={showLocationPicker}
                            onClose={() => setShowLocationPicker(false)}
                            onLocationSelect={handleLocationSelect}
                            buttonRef={locationButtonRef}
                        />
                    </div>
                    <button className={styles.iconButton} type="button"><FaYoutube /></button>
                </div>
                <div className={styles.submitActions}>
                    <CustomSelect options={[
                        { value: 'public', label: 'Público', icon: <FaGlobe /> },
                        { value: 'friends', label: 'Amigos', icon: <FaUserFriends /> },
                    ]} />
                    <button 
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={isPosting || !isSignedIn}
                    >
                        {isPosting ? 'Postando...' : 'Postar'}
                    </button>
                </div>
            </div>
            {selectedImages && selectedImages.length > 0 && (
                <div className={styles.imagePreviewRow}>
                    {selectedImages.map((file, idx) => {
                        const url = URL.createObjectURL(file);
                        return (
                            <div key={idx} className={styles.previewItem}>
                                <img src={url} alt={file.name} className={styles.previewImage} />
                                <button type="button" className={styles.removeImageButton} onClick={() => removeImage(idx)} title="Remover imagem">×</button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <div className={styles.charCount}>
                {length}/{maxLength}
            </div>
        </div>
    );
}