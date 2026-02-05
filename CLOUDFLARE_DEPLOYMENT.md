# Cloudflare Pages Deployment Guide

This guide will help you deploy the Lumina Blog application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (free tier works)
2. Node.js 18+ installed locally
3. Git repository connected to GitHub/GitLab

## Deployment Options

You have two ways to deploy:

### Option 1: Deploy via Cloudflare Dashboard (Recommended for first deployment)

1. **Connect Your Repository**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages** > **Create application** > **Pages**
   - Click **Connect to Git**
   - Select your repository (lumina-blog)

2. **Configure Build Settings**
   - **Framework preset**: Next.js
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (leave as default)
   - **Node version**: 18

3. **Set Environment Variables**
   
   In the Cloudflare Dashboard, go to **Settings** > **Environment Variables** and add:
   
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
   BING_WEBMASTER_API_KEY=697e5283984a4b3f85621c84e6be1cab
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
   ```

4. **Deploy**
   - Click **Save and Deploy**
   - Wait for the build to complete (usually 3-5 minutes)
   - Your site will be live at `https://lumina-blog.pages.dev`

### Option 2: Deploy via Wrangler CLI (For subsequent deployments)

1. **Install Wrangler** (if not already installed)
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Build the Project**
   ```bash
   npm run pages:build
   ```

4. **Deploy**
   ```bash
   wrangler pages deploy .vercel/output/static --project-name=lumina-blog
   ```

   Or use the npm script:
   ```bash
   npm run pages:deploy
   ```

## Custom Domain Setup

1. In Cloudflare Dashboard, go to your Pages project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain name
5. Follow the DNS configuration instructions

## Environment Variables Management

### For Production
Add environment variables in Cloudflare Dashboard:
- Go to your Pages project
- Click **Settings** > **Environment Variables**
- Add variables for **Production** environment

### For Preview/Development
You can add separate variables for preview deployments:
- Same location as above
- Select **Preview** environment
- Add your development/staging API keys

## Troubleshooting

### Build Fails with "Module not found: fs"
- This happens when Node.js modules are used in Edge Runtime
- Ensure all API routes have `export const runtime = 'edge'`
- Check that no server-side only modules (fs, path) are imported in client components

### Environment Variables Not Working
- Make sure variables are added in Cloudflare Dashboard
- Redeploy after adding new variables
- Check that variable names match exactly (case-sensitive)

### 404 Errors on Dynamic Routes
- Ensure `next.config.mjs` has proper rewrites configured
- Check that all dynamic routes are properly exported
- Verify Edge Runtime compatibility

### Images Not Loading
- Cloudflare Pages requires `images.unoptimized: true` in next.config.mjs
- Already configured in this project

## Monitoring and Logs

1. **View Deployment Logs**
   - Go to your Pages project in Cloudflare Dashboard
   - Click on a deployment to see build logs

2. **Real-time Logs** (via Wrangler)
   ```bash
   wrangler pages deployment tail
   ```

3. **Analytics**
   - Available in Cloudflare Dashboard under your Pages project
   - Shows traffic, bandwidth, and performance metrics

## Rollback

If a deployment has issues:
1. Go to Cloudflare Dashboard > Your Pages project
2. Click **Deployments**
3. Find a previous working deployment
4. Click **...** > **Rollback to this deployment**

## Performance Optimization

Cloudflare Pages automatically provides:
- ✅ Global CDN distribution
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Unlimited bandwidth (on free tier)
- ✅ Fast edge network

## Cost

Cloudflare Pages Free Tier includes:
- Unlimited sites
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- 1 build at a time

Perfect for most projects!

## Next Steps

After deployment:
1. Test your site thoroughly
2. Set up custom domain (if needed)
3. Configure analytics
4. Set up automatic deployments (already configured if using Git)

## Support

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Community](https://community.cloudflare.com/)
