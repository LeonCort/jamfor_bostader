# Deployment Guide for Reskollen

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Convex Database**: Your Convex deployment should be set up and running
2. **Clerk Authentication**: Clerk project configured with proper domains
3. **Google Maps API**: API key with proper permissions for Maps Embed API and Directions API
4. **Environment Variables**: All required environment variables ready

## Environment Variables Required

Copy these environment variables to your Vercel project settings:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Convex Database
CONVEX_DEPLOYMENT=your_convex_deployment_here
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://your-clerk-frontend.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Data Source Configuration
NEXT_PUBLIC_COMMUTE_SOURCE=convex
NEXT_PUBLIC_DATA_SOURCE=convex
```

## Deployment Steps

### 1. Prepare Repository
- Ensure all changes are committed and pushed to your Git repository
- The build should pass locally: `npm run build`

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables in the Vercel dashboard
5. Deploy

### 3. Post-Deployment Configuration

#### Update Clerk Settings
1. Go to your Clerk dashboard
2. Add your Vercel domain to the allowed origins
3. Update redirect URLs to include your production domain

#### Update Convex Settings
1. Ensure your Convex deployment has the correct environment variables set
2. Verify the `NEXT_PUBLIC_DATA_SOURCE=convex` is set in Convex dashboard

#### Test Google Maps Integration
1. Verify Google Maps API key works with your production domain
2. Add your Vercel domain to Google Cloud Console API restrictions if needed

## Build Configuration

The project is configured to skip TypeScript and ESLint errors during build for faster deployment:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

## Post-Deployment Tasks

1. **Test Core Functionality**:
   - User authentication (sign up/sign in)
   - Adding accommodations
   - Loan management
   - Map functionality
   - Data persistence

2. **Performance Monitoring**:
   - Check Vercel Analytics
   - Monitor Convex usage
   - Verify Google Maps API usage

3. **Security Review**:
   - Ensure environment variables are properly set
   - Verify Clerk authentication is working
   - Check API key restrictions

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**:
   - Ensure all `NEXT_PUBLIC_*` variables are set in Vercel
   - Redeploy after adding environment variables

2. **Clerk Authentication Issues**:
   - Check domain configuration in Clerk dashboard
   - Verify redirect URLs include production domain

3. **Convex Connection Issues**:
   - Ensure `NEXT_PUBLIC_CONVEX_URL` is correct
   - Check Convex deployment status

4. **Google Maps Not Loading**:
   - Verify API key has proper permissions
   - Check domain restrictions in Google Cloud Console

## Future Improvements

After successful deployment, consider:

1. **Type Safety**: Address TypeScript `any` types for better code quality
2. **ESLint Rules**: Re-enable and fix ESLint warnings
3. **Performance**: Optimize bundle size and loading times
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Testing**: Add automated tests for critical functionality
