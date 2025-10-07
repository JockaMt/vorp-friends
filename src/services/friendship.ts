import type { Friendship, FriendshipStatus } from '@/types/friendship';

function buildUrl(path: string) {
  // in browser, relative paths are fine
  if (typeof window !== 'undefined') return path;

  // server-side: compose absolute URL using env var or localhost fallback
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? (process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) || process.env.NEXT_PUBLIC_APP_URL)
    : `http://localhost:${process.env.PORT || 3000}`;

  return new URL(path, base).toString();
}

async function handleResponse(response: Response) {
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // keep data as null when response isn't valid JSON
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || text || `HTTP ${response.status}`;
    throw new Error(message);
  }

  // If response is OK but not JSON, return the raw text under `raw` key
  return data ?? { raw: text };
}

export const friendshipService = {
  // Buscar amigos
  async getFriends(status: 'pending' | 'accepted' | 'rejected' | 'blocked' = 'accepted', page = 1, limit = 20, userId?: string) {
    const params = new URLSearchParams({
      status,
      page: page.toString(),
      limit: limit.toString()
    });
    if (userId) params.set('userId', userId);

    const response = await fetch(buildUrl(`/api/friends?${params}`));
    const data = await handleResponse(response);
    // API returns { success: true, friendships: [...], pagination: { ... } }
    // Normalize to return the array and pagination to consumers.
    if (data && typeof data === 'object' && Array.isArray(data.friendships)) {
      return {
        friendships: data.friendships,
        pagination: data.pagination || null
      };
    }

    // Fallback: if data is already an array or unexpected, try to coerce
    if (Array.isArray(data)) {
      return { friendships: data, pagination: null };
    }

    return { friendships: [], pagination: null };
  },

  // Enviar solicitação de amizade
  async sendFriendRequest(addresseeId: string) {
  const response = await fetch(buildUrl('/api/friends'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addresseeId }),
    });
    const data = await handleResponse(response);
    return data;
  },

  // Responder solicitação de amizade
  async respondToFriendRequest(friendshipId: string, action: 'accept' | 'reject' | 'block') {
  const response = await fetch(buildUrl(`/api/friends/${friendshipId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });
    const data = await handleResponse(response);
    return data;
  },

  // Remover amizade
  async removeFriendship(friendshipId: string) {
  const response = await fetch(buildUrl(`/api/friends/${friendshipId}`), {
      method: 'DELETE',
    });
    const data = await handleResponse(response);
    return data;
  },

  // Verificar status de amizade
  async getFriendshipStatus(userId: string): Promise<FriendshipStatus> {
    const response = await fetch(buildUrl(`/api/friends/status/${userId}`));
    const data = await handleResponse(response);

    // Ensure we have the expected fields (if data was raw text or unexpected, throw)
    if (!data || typeof data !== 'object' || data.raw) {
      throw new Error('Resposta inesperada do servidor ao verificar status de amizade');
    }

    return {
      status: data.status,
      message: data.message,
      friendshipId: data.friendshipId,
      canSendRequest: data.canSendRequest,
      canRespond: data.canRespond,
      friendship: data.friendship
    };
  }
};