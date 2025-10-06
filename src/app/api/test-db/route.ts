import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/mongodb';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'Conexão com MongoDB estabelecida com sucesso' 
      });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Falha ao conectar com MongoDB' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}