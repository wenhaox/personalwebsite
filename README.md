# 🌟 Personal Websitei cags i 

A beautiful, minimalist personal website built with Next.js 15 and Tailwind CSS v4. Featuring a photography gallery, admin panel, and subtle animations.

## ✨ Features

### 🎨 Design
- **Warm, minimalist aesthetic** inspired by anecdotesf.com and neelkhare.com
- **Purple/burgundy accent** color theme
- **Sidebar navigation** with diamond logo
- **Fully responsive** - looks great on mobile and desktop
- **Dark mode** toggle with system preference support
- **Subtle entrance animations** for polished UX

### 📸 Photography Gallery
- **Masonry layout** with mixed aspect ratios
- **Dynamic sorting** by theme, color, or location
- **Lightbox view** for detailed photo viewing
- **Mobile-optimized** grid (2 columns on mobile)

### 🔐 Admin Panel
- **Secret entrance** - click logo 5 times + password
- **Photo management** - add photos with tags directly from browser
- **localStorage-based** - no backend needed
- **Easy to use** admin interface

### 🎯 Interactive Elements
- **Dynamic day of week** - "Hey! It's Monday..." updates automatically
- **Time-based greetings** - Good morning/afternoon/evening
- **Live clock** on Recently page
- **Smooth animations** throughout
- **Hover effects** and transitions

### 📱 Responsive Design
- **Mobile-first** approach
- **Horizontal nav** on mobile
- **Touch-friendly** interactions
- **Optimized layout** for all screen sizes

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (update with `brew install node`)
- npm (comes with Node.js)

### Installation

```bash
# Clone or navigate to the project
cd /Users/peter/Website/personal-website

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
personal-website/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Navigation.tsx      # Sidebar nav with logo
│   │   │   └── ThemeToggle.tsx     # Dark mode toggle
│   │   ├── admin/
│   │   │   └── page.tsx            # Admin panel for photos
│   │   ├── photography/
│   │   │   └── page.tsx            # Photo gallery
│   │   ├── recently/
│   │   │   └── page.tsx            # Recently page
│   │   ├── resume/
│   │   │   └── page.tsx            # Resume page
│   │   ├── connect/
│   │   │   └── page.tsx            # Connect page
│   │   ├── page.tsx                # Home page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   └── ...
├── DEPLOYMENT.md                   # Deployment guide
├── ADMIN_GUIDE.md                  # Admin panel guide
├── INTERACTIVE_IDEAS.md            # Ideas for more features
└── README.md                       # This file
```

## 🎨 Customization

### Change Your Name
Edit `src/app/page.tsx`:
```javascript
Hey! It's {dayOfWeek} and I'm Your Name.
```

### Change Admin Password
Edit `src/app/components/Navigation.tsx` line 27:
```javascript
if (password === 'admin123') { // Change this!
```

### Modify Colors
Edit `src/app/globals.css`:
```css
--color-accent: #7c2d92;  /* Main purple */
--color-accent-light: #9333ea;  /* Lighter purple */
```

### Update Content
- **Home**: `src/app/page.tsx`
- **Photos**: `src/app/photography/page.tsx`
- **Recently**: `src/app/recently/page.tsx`
- **Resume**: `src/app/resume/page.tsx`
- **Connect**: `src/app/connect/page.tsx`

## 🔐 Admin Panel

### Access
1. Click the diamond logo **5 times quickly**
2. Enter password: `admin123` (change this!)
3. You're in at `/admin`

### Add Photos
1. Upload image to [Imgur](https://imgur.com)
2. Copy image URL
3. Fill in the form (title, location, color, theme, etc.)
4. Click "Add Photo"

See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for full details.

## 🚀 Deployment

The easiest way to deploy is with **Vercel** (free):

### Quick Deploy
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/personal-website.git
git push -u origin main

# Then go to vercel.com and import your GitHub repo
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide including:
- Vercel setup (recommended)
- Custom domain configuration
- Netlify alternative
- Environment variables

## 💡 Interactive Features Ideas

Want to make your site even more interactive? Check out [INTERACTIVE_IDEAS.md](./INTERACTIVE_IDEAS.md) for:
- Weather widget
- Spotify "Now Playing"
- Photo search
- Visitor counter
- Email newsletter
- And 20+ more ideas!

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Fonts**: [Inter](https://fonts.google.com/specimen/Inter) & [Crimson Text](https://fonts.google.com/specimen/Crimson+Text)
- **Icons**: Unicode emoji (no dependencies!)
- **Storage**: localStorage (client-side)
- **Hosting**: [Vercel](https://vercel.com/) (recommended)

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ localStorage required for admin features

## 🐛 Known Limitations

- **Photo storage**: Photos stored in localStorage only persist on the same device/browser
- **No backend**: All data is client-side (great for privacy, limits cross-device sync)
- **Admin access**: Anyone with the password can access admin panel (protect your password!)

### Future Improvements
- Cloud storage integration (Cloudinary/Supabase)
- Edit/delete photos from UI
- Bulk photo upload
- Cross-device sync
- Analytics integration

## 📝 License

This is your personal project! Feel free to modify, share, or use however you'd like.

## 🙏 Credits

- Design inspiration: [anecdotesf.com](https://anecdotesf.com) & [neelkhare.com](https://neelkhare.com)
- Built with love and lots of coffee ☕

## 📧 Questions?

Check the documentation:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - How to deploy
- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - How to use admin panel
- [INTERACTIVE_IDEAS.md](./INTERACTIVE_IDEAS.md) - Ideas for new features

---

**Made with ❤️ and Next.js**
