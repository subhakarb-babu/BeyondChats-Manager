import dotenv from 'dotenv';

// Load environment variables from .env at project root
dotenv.config();

export const env = {
	...process.env,
	BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || process.env.LARAVEL_API_URL || 'http://localhost:8000/api',
	SERPAPI_KEY: process.env.SERPAPI_KEY || process.env.SERP_API_KEY || '',
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
	LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
};
