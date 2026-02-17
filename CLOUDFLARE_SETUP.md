# Cloudflare Pages Setup Guide

Complete guide to deploy Lumina Blog to Cloudflare Pages.

## 🚀 Quick Start (Recommended for Windows)

Since you're on Windows and the Cloudflare CLI has bash dependencies, the easiest method is to deploy via the Cloudflare Dashboard.

### Method 1: Deploy via Cloudflare Dashboard (Easiest)

#### Step 1: Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Cloudflare Pages deployment"
git push origin main
```

#### Step 2: Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** in the left sidebar
3. Click **Create application** > **Pages** > **Connect to Git**
4. Select your GitHub repository (`lumina-blog`)
5. Click **Begin setup**

#### Step 3: Configure Build Settings

Use these exact settings:

- **Project name**: `lumina-blog` (or your preferred name)
- **Production branch**: `main`
- **Framework preset**: `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (leave empty)

**Environment variables** (click "Add variable" for each):

```
NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
BING_WEBMASTER_API_KEY = 697e5283984a4b3f85621c84e6be1cab
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
```

#### Step 4: Deploy

1. Click **Save and Deploy**
2. Wait 3-5 minutes for the build to complete
3. Your site will be live at `https://lumina-blog.pages.dev`

---

## Method 2: Deploy via GitHub Actions (Automated)

This method automatically deploys when you push to GitHub.

#### Step 1: Get Cloudflare Credentials

1. **API Token**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Click **Create Token**
   - Use template: **Edit Cloudflare Workers**
   - Or create custom token with permissions:
     - Account > Cloudflare Pages > Edit
   - Copy the token

2. **Account ID**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Click on **Workers & Pages**
   - Your Account ID is shown on the right sidebar

#### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** for each:

```
CLOUDFLARE_API_TOKEN = <your-api-token>
CLOUDFLARE_ACCOUNT_ID = <your-account-id>
NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
BING_WEBMASTER_API_KEY = 697e5283984a4b3f85621c84e6be1cab
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
```

#### Step 3: Push to GitHub

The workflow file is already created at `.github/workflows/deploy-cloudflare.yml`.

Just push your code:

```bash
git add .
git commit -m "Add Cloudflare Pages deployment workflow"
git push origin main
```

GitHub Actions will automatically build and deploy!

---

## Method 3: Deploy via WSL (If you have WSL installed)

If you have Windows Subsystem for Linux:

#### Step 1: Open WSL Terminal

```bash
wsl
```

#### Step 2: Navigate to your project

```bash
cd /mnt/c/Users/BIggsdesign1/Desktop/lumina-blog
```

#### Step 3: Install dependencies and build

```bash
npm install
npm run build
npx @cloudflare/next-on-pages
```

#### Step 4: Deploy

```bash
npx wrangler pages deploy .vercel/output/static --project-name=lumina-blog
```

---

## 📋 Post-Deployment Checklist

After your first successful deployment:

### 1. Verify Deployment

- [ ] Visit your site at `https://your-project.pages.dev`
- [ ] Check homepage loads correctly
- [ ] Test blog post pages
- [ ] Verify live streaming functionality
- [ ] Test API routes

### 2. Configure Custom Domain (Optional)

1. Go to Cloudflare Dashboard > Your Pages Project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `luminablog.com`)
5. Follow DNS configuration instructions

### 3. Set Up Analytics

Cloudflare provides free analytics:

1. Go to your Pages project
2. Click **Analytics** tab
3. View traffic, performance, and bandwidth metrics

### 4. Configure Redirects (If needed)

Create a `_redirects` file in your `public` folder:

```
# Example redirects
/old-path /new-path 301
/blog/* /posts/:splat 301
```

---

## 🔧 Troubleshooting

### Build Fails

**Error**: "Module not found: fs"
- **Solution**: Ensure API routes have `export const runtime = 'edge'`
- Already configured in this project ✅

**Error**: "Invalid configuration"
- **Solution**: Check `next.config.mjs` syntax
- Verify all environment variables are set

### Environment Variables Not Working

1. Check variable names match exactly (case-sensitive)
2. Redeploy after adding variables
3. Clear browser cache and test again

### 404 Errors on Routes

1. Verify `next.config.mjs` rewrites are correct
2. Check dynamic routes are properly configured
3. Ensure all pages are exported correctly

### Images Not Loading

- Already configured with `images.unoptimized: true` ✅
- Verify image paths are correct
- Check CORS headers for external images

---

## 📊 Monitoring & Maintenance

### View Deployment Logs

**Via Dashboard**:
1. Go to Cloudflare Dashboard
2. Click your Pages project
3. Click on a deployment to view logs

**Via CLI** (in WSL):
```bash
wrangler pages deployment tail
```

### Rollback Deployment

1. Go to Cloudflare Dashboard > Your Project
2. Click **Deployments**
3. Find previous working deployment
4. Click **...** > **Rollback to this deployment**

### Update Environment Variables

1. Go to Cloudflare Dashboard > Your Project
2. Click **Settings** > **Environment Variables**
3. Update variables
4. Trigger a new deployment (push to GitHub or manual deploy)

---

## 💰 Pricing

**Cloudflare Pages Free Tier**:
- ✅ Unlimited sites
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ 500 builds/month
- ✅ 1 concurrent build
- ✅ Global CDN
- ✅ DDoS protection
- ✅ Free SSL certificates

**Perfect for most projects!**

---

## 🎯 Next Steps

1. **Choose your deployment method** (Dashboard recommended for Windows)
2. **Deploy your site**
3. **Test thoroughly**
4. **Set up custom domain** (optional)
5. **Monitor performance** via Cloudflare Analytics

---

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Community](https://community.cloudflare.com/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloudflare Pages documentation
3. Check deployment logs for specific errors
4. Visit Cloudflare Community forums

---

**Ready to deploy? Start with Method 1 (Dashboard) - it's the easiest for Windows users!** 🚀
