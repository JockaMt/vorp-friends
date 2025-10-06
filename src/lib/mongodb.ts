import { MongoClient, Db } from 'mongodb';

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable is not defined');
}

const uri = process.env.DATABASE_URI;

// Opções mais conservadoras para produção
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  // Remover configurações SSL específicas e deixar o driver gerenciar
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, usar uma variável global para preservar o valor
  // através dos hot reloads do módulo.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção, é melhor não usar uma variável global.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    const db = client.db('vorp-friends');
    
    // Teste básico de conectividade
    await db.admin().ping();
    
    return db;
  } catch (error) {
    console.error('Erro detalhado ao conectar com MongoDB:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Re-throw com mensagem mais amigável
    throw new Error(`Falha na conexão com o banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.admin().ping();
    console.log('✅ Conexão com MongoDB estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Falha ao conectar com MongoDB:', error);
    return false;
  }
}