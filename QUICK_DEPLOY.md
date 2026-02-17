# 🚀 Cloudflare Pages - Quick Deploy

## For Windows Users (Recommended Method)

### Option 1: Cloudflare Dashboard (Easiest) ⭐

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Cloudflare Pages"
   git push origin main
   ```

2. **Go to Cloudflare**
   - Visit: https://dash.cloudflare.com/
   - Click: Workers & Pages → Create → Pages → Connect to Git
   - Select your repository

3. **Build Settings**
   ```
   Framework: Next.js
   Build command: npm run build
   Build directory: .next
   ```

4. **Add Environment Variables**
   ```
   NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCcgOnIG_bdXnWZxar0hOWWk9aaaaF4a2M
   BING_WEBMASTER_API_KEY = 697e5283984a4b3f85621c84e6be1cab
   BLOB_READ_WRITE_TOKEN = vercel_blob_rw_UlGanzkpfwuuGLXJ_tyczgxj8Ie9JVzoDcPb3qPeU8afjaM
   ```

5. **Deploy** 🎉
   - Click "Save and Deploy"
   - Wait 3-5 minutes
   - Your site is live!

---

### Option 2: GitHub Actions (Automated)

1. **Add GitHub Secrets**
   
   Go to: Repository → Settings → Secrets → Actions
   
   Add these secrets:
   ```
   CLOUDFLARE_API_TOKEN
   CLOUDFLARE_ACCOUNT_ID
   NEXT_PUBLIC_GEMINI_API_KEY
   BING_WEBMASTER_API_KEY
   BLOB_READ_WRITE_TOKEN
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Enable auto-deployment"
   git push origin main
   ```

3. **Done!**
   - GitHub Actions will automatically deploy
   - Check Actions tab for deployment status

---

## Your Site URLs

After deployment:

- **Production**: `https://lumina-blog.pages.dev`
- **Custom Domain**: Configure in Cloudflare Dashboard

---

## Need Help?

📘 Full Guide: [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)
🔄 Workflow: [.agent/workflows/deploy-cloudflare.md](.agent/workflows/deploy-cloudflare.md)
🐛 Troubleshooting: [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)

---

## Quick Commands

```bash
# Development
npm run dev

# Build locally
npm run build

# Push to GitHub (triggers auto-deploy if using GitHub Actions)
git push origin main
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Cloudflare account created
- [ ] Repository connected to Cloudflare Pages
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Site tested and working
- [ ] Custom domain configured (optional)

---

**That's it! Your site should be live in minutes!** 🎊
