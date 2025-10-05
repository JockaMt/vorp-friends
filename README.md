# VORP Friends - Rede Social

Uma rede social moderna construída com Next.js 13+ e TypeScript.

## 🚀 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js 13+
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   ├── globals.css        # Estilos globais
│   └── api/               # API routes
├── components/
│   ├── ui/                # Componentes de interface básicos
│   │   ├── Button/
│   │   ├── Input/
│   │   └── index.ts
│   ├── features/          # Componentes específicos da aplicação
│   │   ├── ChatComponent/
│   │   ├── Post/
│   │   ├── PostInput/
│   │   ├── ProfileSidebar/
│   │   └── CustomSelect/
│   ├── layout/            # Componentes de layout
│   │   ├── Header/
│   │   └── index.ts
│   └── index.ts
├── hooks/                 # Hooks customizados
│   ├── useAuth.ts
│   ├── usePosts.ts
│   └── index.ts
├── services/              # Serviços de API
│   ├── api.ts
│   ├── auth.ts
│   ├── posts.ts
│   └── index.ts
├── types/                 # Definições de tipos TypeScript
│   ├── user.ts
│   ├── post.ts
│   ├── chat.ts
│   └── index.ts
├── utils/                 # Utilitários e helpers
│   ├── formatters.ts
│   ├── validators.ts
│   └── index.ts
├── constants/             # Constantes da aplicação
│   ├── api.ts
│   ├── app.ts
│   └── index.ts
├── styles/                # Estilos globais e variáveis
│   ├── variables.css
│   └── globals.css
└── store/                 # Estado global (para Zustand/Redux)
```

## 🛠️ Tecnologias

- **Next.js 13+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **CSS Modules** - Estilos com escopo local
- **React Icons** - Biblioteca de ícones

## 📦 Funcionalidades

- ✅ Sistema de autenticação
- ✅ Feed de posts
- ✅ Sistema de chat
- ✅ Perfil de usuário
- ✅ Sistema de amizades
- ✅ Notificações
- ✅ Upload de imagens
- ✅ Tema dark/light

## 🚀 Como executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## 🎨 Design System

O projeto utiliza um design system consistente com:

- **Cores**: Definidas em CSS custom properties
- **Tipografia**: Font families Geist Sans e Geist Mono
- **Espaçamento**: Sistema baseado em rem
- **Componentes**: Modularizados e reutilizáveis

## 📁 Convenções

- **Componentes**: PascalCase (ex: `ChatComponent`)
- **Arquivos**: camelCase (ex: `useAuth.ts`)
- **Pastas**: camelCase (ex: `components/ui`)
- **CSS Modules**: camelCase (ex: `styles.button`)

## 🔧 Configuração

- **Path aliases**: `@/*` aponta para `./src/*`
- **TypeScript**: Configuração estrita habilitada
- **CSS**: Modules com variáveis customizadas
