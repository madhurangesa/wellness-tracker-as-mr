# Wellness Tracker

Shared health tracker for two people — schedule, meals, groceries, and weight chart.

## Quick setup

### 1. Install
```bash
npm install
```

### 2. Add Upstash credentials
1. Go to [console.upstash.com](https://console.upstash.com)
2. Open your Redis database → scroll to **REST API**
3. Copy the URL and Token
4. Create a file called `.env` in this folder:

```
VITE_UPSTASH_URL=https://your-endpoint.upstash.io
VITE_UPSTASH_TOKEN=your_token_here
```

### 3. Run locally
```bash
npm run dev
```

### 4. Deploy on Vercel
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo → Deploy
3. In Vercel → Settings → Environment Variables, add:
   - `VITE_UPSTASH_URL`
   - `VITE_UPSTASH_TOKEN`
4. Redeploy — share the URL with your friend

## Features
- **Schedule** — weekly plan with checkboxes, notes, and a 60-min desk break timer
- **Meals** — day-by-day planner per person with quick suggestions
- **Groceries** — categorised list with healthy staples, view each other's lists
- **Weight** — log weight, see both people on one chart, set a goal
