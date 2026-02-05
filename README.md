<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lumina Blog - AI-Powered Blog Platform

A modern, feature-rich blog platform built with Next.js, featuring AI-powered content generation, live streaming, and real-time discussions.

View your app in AI Studio: https://ai.studio/apps/drive/1efWwelGgtrg6a373jPwIJVBVpJbuv8Fb

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   BING_WEBMASTER_API_KEY=your_bing_api_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Deploy to Cloudflare Pages (Recommended)

This app is optimized for Cloudflare Pages deployment with Edge Runtime support.

**Quick Deploy:**

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Connect your repository
4. Configure build settings (see [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md))
5. Deploy!

**Detailed Guides:**

- 📘 **[Complete Setup Guide](CLOUDFLARE_SETUP.md)** - Step-by-step instructions for all deployment methods
- 🔄 **[Deployment Workflow](.agent/workflows/deploy-cloudflare.md)** - Automated deployment workflow
- 🐛 **[Troubleshooting](CLOUDFLARE_DEPLOYMENT.md)** - Common issues and solutions

### Other Deployment Options

- **Vercel**: Deploy with one click using the Vercel button
- **Netlify**: Compatible with Netlify Edge Functions
- **Self-hosted**: Run with `npm run build && npm start`

## ✨ Features

- 🤖 **AI-Powered Content** - Generate blog posts with Google Gemini
- 📺 **Live Streaming** - Real-time video streaming with HLS support
- 💬 **Live Discussions** - Real-time comments and reactions
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🔍 **SEO Optimized** - Automatic sitemap generation and meta tags
- 📊 **Analytics** - Built-in analytics and performance monitoring
- 🌐 **Edge Runtime** - Fast global performance with Cloudflare Workers

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Database**: Firebase
- **Storage**: Vercel Blob
- **Deployment**: Cloudflare Pages
- **Video**: HLS.js for streaming

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run pages:build  # Build for Cloudflare Pages (Linux/WSL only)
npm run pages:deploy # Deploy to Cloudflare Pages (Linux/WSL only)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For deployment help, see [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) or open an issue.
