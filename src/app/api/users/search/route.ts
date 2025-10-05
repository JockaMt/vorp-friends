import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        users: [],
        message: "Digite pelo menos 2 caracteres para pesquisar" 
      });
    }

    const searchQuery = query.trim().toLowerCase();
    
    // Busca usuários usando a API do Clerk
    const users = await (await clerkClient()).users.getUserList({
      limit: 20,
    });

    // Filtra usuários baseado na consulta
    const filteredUsers = users.data
      .filter(user => {
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        const username = user.username?.toLowerCase() || '';
        const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || '';
        
        return (
          firstName.includes(searchQuery) ||
          lastName.includes(searchQuery) ||
          username.includes(searchQuery) ||
          email.includes(searchQuery) ||
          `${firstName} ${lastName}`.includes(searchQuery)
        );
      })
      .filter(user => user.id !== userId) // Remove o próprio usuário dos resultados
      .map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        emailAddress: user.emailAddresses?.[0]?.emailAddress,
      }));

    return NextResponse.json({ 
      users: filteredUsers,
      total: filteredUsers.length 
    });

  } catch (error) {
    console.error('Erro ao pesquisar usuários:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}