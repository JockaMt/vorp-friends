import { auth, clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";
import styles from './debug-users.module.css';

export default async function ProfileDebugPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Debug - Usuários do Clerk</h1>
        <p>Você precisa estar logado para ver esta página.</p>
        <Link href="/sign-in">Fazer Login</Link>
      </div>
    );
  }

  try {
    const users = await (await clerkClient()).users.getUserList({ limit: 10 });
    
    return (
      <div className={styles.container}>
        <h1>Debug - Usuários do Clerk</h1>
        <p>Total de usuários: {users.data.length}</p>
        
        <h2>Usuários disponíveis:</h2>
        <ul>
          {users.data.map((user) => {
            const identifier = user.username || user.id || user.emailAddresses?.[0]?.emailAddress?.split('@')[0];
            return (
              <li key={user.id} className={styles.userListItem}>
                <strong>Nome:</strong> {user.fullName || user.firstName || 'Sem nome'}<br/>
                <strong>Username:</strong> {user.username || 'Sem username'}<br/>
                <strong>ID:</strong> {user.id}<br/>
                <strong>Email:</strong> {user.emailAddresses?.[0]?.emailAddress || 'Sem email'}<br/>
                <strong>Identificador para link:</strong> {identifier}<br/>
                <Link href={`/profile/${identifier}`}>Ver Perfil</Link>
              </li>
            );
          })}
        </ul>
        
        <hr className={styles.hr} />
        <Link href="/">← Voltar para Home</Link>
      </div>
    );
  } catch (error) {
    return (
      <div className={styles.container}>
        <h1>Erro ao carregar usuários</h1>
        <p>Erro: {String(error)}</p>
        <Link href="/">← Voltar para Home</Link>
      </div>
    );
  }
}