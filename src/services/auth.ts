import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { clerkServerUserToUser } from '@/types';
import type { User } from '@/types';

class AuthService {
  // Verificar se o usuário está autenticado
  async isAuthenticated(): Promise<boolean> {
    const { userId } = await auth();
    return !!userId;
  }

  // Obter o usuário atual
  async getCurrentUser(): Promise<User | null> {
    try {
      const clerkUser = await currentUser();
      if (!clerkUser) return null;
      
      return clerkServerUserToUser(clerkUser);
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  // Obter ID do usuário autenticado
  async getUserId(): Promise<string | null> {
    const { userId } = await auth();
    return userId;
  }

  // Verificar se o usuário tem uma role específica
  async hasRole(role: string): Promise<boolean> {
    const { sessionClaims } = await auth();
    const roles = (sessionClaims?.metadata as any)?.roles as string[] || [];
    return roles.includes(role);
  }

  // Verificar se o usuário tem permissão de administrador
  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  // Verificar se o usuário tem permissão de moderador
  async isModerator(): Promise<boolean> {
    return this.hasRole('moderator') || this.hasRole('admin');
  }

  // Proteger rota - redirecionar se não autenticado
  async protect(): Promise<void> {
    const { userId } = await auth();
    if (!userId) {
      redirect('/sign-in');
    }
  }

  // Proteger rota com role específica
  async protectWithRole(requiredRole: string): Promise<void> {
    await this.protect();
    
    const hasRequiredRole = await this.hasRole(requiredRole);
    if (!hasRequiredRole) {
      redirect('/unauthorized');
    }
  }

  // Redirecionar se já autenticado (para páginas de login/registro)
  async redirectIfAuthenticated(redirectTo: string = '/'): Promise<void> {
    const { userId } = await auth();
    if (userId) {
      redirect(redirectTo);
    }
  }
}

export const authService = new AuthService();