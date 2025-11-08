# Database Setup Guide

This guide will help you set up PostgreSQL database for the Sana application using **Prisma**.

## Prerequisites

- PostgreSQL installed and running (or use a cloud provider like Vercel Postgres)
- Node.js and npm installed
- Prisma installed (already included in dependencies)

## Setup Steps

### 1. Install Dependencies

The required dependencies are already installed:

- `prisma` - Prisma CLI and tools
- `@prisma/client` - Prisma Client for database access

### 2. Configure Database Connection

Create a `.env.local` file in the root directory with your database connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

For example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sana
```

For cloud providers (Vercel Postgres, Supabase, etc.), use the connection string provided by your provider.

### 3. Initialize Database Schema

#### Option 1: Using Prisma Migrations (Recommended)

Run Prisma migrations to create the database schema:

```bash
npm run db:migrate
```

This will:
- Create migration files
- Apply the schema to your database
- Generate Prisma Client

#### Option 2: Using Prisma DB Push (Development Only)

For quick prototyping in development:

```bash
npm run db:push
```

**Note:** `db:push` is for development only. Use migrations for production.

#### Option 3: Manual SQL Execution

If you prefer to use the SQL schema directly:

```bash
psql -d your_database_name -f lib/db-schema.sql
```

Then generate Prisma Client:

```bash
npm run db:generate
```

### 4. Verify Setup

You can verify the setup by:

1. Checking if the `requests` table was created:
   ```sql
   SELECT * FROM requests;
   ```

2. Or using Prisma Studio:
   ```bash
   npm run db:studio
   ```

## Database Schema

The application uses a single `requests` table to store patient requests. The schema is defined in `prisma/schema.prisma`.

The table includes:
- Patient information (name, CNP, birth date, citizenship, address, ID details)
- Doctor information (name, specialty)
- PDF data (stored as BYTEA)
- Signature data URL
- Status and timestamps

## Prisma Commands

- `npm run db:migrate` - Create and run migrations (development)
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes directly (development only)
- `npm run db:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### POST /api/requests

Save a new request to the database.

**Request Body:**

```json
{
  "patientName": "GEORGESCU ANDREI",
  "patientCnp": "1901213254491",
  "patientBirthDate": "19.01.1993",
  "patientCitizenship": "romana",
  "patientAddress": {
    "street": "Dezrobirii",
    "number": "25",
    "block": "1",
    "entrance": "2",
    "apartment": "91",
    "sector": "Sector 6"
  },
  "patientIdType": "Carte de identitate",
  "patientIdSeries": "AX",
  "patientIdNumber": "123456",
  "patientIdIssuedBy": "SPCLEP Sector 6",
  "patientIdIssueDate": "15.03.2020",
  "doctorName": "Dr. Dana Popescu",
  "doctorSpecialty": "Medic de familie",
  "pdfData": "base64_encoded_pdf_string",
  "signatureDataUrl": "data:image/png;base64,..."
}
```

**Response:**

```json
{
  "success": true,
  "id": 1,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/requests

Get all requests or filter by patient CNP.

**Query Parameters:**

- `cnp` (optional): Filter requests by patient CNP

**Response:**

```json
{
  "requests": [
    {
      "id": 1,
      "patientName": "GEORGESCU ANDREI",
      "doctorName": "Dr. Dana Popescu",
      "doctorSpecialty": "Medic de familie",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the database:

1. Verify PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check your connection string format:
   ```
   postgresql://username:password@host:port/database_name?sslmode=require
   ```

3. Verify database exists:
   ```sql
   \l  -- List all databases in psql
   ```

4. Verify Prisma can connect:
   ```bash
   npx prisma db pull
   ```

### Migration Issues

If migrations fail:

1. Make sure Prisma Client is generated:
   ```bash
   npm run db:generate
   ```

2. Validate your schema:
   ```bash
   npx prisma validate
   ```

3. Check migration status:
   ```bash
   npx prisma migrate status
   ```

### Permission Issues

If you encounter permission errors:

1. Check PostgreSQL user permissions
2. Verify the database user has CREATE TABLE privileges
3. Check file system permissions for the project directory

## Production Considerations

For production environments:

1. Use environment-specific connection strings
2. Enable SSL connections (add `?sslmode=require` to connection string)
3. Use Prisma migrations (`prisma migrate deploy`) instead of `db:push`
4. Set up connection pooling (Prisma handles this automatically)
5. Implement database backups
6. Monitor database performance
7. Consider using a managed database service (Vercel Postgres, AWS RDS, Heroku Postgres, etc.)

## Migration Workflow

### Development

1. Make changes to `prisma/schema.prisma`
2. Run migrations:
   ```bash
   npm run db:migrate
   ```
3. This creates a migration file and applies it to the database

### Production

1. Deploy migrations:
   ```bash
   npx prisma migrate deploy
   ```
2. This applies pending migrations without creating new ones

## Support

For issues or questions, please refer to the project documentation or contact the development team.
