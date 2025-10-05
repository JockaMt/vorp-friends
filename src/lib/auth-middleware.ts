import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  redirectTo?: string;
}

export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
) {
  const {
    required = true,
    roles = [],
    redirectTo = '/login'
  } = options;

  try {
    // Tentar obter o token do cookie ou header
    let token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    // Se não há token e é obrigatório
    if (!token && required) {
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, message: 'Token de acesso requerido' },
          { status: 401 }
        );
      }
      
      const loginUrl = new URL(redirectTo, request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se há token, verificar validade
    if (token) {
      try {
        // Validação básica do token (em produção, use JWT real)
        const user = await verifyToken(token);

        // Verificar se o usuário tem as roles necessárias
        if (roles.length > 0 && !roles.some(role => user.roles?.includes(role))) {
          if (request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json(
              { success: false, message: 'Permissões insuficientes' },
              { status: 403 }
            );
          }
          
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // Adicionar informações do usuário no header para uso posterior
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', user.id || '');
        requestHeaders.set('x-user-email', user.email || '');
        requestHeaders.set('x-user-roles', JSON.stringify(user.roles || []));

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        // Token inválido
        if (required) {
          if (request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json(
              { success: false, message: 'Token inválido ou expirado' },
              { status: 401 }
            );
          }
          
          const loginUrl = new URL(redirectTo, request.url);
          loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
          return NextResponse.redirect(loginUrl);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
    
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

// Função simples para verificar token (substitua por validação JWT real)
async function verifyToken(token: string): Promise<any> {
  // Em produção, implemente validação JWT real aqui
  // Por enquanto, uma validação básica
  
  if (!token || token.length < 10) {
    throw new Error('Token inválido');
  }

  // Simular decodificação do token
  // Em produção, use uma biblioteca JWT como jsonwebtoken ou jose
  try {
    // Exemplo de payload simulado
    return {
      id: 'user-id-from-token',
      email: 'user@example.com',
      roles: ['user'],
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };
  } catch {
    throw new Error('Token malformado');
  }
}

export function withAuth(options?: AuthMiddlewareOptions) {
  return (request: NextRequest) => authMiddleware(request, options);
}