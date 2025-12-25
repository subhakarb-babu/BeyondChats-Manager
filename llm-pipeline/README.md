# LLM Enhancement Pipeline

This pipeline enhances the latest article from the Laravel backend by:

- Searching Google for the article title (via SerpAPI)
- Scraping the top 2 reference articles
- Calling OpenAI to improve formatting and content
- Publishing an enhanced version linked to the original (`parent_id`) and marking it as `enhanced` + `published`

## Requirements

- Node.js 18+
- Laravel backend running at `http://localhost:8000`
- PostgreSQL configured for the backend (already done)

## Environment Variables

Create a `.env` file in the repository root (same level as `llm-pipeline/`) with:

```
# Backend API
BACKEND_BASE_URL=http://localhost:8000/api

# Google Search via SerpAPI
SERPAPI_KEY=your_serpapi_key

# OpenAI
OPENAI_API_KEY=your_openai_key
LLM_MODEL=gpt-4o-mini
```

## Install & Run

From the `llm-pipeline/` folder:

```bash
npm install
npm start
```

If keys are missing, the script will print helpful messages.

## Notes

- The enhanced article uses the original article's `source_url` with a `#enhanced` suffix to satisfy the unique URL validation.
- References are appended to the end of the enhanced content as a simple list.
