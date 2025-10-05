import React from "react";
import styles from "./post.module.css";
import { FaHeart, FaComment, FaShare, FaUserCircle } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

interface PostType {
    owner: string;
    likes?: number;
    comments?: [];
    shares?: number;
    date?: string;
    text: string;
    image?: string;
    video?: string;
    location?: string;
}

export function Post(props: PostType) {
    const { owner, likes, date, text, image, video, location } = props;

    function formatTimeAgo(postDateStr?: string) {
        if (!postDateStr) {
            return null;
        }

        const postDate = new Date(postDateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

        let interval = seconds / 31536000; // Anos
        if (interval > 1) {
            return `há ${Math.floor(interval)} anos`;
        }
        interval = seconds / 2592000; // Meses
        if (interval > 1) {
            return `há ${Math.floor(interval)} meses`;
        }
        interval = seconds / 86400; // Dias
        if (interval > 1) {
            return `há ${Math.floor(interval)} dias`;
        }
        interval = seconds / 3600; // Horas
        if (interval > 1) {
            return `há ${Math.floor(interval)} horas`;
        }
        interval = seconds / 60; // Minutos
        if (interval > 1) {
            return `há ${Math.floor(interval)} minutos`;
        }
        return "agora mesmo";
    }

    return (
        <div className={styles.postContainer}>
            <div className={styles.postHeader}> 
                <FaUserCircle size={40} className={styles.avatar} />
                <div className={styles.headerInfo}>
                    <div className={styles.ownerInfo}>
                        <div className={styles.ownerName}>{owner}</div>
                        {location && <div className={styles.location}> – <FaLocationDot size={12} /> {location}</div>}
                    </div>
                    <div className={styles.postDate}>{formatTimeAgo(date)}</div>
                </div>
            </div>
            <div className={styles.postText}>
                {text}
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
                        <img src={image} alt="Post Image" className={styles.postImage} />
                    </div>
                )}
            </div>
            <div className={styles.postActions}>
                <button className={styles.postActionButton}>
                    <FaHeart /> {likes || 0}
                </button>
                <button className={styles.postActionButton}>
                    <FaComment /> {props.comments?.length || 0}
                </button>
                <button className={styles.postActionButton}>
                    <FaShare /> {props.shares || 0}
                </button>
            </div>
        </div>
    )
}