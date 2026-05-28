# Streaks - Habit Tracker

A minimal, GitHub-inspired habit tracker with contribution grids, analytics, journaling, and notes. Built with React + Vite. Runs entirely in the browser with no backend.

## Features

- GitHub-style contribution grids for every habit
- Daily check-off with streak tracking
- Bulk history backfill for the last 42 days
- Quick presets for last 7, 14, or 30 days
- Custom date-range logging for missed days
- Analytics dashboard with completion trends
- Timestamped journal with mood tags
- Quick notes with full CRUD
- Export/import JSON backups
- Fully offline with localStorage

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## GitHub Deployment

### 1. Prepare the repo

This project now includes a `.gitignore`, so `node_modules`, `dist`, logs, and local env files will not be pushed.

### 2. Create the GitHub repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3. Install the GitHub Pages deploy helper

```bash
npm install -D gh-pages
```

`package.json` already includes:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

### 4. Check the Vite base path

`vite.config.js` already uses:

```js
base: './'
```

That works well for GitHub Pages in this app, so you do not need to edit it for your repo name.

### 5. Deploy

```bash
npm run deploy
```

This publishes the built app to the `gh-pages` branch.

### 6. Enable Pages in GitHub

In GitHub:

1. Open your repository.
2. Go to `Settings -> Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select the `gh-pages` branch.
5. Select `/ (root)`.
6. Save.

Your site will be available at:

`https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Notes

- Habit data is stored in your browser, so switching browsers or clearing storage removes local data unless you export it first.
- Use `Settings -> Export Data` before major changes or redeploys.
