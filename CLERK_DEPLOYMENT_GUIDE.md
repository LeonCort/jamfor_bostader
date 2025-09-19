# 🔐 Clerk Configuration for Vercel Deployment

## Overview

When deploying to Vercel, you need to update your Clerk settings to allow your production domain. Currently, your Clerk is configured for development (`fitting-eagle-98.clerk.accounts.dev`), but you'll need to add your Vercel domain for production.

## 📋 Step-by-Step Clerk Configuration

### 1. Access Your Clerk Dashboard

1. Go to [clerk.com](https://clerk.com) and sign in
2. Navigate to your project: **fitting-eagle-98**
3. You should see your current development setup

### 🎯 Quick Visual Guide

Here's exactly what you need to do in the Clerk dashboard:

```
Clerk Dashboard → fitting-eagle-98 project
├── Configure
│   ├── Domains ← Add your Vercel URL here
│   ├── Paths ← Add redirect URLs here
│   └── JWT Templates ← Get issuer URL for Convex
└── Settings
    └── Environment Variables (if available)
```

### 2. Add Your Vercel Domain

#### After Vercel Deployment:
1. **Get Your Vercel URL**: After deploying, Vercel will give you a URL like:
   - `https://your-app-name.vercel.app` (auto-generated)
   - `https://your-custom-domain.com` (if you add a custom domain)

#### In Clerk Dashboard:
1. Go to **"Domains"** section in the left sidebar
2. Click **"Add Domain"**
3. Add your Vercel production URL:
   ```
   https://your-app-name.vercel.app
   ```
4. If you have a custom domain, add that too:
   ```
   https://your-custom-domain.com
   ```

### 3. Configure Allowed Origins

1. In Clerk Dashboard, go to **"Settings"** → **"Domains"**
2. Under **"Allowed Origins"**, add:
   ```
   https://your-app-name.vercel.app
   https://your-custom-domain.com (if applicable)
   ```
3. Keep your development origins for local development:
   ```
   http://localhost:3000
   ```

### 4. Update Redirect URLs

**Important**: In the Clerk dashboard, look for these sections:

#### Sign-in Redirect URLs:
1. Go to **"Configure"** → **"Paths"** (or **"User & Authentication"** → **"Paths"**)
2. Find **"After sign-in"** section
3. Add these redirect URLs:
   ```
   https://your-app-name.vercel.app/overview
   https://your-app-name.vercel.app/
   ```

#### Sign-up Redirect URLs:
1. In the same **"Paths"** section
2. Find **"After sign-up"** section
3. Add:
   ```
   https://your-app-name.vercel.app/overview
   https://your-app-name.vercel.app/
   ```

#### Sign-out Redirect URLs:
1. In the same **"Paths"** section
2. Find **"After sign-out"** section
3. Add:
   ```
   https://your-app-name.vercel.app/
   ```

**Note**: Clerk dashboard layout may vary. Look for sections like:
- **"Configure"** → **"Paths"**
- **"User & Authentication"** → **"Paths"**
- **"Settings"** → **"Paths"**

### 5. Environment Variables for Production

Your current development environment variables:
```bash
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://fitting-eagle-98.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zml0dGluZy1lYWdsZS05OC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_YhdFVNjPPvEw4AmJRpFHtSgGBERRN07FbLaCPauJ2X
```

#### For Production (Vercel):
**Option A: Use Same Development Keys (Recommended for Testing)**
- Use the same environment variables in Vercel
- This allows you to use the same Clerk project for both dev and production
- Just add the production domains to the existing Clerk project

**Option B: Create Production Clerk Project (Recommended for Real Production)**
1. Create a new Clerk application for production
2. Get new production keys
3. Configure the production project with your Vercel domain

### 6. Vercel Environment Variables Setup

In your Vercel project dashboard:

1. Go to **"Settings"** → **"Environment Variables"**
2. Add these variables:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=https://fitting-eagle-98.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zml0dGluZy1lYWdsZS05OC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_YhdFVNjPPvEw4AmJRpFHtSgGBERRN07FbLaCPauJ2X

# Data Source (Important!)
NEXT_PUBLIC_DATA_SOURCE=convex
NEXT_PUBLIC_COMMUTE_SOURCE=convex

# Convex
CONVEX_DEPLOYMENT=dev:chatty-ladybug-811
NEXT_PUBLIC_CONVEX_URL=https://chatty-ladybug-811.convex.cloud

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA9lmR72VsAK5SmGOrxKsbXWSeTC5ujV2s
```

## 🧪 Testing Clerk Integration

After deployment and configuration:

### 1. Test Authentication Flow
1. Visit your Vercel URL
2. Try to sign up with a new account
3. Check if you receive verification emails
4. Test sign-in with existing account
5. Test sign-out functionality

### 2. Test Protected Routes
1. Try accessing `/overview` without being signed in
2. Should redirect to sign-in page
3. After signing in, should redirect back to the intended page

### 3. Check User Data Persistence
1. Sign in and add some data (accommodations, loans)
2. Sign out and sign back in
3. Verify data persists correctly

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid redirect URL"
**Solution**: Make sure you've added your Vercel URL to the allowed redirect URLs in Clerk

### Issue 2: "CORS errors"
**Solution**: Add your Vercel domain to the allowed origins in Clerk settings

### Issue 3: "Authentication not working"
**Solution**: 
1. Check that environment variables are set correctly in Vercel
2. Verify the Clerk publishable key matches your project
3. Ensure the domain is added to Clerk

### Issue 4: "Users can't sign up"
**Solution**: Check email delivery settings in Clerk dashboard

## 🔄 Development vs Production

### Development Setup (Current)
- Domain: `http://localhost:3000`
- Clerk Frontend: `https://fitting-eagle-98.clerk.accounts.dev`
- Environment: `.env.local`

### Production Setup (After Deployment)
- Domain: `https://your-app.vercel.app`
- Clerk Frontend: Same (`https://fitting-eagle-98.clerk.accounts.dev`)
- Environment: Vercel Environment Variables

## 📝 Quick Checklist

After deploying to Vercel:

- [ ] Get your Vercel URL
- [ ] Add Vercel URL to Clerk domains
- [ ] Add Vercel URL to allowed origins
- [ ] Update redirect URLs in Clerk
- [ ] Set environment variables in Vercel
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test protected routes
- [ ] Test data persistence

## 🔗 Important: Convex + Clerk Integration

Your app uses Convex with Clerk authentication. There's an additional step needed:

### Configure Clerk JWT Issuer for Convex

1. **In Clerk Dashboard**:
   - Go to **"Configure"** → **"JWT Templates"**
   - Find or create a template named **"convex"**
   - Copy the **"Issuer"** URL (looks like: `https://fitting-eagle-98.clerk.accounts.dev`)

2. **In Convex Dashboard**:
   - Go to your Convex project dashboard
   - Navigate to **"Settings"** → **"Environment Variables"**
   - Add this environment variable:
     ```
     CLERK_JWT_ISSUER_DOMAIN=https://fitting-eagle-98.clerk.accounts.dev
     ```

3. **Verify in your code**: Your `convex/auth.config.ts` should reference this:
   ```typescript
   export default {
     providers: [
       {
         domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
         applicationID: "convex",
       },
     ]
   };
   ```

### Your App's Authentication Flow

Based on your code, here's how authentication works:

1. **Middleware Protection**: `middleware.ts` protects all routes except `/`, `/sign-in`, `/sign-up`
2. **Provider Setup**: `src/app/providers.tsx` wraps your app with `ClerkProvider` and `ConvexProviderWithClerk`
3. **Route Protection**: Users are redirected to sign-in if not authenticated
4. **Data Access**: Convex uses Clerk JWT tokens to authenticate database requests

## 🎯 Next Steps

1. **Deploy to Vercel first** to get your production URL
2. **Configure Clerk domains** with your new URL (follow steps above)
3. **Set up Convex + Clerk JWT integration** (very important!)
4. **Test authentication flow** thoroughly
5. **Test data persistence** to ensure Convex + Clerk integration works

## ⚠️ Critical: Don't Skip the Convex + Clerk Setup

Without properly configuring the JWT issuer domain in Convex, your users will be able to sign in but won't be able to access their data. This is a common issue when deploying Clerk + Convex apps.

Your Clerk setup should work seamlessly once you:
1. Add the production domain to your existing Clerk project
2. Configure the JWT issuer domain in Convex
3. Test the complete authentication + data flow
