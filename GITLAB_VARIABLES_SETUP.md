# 🔑 GitLab CI/CD Variables Setup

## Your Cloudflare Credentials

### ✅ API Token (You have this!)
```
IZE0BhTnCk1m2Fd2d6Gtu9te4P-_tw-6301A2SuF
```

### 📋 Account ID (Get this next)

1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages** in the left sidebar
3. Look at the right side - you'll see **Account ID**
4. Click to copy it

---

## 🚀 Add Variables to GitLab

### Step 1: Go to GitLab CI/CD Settings

Visit: https://gitlab.com/svse3/bigyann/-/settings/ci_cd

Or manually:
1. Go to your GitLab project: https://gitlab.com/svse3/bigyann
2. Click **Settings** (left sidebar)
3. Click **CI/CD**
4. Scroll down to **Variables** section
5. Click **Expand**

### Step 2: Add Each Variable

Click **Add variable** button for each of these:

---

#### Variable 1: CLOUDFLARE_API_TOKEN

- **Key:** `CLOUDFLARE_API_TOKEN`
- **Value:** `IZE0BhTnCk1m2Fd2d6Gtu9te4P-_tw-6301A2SuF`
- **Type:** Variable
- **Environment scope:** All (default)
- **Protect variable:** ✅ **Check this box**
- **Mask variable:** ✅ **Check this box**
- **Expand variable reference:** ❌ Leave unchecked

Click **Add variable**

---

#### Variable 2: CLOUDFLARE_ACCOUNT_ID

- **Key:** `CLOUDFLARE_ACCOUNT_ID`
- **Value:** `[Your Account ID from Cloudflare Dashboard]`
- **Type:** Variable
- **Environment scope:** All (default)
- **Protect variable:** ✅ **Check this box**
- **Mask variable:** ❌ Leave unchecked (Account IDs are not sensitive)
- **Expand variable reference:** ❌ Leave unchecked

Click **Add variable**

---

#### Variable 3: NEXT_PUBLIC_GEMINI_API_KEY

- **Key:** `NEXT_PUBLIC_GEMINI_API_KEY`
- **Value:** `AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M`
- **Type:** Variable
- **Environment scope:** All (default)
- **Protect variable:** ✅ **Check this box**
- **Mask variable:** ✅ **Check this box**
- **Expand variable reference:** ❌ Leave unchecked

Click **Add variable**

---

#### Variable 4: BING_WEBMASTER_API_KEY

- **Key:** `BING_WEBMASTER_API_KEY`
- **Value:** `697e5283984a4b3f85621c84e6be1cab`
- **Type:** Variable
- **Environment scope:** All (default)
- **Protect variable:** ✅ **Check this box**
- **Mask variable:** ✅ **Check this box**
- **Expand variable reference:** ❌ Leave unchecked

Click **Add variable**

---

#### Variable 5: BLOB_READ_WRITE_TOKEN

- **Key:** `BLOB_READ_WRITE_TOKEN`
- **Value:** `vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM`
- **Type:** Variable
- **Environment scope:** All (default)
- **Protect variable:** ✅ **Check this box**
- **Mask variable:** ✅ **Check this box**
- **Expand variable reference:** ❌ Leave unchecked

Click **Add variable**

---

## ✅ Verification Checklist

After adding all variables, you should have:

- [ ] `CLOUDFLARE_API_TOKEN` - Protected ✅, Masked ✅
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Protected ✅, Masked ❌
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` - Protected ✅, Masked ✅
- [ ] `BING_WEBMASTER_API_KEY` - Protected ✅, Masked ✅
- [ ] `BLOB_READ_WRITE_TOKEN` - Protected ✅, Masked ✅

**Total: 5 variables**

---

## 🎯 Next Steps

### 1. Create Cloudflare Pages Project

Before deploying, create the project in Cloudflare:

1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages** → **Create application** → **Pages**
3. Click **Create using Direct Upload**
4. **Project name:** `bigyann`
5. Click **Create project**
6. You can close the upload page (GitLab CI will handle uploads)

### 2. Add Environment Variables in Cloudflare

In Cloudflare Dashboard:
1. Go to **Workers & Pages** → **bigyann**
2. Click **Settings** → **Environment Variables**
3. Add these for **Production** environment:

```
NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
BING_WEBMASTER_API_KEY = 697e5283984a4b3f85621c84e6be1cab
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
NODE_VERSION = 18
```

### 3. Trigger Deployment

1. Go to: https://gitlab.com/svse3/bigyann/-/pipelines
2. You should see a pipeline running (from your last push)
3. Wait for the **build** stage to complete
4. Click the **play button** (▶) next to `deploy_production`
5. Wait for deployment to complete (3-5 minutes)

### 4. Verify Your Site

Visit: https://bigyann.pages.dev

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Double-check the API token is correct
- Ensure the token has **Cloudflare Pages Edit** permissions
- Try creating a new token with the correct permissions

### "Project not found" Error
- Make sure you created the `bigyann` project in Cloudflare Dashboard
- Check the project name matches exactly (case-sensitive)

### Pipeline Doesn't Start
- Check that your main branch is protected in GitLab
- Verify all variables are marked as "Protected"
- Try pushing a new commit to trigger the pipeline

---

## 📊 Quick Links

- **GitLab Project:** https://gitlab.com/svse3/bigyann
- **GitLab CI/CD Settings:** https://gitlab.com/svse3/bigyann/-/settings/ci_cd
- **GitLab Pipelines:** https://gitlab.com/svse3/bigyann/-/pipelines
- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Your Site (after deployment):** https://bigyann.pages.dev

---

**You're almost there! Add the variables and trigger your first deployment!** 🚀
