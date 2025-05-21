# Weight Management System

## Deployment Guide for Vercel

This guide will help you deploy your Next.js application to Vercel with a cloud-hosted database.

For detailed step-by-step instructions, see:
- [Vercel Deployment Guide](./docs/vercel-deployment.md) - Complete guide for deploying to Vercel
- [Supabase Integration Guide](./docs/supabase-integration.md) - Guide for setting up Supabase
- [Supabase Data Management](./docs/supabase-data-management.md) - Guide for managing data in Supabase

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A cloud database service account (Supabase, PlanetScale, etc.)

### Step 1: Set up your cloud database

#### Option 1: Supabase (Recommended - PostgreSQL)

1. Create an account at [Supabase](https://supabase.com/)
2. Create a new database project
3. Get your Supabase URL and anon key from the project settings
4. Either:
   - Run the SQL migration script in `/scripts/supabase-migration.sql` using the Supabase SQL editor
   - Configure your environment variables and run `npm run setup-supabase`

For detailed instructions, see [Supabase Integration Guide](./docs/supabase-integration.md)

#### Option 2: PlanetScale (MySQL)

1. Create an account at [PlanetScale](https://planetscale.com/)
2. Create a new database
3. Get your database connection string from the "Connect" tab
4. Create the required tables by running the scripts in `/scripts/init-db.js`

#### Option 3: Other MySQL providers (AWS RDS, DigitalOcean, etc.)

1. Create a MySQL database instance
2. Note your connection details (host, username, password, database name)
3. Make sure to configure the database to accept connections from Vercel's IP ranges
4. Run the initialization script from your local machine or a VM with access to the database

### Step 2: Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Vercel
3. In the Vercel project settings, add the following environment variables:

```bash
# For Supabase (PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# For MySQL (if using)
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# Environment and Authentication
NODE_ENV=production
JWT_SECRET=your-secure-random-string
```

4. Deploy your application

### Step 3: Verify your deployment

1. Check that your application is functioning correctly
2. Verify database connections are working
3. Test all your application's features

### Troubleshooting

- If you encounter database connection issues, ensure your database allows connections from Vercel's IP addresses
- Check the Vercel deployment logs for detailed error messages
- Verify your environment variables are correctly set in the Vercel dashboard

### Local Development

For local development, use the `.env.local` file with your local database credentials.
