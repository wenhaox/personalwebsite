# 🚀 Deployment Guide

## Free Hosting on Vercel (Recommended)

Vercel is the best option for Next.js sites - it's free, fast, and made by the creators of Next.js.

### Step 1: Push to GitHub

1. **Create a GitHub account** (if you don't have one): [github.com](https://github.com)

2. **Create a new repository**:
   - Go to GitHub and click "New repository"
   - Name it `personal-website` (or whatever you like)
   - Keep it Public or Private (both work with Vercel)
   - Don't initialize with README (we already have files)

3. **Push your code to GitHub**:
   ```bash
   cd /Users/peter/Website/personal-website
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/personal-website.git
   git push -u origin main
   ```
   *Replace `YOUR_USERNAME` with your actual GitHub username*

### Step 2: Deploy to Vercel

1. **Create a Vercel account**: Go to [vercel.com](https://vercel.com) and sign up with GitHub

2. **Import your project**:
   - Click "Add New" → "Project"
   - Select your `personal-website` repository from the list
   - Click "Import"

3. **Configure your project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - Click "Deploy"

4. **Wait for deployment** (usually 1-2 minutes)

5. **Done!** Your site is live at `https://your-project-name.vercel.app`

### Step 3: Connect Your Custom Domain

1. **Buy a domain** from:
   - [Namecheap](https://www.namecheap.com) - ~$10/year
   - [Google Domains](https://domains.google.com) - ~$12/year
   - [Porkbun](https://porkbun.com) - ~$9/year (cheap!)

2. **Add domain to Vercel**:
   - Go to your project on Vercel
   - Click "Settings" → "Domains"
   - Enter your domain (e.g., `yourname.com`)
   - Follow Vercel's instructions to update DNS settings

3. **Update DNS** (at your domain registrar):
   - Add the A record and CNAME that Vercel provides
   - Wait 10-30 minutes for DNS to propagate
   - Your site will be live at your custom domain!

### Automatic Deployments

Every time you push changes to GitHub, Vercel automatically:
- Rebuilds your site
- Deploys the new version
- Updates your live site

```bash
# Make changes to your code
git add .
git commit -m "Added new features"
git push

# Vercel automatically deploys! ✨
```

---

## Alternative: Netlify (Also Free)

If you prefer Netlify over Vercel:

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Click "Deploy site"

---

## Environment Variables (Connect guestbook)

The Connect page guestbook needs shared storage in production (Vercel’s filesystem does not persist).

1. Create a free Redis DB at [Upstash](https://console.upstash.com) → **REST API**
2. In Vercel → Project → **Settings → Environment Variables**, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy

Without these, notes still work in each visitor’s browser (`localStorage`), but they won’t sync across devices.

Also set a private approve password:

- `GUESTBOOK_APPROVE_PASSWORD` — used only at `/approve` (not linked in the nav)

Visitors’ notes stay pending until you approve them there. Reject deletes the note.

See `env.example` in the repo.

---

## Guestbook approve queue

1. Set `GUESTBOOK_APPROVE_PASSWORD` in `.env.local` (local) and Vercel env (production)
2. Open `/approve` on your site
3. Unlock with that password, then Approve or Reject pending notes

---

## 📸 Photo Storage Notes

Currently, photos are stored in localStorage (browser storage). This means:
- ✅ Works great for personal use
- ✅ No backend needed
- ⚠️ Photos only visible on the device where you uploaded them
- ⚠️ Clearing browser data will delete photos

### Future Upgrade Options:

If you want photos to persist across devices, you can:

1. **Cloudinary** (Free tier: 25GB storage)
   - Upload images to Cloudinary
   - Use their URLs in your admin panel

2. **Imgur** (Free, unlimited)
   - Upload to Imgur
   - Copy image links into admin panel

3. **Supabase Storage** (Free tier: 1GB)
   - Add Supabase to your project
   - Store photos in their database

---

## Troubleshooting

### Build fails on Vercel?
- Check the error message in Vercel's deployment log
- Make sure all dependencies are in `package.json`
- Run `npm run build` locally to test

### Site is slow?
- Vercel's free tier is already very fast
- Add images through proper `next/image` component
- Compress images before uploading

### Need help?
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)

---

## 🎉 You're Done!

Your personal website is now live and automatically updates whenever you push code to GitHub!

**Quick Deploy Command:**
```bash
git add .
git commit -m "Update website"
git push
```

Vercel handles the rest! 🚀

