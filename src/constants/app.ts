export const APP_CONFIG = {
  NAME: 'VORP Friends',
  DESCRIPTION: 'Uma rede social para conectar amigos',
  VERSION: '1.0.0',
  AUTHOR: 'VORP Team',
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  POST: {
    MAX_LENGTH: 500,
  },
  COMMENT: {
    MAX_LENGTH: 200,
  },
  BIO: {
    MAX_LENGTH: 160,
  },
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILES: 4,
} as const;