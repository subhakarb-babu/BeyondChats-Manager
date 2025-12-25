# BeyondChats Full Stack Assignment

Production-ready 3-tier system for scraping, managing, and AI-enhancing articles.

## Architecture Overview
- **Frontend (React + Vite)**: UI for scraping, browsing, enhancing, downloading articles. Talks to Laravel API via `VITE_API_BASE_URL`.
- **Backend (Laravel 11 / PHP 8.1+)**: REST API, validation, caching, persistence (PostgreSQL). Orchestrates scraping and AI enhancement by calling the Node service. Provides TXT downloads.
- **LLM Pipeline (Node + Express)**: `/scrape` (Puppeteer + Cheerio) and `/enhance` (Google search + scraping references + OpenAI enhancement + HTML formatting). Returns enhanced payload to Laravel.
- **Database**: PostgreSQL `articles` table with `version` (original/enhanced) and `parent_id` link to original.

## End-to-End Flow
1) **Scrape**
   - Frontend → `POST /api/articles/scrape` (count, url)
   - Laravel calls Node `/scrape`, saves originals (version=original), clears cache.
2) **Enhance**
   - Frontend → `POST /api/articles/{id}/enhance`
   - Laravel sends full article to Node `/enhance`
   - Node: Google search (SerpAPI or mock) → scrape refs → OpenAI enhance → format HTML → return
   - Laravel saves new article (version=enhanced, parent_id=original), clears cache.
3) **List**
   - Frontend → `GET /api/articles` (cached 5m) → grid + modal view.
4) **Download**
   - Frontend → `GET /api/articles/{id}/download` → Laravel streams TXT with metadata.

## Key Components
- Backend: `routes/api.php`, `app/Http/Controllers/ArticleController.php`, `app/Services/ArticleService.php`, `database/migrations/*create_articles_table.php`
- Frontend: `src/App.jsx`, `src/components/{ControlPanel,ArticleList,ArticleModal,ArticleCard}.jsx`, `src/api/article.api.js`
- LLM Pipeline: `src/api/scraper.api.js`, `src/workflows/articleEnhancer.workflow.js`, `src/services/{llm.service.js,googleSearch.service.js,scraper.service.js,contentFormatter.service.js}`

## Configuration (.env samples)
### Laravel `backend/.env`
```
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
```

### LLM Pipeline `llm-pipeline/.env`
```
OPENAI_API_KEY=sk-...
SERPAPI_KEY=your_serpapi_key_here   # leave blank to use mock results
LLM_MODEL=gpt-4o-mini
PORT=3000
```

### Frontend `frontend/.env.production`
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Setup & Run (dev)
1) Backend
```
cd backend
cp .env.example .env    # fill values
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```
2) LLM Pipeline
```
cd llm-pipeline
cp .env.example .env    # fill values
npm install
node src/api/scraper.api.js
```
3) Frontend
```
cd frontend
cp .env.example .env    # set VITE_API_BASE_URL
npm install
npm run dev -- --host --port 5173
```

## Production Deployment (outline)
- **Backend**: `composer install --no-dev`, `php artisan migrate --force`, cache config/routes/views, serve via Nginx + PHP-FPM, point root to `backend/public`.
- **LLM Pipeline**: `npm install --production`, run `node src/api/scraper.api.js` under PM2/systemd, reverse proxy `http://127.0.0.1:3000` via Nginx.
- **Frontend**: `npm run build`, serve `frontend/dist` as static via Nginx (`try_files $uri /index.html`).
- **TLS**: Use Certbot with Nginx for `app.yourdomain.com`, `api.yourdomain.com`, and optionally `llm.yourdomain.com`.
- **Env wiring**: Frontend `VITE_API_BASE_URL` → API domain; Laravel `APP_URL` and CORS allow frontend origin; LLM `.env` with OpenAI/SerpAPI keys.

## Operational Notes
- Caching: `GET /api/articles` cached 300s; cache cleared on create/update/delete/scrape/enhance.
- Enhanced articles are new rows with `version='enhanced'` and `parent_id` pointing to the original.
- Scraper optimizes Puppeteer: blocks images/fonts, supports pagination fallback, and falls back to paragraph extraction.
- Google search uses SerpAPI; falls back to realistic mock results when key is missing/invalid.
- Formatter outputs styled HTML (headings, paragraphs, lists, references with orange accent).

## Quick Smoke Tests
- List: `curl http://localhost:8000/api/articles`
- Scrape: `curl -X POST http://localhost:8000/api/articles/scrape -H "Content-Type: application/json" -d '{"count":2,"url":"https://beyondchats.com/blogs/"}'`
- Enhance: `curl -X POST http://localhost:8000/api/articles/1/enhance`
- Frontend: open Vite dev server; enhance an article and filter by enhanced.
