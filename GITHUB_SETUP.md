# GitHub Setup Guide

This guide will help you push your project to GitHub and connect it to Vercel.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in the details:
   - Repository name: `acai-stock-management` (or your preferred name)
   - Description: "Berry Brazil Açai - Sales & Stock Management System"
   - Visibility: Private or Public (your choice)
   - **DO NOT** check "Initialize this repository with a README"
3. Click "Create repository"

## Step 2: Initialize Git (if not already done)

Open terminal in the STOCK_CONTROL directory and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - migrated from AWS to Vercel + Neon"
```

## Step 3: Connect to GitHub

Copy the commands from your new GitHub repository page, or use these (replace with your details):

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files uploaded
3. Verify that these key files are present:
   - `package.json`
   - `vercel.json`
   - `schema.sql`
   - `api/` directory
   - `src/` directory

## Step 5: Connect to Vercel

Now that your code is on GitHub, you can deploy to Vercel:

1. Go to https://vercel.com
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Select your GitHub repository
5. Follow the deployment steps in `VERCEL_DEPLOYMENT.md`

## Future Updates

After initial setup, updating is simple:

```bash
# Make your changes to the code

# Stage changes
git add .

# Commit with a message
git commit -m "Description of your changes"

# Push to GitHub
git push
```

Vercel will automatically detect the push and deploy your changes!

## Troubleshooting

### Authentication Issues

If you have trouble pushing to GitHub, you may need to:

1. Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
2. Or use Personal Access Token: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

### Repository Already Exists

If you get an error that the repository already exists:

```bash
# Remove existing remote
git remote remove origin

# Add the correct remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push again
git push -u origin main
```

## Next Steps

After pushing to GitHub:
1. Follow `VERCEL_DEPLOYMENT.md` to deploy to Vercel
2. Set up your Neon database
3. Configure environment variables in Vercel
4. Test your deployed application
