# Tech Stack

## Frontend
- **Framework**: React 18.3+ with JSX
- **Build Tool**: Vite 5.1+
- **Routing**: React Router DOM v6
- **Charts**: Recharts 2.12+
- **UI Library**: AWS Amplify UI React 6.0+

## Backend (AWS Serverless)
- **API**: AWS AppSync (GraphQL)
- **Database**: Amazon DynamoDB
- **Auth**: AWS Amplify Auth (public access currently)
- **Hosting**: AWS Amplify Hosting

## Development Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Amplify CLI installed globally

### Common Commands

**Local Development** (testing only):
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
```

**AWS Deployment** (production):
```bash
amplify init         # Initialize Amplify project
amplify add api      # Add GraphQL API
amplify push         # Deploy backend changes
amplify publish      # Deploy frontend + backend
```

## GraphQL Schema Location
- Schema definition: `amplify/backend/api/schema.graphql`
- Generated queries/mutations: `src/graphql/`
- Auto-generated on `amplify push`

## Configuration Files
- `vite.config.js` - Vite configuration (port 3000)
- `amplify/backend/backend-config.json` - Amplify backend config
- `src/aws-exports.js` - Auto-generated AWS config (do not edit manually)
