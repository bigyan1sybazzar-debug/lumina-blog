# GitLab + Cloudflare Pages Setup Guide

Complete guide to deploy your Lumina Blog from GitLab to Cloudflare Pages.

## 🎯 Two Deployment Methods

### Method 1: GitLab CI/CD (Recommended) ⭐
Automatic deployment using GitLab pipelines

### Method 2: Cloudflare Dashboard
Manual connection to GitLab repository

---

## Method 1: GitLab CI/CD Deployment (Recommended)

This method uses the `.gitlab-ci.yml` file to automatically deploy on every push.

### Step 1: Get Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers** or create custom token with:
   - **Account** → **Cloudflare Pages** → **Edit**
4. Click **Continue to summary** → **Create Token**
5. **Copy the token** (you won't see it again!)

### Step 2: Get Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** in the left sidebar
3. Your **Account ID** is shown on the right side
4. Copy it

### Step 3: Add Variables to GitLab

1. Go to your GitLab project: `https://gitlab.com/svse3/bigyann`
2. Navigate to **Settings** → **CI/CD**
3. Expand **Variables**
4. Click **Add variable** for each:

**Required Variables:**

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `CLOUDFLARE_API_TOKEN` | Your API token from Step 1 | ✅ Yes | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID from Step 2 | ✅ Yes | ❌ No |
| `NEXT_PUBLIC_GEMINI_API_KEY` | AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M | ✅ Yes | ✅ Yes |
| `BING_WEBMASTER_API_KEY` | 697e5283984a4b3f85621c84e6be1cab | ✅ Yes | ✅ Yes |
| `BLOB_READ_WRITE_TOKEN` | vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM | ✅ Yes | ✅ Yes |

**Important:** 
- Check **Protected** for all variables (only runs on protected branches)
- Check **Masked** for sensitive tokens (hides in logs)

### Step 4: Create Cloudflare Pages Project

Before the first deployment, create the Pages project:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** → **Create application** → **Pages**
3. Click **Create using Direct Upload**
4. **Project name**: `bigyann`
5. Click **Create project**
6. You can skip the upload step (GitLab CI will handle it)

### Step 5: Push the GitLab CI Configuration

The `.gitlab-ci.yml` file has been created. Now push it:

```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab CI/CD for Cloudflare Pages deployment"
git push origin main
```

### Step 6: Trigger Deployment

1. Go to your GitLab project
2. Navigate to **CI/CD** → **Pipelines**
3. You'll see a new pipeline running
4. The pipeline has two stages:
   - **Build** (automatic) - Builds your Next.js app
   - **Deploy** (manual) - Deploys to Cloudflare Pages
5. Click the **play button** (▶) next to `deploy_production` to deploy

### Step 7: Verify Deployment

After deployment completes:
- Your site will be live at: `https://bigyann.pages.dev`
- Check the pipeline logs for any errors
- Test your site thoroughly

---

## Method 2: Cloudflare Dashboard (Direct GitLab Connection)

This method connects your GitLab repository directly to Cloudflare.

### Step 1: Connect GitLab to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Select **GitLab**
5. Authorize Cloudflare to access your GitLab account
6. Select repository: `svse3/bigyann`

### Step 2: Configure Build Settings

Use these exact settings:

**Framework preset:** Next.js (Static HTML Export)

**Build configuration:**
- **Build command:** `npm run build && npx @cloudflare/next-on-pages`
- **Build output directory:** `.vercel/output/static`
- **Root directory:** `/` (leave empty)

**Environment variables:**

Click **Add variable** for each:

```
NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
BING_WEBMASTER_API_KEY = 697e5283984a4b3f85621c84e6be1cab
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
NODE_VERSION = 18
```

### Step 3: Deploy

1. Click **Save and Deploy**
2. Wait 3-5 minutes for the build
3. Your site will be live at `https://bigyann.pages.dev`

### Step 4: Automatic Deployments

After initial setup:
- **Production deploys:** Automatic on push to `main` branch
- **Preview deploys:** Automatic on push to other branches or merge requests

---

## 🔧 Updating the GitLab CI Configuration

The `.gitlab-ci.yml` file needs your Cloudflare credentials. Update it:

### Option A: Use GitLab CI/CD Variables (Recommended)

The current `.gitlab-ci.yml` expects these variables in GitLab:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Add them as described in Method 1, Step 3.

### Option B: Use Wrangler Configuration

Alternatively, you can configure Wrangler to use your credentials:

```bash
# Login to Wrangler (one-time setup)
npx wrangler login
```

This creates a local config file that GitLab CI can use.

---

## 📊 Monitoring Deployments

### GitLab Pipelines

1. Go to **CI/CD** → **Pipelines**
2. View build logs and deployment status
3. See deployment history

### Cloudflare Dashboard

1. Go to **Workers & Pages** → **bigyann**
2. Click **Deployments** tab
3. View deployment history and logs
4. See analytics and performance metrics

---

## 🚀 Deployment Workflow

### Production Deployment

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# GitLab CI will:
# 1. Build your app automatically
# 2. Wait for manual trigger
# 3. Deploy to Cloudflare Pages when you click "play"
```

### Preview Deployment

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# GitLab CI will:
# 1. Build your app automatically
# 2. Create a preview deployment at:
#    https://feature-new-feature.bigyann.pages.dev
```

---

## 🐛 Troubleshooting

### Build Fails in GitLab CI

**Error:** "Module not found"
- **Solution:** Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error:** "Wrangler command not found"
- **Solution:** The CI installs it automatically, check the logs

### Deployment Fails

**Error:** "Unauthorized"
- **Solution:** Check `CLOUDFLARE_API_TOKEN` is correct in GitLab variables
- Ensure token has correct permissions

**Error:** "Project not found"
- **Solution:** Create the Pages project in Cloudflare Dashboard first (Method 1, Step 4)

### Environment Variables Not Working

- Ensure variables are added in GitLab CI/CD settings
- Check variable names match exactly (case-sensitive)
- Verify variables are not expired or masked incorrectly

---

## 🎯 Next Steps

1. **Choose your method** (GitLab CI recommended)
2. **Set up Cloudflare credentials**
3. **Configure GitLab variables**
4. **Push and deploy**
5. **Test your live site**
6. **Set up custom domain** (optional)

---

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [GitLab CI/CD Docs](https://docs.gitlab.com/ee/ci/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

## 💡 Pro Tips

1. **Use protected branches** for production deployments
2. **Enable manual triggers** for production (already configured)
3. **Use preview deployments** to test before merging
4. **Monitor pipeline costs** in GitLab (Cloudflare is free!)
5. **Set up custom domain** after first successful deployment

---

**Ready to deploy? Follow Method 1 for the best GitLab + Cloudflare experience!** 🚀
