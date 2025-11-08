# Quick Fix: Production Database Migration

## Immediate Fix

Your production database is missing the `requests` table. Run this command **now** in your production environment:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run the migration
npx prisma migrate deploy
```

## For Vercel

### Option 1: Run Migration via Vercel CLI (Quickest)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Run migration in production
vercel env pull .env.production
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-)
npx prisma migrate deploy
```

### Option 2: Update Vercel Build Command

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Find **Build & Development Settings**
3. Set **Build Command** to:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
4. Redeploy your application

### Option 3: Use Vercel's Database Connection

If you're using Vercel's database, you can connect via their dashboard:

1. Go to your Vercel project
2. Navigate to **Storage** → Your Database
3. Use the SQL Editor to run the migration manually
4. Or use the connection string with a database client

## For Other Platforms

### Railway

```bash
# In Railway dashboard, open a shell or use their CLI
railway run npx prisma migrate deploy
```

### Docker

If using Docker, update your startup command:

```bash
# In your Dockerfile or docker-compose.yml
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### Manual SSH Access

If you have SSH access to your server:

```bash
# SSH into your server
ssh your-server

# Navigate to your app directory
cd /path/to/your/app

# Set DATABASE_URL (or it should be in your environment)
export DATABASE_URL="your-production-database-url"

# Run migration
npx prisma migrate deploy
```

## Verify Migration

After running the migration, verify it worked:

```bash
npx prisma migrate status
```

You should see:
```
Database schema is up to date!
```

## Test Your Application

After the migration:

1. Try creating a request through your app
2. Check that it saves to the database
3. Verify you can view it in the admin panel

## Prevent Future Issues

### Update Your Build Process

Make sure your production build includes migrations. Update your deployment configuration:

**Vercel:** Use the build command: `prisma generate && prisma migrate deploy && next build`

**Docker:** Add migration step before starting the app

**Other platforms:** Ensure migrations run before the app starts

### Commit Migration Files

Make sure `prisma/migrations/` is committed to git:

```bash
git add prisma/migrations/
git commit -m "Add Prisma migrations"
git push
```

## Current Migration

The migration `20251108192531_init` creates:
- `requests` table with all required fields
- Indexes on `patient_cnp`, `status`, and `created_at`

This migration is safe to run multiple times - it will only create the table if it doesn't exist.

## Need Help?

If you're still having issues:

1. Check your `DATABASE_URL` is correct
2. Verify database permissions
3. Check database connection (can you connect with `psql`?)
4. Review the migration file: `prisma/migrations/20251108192531_init/migration.sql`

