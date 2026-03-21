# Quick Start Guide - Deploy in 15 Minutes

Follow these steps to get your Berry Brazil Açai Stock Management system live on the internet.

## Prerequisites (5 minutes)

1. **GitHub Account**: Sign up at https://github.com (free)
2. **Vercel Account**: Sign up at https://vercel.com (free, use GitHub to sign in)
3. **Neon Account**: Sign up at https://neon.tech (free, use GitHub to sign in)

## Step 1: Database Setup (3 minutes)

1. Go to https://neon.tech
2. Click "Create Project"
3. Name it: `acai-stock-db`
4. Click "Create Project"
5. Click "SQL Editor" in the left sidebar
6. Open the `schema.sql` file from this project
7. Copy ALL the content and paste into Neon SQL Editor
8. Click "Run" button
9. You should see "Success" messages
10. Click "Dashboard" → "Connection Details"
11. Copy the connection string (starts with `postgresql://`)
12. Save it somewhere safe - you'll need it in Step 3

## Step 2: Push to GitHub (3 minutes)

Open terminal in the STOCK_CONTROL folder:

```bash
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial deployment"

# Create repository on GitHub (go to github.com/new)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel (4 minutes)

1. Go to https://vercel.com
2. Click "Add New Project"
3. Click "Import" next to your GitHub repository
4. Configure:
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (should be set)
   - Output Directory: `dist` (should be set)

5. Click "Environment Variables"
6. Add variable:
   - Name: `DATABASE_URL`
   - Value: Paste your Neon connection string from Step 1
   - Check all environments (Production, Preview, Development)

7. Click "Deploy"
8. Wait 1-2 minutes for deployment
9. Click on the deployment URL to see your live app!

## Step 4: Test Your App (2 minutes)

1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Navigate to "Products" page
3. Click "+ Add Product"
4. Fill in:
   - Name: "Açai Bowl 300g"
   - Category: "Bowls"
   - Price: 15.00
   - Stock: 50
   - Min Stock: 10
5. Click "Save"
6. Refresh the page - your product should still be there!

## 🎉 You're Live!

Your app is now running on the internet. Share your Vercel URL with your team!

## Next Steps

- Add more products
- Test the Sales page
- Try the Warehouse features
- Invite team members
- Set up a custom domain (optional)

## Updating Your App

Whenever you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically redeploy your app in 1-2 minutes!

## Troubleshooting

### "Database connection failed"
- Check that DATABASE_URL is set in Vercel environment variables
- Verify the connection string includes `?sslmode=require`
- Make sure you ran the schema.sql in Neon

### "API routes not found"
- Verify `vercel.json` exists in root directory
- Check that `/api` folder exists with .js files
- Redeploy from Vercel dashboard

### "Build failed"
- Check build logs in Vercel dashboard
- Verify package.json has all dependencies
- Try running `npm run build` locally first

## Need Help?

- Check `MIGRATION_CHECKLIST.md` for detailed steps
- Review `VERCEL_DEPLOYMENT.md` for troubleshooting
- See `GITHUB_SETUP.md` for Git issues

## Cost

Everything in this guide uses free tiers:
- GitHub: Free for public/private repos
- Vercel: Free tier (100GB bandwidth)
- Neon: Free tier (0.5GB storage)

Perfect for small to medium businesses!
