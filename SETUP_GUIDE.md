# 🚀 Complete Application Setup Guide

## Overview

This application consists of three parts:
1. **Backend (Laravel)** - Article CRUD API + Database
2. **Scraper Service (Node.js)** - Web scraping with Puppeteer
3. **Frontend (React)** - User interface

---

## 📋 Prerequisites

- PHP 8.1+ with extensions: pdo_pgsql, mbstring, xml
- PostgreSQL 17
- Node.js 18+
- Composer

---

## 🔧 Initial Setup (One-time)

### 1. Backend Setup

```powershell
cd backend

# Install dependencies
composer install

# Configure environment (already done)
# .env file contains:
# - DB_CONNECTION=pgsql
# - DB_PASSWORD=root
# - APP_KEY (generated)

# Run migrations
php artisan migrate

# Clear caches
php artisan config:clear
php artisan cache:clear
```

### 2. Scraper Service Setup

```powershell
cd llm-pipeline

# Install dependencies
npm install

# Environment variables in .env:
# LARAVEL_API_URL=http://localhost:8000/api
# SERP_API_KEY=your_key
# OPENAI_API_KEY=your_key
```

### 3. Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# No env needed (uses default localhost:8000)
```

---

## ▶️ Running the Application

### Terminal 1: Backend API
```powershell
cd backend
php artisan serve
```
**Runs on:** http://localhost:8000

### Terminal 2: Scraper Service
```powershell
cd llm-pipeline
npm run scraper
```
**Runs on:** http://localhost:3000

### Terminal 3: Frontend
```powershell
cd frontend
npm run dev
```
**Runs on:** http://localhost:5173

---

## 🎯 Using the Application

### Step 1: Scrape Articles

1. Open browser: http://localhost:5173
2. In **Scraper Control** panel:
   - Set number of articles (e.g., 5)
   - Keep default URL or change
   - Click **"🚀 Start Scraping"**
3. Wait for success message
4. Articles appear automatically in grid below

### Step 2: View Articles

- Browse articles in responsive card grid
- Each card shows:
  - Title
  - Version badge (original/enhanced)
  - Status badge (published/draft)
  - Author and date
  - Content preview

### Step 3: Manage Articles

**View Details:**
- Click any article card
- Modal opens with full content
- See all metadata

**Download:**
- Click "⬇️ Download" button
- Gets formatted .txt file

**Delete:**
- Click "🗑️ Delete" button
- Confirm in dialog
- Article removed

---

## 🤖 LLM Enhancement Process

### Run Enhancement Pipeline

```powershell
cd llm-pipeline
npm start
```

**What it does:**
1. Fetches latest article from database
2. Searches Google for article title (via SerpAPI)
3. Scrapes top 2 reference articles
4. Sends to OpenAI for enhancement
5. Saves enhanced version to database (linked via parent_id)

**Requirements:**
- Articles must exist in database
- OPENAI_API_KEY in .env
- SERP_API_KEY in .env

---

## 📊 Application Flow

```
USER → Frontend (localhost:5173)
         ↓
    Backend API (localhost:8000)
         ↓
    Scraper Service (localhost:3000)
         ↓
    PostgreSQL Database

Separate Process:
LLM Pipeline → SerpAPI → Puppeteer → OpenAI → Database
```

---

## 🌐 API Endpoints

### Backend (localhost:8000/api)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | List all articles |
| GET | `/articles/{id}` | Get single article |
| POST | `/articles` | Create article |
| PUT | `/articles/{id}` | Update article |
| DELETE | `/articles/{id}` | Delete article |
| GET | `/articles/{id}/download` | Download as .txt |
| POST | `/articles/scrape` | Scrape BeyondChats |

### Scraper Service (localhost:3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scrape` | Scrape articles |
| GET | `/health` | Health check |

---

## 🎨 Frontend Features

### Control Panel
- Configure scraping parameters
- Start/stop scraping
- Real-time status updates

### Article Grid
- Responsive card layout
- Version & status badges
- Quick actions (download, delete)
- Click to view details

### Article Modal
- Full article content
- Complete metadata
- Clean formatting
- Close on overlay click

---

## 🛠️ Troubleshooting

### Backend not starting
```powershell
cd backend
php artisan config:clear
php artisan cache:clear
```

### Database connection error
- Check PostgreSQL is running
- Verify password in `.env` (DB_PASSWORD=root)

### Frontend not loading
```powershell
cd frontend
rm -rf node_modules
npm install
```

### Scraper service failing
- Check if port 3000 is available
- Verify Puppeteer installed correctly
- Try: `npm install puppeteer --force`

---

## 📁 Project Structure

```
beyondchats-assignment-full/
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/ArticleController.php
│   │   ├── Models/Article.php
│   │   └── Services/ArticleService.php
│   ├── database/migrations/
│   ├── routes/api.php
│   └── .env
├── llm-pipeline/         # Node.js services
│   ├── src/
│   │   ├── api/scraper.api.js
│   │   ├── services/
│   │   │   ├── googleSearch.service.js
│   │   │   ├── llm.service.js
│   │   │   └── scraper.service.js
│   │   └── workflows/articleEnhancer.workflow.js
│   └── .env
└── frontend/             # React UI
    ├── src/
    │   ├── api/article.api.js
    │   ├── components/
    │   └── App.jsx
    └── package.json
```

---

## 🎯 Quick Start (All in One)

```powershell
# Terminal 1 - Backend
cd backend; php artisan serve

# Terminal 2 - Scraper
cd llm-pipeline; npm run scraper

# Terminal 3 - Frontend
cd frontend; npm run dev

# Then open: http://localhost:5173
```

---

## ✅ Checklist

- [ ] PostgreSQL running (service: postgresql-x64-17)
- [ ] Backend .env configured (DB_PASSWORD=root)
- [ ] Migrations run (articles table exists)
- [ ] Backend API running (port 8000)
- [ ] Scraper service running (port 3000)
- [ ] Frontend running (port 5173)
- [ ] Can scrape articles via UI
- [ ] Can view article details
- [ ] Can download/delete articles

---

## 📝 Notes

- **Original articles**: `version: 'original'`, no parent_id
- **Enhanced articles**: `version: 'enhanced'`, has parent_id
- All articles stored in same `articles` table
- Soft deletes enabled (deleted_at column)
- Cache cleared automatically on modifications
