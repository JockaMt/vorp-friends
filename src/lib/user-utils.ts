import { clerkClient } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

export async function getUserInfo(userId: string) {
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    return {
      id: user.id,
      username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'user',
      displayName: user.fullName || user.firstName || user.username || 'Usuário',
      avatar: user.imageUrl || undefined
    };
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    return {
      id: userId,
      username: 'user',
      displayName: 'Usuário',
      avatar: undefined
    };
  }
}

export async function getUsersInfo(userIds: string[]) {
  try {
    const users = await (await clerkClient()).users.getUserList({
      userId: userIds,
      limit: userIds.length
    });
    
    return users.data.map(user => ({
      id: user.id,
      username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'user',
      displayName: user.fullName || user.firstName || user.username || 'Usuário',
      avatar: user.imageUrl || undefined
    }));
  } catch (error) {
    console.error('Erro ao buscar informações dos usuários:', error);
    return userIds.map(id => ({
      id,
      username: 'user',
      displayName: 'Usuário',
      avatar: undefined
    }));
  }
}