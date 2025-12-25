# BeyondChats Manager

## Overview

BeyondChats Manager is an AI-powered article management system that scrapes content from websites and enhances it using artificial intelligence. It combines web scraping, data storage, and AI capabilities to help you collect, manage, and improve articles automatically.

**Live app:** https://frontend-production-b9b4.up.railway.app/

## Tech Stacks

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Axios** - HTTP client

### Backend
- **Laravel 11** - PHP web framework
- **PHP 8.1+** - Server-side language
- **PostgreSQL** - Database (via Supabase)
- **Guzzle HTTP** - HTTP client for API calls

### LLM Pipeline
- **Node.js + Express** - JavaScript runtime and web framework
- **Puppeteer** - Headless browser for web scraping
- **Cheerio** - HTML parser
- **OpenAI API** - AI enhancement engine
- **SerpAPI** - Google search results

### Database
- **PostgreSQL** - Relational database
- **Supabase** - Cloud database hosting

## Setup Guide

1. **Clone the repository:**
```bash
git clone https://github.com/subhakarb-babu/BeyondChats-Manager.git
cd BeyondChats-Manager
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env: add DB credentials, API keys
```

**Or download pre-configured .env file:**
[Download .env file](https://drive.google.com/file/d/1DpKhLAqATF2V5PXBzuo0beKdEFI2BObn/view?usp=sharing)

3. **Install everything:**
```bash
npm run install:all
```

4. **Run services (three terminals):**

Terminal 1:
```bash
npm run dev:backend
```

Terminal 2:
```bash
npm run dev:llm
```

Terminal 3:
```bash
npm run dev:frontend
```

5. **Open app:**
```
http://localhost:5173
```

## Project Flow

### 1. User Interface (Frontend)
You interact with the React app. You can:
- Enter a URL to scrape articles
- Browse all saved articles
- Click "Enhance" on any article
- View original vs enhanced side-by-side
- Download articles

### 2. Scraping Flow
1. User enters URL → Frontend sends request to Backend
2. Backend receives request → forwards to Node.js LLM service
3. LLM service uses **Puppeteer** (or **Cheerio**) to extract articles from the website
4. Backend saves articles to PostgreSQL database
5. Frontend displays the articles

### 3. Enhancement Flow
1. User clicks "Enhance" on an article → Frontend sends to Backend
2. Backend sends article to Node.js LLM service
3. LLM service:
   - Searches for references using **Google/SerpAPI**
   - Sends article + references to **OpenAI API**
   - OpenAI enhances the content with better structure and insights
   - Formats result as clean HTML
4. Backend saves enhanced article as new row in database (original stays intact)
5. Frontend shows enhanced version

### 4. Data Storage
- Original articles are never deleted
- Enhanced articles are new entries with `version='enhanced'`
- Each enhanced article references the original with `parent_id`
- This keeps full version history

### 5. Caching
- Article lists are cached for 5 minutes (fast loading)
- Cache clears automatically when articles are created/updated/enhanced
- Keeps the app responsive even with many articles

## Architecture Diagram

![BeyondChats Architecture](https://i.ibb.co/v4Kn8K0Y/Chat-GPT-Image-Dec-25-2025-02-01-26-PM.png)
