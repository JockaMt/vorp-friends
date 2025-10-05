'use client';

import React from 'react';
import { useAuth } from '@/hooks';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui';

interface ProtectedContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireRole?: string;
}

export function ProtectedContent({ 
  children, 
  fallback,
  requireRole 
}: ProtectedContentProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-4">
          Faça login para acessar este conteúdo
        </h3>
        <div className="space-x-4">
          <SignInButton mode="modal">
            <Button variant="primary">Entrar</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline">Criar conta</Button>
          </SignUpButton>
        </div>
      </div>
    );
  }

  // Verificar role se necessário
  if (requireRole) {
    // Aqui você pode implementar verificação de role
    // Por exemplo, verificando user.publicMetadata.roles
    const userRoles = (user as any)?.publicMetadata?.roles as string[] || [];
    
    if (!userRoles.includes(requireRole)) {
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-4">
            Acesso Restrito
          </h3>
          <p className="text-gray-600">
            Você não tem permissão para acessar este conteúdo.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Componente para exibir informações do usuário autenticado
export function UserInfo() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-3">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div>
          <h4 className="font-semibold">{user.displayName}</h4>
          <p className="text-sm text-gray-600">@{user.username}</p>
        </div>
      </div>
      {user.bio && (
        <p className="mt-2 text-sm text-gray-700">{user.bio}</p>
      )}
    </div>
  );
}