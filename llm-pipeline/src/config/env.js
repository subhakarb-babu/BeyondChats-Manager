import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory (3 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

// Load environment variables from root .env file
dotenv.config({ path: path.join(rootDir, '.env') });

export const env = {
	...process.env,
	BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || process.env.LARAVEL_API_URL || 'http://localhost:8000/api',
	SERPAPI_KEY: process.env.SERPAPI_KEY || process.env.SERP_API_KEY || '',
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
	LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
};
