export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    PROFILE: '/users/profile',
    SEARCH: '/users/search',
    FOLLOW: '/users/follow',
    UNFOLLOW: '/users/unfollow',
    FOLLOWERS: '/users/followers',
    FOLLOWING: '/users/following',
  },
  POSTS: {
    FEED: '/posts/feed',
    CREATE: '/posts',
    DELETE: '/posts',
    LIKE: '/posts/like',
    UNLIKE: '/posts/unlike',
    COMMENTS: '/posts/comments',
  },
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: '/chat/messages',
    SEND: '/chat/send',
    MARK_READ: '/chat/mark-read',
  },
} as const;