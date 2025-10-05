'use client';
import { useEffect, useState } from "react";
import styles from "./profileSidebar.module.css";
import Image from "next/image";
import { FaUserCircle, FaUserFriends } from "react-icons/fa";
import { MdGroups } from "react-icons/md";
import { TbGlassFullFilled, TbHandFinger } from "react-icons/tb";
import { FaPen, FaUser } from "react-icons/fa6";

interface ProfileSidebarProps {
    imageUrl?: string;
    name?: string;
    bio?: string;
    friendsCount?: number;
    groupsCount?: number;
    pokesCount?: number;
    fansCount?: number;
}

export function ProfileSidebar(props: ProfileSidebarProps) {
    const [status, setStatus] = useState('');
    const { imageUrl, name, bio, friendsCount, groupsCount, pokesCount, fansCount } = props;

    useEffect(() => {
        // Simula a obtenção do status do usuário (pode ser substituído por uma chamada real)
        const fetchStatus = () => {
            // Simulação de uma chamada de API
            setTimeout(() => {
                setStatus('online');
            }, 1000);
        };

        fetchStatus();
    }, []);

    return (
        <aside className={styles.aside}>
            <div className={styles.profileContainer}>
                <div className={styles.profileImageContainer}>
                    {imageUrl ? (
                        <div className={styles.profileImageWrapper}>
                            <Image
                                src={imageUrl}
                                alt="Profile Picture"
                                width={100}
                                height={100}
                                className={styles.profileImage}
                            />
                            <div className={styles.editPhoto}><FaPen style={{ color: 'white' }} size={30} /></div>
                        </div>) : (
                        <FaUserCircle size={100} opacity={0.3} className={styles.profileImagePlaceholder} />
                    )}
                    <a className={styles.profileLink} href="#"><h1 className={styles.profileName}>Seu nome</h1></a>
                    <span className={styles.profileStatus}>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.statusSelect} name="status" id="status">
                            <option className={styles.statusOption} value="online"> Online</option>
                            <option className={styles.statusOption} value="offline">Offline</option>
                            <option className={styles.statusOption} value="busy">Ocupado</option>
                            <option className={styles.statusOption} value="away">Ausente</option>
                        </select>
                        <span data-status={status} className={styles.statusIndicator}></span>
                    </span>
                    <div className={styles.profileBio}>
                        <p>Short bio about yourself.</p>
                    </div>
                    <div className={styles.profileStats}>
                        <a href="#" className={styles.statsItem}><FaUserFriends className={styles.statsIcon} /> 250</a>      {/*Amigos*/}
                        <a href="#" className={styles.statsItem}><MdGroups className={styles.statsIcon} /> 5</a>           {/*Grupos*/}
                        <a href="#" className={styles.statsItem}><TbHandFinger className={styles.statsIcon} /> 20</a>       {/*Cutucadas*/}
                        <a href="#" className={styles.statsItem}><TbGlassFullFilled className={styles.statsIcon} /> 1k</a> {/*Fans*/}
                    </div>
                </div>
                <div className={styles.profileActions}>
                    <button className="buttonPrimary">Adicionar Amigo</button>
                    <button className="buttonSecondary">Seguir</button>
                    <button className="buttonSecondary">Mensagem</button>
                    <button className="buttonSecondary">Cutucar</button>
                </div>
            </div>
            <div className={styles.friendSection}>
                <h3 className={styles.sectionTitle}>Amigos</h3>
                <ul className={styles.friendList}>
                    <li className={styles.friendItem}>
                        <span className={styles.friendName}>Amigo 1</span>
                        <span className={`${styles.statusIndicator} ${styles.online}`}></span>
                    </li>
                    <li className={styles.friendItem}>
                        <span className={styles.friendName}>Amigo 2</span>
                        <span className={`${styles.statusIndicator} ${styles.offline}`}></span>
                    </li>
                </ul>
                {/* <p>Nenhum amigo online</p> */}
            </div>
        </aside>
    )
}