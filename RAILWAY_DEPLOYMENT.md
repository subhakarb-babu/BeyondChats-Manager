# Railway Deployment Guide

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `BeyondChats-Manager` repo
5. Click **"Deploy"**

---

## Step 2: Configure Backend Service

1. In Railway dashboard, click **"New Service"**
2. Select **"GitHub Repo"**
3. Select `BeyondChats-Manager`
4. Set **Root Directory**: `backend`
5. Click **"Deploy"**

### Add Backend Environment Variables

1. Click **backend** service
2. Go to **Settings** tab
3. Add **Environment Variables**:

```
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:MjIyMTAxNzcxODM5NzIwNjE5OTE3MjUwMzgxMTExMzcxMjE2MTM2MjA2MjMzMTM0MjMwMjMxNjI5OTU3MjE4Njg5MTY0MTg0NDAxNzU2NjE1OQ==
APP_URL=https://<your-backend-railway-domain>.railway.app

DB_CONNECTION=pgsql
DB_HOST=db.qhtpfbqbdplvrcnboqjq.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=SA2XmDHMZFCysBOV
DB_SSLMODE=require

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

OPENAI_API_KEY=sk-your-openai-api-key-here
SERP_API_KEY=your-serpapi-key-here
```

4. Get your **Backend URL**:
   - Go to **Deployments** tab
   - Copy the **public URL** (looks like: `https://beyondchats-backend-prod.railway.app`)
   - Update `APP_URL` variable with this

---

## Step 3: Configure LLM Pipeline Service

1. Click **"New Service"** → **"GitHub Repo"**
2. Select `BeyondChats-Manager`
3. Set **Root Directory**: `llm-pipeline`
4. Click **"Deploy"**

### Add LLM Environment Variables

1. Click **llm-pipeline** service
2. Go to **Settings** tab
3. Add **Environment Variables**:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
SERP_API_KEY=your-serpapi-key-here
BACKEND_BASE_URL=https://<your-backend-railway-domain>.railway.app/api
```

---

## Step 4: Configure Frontend Service

1. Click **"New Service"** → **"GitHub Repo"**
2. Select `BeyondChats-Manager`
3. Set **Root Directory**: `frontend`
4. Click **"Deploy"**

### Add Frontend Environment Variables

1. Click **frontend** service
2. Go to **Settings** tab
3. Add **Environment Variables**:

```
VITE_API_URL=https://<your-backend-railway-domain>.railway.app/api
```

---

## Step 5: Enable CORS in Backend

Update `backend/config/cors.php` to allow frontend:

```php
'allowed_origins' => [
    'https://<your-frontend-railway-domain>.railway.app',
    'http://localhost:3000',
    'http://localhost:5173'
],
```

Push to GitHub:
```bash
git add backend/config/cors.php
git commit -m "Configure CORS for Railway"
git push origin main
```

Railway auto-redeploys.

---

## Your Deployed URLs

After all 3 services deploy successfully:

- **Frontend**: `https://your-frontend-railway-domain.railway.app`
- **Backend API**: `https://your-backend-railway-domain.railway.app`
- **LLM Pipeline**: `https://your-llm-railway-domain.railway.app`

---

## Verify Everything Works

### 1. Check Service Status in Railway
- All 3 services should show **green checkmarks** ✓
- If red, click service and check **Logs** tab

### 2. Test Backend API
```bash
curl https://your-backend-railway-domain.railway.app/api/articles
```
Should return JSON (not error)

### 3. Test Frontend
Visit: `https://your-frontend-railway-domain.railway.app`
Should load the React app without errors

### 4. Test Scraping
1. Open frontend
2. Enter URL: `https://beyondchats.com/blogs/`
3. Count: `2`
4. Click **Scrape**
5. Wait 30 seconds (first run is slow)
6. Should see articles appear

### 5. Test Enhancement
1. Click on an article
2. Click **Enhance**
3. Wait 1-2 minutes
4. Should see enhanced version

---

## Troubleshooting

### "Module not found" errors
- Missing dependencies in package.json
- Solution: Already fixed - all deps added

### Backend won't start
- Check **Logs** in Railway
- Verify `APP_URL` matches Railway domain
- Make sure `DB_SSLMODE=require` is set

### Frontend blank page
- Check browser **Console** (F12)
- Verify `VITE_API_URL` is correct
- Check network requests to API

### Scraping fails
- Check LLM service logs
- Verify `BACKEND_BASE_URL` is correct
- Try different website URL

### Database connection failed
- Verify Supabase credentials are correct
- Check `DB_HOST`, `DB_PASSWORD`
- Make sure `DB_SSLMODE=require`

### Services sleeping (free tier)
- Free tier services auto-sleep after 15 min inactivity
- To prevent: Upgrade to **Hobby** plan ($7/month)
- Or keep site in browser tab to prevent sleep

---

## Cost & Pricing

- **Free tier**: $5/month credits per service
- **Hobby plan**: $7/month per service (always-on)
- Database: Supabase free (500 MB)
- Total per month: ~$21-35 for production (3 services + DB)

---

## Check Logs if Anything Fails

1. Click service in Railway
2. Go to **Deployments** tab
3. Click latest deployment
4. Go to **Logs** tab
5. Scroll down to see errors

Good luck! 🚀
