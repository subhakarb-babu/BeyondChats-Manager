import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the project root directory (3 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const llmDir = path.resolve(__dirname, '../../');

// Try to load from root .env first (monorepo), then fallback to llm-pipeline/.env
const rootEnvPath = path.join(rootDir, '.env');
const llmEnvPath = path.join(llmDir, '.env');

if (fs.existsSync(rootEnvPath)) {
	console.log('[ENV] Loading from root .env');
	dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(llmEnvPath)) {
	console.log('[ENV] Loading from llm-pipeline/.env');
	dotenv.config({ path: llmEnvPath });
}

export const env = {
	...process.env,
	BACKEND_BASE_URL:
		process.env.BACKEND_BASE_URL ||
		process.env.LARAVEL_API_URL ||
		(process.env.NODE_ENV === 'production'
			? 'https://backend-production-5198.up.railway.app/api'
			: 'http://localhost:8000/api'),
	SERPAPI_KEY: process.env.SERPAPI_KEY || process.env.SERP_API_KEY || '',
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
	LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
	PORT: process.env.PORT || '3000',
};
