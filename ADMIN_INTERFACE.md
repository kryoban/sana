# Admin Interface Guide

## Database Information

- **Port**: `5432` (standard PostgreSQL port)
- **Database**: `sana`
- **Connection**: `postgresql://tom@localhost:5432/sana`

## Accessing the Admin Interface

The admin interface is available at:
```
http://localhost:3000/admin
```

## Features

### 1. Request List View
- View all patient requests in a table format
- See key information at a glance:
  - Request ID
  - Patient name
  - CNP (Personal Numeric Code)
  - Doctor name and specialty
  - Status (Pending, Approved, Rejected)
  - Creation date and time

### 2. Request Details
- Click the eye icon (👁️) to view full request details
- View complete patient information:
  - Personal details (name, CNP, birth date, citizenship)
  - Address information
  - ID document details
  - Doctor information
  - Request status and timestamps

### 3. PDF Download
- Click the download icon (⬇️) to download the signed PDF
- PDFs are stored in the database and can be downloaded on demand
- PDFs include:
  - Complete patient information
  - Doctor information
  - Signature
  - Date of submission

### 4. Refresh Data
- Click the "Refresh" button to reload the request list
- Updates the table with the latest data from the database

## API Endpoints

### GET /api/requests
Retrieve all requests or filter by patient CNP.

**Query Parameters:**
- `cnp` (optional): Filter by patient CNP

**Example:**
```
GET /api/requests
GET /api/requests?cnp=1901213254491
```

### GET /api/requests/[id]/pdf
Download the PDF for a specific request.

**Example:**
```
GET /api/requests/1/pdf
```

## Database Viewing Options

### Option 1: Admin Interface (Recommended)
Use the built-in admin interface at `/admin` - this is the Prisma Studio-like interface.

### Option 2: PostgreSQL CLI
```bash
psql -d sana
```

Then run SQL queries:
```sql
SELECT * FROM requests;
SELECT * FROM requests WHERE status = 'pending';
```

### Option 3: GUI Tools
You can use any PostgreSQL GUI tool:

- **pgAdmin** (free, open-source)
  - Download from: https://www.pgadmin.org/
  - Connect to: `localhost:5432`, database: `sana`

- **TablePlus** (paid, free trial)
  - Download from: https://tableplus.com/
  - Beautiful, modern interface

- **DBeaver** (free, open-source)
  - Download from: https://dbeaver.io/
  - Cross-platform database tool

- **Postico** (macOS, paid)
  - Download from: https://eggerapps.at/postico/
  - Native macOS app

### Option 4: VS Code Extension
- **PostgreSQL** extension by Chris Kolkman
- **SQLTools** with PostgreSQL driver
- Connect using: `postgresql://tom@localhost:5432/sana`

## Database Schema

The `requests` table contains:
- Patient information (name, CNP, address, ID details)
- Doctor information (name, specialty)
- PDF data (stored as BYTEA)
- Signature data URL
- Status (pending, approved, rejected)
- Timestamps (created_at, updated_at)

## Status Values

- `pending`: Request is awaiting review
- `approved`: Request has been approved
- `rejected`: Request has been rejected

## Security Note

The admin interface is currently accessible without authentication. In production, you should:
1. Add authentication/authorization
2. Restrict access to authorized users only
3. Add role-based access control
4. Implement audit logging

## Troubleshooting

### Can't connect to database
1. Verify PostgreSQL is running:
   ```bash
   brew services list  # macOS
   # or
   sudo systemctl status postgresql  # Linux
   ```

2. Check the connection string in `.env.local`

3. Verify the database exists:
   ```bash
   psql -l | grep sana
   ```

### Admin page shows no data
1. Check if requests exist in the database:
   ```bash
   psql -d sana -c "SELECT COUNT(*) FROM requests;"
   ```

2. Verify the API endpoint is working:
   ```bash
   curl http://localhost:3000/api/requests
   ```

3. Check browser console for errors

### PDF download not working
1. Verify the request exists:
   ```bash
   psql -d sana -c "SELECT id FROM requests LIMIT 1;"
   ```

2. Check if PDF data exists:
   ```sql
   SELECT id, LENGTH(pdf_data) as pdf_size FROM requests WHERE id = 1;
   ```

## Next Steps

1. **Add Authentication**: Secure the admin interface
2. **Add Filtering**: Filter by status, date range, doctor, etc.
3. **Add Search**: Search by patient name, CNP, doctor name
4. **Add Pagination**: Handle large numbers of requests
5. **Add Status Updates**: Allow changing request status
6. **Add Export**: Export data to CSV/Excel
7. **Add Statistics**: Show dashboard with statistics

