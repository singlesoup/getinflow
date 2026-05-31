# Focus App — Vercel Deployment Guide

A minimal Pomodoro + Tasks + Ambient Sounds app.
Fully client-side. No backend, no database, no auth required.

---

## What's Deployed

- **Pomodoro Timer** — 25min/5min with session tracking
- **Task List** — localStorage persistence, time-per-task tracking
- **Ambient Sounds** — Rain, Forest, Ocean, White Noise (WAV)
- **Import / Export** — JSON backup/restore of all user data
- **Dark Mode** — persisted in localStorage

---

## Option A — Deploy via Vercel CLI (Fastest)

### Prerequisites
```bash
npm install -g vercel      # Install Vercel CLI globally
vercel --version           # Confirm it installed: should print 30.x+
```

### Steps

1. **Login to Vercel**
```bash
vercel login
# Opens browser → choose GitHub / GitLab / email
```

2. **Navigate to project root**
```bash
cd /path/to/your/project    # wherever this repo lives
```

3. **Deploy to preview (test first)**
```bash
vercel
# Prompts:
#   Set up and deploy? → Y
#   Which scope? → your-username
#   Link to existing project? → N (first time)
#   Project name? → focus-app (or any name)
#   In which directory? → ./ (press Enter)
#   Override settings? → N
```

4. **Deploy to Production**
```bash
vercel --prod
# Gives you a live URL like: https://focus-app.vercel.app
```

---

## Option B — Auto-Deploy from GitHub (Recommended)

This connects your GitHub repo so every push to `main` deploys automatically.

### Step 1: Push code to GitHub
```bash
git init                             # if not already a git repo
git add .
git commit -m "feat: focus app with import/export"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/focus-app.git
git push -u origin main
```

### Step 2: Import project on Vercel Dashboard

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Connect your GitHub account (first time only)
4. Select your **focus-app** repository
5. Vercel auto-detects Next.js — no changes needed
6. Click **Deploy**

### Step 3: Verify settings (Vercel will auto-detect these)
| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `yarn build` |
| Output Directory | `.next` |
| Install Command | `yarn install` |

### Step 4: Done — auto-deploy is now live!

Every `git push origin main` will trigger a new deployment.
Pull Requests get **preview URLs** automatically.

---

## Environment Variables

This app is 100% client-side — **no environment variables needed** on Vercel.

> The app uses `localStorage` only. No server, no database.

---

## Audio Files

Make sure `/public/audio/` is committed to git:
```bash
git add public/audio/
git status   # should show rain.wav, forest.wav, ocean.wav, white.wav
```

Vercel serves `/public` contents as static assets automatically.

---

## Checking Your Deployment

After deploying, verify these URLs work:
```
https://your-app.vercel.app/              ← Main app
https://your-app.vercel.app/audio/rain.wav    ← Audio (should stream)
https://your-app.vercel.app/audio/forest.wav
https://your-app.vercel.app/audio/ocean.wav
https://your-app.vercel.app/audio/white.wav
```

---

## Merging the Feature Branch

This feature was developed on `feature/import-export-localstorage`.

```bash
# 1. Review the diff
git diff main feature/import-export-localstorage

# 2. Merge to main
git checkout main
git merge feature/import-export-localstorage

# 3. Push — triggers auto-deploy on Vercel
git push origin main
```

Or open a Pull Request on GitHub for code review first.
