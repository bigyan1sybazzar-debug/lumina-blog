---
description: Deploy to Cloudflare Pages
---

# Deploy to Cloudflare Pages Workflow

This workflow guides you through deploying the Lumina Blog to Cloudflare Pages.

## Prerequisites Check

1. Ensure you have a Cloudflare account
2. Install Wrangler CLI globally: `npm install -g wrangler`
3. Login to Cloudflare: `wrangler login`

## Deployment Steps

### Step 1: Build the Next.js Application

First, build the standard Next.js application:

```bash
npm run build
```

This creates the `.next` directory with the production build.

### Step 2: Build for Cloudflare Pages

Run the Cloudflare Pages adapter to convert the Next.js build:

// turbo
```bash
npm run pages:build
```

This command:
- Runs `@cloudflare/next-on-pages` adapter
- Converts the Next.js build to Cloudflare Pages format
- Outputs to `.vercel/output/static`

### Step 3: Deploy to Cloudflare Pages

Deploy the built application:

```bash
npm run pages:deploy
```

Or manually with wrangler:

```bash
wrangler pages deploy .vercel/output/static --project-name=lumina-blog
```

### Step 4: Configure Environment Variables

After first deployment, add environment variables in Cloudflare Dashboard:

1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages > lumina-blog
3. Click Settings > Environment Variables
4. Add the following variables:

**Production Environment:**
- `NEXT_PUBLIC_GEMINI_API_KEY` = Your Gemini API key
- `BING_WEBMASTER_API_KEY` = Your Bing Webmaster API key
- `BLOB_READ_WRITE_TOKEN` = Your Vercel Blob token

**Preview Environment (optional):**
- Same variables but with development/staging values

### Step 5: Verify Deployment

1. Check deployment status in Cloudflare Dashboard
2. Visit your site at `https://lumina-blog.pages.dev`
3. Test key functionality:
   - Homepage loads
   - Blog posts display
   - Live streaming works
   - API routes respond correctly

## Continuous Deployment

Once connected to Git, Cloudflare automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to other branches or open PRs

## Troubleshooting

### Build Fails

If the build fails:

1. Check build logs in Cloudflare Dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node version is 18+ (set in `.node-version`)
4. Check that all API routes have `export const runtime = 'edge'`

### Environment Variables Not Working

1. Redeploy after adding variables
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are added to correct environment (Production/Preview)

### 404 Errors

1. Check `next.config.mjs` rewrites configuration
2. Verify dynamic routes are properly configured
3. Check deployment logs for route generation errors

## Rollback

To rollback to a previous deployment:

1. Go to Cloudflare Dashboard > lumina-blog
2. Click Deployments tab
3. Find the working deployment
4. Click "..." > "Rollback to this deployment"

## Custom Domain

To add a custom domain:

1. Go to Cloudflare Dashboard > lumina-blog
2. Click Custom domains
3. Click "Set up a custom domain"
4. Enter your domain
5. Follow DNS configuration instructions

## Performance Monitoring

Monitor your deployment:

1. **Analytics**: Cloudflare Dashboard > lumina-blog > Analytics
2. **Real-time Logs**: `wrangler pages deployment tail`
3. **Deployment History**: Cloudflare Dashboard > Deployments

## Notes

- Cloudflare Pages free tier includes unlimited bandwidth
- Builds are limited to 500/month on free tier
- Edge Runtime is used for optimal performance
- All API routes run on Cloudflare's global network
