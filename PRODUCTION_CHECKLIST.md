# Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Migration Files
- [x] Migration files are in `prisma/migrations/` directory
- [ ] **ACTION REQUIRED:** Commit migration files to git:
  ```bash
  git add prisma/migrations/20251108234044_add_type_and_referral_specialty/
  git commit -m "Add migration for type and referral_specialty columns"
  git push
  ```

### ✅ Build Configuration
- [x] `vercel-build` script added to `package.json` (runs migrations automatically)
- [x] `build:prod` script available for manual production builds
- [x] `postinstall` script runs `prisma generate`

### ✅ Docker Configuration
- [x] Dockerfile updated to run migrations at container startup
- [x] Startup script (`scripts/start.sh`) created for migration handling
- [x] Dockerfile copies necessary files for migrations

### ✅ Code Changes
- [x] API routes updated to use `type` and `referralSpecialty` fields
- [x] Schema updated with new fields
- [x] Migration file created and tested locally

## Deployment Steps

### For Vercel Deployment

1. **Commit Migration Files:**
   ```bash
   git add prisma/migrations/
   git commit -m "Add database migrations"
   git push
   ```

2. **Verify Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set for Production environment
   - Verify it's a production database URL with SSL enabled

3. **Build Configuration:**
   - Vercel will automatically use the `vercel-build` script
   - This script runs: `prisma generate && prisma migrate deploy && next build`
   - No additional configuration needed in Vercel dashboard

4. **Deploy:**
   - Push to main branch (if auto-deploy is enabled)
   - Or manually trigger deployment in Vercel dashboard
   - Monitor build logs for migration execution

5. **Verify Deployment:**
   - Check build logs for: "✅ Migrations completed successfully"
   - Test the application:
     - Create a new request (inscriere)
     - Create a new request (trimitere)
     - Verify requests are saved correctly
     - Check admin panel shows requests

### For Docker Deployment

1. **Build Docker Image:**
   ```bash
   docker build -t sana-app .
   ```

2. **Run Container with Environment Variables:**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" \
     -e NODE_ENV=production \
     sana-app
   ```

3. **Verify Migrations:**
   - Check container logs for: "✅ Migrations completed successfully"
   - If migrations fail, check DATABASE_URL and database connectivity

### For Other Platforms (Railway, Render, etc.)

1. **Set Build Command:**
   - Use: `prisma generate && prisma migrate deploy && next build`
   - Or use the `build:prod` script: `npm run build:prod`

2. **Set Environment Variables:**
   - `DATABASE_URL`: Your production database connection string
   - `NODE_ENV`: `production`

3. **Deploy and Verify:**
   - Deploy your application
   - Check build logs for migration execution
   - Test the application functionality

## Post-Deployment Verification

### Database Verification

1. **Check Migration Status:**
   ```bash
   # Connect to your production database
   export DATABASE_URL="your-production-database-url"
   npx prisma migrate status
   ```
   
   Expected output:
   ```
   Database schema is up to date!
   ```

2. **Verify Schema:**
   ```bash
   npx prisma db pull
   npx prisma studio
   ```
   
   Check that:
   - `requests` table has `type` column (default: 'inscriere')
   - `requests` table has `referral_specialty` column (nullable)
   - `pdf_data` is nullable
   - `signature_data_url` is nullable

### Application Verification

1. **Test Inscriere Request:**
   - Create a new inscriere request
   - Verify it saves with `type = 'inscriere'`
   - Verify PDF and signature are saved
   - Verify it appears in admin panel

2. **Test Trimitere Request:**
   - Create a new trimitere request
   - Verify it saves with `type = 'trimitere'`
   - Verify `referral_specialty` is saved
   - Verify PDF and signature are optional
   - Verify it appears in admin panel

3. **Test API Endpoints:**
   - `GET /api/requests` - List all requests
   - `GET /api/requests/pending` - List pending requests
   - `GET /api/requests/[id]` - Get specific request
   - `POST /api/requests` - Create new request
   - `POST /api/requests/[id]/approve` - Approve request
   - `GET /api/requests/[id]/pdf` - Get PDF

## Migration Details

### Migration: `20251108234044_add_type_and_referral_specialty`

**Changes:**
1. Adds `type` column (VARCHAR(50), default: 'inscriere')
2. Adds `referral_specialty` column (VARCHAR(255), nullable)
3. Makes `pdf_data` nullable (for trimitere requests)
4. Makes `signature_data_url` nullable (for trimitere requests)
5. Creates index on `type` column
6. Updates existing records to have `type = 'inscriere'`

**Backward Compatibility:**
- ✅ Existing records are automatically set to `type = 'inscriere'`
- ✅ Existing API calls without `type` will default to 'inscriere'
- ✅ Existing requests will continue to work

## Troubleshooting

### Migration Fails in Production

**Error: "Table does not exist"**
- Solution: Run migrations manually:
  ```bash
  export DATABASE_URL="your-production-database-url"
  npx prisma migrate deploy
  ```

**Error: "Migration already applied"**
- This is fine - the migration was already run
- The command will skip it automatically

**Error: "Column already exists"**
- This means the migration was partially applied
- Check the database schema manually
- You may need to manually complete the migration

### Application Fails to Start

**Error: "Prisma Client not generated"**
- Solution: The `postinstall` script should handle this
- If it fails, run manually: `npx prisma generate`

**Error: "DATABASE_URL not set"**
- Solution: Set `DATABASE_URL` in your deployment platform's environment variables
- Verify it's set for the correct environment (Production)

### Database Connection Issues

**Error: "Connection refused"**
- Check database is running
- Check DATABASE_URL is correct
- Check firewall/network settings
- Verify SSL mode is set correctly

**Error: "SSL required"**
- Add `?sslmode=require` to DATABASE_URL
- Example: `postgresql://user:pass@host:port/db?sslmode=require`

## Rollback Plan

If something goes wrong, you can rollback:

1. **Rollback Migration (if needed):**
   ```bash
   # Connect to database and manually revert changes
   # This should be done carefully and tested first
   ```

2. **Revert Code:**
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Redeploy:**
   - Trigger a new deployment
   - Verify the application works

## Important Notes

1. **Always test migrations in a staging environment first**
2. **Backup your production database before running migrations**
3. **Monitor application logs after deployment**
4. **Verify all functionality works as expected**
5. **Keep migration files in git for version control**

## Current Migration Status

- ✅ Migration file created: `20251108234044_add_type_and_referral_specialty`
- ✅ Schema updated: `prisma/schema.prisma`
- ✅ API routes updated to use new fields
- ✅ Build scripts configured for automatic migrations
- ⚠️ **ACTION REQUIRED:** Commit migration files to git before deploying

## Next Steps

1. **Commit migration files:**
   ```bash
   git add prisma/migrations/20251108234044_add_type_and_referral_specialty/
   git commit -m "Add migration for type and referral_specialty columns"
   git push
   ```

2. **Deploy to production:**
   - Push to main branch (if auto-deploy enabled)
   - Or manually deploy via your platform's dashboard

3. **Verify deployment:**
   - Check build logs
   - Test application functionality
   - Verify database schema

4. **Monitor:**
   - Check application logs
   - Monitor error rates
   - Verify user-facing functionality

