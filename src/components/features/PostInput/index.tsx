'use client';
import { useRef, useEffect, useState } from "react";
import styles from "./postInput.module.css";
import { CustomSelect } from "../CustomSelect";
import { FaCamera, FaMapMarkerAlt, FaSmile, FaYoutube, FaUserFriends } from 'react-icons/fa';
import { FaGlobe } from "react-icons/fa6";

export function PostInput() {
    const divRef = useRef<HTMLDivElement>(null);
    const maxLength = 500;
    const [length, setLength] = useState(0);

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

    return (
        <div className={styles.postInputContainer}>
            <div
                ref={divRef}
                className={styles.postEditable}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handleInput}
                data-placeholder="O que você está pensando hoje?"
            ></div>
            <div className={styles.postActions}>
                <div className={styles.iconActions}>
                    <button className={styles.iconButton}><FaSmile /></button>
                    <button className={styles.iconButton}><FaCamera /></button>
                    <button className={styles.iconButton}><FaMapMarkerAlt /></button>
                    <button className={styles.iconButton}><FaYoutube /></button>
                </div>
                <div className={styles.submitActions}>
                    <CustomSelect options={[
                        { value: 'public', label: 'Público', icon: <FaGlobe /> },
                        { value: 'friends', label: 'Amigos', icon: <FaUserFriends /> },
                    ]} />
                    <button className={styles.submitButton}>Postar</button>
                </div>
            </div>
        </div>
    );
}