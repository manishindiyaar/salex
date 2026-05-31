/**
 * Prisma Client Singleton
 * 
 * Ensures a single PrismaClient instance is used across the application.
 * Prevents connection pool exhaustion in serverless environments.
 */

import { PrismaClient, Prisma } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const shouldLogQueries = process.env.PRISMA_QUERY_LOGS === 'true';

  return new PrismaClient({
    log: shouldLogQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { PrismaClient, Prisma };
export default prisma;
