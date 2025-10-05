import { clerkClient } from "@clerk/nextjs/server";

// Função para buscar usuários reais do Clerk para demonstração
export async function getClerkUsers() {
  try {
    const response = await (await clerkClient()).users.getUserList({
      limit: 10,
      orderBy: '-created_at'
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar usuários do Clerk:', error);
    return [];
  }
}

// Função para obter dados de um usuário específico
export async function getClerkUser(userId: string) {
  try {
    return await (await clerkClient()).users.getUser(userId);
  } catch (error) {
    console.error('Erro ao buscar usuário do Clerk:', error);
    return null;
  }
}