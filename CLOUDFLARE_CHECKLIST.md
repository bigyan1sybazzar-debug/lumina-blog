# ✅ Cloudflare Pages Setup Checklist for "bigyann"

## 🎯 Your Configuration

**Project Name:** `bigyann`
**Repository:** `https://gitlab.com/svse3/bigyann.git`
**Deployment URL:** `https://bigyann.pages.dev`

---

## 📋 Setup Steps

### ✅ Step 1: Create Cloudflare Pages Project

1. Go to: https://dash.cloudflare.com/
2. Click: **Workers & Pages** → **Create application** → **Pages**
3. Choose one of these options:

#### Option A: Direct Upload (For GitLab CI/CD)
- Click **Create using Direct Upload**
- **Project name:** `bigyann`
- Click **Create project**
- Skip the upload (GitLab CI will handle it)

#### Option B: Connect to Git (For Automatic Deployments)
- Click **Connect to Git** → **GitLab**
- Authorize Cloudflare
- Select repository: `svse3/bigyann`
- Configure build settings (see below)

---

### ✅ Step 2: Configure Build Settings (If using Option B)

**Framework preset:** Next.js

**Build command:**
```bash
npm run build && npx @cloudflare/next-on-pages
```

**Build output directory:**
```
.vercel/output/static
```

**Root directory:** `/` (leave empty)

**Node version:** `18`

---

### ✅ Step 3: Add Environment Variables

In Cloudflare Dashboard → Your Project → **Settings** → **Environment Variables**

Add these for **Production** environment:

```
NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
BING_WEBMASTER_API_KEY = 697e5283984a4b3f85621c84e6be1cab
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
NODE_VERSION = 18
```

---

### ✅ Step 4: Set Up GitLab CI/CD (Optional but Recommended)

If you want automatic deployments via GitLab:

#### 4a. Get Cloudflare Credentials

**API Token:**
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Copy the token

**Account ID:**
1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages**
3. Copy your Account ID from the right sidebar

#### 4b. Add Variables to GitLab

1. Go to: https://gitlab.com/svse3/bigyann/-/settings/ci_cd
2. Expand **Variables**
3. Add these variables:

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `CLOUDFLARE_API_TOKEN` | Your API token | ✅ | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID | ✅ | ❌ |
| `NEXT_PUBLIC_GEMINI_API_KEY` | AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M | ✅ | ✅ |
| `BING_WEBMASTER_API_KEY` | 697e5283984a4b3f85621c84e6be1cab | ✅ | ✅ |
| `BLOB_READ_WRITE_TOKEN` | vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM | ✅ | ✅ |

---

### ✅ Step 5: Push GitLab CI Configuration

```bash
git add .gitlab-ci.yml wrangler.toml GITLAB_CLOUDFLARE_SETUP.md
git commit -m "Configure GitLab CI/CD for Cloudflare Pages deployment"
git push origin main
```

---

### ✅ Step 6: Deploy

#### If using GitLab CI/CD:
1. Go to: https://gitlab.com/svse3/bigyann/-/pipelines
2. Wait for the build stage to complete
3. Click the **play button** (▶) next to `deploy_production`
4. Wait for deployment to complete

#### If using Cloudflare Dashboard:
1. Your site will deploy automatically on push to main
2. Check deployment status in Cloudflare Dashboard

---

### ✅ Step 7: Verify Deployment

1. Visit: https://bigyann.pages.dev
2. Test key features:
   - [ ] Homepage loads
   - [ ] Blog posts display
   - [ ] Live streaming works
   - [ ] API routes respond
   - [ ] Images load correctly

---

## 🔧 Quick Commands

```bash
# Check Git status
git status

# Push to GitLab
git push origin main

# View remote
git remote -v

# Check current branch
git branch
```

---

## 📊 Monitoring

### GitLab
- **Pipelines:** https://gitlab.com/svse3/bigyann/-/pipelines
- **CI/CD Settings:** https://gitlab.com/svse3/bigyann/-/settings/ci_cd

### Cloudflare
- **Dashboard:** https://dash.cloudflare.com/
- **Your Project:** Workers & Pages → bigyann
- **Deployments:** Check deployment history and logs
- **Analytics:** View traffic and performance

---

## 🐛 Common Issues

### "Project not found" Error
- **Solution:** Create the Pages project in Cloudflare Dashboard first (Step 1)

### "Unauthorized" Error
- **Solution:** Check `CLOUDFLARE_API_TOKEN` in GitLab variables
- Ensure token has correct permissions

### Build Fails
- **Solution:** Check build logs in GitLab pipeline
- Verify all dependencies are in `package.json`
- Ensure Node version is 18

### Environment Variables Not Working
- **Solution:** Add them in both GitLab CI/CD variables AND Cloudflare Dashboard
- Redeploy after adding variables

---

## 📚 Documentation

- **GitLab Setup Guide:** [GITLAB_CLOUDFLARE_SETUP.md](GITLAB_CLOUDFLARE_SETUP.md)
- **Quick Deploy:** [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- **Full Setup:** [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)

---

## 🎯 Current Status

- ✅ Project name updated to `bigyann`
- ✅ GitLab CI/CD configuration created
- ✅ Wrangler configuration updated
- ✅ Code pushed to GitLab
- ⏳ **Next:** Set up Cloudflare Pages project
- ⏳ **Next:** Configure environment variables
- ⏳ **Next:** Deploy!

---

**You're almost there! Follow the steps above to complete your deployment.** 🚀
