# Project Structure

## Directory Organization

```
/src
  /components     - Reusable UI components (Layout, shared components)
  /pages          - Page-level components (one per route)
  /utils          - Utility functions (currency, date formatting)
  /graphql        - Auto-generated GraphQL queries/mutations/subscriptions
  App.jsx         - Main app component with routing
  main.jsx        - React entry point
  
/amplify
  /backend
    /api          - GraphQL schema and resolvers
    /hosting      - S3 and CloudFront config
  /hooks          - Amplify lifecycle hooks
  
/dist             - Production build output (generated)
```

## Code Conventions

### File Naming
- Components: PascalCase (e.g., `Dashboard.jsx`, `Layout.jsx`)
- Utilities: camelCase (e.g., `currency.js`)
- Styles: Match component name (e.g., `Dashboard.css` for `Dashboard.jsx`)

### Component Structure
- Use functional components with hooks
- Co-locate CSS files with components
- Export default for page/component modules
- Named exports for utilities

### Routing
- All routes defined in `App.jsx`
- Root path `/` redirects to `/dashboard`
- Route paths match page component names (lowercase)

### Styling
- Component-specific CSS files (not CSS-in-JS)
- Mobile-first responsive design
- Desktop: Sidebar navigation
- Mobile: Bottom navigation bar

### Data Patterns
- GraphQL for all backend operations
- AWS Amplify client for API calls
- DynamoDB as data store (NoSQL)
- Public auth rules (no authentication currently)

### Utilities
- Currency formatting: Use `formatCurrency()` from `src/utils/currency.js`
- Always format as AUD (Australian Dollars)
- Date formatting: Use `formatDate()` for consistent AU format

## Key Models (GraphQL)
- `Product` - Product catalog with stock levels
- `Category` - Product categories
- `Sale` - Sales transactions with line items
- `Order` - Customer orders
- `PurchaseOrder` - Supplier purchase orders
- `StockMovement` - Stock change history
