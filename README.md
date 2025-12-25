# BeyondChats – Full Stack Article Enhancement System

BeyondChats is a production-ready, three-tier application designed to scrape, manage, and AI-enhance articles. The system is built to reflect real-world engineering practices with clear separation of concerns, safe data handling, and scalable architecture.

The application allows users to scrape articles from external sources, store and manage original content, enhance articles using AI with supporting references, maintain version history, and browse, filter, and download articles through a clean and intuitive interface.

## Architecture Overview

[![System Architecture](docs/architecture.png)](docs/architecture.png)

The system follows a three-tier architecture:

**Frontend**: React + Vite  
**Backend**: Laravel 11 (PHP 8.1+)  
**LLM Pipeline**: Node.js + Express  
**Database**: PostgreSQL  

High-level interaction flow:

1. User interacts with the React frontend.
2. The frontend communicates with the Laravel backend via REST APIs.
3. Laravel persists data in PostgreSQL and orchestrates AI operations by calling the Node-based LLM pipeline.
4. The LLM pipeline handles scraping, reference gathering, AI enhancement, and formatting, then returns the enhanced content back to Laravel.

## Frontend (React + Vite)

The frontend is responsible for all user-facing interactions. It allows users to trigger scraping, browse and filter articles, enhance articles using AI, view original and enhanced versions, and download articles as text files.

**Key frontend files include:**

- `src/App.jsx`
- `src/components/ControlPanel.jsx`
- `src/components/ArticleList.jsx`
- `src/components/ArticleModal.jsx`
- `src/components/ArticleCard.jsx`
- `src/api/article.api.js`

The frontend communicates with the backend using the environment variable `VITE_API_BASE_URL`.

## Backend (Laravel)

The backend acts as the central orchestrator of the system. It exposes REST APIs, validates input, manages caching, persists data, coordinates scraping and enhancement workflows, and streams downloadable files.

**Key backend files include:**

- `routes/api.php`
- `app/Http/Controllers/ArticleController.php`
- `app/Services/ArticleService.php`
- `database/migrations/*create_articles_table.php`

The backend ensures that original and enhanced articles are stored safely without overwriting data and that cache consistency is maintained across operations.

## LLM Pipeline (Node.js + Express)

The LLM pipeline is a dedicated service responsible for heavy processing tasks. It scrapes websites using Puppeteer and Cheerio, gathers reference material via Google search (using SerpAPI or a mock fallback), enhances content using OpenAI, and formats the result into clean, structured HTML.

**Key LLM pipeline files include:**

- `src/api/scraper.api.js`
- `src/workflows/articleEnhancer.workflow.js`
- `src/services/llm.service.js`
- `src/services/googleSearch.service.js`
- `src/services/scraper.service.js`
- `src/services/contentFormatter.service.js`

## Database Design

The application uses a PostgreSQL database with a primary `articles` table. Important fields include `id`, `title`, `content`, `version`, `parent_id`, `created_at`, and `updated_at`.

The `version` field indicates whether an article is original or enhanced. Enhanced articles are always stored as new rows, with `parent_id` referencing the original article. Original content is never overwritten, ensuring safe version history.

## End-to-End Flow

### Scrape Flow

The frontend sends a POST request to `/api/articles/scrape`. Laravel forwards the request to the Node `/scrape` endpoint. Scraped articles are saved as original versions, and the cache is cleared.

### Enhance Flow

The frontend sends a POST request to `/api/articles/{id}/enhance`. Laravel sends the full article to the Node `/enhance` endpoint. The Node pipeline performs Google search, reference scraping, AI enhancement, and HTML formatting. Laravel saves the enhanced article as a new row with `version` set to `enhanced` and `parent_id` pointing to the original article.

### List Flow

The frontend requests `GET /api/articles`. The response is cached for five minutes and displayed in the UI.

### Download Flow

The frontend requests `GET /api/articles/{id}/download`. Laravel streams a TXT file containing the article content and metadata.

## Environment Configuration

### Backend (.env)

```env
APP_ENV=production
APP_KEY=generate_with_artisan
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=your_db
DB_USERNAME=your_user
DB_PASSWORD=your_pass
DB_SSLMODE=require
```

### LLM Pipeline (.env)

```env
OPENAI_API_KEY=sk-...
SERPAPI_KEY=your_serpapi_key_here
LLM_MODEL=gpt-4o-mini
PORT=3000
```

### Frontend (.env.production)

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Local Development Setup

### Backend Setup

1. Install dependencies
2. Generate the application key
3. Run migrations
4. Start the Laravel server

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

### LLM Pipeline Setup

1. Install dependencies
2. Run the Node server

```bash
cd llm-pipeline
cp .env.example .env
npm install
node src/api/scraper.api.js
```

### Frontend Setup

1. Install dependencies
2. Run the Vite development server

```bash
cd frontend
cp .env.example .env
npm install
npm run dev -- --host --port 5173
```

## Production Deployment

### Backend Deployment

- Run `composer install --no-dev`
- Run `php artisan migrate --force`
- Cache config/routes/views
- Serve via Nginx + PHP-FPM
- Point root to `backend/public`

### LLM Pipeline Deployment

- Run `npm install --production`
- Run `node src/api/scraper.api.js` under PM2/systemd
- Reverse proxy `http://127.0.0.1:3000` via Nginx

### Frontend Deployment

- Run `npm run build`
- Serve `frontend/dist` as static via Nginx
- Use `try_files $uri /index.html` for SPA routing

### SSL Configuration

Use Certbot with Nginx for:
- `app.yourdomain.com`
- `api.yourdomain.com`
- `llm.yourdomain.com` (optional)

### Environment Wiring

- Frontend `VITE_API_BASE_URL` → API domain
- Laravel `APP_URL` and CORS allow frontend origin
- LLM `.env` with OpenAI/SerpAPI keys

## Production Notes

- **Article listing responses are cached for 300 seconds**. Cache is cleared on create, update, delete, scrape, and enhance operations.
- **Puppeteer scraping is optimized** by blocking images and fonts.
- **Google search falls back to realistic mock data** if SerpAPI is unavailable.
- **The formatter produces clean, structured, and readable HTML** suitable for display.

## Using Supabase Postgres

Supabase provides a managed Postgres connection string like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.qhtpfbqbdplvrcnboqjq.supabase.co:5432/postgres
```

Set these in `backend/.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=db.qhtpfbqbdplvrcnboqjq.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=YOUR-PASSWORD
DB_SSLMODE=require
```

Run migrations:
```bash
cd backend
php artisan migrate --force
```

Import existing data:
```bash
pg_dump -h localhost -U local_user -d local_db -Fc -f backup.dump
pg_restore -h db.qhtpfbqbdplvrcnboqjq.supabase.co -U postgres -d postgres --no-owner --no-privileges backup.dump
```

## Smoke Tests

```bash
# List articles
GET http://localhost:8000/api/articles

# Scrape articles
POST http://localhost:8000/api/articles/scrape

# Enhance article
POST http://localhost:8000/api/articles/1/enhance
```

Or use curl:
```bash
curl http://localhost:8000/api/articles
curl -X POST http://localhost:8000/api/articles/scrape -H "Content-Type: application/json" -d '{"count":2,"url":"https://beyondchats.com/blogs/"}'
curl -X POST http://localhost:8000/api/articles/1/enhance
```

## Final Notes

This project emphasizes clean architecture, safe data versioning, realistic AI integration, and production-style workflows. All design choices are intentional and aligned with real-world system design principles.
