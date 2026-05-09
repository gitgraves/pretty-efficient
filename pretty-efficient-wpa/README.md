# Pretty Efficient — Job Tracker PWA

## Deploy to Netlify (one-time setup)

### Step 1 — Install dependencies & build
You need Node.js installed. If you don't have it: https://nodejs.org (download the LTS version).

Open Terminal (Mac) or Command Prompt (Windows) in this folder, then run:

```
npm install
npm run build
```

This creates a `dist/` folder — that's what you'll deploy.

### Step 2 — Deploy to Netlify
1. Go to https://netlify.com and create a free account
2. From the dashboard, click **"Add new site" → "Deploy manually"**
3. Drag the `dist/` folder onto the upload area
4. Done! Netlify gives you a URL like `https://pretty-efficient-abc123.netlify.app`

### Step 3 — Install on iPhone
1. Open the URL in Safari on her iPhone
2. Tap the Share button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap Add — it now appears as an app icon

## Re-deploying after updates
Run `npm run build` again, then drag the new `dist/` folder to Netlify.

## Local development
```
npm run dev
```
Opens at http://localhost:5173

## Supabase
Project: https://bfuunlrugixhqdjtzfre.supabase.co
Credentials are already embedded in src/lib/supabase.js
