# Vercel Postgres Setup Guide

## Quick Setup with Prisma

This project uses **Prisma** as the ORM for PostgreSQL database access.

## Option 1: Vercel Postgres (Recommended)

### Step 1: Add Vercel Postgres via Vercel Marketplace

1. Go to your **Vercel project dashboard**
2. Click on **Storage** tab
3. Click **Browse Marketplace**
4. Find and click **Vercel Postgres**
5. Click **Add Integration**
6. Follow the prompts to create a new Postgres database

**That's it!** Vercel will automatically:
- Create the Postgres database
- Set up `POSTGRES_URL` environment variable
- Connect your project

### Step 2: Initialize Database Schema

#### Using Prisma Migrations (Recommended)

1. Get your connection string from Vercel:
   - Go to **Storage** → Your Postgres database
   - Copy the `POSTGRES_URL` connection string

2. In your local `.env.local`, add:
   ```env
   DATABASE_URL=<paste connection string from Vercel>
   ```
   Note: Prisma uses `DATABASE_URL`, but Vercel provides `POSTGRES_URL`. You can either:
   - Set `DATABASE_URL` to the same value as `POSTGRES_URL`
   - Or set both to the same value

3. Run Prisma migrations:
   ```bash
   npm run db:migrate
   ```

This will:
- Create the database schema
- Generate Prisma Client
- Create migration files

#### Alternative: Using Prisma DB Push (Development Only)

For quick prototyping in development:
```bash
npm run db:push
```

**Note:** `db:push` is for development only. Use migrations for production.

## Option 2: Other PostgreSQL Providers

You can use any PostgreSQL provider (Supabase, Railway, AWS RDS, etc.):

1. Get your PostgreSQL connection string
2. Set `DATABASE_URL` in your environment variables
3. Run migrations: `npm run db:migrate`

## Environment Variables

### Local Development

Create `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Production (Vercel)

Vercel automatically sets:
- `POSTGRES_URL` - Your PostgreSQL connection string

Make sure to also set:
- `DATABASE_URL` - Set to the same value as `POSTGRES_URL` (or configure Prisma to use `POSTGRES_URL`)

## Prisma Commands

- `npm run db:migrate` - Create and run migrations (development)
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes directly (development only)
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Production Deployment

### On Vercel

1. Ensure `DATABASE_URL` is set in Vercel environment variables
2. Vercel will automatically run `prisma generate` during build (via `postinstall` script)
3. For migrations, run: `npx prisma migrate deploy` (in Vercel build command or separately)

### Build Command (Optional)

You can add Prisma migration to your build process:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## Database Schema

The database schema is defined in `prisma/schema.prisma`. The main model is:

- **Request** - Stores patient requests with all related information

## Migration Workflow

1. **Development:**
   ```bash
   # Make changes to prisma/schema.prisma
   npm run db:migrate
   # This creates a migration and applies it
   ```

2. **Production:**
   ```bash
   # Deploy migrations
   npx prisma migrate deploy
   ```

## Troubleshooting

### Connection Issues
- Ensure `DATABASE_URL` is set correctly
- Verify SSL is enabled in connection string (`?sslmode=require`)
- Check that the database is active

### Migration Issues
- Make sure you've run `npm run db:generate` to generate Prisma Client
- Check that your schema is valid: `npx prisma validate`
- For production, use `prisma migrate deploy` instead of `prisma migrate dev`

### Local Development
- Copy connection string from Vercel dashboard to `.env.local`
- Ensure `.env.local` is in `.gitignore`
- Run `npm run db:generate` after schema changes

## Next Steps

1. ✅ Add Vercel Postgres via Vercel Marketplace
2. ✅ Set `DATABASE_URL` in environment variables
3. ✅ Run `npm run db:migrate` to initialize schema
4. ✅ Deploy your app - it will automatically use the Postgres database!
5. ✅ Test your API endpoints

That's it! Your app is now using Prisma with PostgreSQL! 🚀
