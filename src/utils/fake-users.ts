// Função para gerar IDs de usuário fictícios consistentes
// Em um app real, estes viriam do banco de dados
export function getFakeUserId(username: string): string {
  const userMap: Record<string, string> = {
    'Jane Smith': 'user_jane_smith_123',
    'Alice Johnson': 'user_alice_johnson_456', 
    'Bob Brown': 'user_bob_brown_789',
    'John Doe': 'user_john_doe_101',
    'Charlie': 'user_charlie_202',
    'Dave': 'user_dave_303',
  };

  return userMap[username] || `user_${username.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 9)}`;
}

// Lista de usuários fictícios para demonstração
export const fakeUsers = [
  {
    id: 'user_jane_smith_123',
    name: 'Jane Smith',
    username: 'janesmith',
    bio: 'Amante da natureza 🌿',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9a7b2b3?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: 'user_alice_johnson_456', 
    name: 'Alice Johnson',
    username: 'alicej',
    bio: 'Designer criativa ✨',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: 'user_bob_brown_789',
    name: 'Bob Brown', 
    username: 'bobbrown',
    bio: 'Desenvolvedor apaixonado',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: 'user_john_doe_101',
    name: 'John Doe',
    username: 'johndoe', 
    bio: 'Explorando o mundo 🌍',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  }
];