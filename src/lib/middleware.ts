import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './auth-middleware';
import { apiRateLimit, authRateLimit, strictRateLimit } from './rate-limit';

export interface MiddlewareConfig {
  auth?: {
    required?: boolean;
    roles?: string[];
    redirectTo?: string;
  };
  rateLimit?: 'auth' | 'api' | 'strict' | 'none';
  security?: boolean;
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  };
}

export async function createMiddleware(
  request: NextRequest,
  config: MiddlewareConfig = {}
) {
  const { pathname } = request.nextUrl;

  try {
    // 1. Rate Limiting
    if (config.rateLimit && config.rateLimit !== 'none') {
      let rateLimitResponse: NextResponse | null = null;

      switch (config.rateLimit) {
        case 'auth':
          rateLimitResponse = await authRateLimit.checkLimit(request);
          break;
        case 'api':
          rateLimitResponse = await apiRateLimit.checkLimit(request);
          break;
        case 'strict':
          rateLimitResponse = await strictRateLimit.checkLimit(request);
          break;
      }

      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // 2. CORS (para rotas da API)
    if (pathname.startsWith('/api') && config.cors) {
      const corsResponse = handleCORS(request, config.cors);
      if (corsResponse) {
        return corsResponse;
      }
    }

    // 3. Autenticação
    if (config.auth) {
      const authResponse = await authMiddleware(request, config.auth);
      if (authResponse.status !== 200) {
        return authResponse;
      }
    }

    // 4. Headers de Segurança
    const response = NextResponse.next();
    
    if (config.security !== false) {
      addSecurityHeaders(response);
    }

    return response;
  } catch (error) {
    console.error('Erro no middleware:', error);
    
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
    
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

function handleCORS(request: NextRequest, corsConfig: NonNullable<MiddlewareConfig['cors']>) {
  const origin = request.headers.get('origin');
  const { origin: allowedOrigins = '*', methods = ['GET', 'POST', 'PUT', 'DELETE'], headers = ['*'] } = corsConfig;

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    // Set CORS headers
    if (allowedOrigins === '*' || (Array.isArray(allowedOrigins) && origin && allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    } else if (typeof allowedOrigins === 'string' && allowedOrigins !== '*') {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    }
    
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }

  return null;
}

function addSecurityHeaders(response: NextResponse) {
  // Prevenir sniffing de content-type
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Proteção XSS
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Política de referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (apenas em HTTPS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ];
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
}

// Middlewares pré-configurados para cenários comuns
export const authPageMiddleware = (request: NextRequest) =>
  createMiddleware(request, {
    auth: { required: true },
    rateLimit: 'api',
    security: true,
  });

export const publicPageMiddleware = (request: NextRequest) =>
  createMiddleware(request, {
    auth: { required: false },
    rateLimit: 'api',
    security: true,
  });

export const apiMiddleware = (request: NextRequest) =>
  createMiddleware(request, {
    auth: { required: true },
    rateLimit: 'api',
    security: true,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      headers: ['Content-Type', 'Authorization'],
    },
  });

export const authApiMiddleware = (request: NextRequest) =>
  createMiddleware(request, {
    auth: { required: false },
    rateLimit: 'auth',
    security: true,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['POST'],
      headers: ['Content-Type'],
    },
  });

export const adminMiddleware = (request: NextRequest) =>
  createMiddleware(request, {
    auth: { required: true, roles: ['admin'] },
    rateLimit: 'strict',
    security: true,
  });