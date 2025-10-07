import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import styles from "@/app/page.module.css";
import profileStyles from "./profile.module.css";
import { ProfileSidebar } from "@/components/features/ProfileSidebar";
import { UserPosts } from '@/components/features/UserPosts';
import { PostInput } from '@/components/features/PostInput';
import { FriendButton } from '@/components/features/FriendButton';
import type { User } from "@clerk/nextjs/server";
import type { SerializedUser } from "@/types/serializedUser";

// Função para serializar dados do usuário para componentes cliente
function serializeUser(user: User): SerializedUser {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    imageUrl: user.imageUrl,
    hasImage: user.hasImage,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    emailAddresses: user.emailAddresses?.map(email => ({
      id: email.id,
      emailAddress: email.emailAddress,
    })) || [],
    publicMetadata: user.publicMetadata,
  };
}

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const { userId: currentUserId } = await auth();
  
  // Se não estiver logado, redireciona para login
  if (!currentUserId) {
    redirect('/sign-in');
  }

  try {
    let profileUser;
    
    // Log para debug
    console.log('Buscando perfil para:', username);
    
    // Primeiro tenta buscar por username
    if (username && !username.startsWith('user_')) {
      try {
        const usersByUsername = await (await clerkClient()).users.getUserList({
          username: [username]
        });
        profileUser = usersByUsername.data[0];
        console.log('Encontrado por username:', profileUser ? 'Sim' : 'Não');
      } catch (error) {
        console.log('Erro ao buscar por username:', error);
      }
    }
    
    // Se não encontrou por username, tenta buscar por ID (para compatibilidade)
    if (!profileUser) {
      try {
        profileUser = await (await clerkClient()).users.getUser(username);
        console.log('Encontrado por ID:', profileUser ? 'Sim' : 'Não');
      } catch (error) {
        console.log('Erro ao buscar por ID:', error);
        // Se não é um ID válido, continua sem usuário
      }
    }
    
    // Se ainda não encontrou, busca todos os usuários e procura por correspondência
    if (!profileUser) {
      try {
        const allUsers = await (await clerkClient()).users.getUserList({ limit: 50 });
        profileUser = allUsers.data.find(user => 
          user.username === username || 
          user.id === username ||
          user.emailAddresses?.[0]?.emailAddress?.split('@')[0] === username
        );
        console.log('Encontrado na busca geral:', profileUser ? 'Sim' : 'Não');
      } catch (error) {
        console.log('Erro na busca geral:', error);
      }
    }
    
    if (!profileUser) {
      console.log('Usuário não encontrado, redirecionando para 404');
      notFound();
    }

    // Determina se é o próprio usuário
    const isSelf = currentUserId === profileUser.id;

    // Serializa os dados do usuário para componentes cliente
    const serializedUser = serializeUser(profileUser);

    return (
      <div className={styles.page}>
        <div className={styles.mainContent}>
          <ProfileSidebar profileUser={serializedUser} />
          <main className={styles.content}>
            {isSelf && (
              <div style={{ marginBottom: '1rem' }}>
                <PostInput />
              </div>
            )}
            <UserPosts authorId={profileUser.id} />
          </main>
          <div className={profileStyles.rightSidebar}>
            <aside className={profileStyles.rightAside}>
              <h3 className={profileStyles.rightAsideTitle}>Amigos em comum</h3>
              <p className={profileStyles.rightAsideText}>Nenhum amigo em comum encontrado.</p>
            </aside>
            <aside className={profileStyles.rightAside}>
              <h3 className={profileStyles.rightAsideTitle}>Informações</h3>
              <div style={{ fontSize: '14px', color: 'var(--gray-alpha-600)' }}>
                <p className={profileStyles.rightAsideText}><strong>Nome:</strong> {serializedUser.fullName || serializedUser.firstName || 'Não informado'}</p>
                <p className={profileStyles.rightAsideText}><strong>Username:</strong> @{serializedUser.username || serializedUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'N/A'}</p>
                <p className={profileStyles.rightAsideText}><strong>Membro desde:</strong> {new Date(serializedUser.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  try {
    const { username } = await params;
    const users = await (await clerkClient()).users.getUserList({
      username: [username]
    });
    
    const profileUser = users.data[0];
    
    if (profileUser) {
      const displayName = profileUser.fullName || profileUser.firstName || profileUser.username || 'Usuário';
      return {
        title: `Perfil de ${displayName} | Vorp Friends`,
        description: `Veja o perfil de ${displayName} no Vorp Friends`,
      };
    }
    
    return {
      title: 'Perfil não encontrado | Vorp Friends',
      description: 'O perfil que você está procurando não existe.',
    };
  } catch {
    return {
      title: 'Perfil não encontrado | Vorp Friends',
      description: 'O perfil que você está procurando não existe.',
    };
  }
}