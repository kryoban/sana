import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db-init';

/**
 * API route to initialize database schema
 * WARNING: This should only be used in development
 * For production, use Prisma migrations: `prisma migrate deploy`
 */
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Database initialization is not allowed in production. Use Prisma migrations instead.' },
      { status: 403 }
    );
  }

  try {
    await initDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection verified. Run "npx prisma migrate dev" to apply schema changes.' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
