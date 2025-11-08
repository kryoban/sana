#!/usr/bin/env ts-node

/**
 * Database initialization script
 * 
 * NOTE: This script is now deprecated in favor of Prisma migrations.
 * Use `npm run db:migrate` instead for database setup.
 * 
 * This script now just verifies the database connection and prompts
 * the user to run Prisma migrations.
 */

import { initDatabase } from '../lib/db-init';

console.log('⚠️  This script is deprecated. Use Prisma migrations instead:');
console.log('   npm run db:migrate');
console.log('');
console.log('Verifying database connection...');
console.log('');

initDatabase()
  .then(() => {
    console.log('');
    console.log('✅ Database connection verified');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Run: npm run db:migrate');
    console.log('   2. This will create the database schema');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.error('');
    console.error('Make sure:');
    console.error('   1. DATABASE_URL is set in .env.local');
    console.error('   2. The database is accessible');
    process.exit(1);
  });
