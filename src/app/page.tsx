import { ChatComponent } from "@/components/features/ChatComponent";
import { ProfileSidebar } from "@/components/features/ProfileSidebar";
import { MainContent } from "@/components/MainContent";
import styles from "./page.module.css";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import RightAside from "@/components/features/RightAside";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className={styles.page}>
        <div className={styles.mainContent}>
          <main className={styles.content}>
            <h2>Bem-vindo ao Vorp Friends!</h2>
            <p>Por favor, faça login para continuar.</p>
            <SignInButton mode="modal">
              <button className="buttonPrimary" style={{ marginTop: '1em' }}>
                Entrar
              </button>
            </SignInButton>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ChatComponent />
      <div className={styles.mainContent}>
        <ProfileSidebar />
        <main className={styles.content}>
          <MainContent />
        </main>
        <RightAside />
      </div>
    </div>
  );
}
