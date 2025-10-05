import { MongoClient, Db } from 'mongodb';

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable is not defined');
}

const uri = process.env.DATABASE_URI;
const options = {};

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
  const client = await clientPromise;
  return client.db('vorp-friends'); // Nome do banco de dados
}