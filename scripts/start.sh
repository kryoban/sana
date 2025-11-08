#!/bin/sh

# Run database migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Warning: Migration failed or DATABASE_URL not set"
  echo "   The application will start anyway, but database might not be ready."
  echo "   Make sure DATABASE_URL is set and the database is accessible."
fi

# Start the application
echo "🚀 Starting application..."
set -e
exec npm start

