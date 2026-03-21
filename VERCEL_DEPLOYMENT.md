# Vercel + Neon Deployment Guide

This guide will help you deploy the Berry Brazil Açai Stock Management system to Vercel with Neon PostgreSQL.

## Prerequisites

- GitHub account
- Vercel account (free tier available at https://vercel.com)
- Neon account (free tier available at https://neon.tech)

## Step 1: Set Up Neon Database

1. Go to https://neon.tech and sign up/login
2. Click "Create Project"
3. Choose a name (e.g., "acai-stock-db")
4. Select a region close to your users
5. Click "Create Project"
6. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
7. Save this connection string - you'll need it later

### Initialize the Database

1. In Neon dashboard, click "SQL Editor"
2. Copy the contents of `schema.sql` from this project
3. Paste it into the SQL Editor
4. Click "Run" to create all tables

## Step 2: Push to GitHub

1. Initialize git repository (if not already done):
   ```bash
   cd STOCK_CONTROL
   git init
   git add .
   git commit -m "Initial commit - migrated from AWS to Vercel"
   ```

2. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it (e.g., "acai-stock-management")
   - Don't initialize with README (we already have code)
   - Click "Create repository"

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and login
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Vite
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Add Environment Variable:
   - Click "Environment Variables"
   - Add: `DATABASE_URL` = your Neon connection string
   - Make sure it's available for Production, Preview, and Development

6. Click "Deploy"

## Step 4: Verify Deployment

1. Wait for deployment to complete (usually 1-2 minutes)
2. Click on the deployment URL
3. Test the application:
   - Navigate to Products page
   - Try adding a product
   - Check if data persists after refresh

## Step 5: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Local Development

To run locally with Neon database:

1. Create `.env.local` file:
   ```
   DATABASE_URL=your_neon_connection_string
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correctly set in Vercel environment variables
- Check that connection string includes `?sslmode=require`
- Ensure Neon project is active (free tier projects may sleep after inactivity)

### API Routes Not Working
- Verify `vercel.json` is in the root directory
- Check that API files are in the `/api` directory
- Review Vercel function logs in the dashboard

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Review build logs in Vercel dashboard

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically build and deploy your changes.

## Cost Estimate

- Neon Free Tier: 0.5 GB storage, 1 compute unit
- Vercel Free Tier: 100 GB bandwidth, unlimited deployments
- Total: $0/month for small to medium usage

Both services offer paid tiers if you need more resources.
