# BeyondChats Article Manager - Frontend

Modern React frontend for managing, scraping, and viewing articles.

## Features

- 🚀 **Article Scraping**: Scrape articles from BeyondChats blog
- 📋 **Article Management**: View, download, and delete articles
- 🔍 **Article Details**: Click any article card to view full details
- 🎨 **Clean UI**: Minimal, organized interface with responsive design
- ⚡ **Real-time Updates**: Auto-refresh after scraping

## Tech Stack

- React 18
- Vite
- Vanilla CSS (no dependencies)
- Axios for API calls

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── article.api.js          # API service layer
│   ├── components/
│   │   ├── ArticleCard.jsx         # Article card with actions
│   │   ├── ArticleList.jsx         # Grid of articles
│   │   ├── ArticleModal.jsx        # Article detail modal
│   │   └── ControlPanel.jsx        # Scraper control panel
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
├── index.html
└── package.json
```

## Setup & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

## Environment Variables

Create `.env` file (optional):

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Default is `http://localhost:8000/api` if not specified.

## Usage

### 1. Scrape Articles
- Set number of articles (1-50)
- Enter source URL (default: beyondchats.com/blogs)
- Click "Start Scraping"
- Articles appear automatically after scraping

### 2. View Articles
- Browse articles in responsive grid
- Click any card to view full details
- See badges for version (original/enhanced) and status

### 3. Manage Articles
- **Download**: Get article as .txt file
- **Delete**: Remove article (with confirmation)
- **View Details**: Click card to open modal with metadata

## Components Overview

### ControlPanel
- Input fields for scraping configuration
- Handles scraping API calls
- Shows success/error messages
- Triggers article list refresh

### ArticleList
- Fetches articles from API
- Shows loading/error states
- Handles empty state
- Grid layout with responsive design

### ArticleCard
- Displays article preview
- Shows version & status badges
- Download & delete actions
- Opens detail modal on click

### ArticleModal
- Full article details
- All metadata (dates, author, source)
- Clean text content display
- Close on overlay click

## API Integration

All API calls go through `src/api/article.api.js`:

```javascript
getArticles()                    // GET /articles
getArticle(id)                   // GET /articles/{id}
scrapeArticles(count, url)       // POST /articles/scrape
deleteArticle(id)                // DELETE /articles/{id}
downloadArticle(id)              // GET /articles/{id}/download
```

## Build for Production

```bash
npm run build
```

Output: `dist/` directory
