import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { clerkServerUserToUser } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados do usuário
    const clerkUser = await currentUser();
    const user = clerkUser ? clerkServerUserToUser(clerkUser) : null;

    return NextResponse.json({
      success: true,
      message: 'API funcionando com Clerk',
      user: {
        id: userId,
        ...user,
      },
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    if (!body.content) {
      return NextResponse.json(
        { success: false, message: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    // Lógica para criar recurso
    const resource = {
      id: Math.random().toString(36).substr(2, 9),
      content: body.content,
      userId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Recurso criado com sucesso',
      data: resource,
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}