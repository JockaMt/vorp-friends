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
    const exact = searchParams.get('exact') === 'true';
    
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
        const fullName = `${firstName} ${lastName}`.trim();
        
        if (exact) {
          // Busca exata: verifica se algum campo é exatamente igual
          return (
            username === searchQuery ||
            user.id === query.trim() || // Permite busca por ID também
            email === searchQuery
          );
        } else {
          // Busca por substring (comportamento original)
          return (
            firstName.includes(searchQuery) ||
            lastName.includes(searchQuery) ||
            username.includes(searchQuery) ||
            email.includes(searchQuery) ||
            fullName.includes(searchQuery)
          );
        }
      })
      .filter(user => exact || user.id !== userId) // Remove o próprio usuário apenas para buscas não-exatas
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