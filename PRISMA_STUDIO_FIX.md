# Prisma Studio Fix for Large Binary Fields

## Issue

Prisma Studio may fail when trying to view the `Request` table because the `pdfData` field contains large binary data (PDF files) that can cause serialization issues.

## Solution

### Option 1: Use the Updated Script (Recommended)

Run Prisma Studio using the updated script that properly loads your `.env.local` file:

```bash
npm run db:studio
```

This script now uses `dotenv-cli` to ensure your `DATABASE_URL` from `.env.local` is loaded.

### Option 2: Manual Environment Variable

If the script doesn't work, you can manually set the environment variable:

```bash
# On macOS/Linux
DATABASE_URL="$(grep DATABASE_URL .env.local | cut -d '=' -f2-)" npx prisma studio

# Or export it first
export DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)
npx prisma studio
```

### Option 3: View Records Without pdfData

If Prisma Studio still has issues with the `pdfData` field, you can query the database directly using Prisma CLI or a database client:

```bash
# Using Prisma Studio, try clicking on individual records instead of the table view
# The table view tries to load all records with all fields, which can cause issues

# Or use a database client like:
# - pgAdmin
# - DBeaver
# - TablePlus
# - psql command line
```

### Option 4: Create a Database View (Advanced)

If you frequently need to view records without the PDF data, you can create a database view:

```sql
CREATE OR REPLACE VIEW requests_view AS
SELECT 
  id,
  patient_name,
  patient_cnp,
  patient_birth_date,
  patient_citizenship,
  patient_address_street,
  patient_address_number,
  patient_address_block,
  patient_address_entrance,
  patient_address_apartment,
  patient_address_sector,
  patient_id_type,
  patient_id_series,
  patient_id_number,
  patient_id_issued_by,
  patient_id_issue_date,
  doctor_name,
  doctor_specialty,
  signature_data_url,
  status,
  created_at,
  updated_at
FROM requests;
```

Then you can query this view instead of the table directly.

## Troubleshooting

### Error: "Can't reach database server"

1. Make sure your PostgreSQL server is running:
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   # Or
   brew services list  # on macOS with Homebrew
   ```

2. Verify your `DATABASE_URL` in `.env.local`:
   ```bash
   cat .env.local | grep DATABASE_URL
   ```

3. Test the connection:
   ```bash
   psql "$(grep DATABASE_URL .env.local | cut -d '=' -f2-)"
   ```

### Error: "fetch failed" or Serialization Issues

This is likely because the `pdfData` field is too large. Try:

1. View records individually instead of in table view
2. Use the admin page in your app (`/admin`) instead of Prisma Studio
3. Query specific fields using Prisma CLI or a database client

### Prisma Client Not Found

Regenerate Prisma Client:

```bash
npm run db:generate
```

## Alternative: Use Your Admin Page

Instead of Prisma Studio, you can use the admin interface at `/admin` which:
- Already excludes the `pdfData` field from the list view
- Only loads the PDF when downloading
- Provides a better user experience for managing requests

