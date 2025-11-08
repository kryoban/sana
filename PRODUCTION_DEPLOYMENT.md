# Production Deployment Guide

## Prisma Migrations in Production

### The Problem

When deploying to production, the database tables need to be created. Prisma migrations must be run **before** your application starts.

### Solution

Run Prisma migrations during your deployment process. Here are the steps for different platforms:

## Vercel Deployment

### Option 1: Automatic Migration (Recommended)

1. **Add migration step to build process:**
   
   Your `package.json` already includes:
   ```json
   "build": "prisma generate && next build",
   ```

2. **Add a build command in Vercel:**
   - Go to your Vercel project settings
   - Navigate to **Settings** → **General** → **Build & Development Settings**
   - Set **Build Command** to:
     ```
     prisma generate && prisma migrate deploy && next build
     ```
   
   Or update your `package.json`:
   ```json
   "build": "prisma generate && prisma migrate deploy && next build",
   ```

3. **Set Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Add `DATABASE_URL` with your production database connection string
   - Make sure it's set for **Production** environment

### Option 2: Manual Migration (Before Deploy)

Run migrations manually before deploying:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Then deploy your app
vercel deploy --prod
```

## Docker Deployment

### Update Dockerfile

If you're using Docker, your `Dockerfile` should include migration steps:

```dockerfile
# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Run migrations
RUN npx prisma migrate deploy

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "start"]
```

### Or use a startup script:

Create a `start.sh` file:

```bash
#!/bin/bash
set -e

# Run migrations
npx prisma migrate deploy

# Start the application
npm start
```

Then in your `Dockerfile`:

```dockerfile
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]
```

## Railway Deployment

1. **Set Environment Variables:**
   - Add `DATABASE_URL` in Railway dashboard

2. **Add Build Command:**
   ```
   prisma generate && prisma migrate deploy && next build
   ```

3. **Or use a `railway.json` file:**
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

## Manual Migration (Any Platform)

If you prefer to run migrations manually:

```bash
# 1. Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify migration status
npx prisma migrate status

# 4. Deploy your application
```

## Important Notes

### Migration Files

The migration files are in `prisma/migrations/` directory. **Make sure these are committed to git** so they're available during deployment:

```bash
git add prisma/migrations/
git commit -m "Add Prisma migrations"
git push
```

### Environment Variables

- **Never commit** `.env.local` or `.env` files with production credentials
- Set `DATABASE_URL` in your hosting platform's environment variables
- Use different databases for development and production

### Migration Commands

- **Development:** `npm run db:migrate` (creates and applies migrations)
- **Production:** `npm run db:migrate:deploy` or `npx prisma migrate deploy` (only applies existing migrations)

### Troubleshooting

#### Error: "Table does not exist"

This means migrations haven't been run. Solution:
```bash
# In production environment
npx prisma migrate deploy
```

#### Error: "Migration already applied"

This is fine - it means the migration was already run. The command will skip it.

#### Error: "Migration failed"

1. Check your `DATABASE_URL` is correct
2. Check database permissions
3. Check if the table already exists with a different structure
4. Review migration files in `prisma/migrations/`

### Verify Migration Status

After deployment, verify migrations are applied:

```bash
npx prisma migrate status
```

This should show all migrations as applied.

## Quick Checklist

- [ ] Migration files are committed to git (`prisma/migrations/`)
- [ ] `DATABASE_URL` is set in production environment
- [ ] Build command includes `prisma migrate deploy`
- [ ] Prisma Client is generated during build
- [ ] Test migrations in a staging environment first
- [ ] Verify migrations after deployment

## Current Migration

The initial migration (`20251108192531_init`) creates the `requests` table with all required fields and indexes.

To apply it in production:

```bash
export DATABASE_URL="your-production-database-url"
npx prisma migrate deploy
```

