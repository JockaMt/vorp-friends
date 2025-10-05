import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em millisegundos
  maxRequests: number; // Máximo de requests por janela
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Armazenamento em memória para rate limiting
// Em produção, use Redis ou outro storage persistente
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  async checkLimit(request: NextRequest): Promise<NextResponse | null> {
    const key = this.getKey(request);
    const now = Date.now();
    
    // Limpar entradas expiradas
    this.cleanup();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Criar novo record ou resetar expirado
      record = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      rateLimitStore.set(key, record);
    } else {
      // Incrementar contador
      record.count++;
    }

    // Verificar se excedeu o limite
    if (record.count > this.config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          {
            success: false,
            message: this.config.message,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (record.resetTime / 1000).toString(),
            },
          }
        );
      }

      // Para rotas não-API, redirecionar para página de erro
      return NextResponse.redirect(new URL('/rate-limit-exceeded', request.url));
    }

    // Adicionar headers de rate limit nas respostas
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (this.config.maxRequests - record.count).toString());
    response.headers.set('X-RateLimit-Reset', (record.resetTime / 1000).toString());

    return null; // Permite continuar
  }

  private getKey(request: NextRequest): string {
    // Usar IP + User Agent como chave
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    return `${ip}:${this.hashString(userAgent)}`;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return 'unknown';
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Rate limiters pré-configurados para diferentes cenários
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 tentativas de login por IP a cada 15 minutos
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
});

export const apiRateLimit = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests por minuto
  message: 'Limite de requisições excedido. Tente novamente em 1 minuto.',
});

export const strictRateLimit = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  maxRequests: 10, // 10 requests por minuto
  message: 'Limite rigoroso excedido. Aguarde 1 minuto.',
});

// Middleware wrapper
export function withRateLimit(limiter: RateLimiter) {
  return async (request: NextRequest) => {
    return await limiter.checkLimit(request);
  };
}