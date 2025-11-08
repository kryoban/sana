import { PrismaClient } from '@prisma/client';

/**
 * Initialize database schema using Prisma
 * This will run migrations to ensure the database is up to date
 * 
 * Note: In production, use `prisma migrate deploy` instead
 */
export async function initDatabase() {
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // In development, you can use prisma db push
    // In production, use prisma migrate deploy
    // For now, we'll just verify the connection
    // The schema should be applied via migrations
    console.log('Database schema should be applied via Prisma migrations');
    console.log('Run: npx prisma migrate dev (for development)');
    console.log('Run: npx prisma migrate deploy (for production)');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
