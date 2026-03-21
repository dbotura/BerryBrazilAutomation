# AWS Setup Guide for Açai Sales & Stock

This guide will help you deploy your application to AWS using the free tier.

## Important: Everything Runs on AWS

**You do NOT need to run anything on your local computer in production.**

Once deployed:
- Your app is hosted on AWS servers (not your computer)
- Database runs on AWS DynamoDB (serverless, no server to manage)
- API runs on AWS AppSync (serverless)
- Accessible via a public URL from any device with internet

**Localhost is ONLY for development/testing before deployment.**

## What You Get

After deployment, you'll have:
- **Public URL**: `https://xxxxx.amplifyapp.com` 
- Accessible from any phone, tablet, or computer
- No servers to maintain
- No software to install on devices
- Just open the URL in a browser

## Prerequisites

1. AWS Account (free tier eligible) - [Create one here](https://aws.amazon.com/free/)
2. Node.js 18+ installed (only for initial setup)
3. Git installed (only for initial setup)

## Step 1: Install AWS Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

## Step 2: Configure AWS Credentials

```bash
amplify configure
```

This will:
- Open AWS Console in your browser
- Guide you to create an IAM user
- Generate access keys
- Configure your local AWS profile

## Step 3: Initialize Amplify in Your Project

```bash
cd your-project-directory
amplify init
```

Answer the prompts:
- Enter a name for the project: `acaisales`
- Enter a name for the environment: `prod`
- Choose your default editor: (your preference)
- Choose the type of app: `javascript`
- Framework: `react`
- Source Directory Path: `src`
- Distribution Directory Path: `dist`
- Build Command: `npm run build`
- Start Command: `npm run dev`
- Select AWS profile: (choose the one you created)

## Step 4: Add Authentication (Optional but Recommended)

```bash
amplify add auth
```

Choose:
- Default configuration
- Username for sign-in
- No advanced settings

## Step 5: Add API and Database

```bash
amplify add api
```

Choose:
- GraphQL
- API name: `acaisalesapi`
- Authorization type: `API key` (for simplicity) or `Amazon Cognito User Pool` (if you added auth)
- Do you want to configure advanced settings: `No`
- Do you have an annotated GraphQL schema: `Yes`
- Provide schema path: `amplify/backend/api/schema.graphql`

The schema is already created in your project!

## Step 6: Deploy to AWS

```bash
amplify push
```

This will:
- Create DynamoDB tables
- Set up AppSync GraphQL API
- Generate API configuration files
- Deploy everything to AWS

Answer `Yes` when asked to generate code.

## Step 7: Add Hosting

```bash
amplify add hosting
```

Choose:
- Hosting with Amplify Console
- Manual deployment

Then publish:

```bash
amplify publish
```

## Step 8: Access Your App

After deployment completes, Amplify will provide you with a URL like:
`https://xxxxx.amplifyapp.com`

**This is your production app!**

- Share this URL with your salesperson (they open it on their phone)
- Bookmark it on warehouse computers
- No installation needed - just open in any browser
- Works on iPhone, Android, Windows, Mac, Linux
- Always online, always accessible

### How to Use:

**For Field Salesperson:**
1. Open the URL on their phone browser (Chrome, Safari, etc.)
2. Bookmark it to home screen for easy access
3. Use Sales, Orders, and Stock sections

**For Warehouse Staff:**
1. Open the URL on warehouse computer browser
2. Bookmark it
3. Use Warehouse, Products, and Stock sections

**For You (Manager):**
- Access from anywhere to view Dashboard and Reports
- Monitor sales and inventory in real-time

## Free Tier Limits

Your application will stay within AWS free tier with these services:

### DynamoDB
- 25 GB of storage
- 25 read/write capacity units
- Enough for thousands of products and sales records

### AWS AppSync (GraphQL API)
- 250,000 query/mutation operations per month
- More than enough for a small business

### AWS Amplify Hosting
- 15 GB served per month
- 5 GB stored
- Perfect for your mobile-optimized app

### Lambda Functions
- 1 million requests per month
- 400,000 GB-seconds of compute time

## Monitoring Costs

To ensure you stay within free tier:

1. Go to AWS Console → Billing Dashboard
2. Set up billing alerts
3. Monitor your usage monthly

## Updating Your App

After making changes to your code:

```bash
npm run build
amplify publish
```

## Environment Variables

Amplify automatically generates `aws-exports.js` with your API configuration.
This file is gitignored and contains your API endpoints and keys.

## Security Notes

- The schema uses public access for simplicity
- For production, consider adding Cognito authentication
- API keys should be rotated regularly
- Enable CloudWatch logging for monitoring

## Troubleshooting

### Build fails
- Check Node.js version (18+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### API not working
- Verify amplify push completed successfully
- Check aws-exports.js was generated
- Ensure API key hasn't expired

### Can't access from mobile
- Verify the Amplify URL is HTTPS
- Check mobile browser compatibility
- Clear mobile browser cache

## Next Steps

1. Test the app on your mobile device
2. Add real product data
3. Train your salesperson on the interface
4. Monitor usage in AWS Console
5. Set up automated backups (optional)

## Support

For AWS Amplify issues: https://docs.amplify.aws/
For DynamoDB questions: https://docs.aws.amazon.com/dynamodb/
