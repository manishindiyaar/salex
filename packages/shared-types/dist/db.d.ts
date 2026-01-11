/**
 * Prisma Client Singleton
 *
 * Ensures a single PrismaClient instance is used across the application.
 * Prevents connection pool exhaustion in serverless environments.
 */
import { PrismaClient, Prisma } from '@prisma/client';
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { PrismaClient, Prisma };
export default prisma;
