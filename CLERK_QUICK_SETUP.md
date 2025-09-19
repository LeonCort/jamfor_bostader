# ⚡ Clerk Quick Setup for Vercel Deployment

## 🚨 Critical Steps (Don't Skip!)

After deploying to Vercel, you MUST configure these 3 things in Clerk:

### 1. ✅ Add Your Vercel Domain
**Where**: Clerk Dashboard → Configure → Domains
**Add**: `https://your-app-name.vercel.app`

### 2. ✅ Update Redirect URLs  
**Where**: Clerk Dashboard → Configure → Paths
**Add to "After sign-in"**: `https://your-app-name.vercel.app/overview`
**Add to "After sign-up"**: `https://your-app-name.vercel.app/overview`
**Add to "After sign-out"**: `https://your-app-name.vercel.app/`

### 3. ✅ Configure Convex JWT Integration
**Where**: Clerk Dashboard → Configure → JWT Templates
**Find**: Template named "convex" 
**Copy**: The Issuer URL (e.g., `https://fitting-eagle-98.clerk.accounts.dev`)
**Then**: Add to Convex Dashboard → Settings → Environment Variables:
```
CLERK_JWT_ISSUER_DOMAIN=https://fitting-eagle-98.clerk.accounts.dev
```

## 🧪 Test These After Setup

1. **Visit your Vercel URL** → Should redirect to sign-in
2. **Sign up with new account** → Should redirect to `/overview`
3. **Add accommodation data** → Should save to database
4. **Sign out and back in** → Data should persist

## 🚨 If Authentication Doesn't Work

**Check these common issues:**

1. **"Invalid redirect URL" error**
   → Make sure you added your Vercel URL to Clerk domains

2. **"CORS error"** 
   → Add your Vercel URL to allowed origins in Clerk

3. **"Can sign in but no data loads"**
   → Check Convex JWT issuer domain configuration

4. **"Infinite redirect loop"**
   → Verify redirect URLs are correct in Clerk paths

## 📞 Your Current Clerk Setup

- **Project**: fitting-eagle-98
- **Frontend URL**: https://fitting-eagle-98.clerk.accounts.dev
- **Publishable Key**: pk_test_Zml0dGluZy1lYWdsZS05OC5jbGVyay5hY2NvdW50cy5kZXYk

## 🎯 Success Checklist

- [ ] Deployed to Vercel ✓
- [ ] Added Vercel URL to Clerk domains
- [ ] Updated redirect URLs in Clerk
- [ ] Configured Convex JWT issuer domain
- [ ] Tested sign-up flow
- [ ] Tested data persistence
- [ ] Tested sign-out/sign-in cycle

**Time needed**: ~10 minutes after Vercel deployment
