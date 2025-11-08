# Production Deployment Guide

This guide covers deploying the Sana application to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
  - [Option 1: Vercel (Recommended)](#option-1-vercel-recommended)
  - [Option 2: Docker](#option-2-docker)
  - [Option 3: Other Platforms](#option-3-other-platforms)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Build & Deploy](#build--deploy)
- [Post-Deployment Checklist](#post-deployment-checklist)

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (cloud or self-hosted)
- Git repository
- Environment variables configured

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest and most optimized platform for Next.js applications.

#### Step 1: Prepare Your Repository

1. Push your code to GitHub, GitLab, or Bitbucket
2. Ensure all changes are committed

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js settings

#### Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
```

**Important:** Use a production database URL with SSL enabled.

#### Step 4: Configure Build Settings

Vercel automatically detects Next.js, but you can verify:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

#### Step 5: Add Post-Install Hook

In your `package.json`, the `postinstall` script is already configured:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma Client is generated after installation.

#### Step 6: Deploy Database Migrations

After deployment, run migrations using Vercel's CLI or add a build script:

**Option A: Using Vercel CLI (Recommended)**

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Run migrations after deployment:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

**Option B: Using Vercel Build Script**

Add a build script that runs migrations:

```json
{
  "scripts": {
    "build": "prisma migrate deploy && next build",
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

**Note:** For Vercel, use `vercel-build` script instead of modifying `build`.

#### Step 7: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

#### Step 8: Set Up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Option 2: Docker

For self-hosting or other cloud platforms.

#### Step 1: Create Dockerfile

Create a `Dockerfile` in the root directory:

```dockerfile
# Use the official Node.js runtime as base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Configure Next.js for Standalone Output

Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
};

export default nextConfig;
```

#### Step 3: Create .dockerignore

Create a `.dockerignore` file:

```
node_modules
.next
.git
.env.local
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.pem
```

#### Step 4: Build and Run Docker Image

```bash
# Build the image
docker build -t sana-app .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" \
  -e NODE_ENV=production \
  sana-app
```

#### Step 5: Run Database Migrations

Before starting the container, run migrations:

```bash
# Using Docker
docker run --rm \
  -e DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" \
  sana-app npx prisma migrate deploy
```

### Option 3: Other Platforms

#### Railway

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Railway will auto-detect Next.js
4. Add build command: `npm run build`
5. Add start command: `npm start`

#### Render

1. Create a new Web Service
2. Connect your repository
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables
5. Run migrations: `npx prisma migrate deploy`

#### AWS/Azure/GCP

For cloud platforms, use Docker or follow platform-specific Next.js deployment guides.

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Environment
NODE_ENV=production
```

### Optional Variables

```env
# PostgreSQL (alternative to DATABASE_URL)
POSTGRES_URL=postgresql://user:password@host:port/database?sslmode=require

# Next.js
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Setting Environment Variables

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable for Production, Preview, and Development
3. Redeploy after adding variables

**Docker:**
- Use `-e` flag: `docker run -e VAR=value`
- Use `.env` file: `docker run --env-file .env`
- Use Docker Compose (see below)

**Other Platforms:**
- Check platform-specific documentation for environment variable configuration

## Database Setup

### 1. Choose a Database Provider

Recommended options:
- **Vercel Postgres** (if using Vercel)
- **Supabase** (free tier available)
- **Neon** (serverless Postgres)
- **AWS RDS** (for enterprise)
- **Railway Postgres** (simple setup)

### 2. Create Production Database

1. Create a new PostgreSQL database
2. Note the connection string
3. Enable SSL (required for production)

### 3. Run Migrations

**For Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

**For Docker:**

```bash
docker run --rm \
  -e DATABASE_URL="your-production-database-url" \
  -v $(pwd):/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npx prisma migrate deploy"
```

**For Other Platforms:**

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

### 4. Verify Database Connection

```bash
# Test connection
npx prisma db pull

# Open Prisma Studio (for verification)
npx prisma studio
```

## Build & Deploy

### Local Build Test

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Build the application
npm run build

# Test production build locally
npm start
```

### Deployment Checklist

- [ ] All environment variables are set
- [ ] Database is created and accessible
- [ ] Database migrations are run
- [ ] Build completes successfully locally
- [ ] All dependencies are in `package.json`
- [ ] `postinstall` script runs Prisma generate
- [ ] SSL is enabled for database connection
- [ ] Custom domain is configured (if applicable)
- [ ] Error monitoring is set up (Sentry, etc.)

## Post-Deployment Checklist

### 1. Verify Application

- [ ] Application loads correctly
- [ ] Database connection works
- [ ] API routes respond correctly
- [ ] Static assets load properly
- [ ] Environment variables are set

### 2. Test Functionality

- [ ] User authentication works (if applicable)
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] PDF generation works
- [ ] Map functionality works

### 3. Monitor Performance

- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Set up analytics (Vercel Analytics, Google Analytics, etc.)
- [ ] Monitor database performance
- [ ] Set up uptime monitoring

### 4. Security

- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Verify database SSL connection
- [ ] Review environment variables (no secrets in code)
- [ ] Set up rate limiting (if needed)
- [ ] Review CORS settings

### 5. Backup & Recovery

- [ ] Set up database backups
- [ ] Document recovery procedures
- [ ] Test backup restoration

## Docker Compose (Optional)

For local development or self-hosting, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/sana
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=sana
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## Troubleshooting

### Build Failures

1. **Prisma Client not generated:**
   ```bash
   npx prisma generate
   ```

2. **Type errors:**
   ```bash
   npm run lint
   npm run build
   ```

3. **Database connection errors:**
   - Verify DATABASE_URL is correct
   - Check SSL settings
   - Verify database is accessible

### Runtime Errors

1. **Database connection:**
   - Check environment variables
   - Verify database is running
   - Check network connectivity

2. **Missing environment variables:**
   - Verify all required variables are set
   - Check variable names (case-sensitive)
   - Restart application after adding variables

### Migration Issues

1. **Migration conflicts:**
   ```bash
   npx prisma migrate resolve --applied <migration-name>
   ```

2. **Reset database (development only):**
   ```bash
   npx prisma migrate reset
   ```

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Docker Documentation](https://docs.docker.com/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Check application logs
4. Contact the development team

