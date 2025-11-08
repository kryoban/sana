# Migration Guide: Removing Neon Database

This guide will help you migrate from Neon to a different PostgreSQL provider (Vercel Postgres, local PostgreSQL, etc.).

## Step 1: Set Up New Database

Choose one of the following options:

### Option A: Vercel Postgres (Recommended for Vercel deployments)

1. Go to your Vercel project dashboard
2. Click on **Storage** tab
3. Click **Browse Marketplace**
4. Find and click **Vercel Postgres**
5. Click **Add Integration**
6. Copy the connection string (usually `POSTGRES_URL`)

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   createdb sana
   ```
3. Connection string format:
   ```
   postgresql://username:password@localhost:5432/sana
   ```

### Option C: Other Providers

- **Supabase**: Get connection string from Supabase Dashboard
- **Railway**: Get connection string from Railway Dashboard
- **AWS RDS**: Use your RDS instance connection string
- **Any other PostgreSQL provider**: Use their provided connection string

## Step 2: Update Environment Variables

### Local Development

1. Open or create `.env.local` in your project root
2. Remove or update the old Neon `DATABASE_URL`:
   ```env
   # Remove this (old Neon URL):
   # DATABASE_URL=postgres://...@ep-xxx.neon.tech/...
   
   # Add your new database URL:
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

3. **If using Vercel Postgres**, you might need to also handle `POSTGRES_URL`:
   - Option 1: Set `DATABASE_URL` to the same value as `POSTGRES_URL`
   - Option 2: Update `prisma/schema.prisma` to use `POSTGRES_URL`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("POSTGRES_URL")
     }
     ```

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Remove or update the `DATABASE_URL` variable
3. If using Vercel Postgres, the `POSTGRES_URL` will be automatically set

## Step 3: Run Prisma Migrations

After updating your `DATABASE_URL`:

1. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

2. **Run migrations** (if you have existing migrations):
   ```bash
   npm run db:migrate
   ```

3. **Or push schema directly** (development only):
   ```bash
   npm run db:push
   ```

## Step 4: Verify Connection

1. Test the connection:
   ```bash
   npx prisma db pull
   ```

2. Or open Prisma Studio:
   ```bash
   npm run db:studio
   ```

3. Start your dev server:
   ```bash
   npm run dev
   ```

## Step 5: Migrate Data (If Needed)

If you have existing data in your Neon database:

1. **Export from Neon**:
   ```bash
   pg_dump "your-neon-connection-string" > backup.sql
   ```

2. **Import to new database**:
   ```bash
   psql "your-new-connection-string" < backup.sql
   ```

## Troubleshooting

### Connection Errors

If you see connection errors:

1. **Check your connection string format**:
   - Should start with `postgresql://` (not `postgres://`)
   - Include SSL mode if required: `?sslmode=require`

2. **Verify database is accessible**:
   ```bash
   psql "your-connection-string"
   ```

3. **Check firewall/network settings**:
   - Local databases: Ensure PostgreSQL is running
   - Cloud databases: Check IP whitelist/security groups

### Migration Issues

If migrations fail:

1. **Reset database** (development only, will delete all data):
   ```bash
   npx prisma migrate reset
   ```

2. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

3. **Validate schema**:
   ```bash
   npx prisma validate
   ```

## Next Steps

1. ✅ Remove Neon database from your Neon account (optional)
2. ✅ Update all environment variables
3. ✅ Run Prisma migrations
4. ✅ Test your application
5. ✅ Deploy to production

## Need Help?

- Check `DATABASE_SETUP.md` for general database setup
- Check `VERCEL_POSTGRES_SETUP.md` for Vercel Postgres specific setup
- Review Prisma documentation: https://www.prisma.io/docs

