import type { Metadata } from "next";
import styles from "./page.module.css";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RiNotificationBadgeFill } from "react-icons/ri";
import { FaMessage } from "react-icons/fa6";
import { IoLogOut } from "react-icons/io5";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vorp Friends",
  description: "A simple social app to connect with vorp friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <nav className={styles.headerNav}>
              <h1 className={styles.headerTitle}>Vorp Friends</h1>
              <ul className={styles.headerNavList}>
                <li className={styles.headerNavItem}><a className={styles.active} href="#">Início</a></li>
                <li className={styles.headerNavItem}><a href="#">Perfil</a></li>
                <li className={styles.headerNavItem}><a href="#">Amigos</a></li>
                <li className={styles.headerNavItem}><a href="#">Grupos</a></li>
                <li className={styles.headerNavItem}><a href="#">Recados</a></li>
              </ul>
            </nav>
            <nav className={styles.headerNav}>
              <button className={styles.navButton}><RiNotificationBadgeFill size={17} /></button>
              <button className={styles.navButton}><FaMessage size={14} /></button>
              <button className={styles.navButton}><IoLogOut size={19} /></button>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
