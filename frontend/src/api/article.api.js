/**
 * Article API Service
 * 
 * Client-side API client for communicating with Laravel backend
 * Handles all CRUD operations and special actions on articles
 */

const DEFAULT_PROD = 'https://backend-production-5198.up.railway.app/api';
const DEFAULT_DEV = 'http://localhost:8000/api';
const isLocalHost = typeof window !== 'undefined' && (
	window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1'
);

const BASE_URL =
	import.meta?.env?.VITE_API_URL ||
	import.meta?.env?.VITE_API_BASE_URL ||
	(isLocalHost ? DEFAULT_DEV : DEFAULT_PROD);

/**
 * Fetch all articles from backend
 * @returns {Promise<Array>} Array of article objects
 */
export async function getArticles() {
	const res = await fetch(`${BASE_URL}/articles`);
	if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);
	const json = await res.json();
	return json?.data || [];
}

/**
 * Get a single article by ID
 * @param {number} id - Article ID
 * @returns {Promise<Object>} Article object
 */
export async function getArticle(id) {
	const res = await fetch(`${BASE_URL}/articles/${id}`);
	if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

/**
 * Create a new article
 * @param {Object} data - Article data
 * @returns {Promise<Object>} Created article object
 */
export async function createArticle(data) {
	const res = await fetch(`${BASE_URL}/articles`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(`Failed to create article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

/**
 * Update an existing article
 * @param {number} id - Article ID
 * @param {Object} data - Updated article data
 * @returns {Promise<Object>} Updated article object
 */
export async function updateArticle(id, data) {
	const res = await fetch(`${BASE_URL}/articles/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(`Failed to update article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

/**
 * Delete an article by ID
 * @param {number} id - Article ID
 * @returns {Promise<Object>} Deletion response
 */
export async function deleteArticle(id) {
	const res = await fetch(`${BASE_URL}/articles/${id}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error(`Failed to delete article: ${res.status}`);
	const json = await res.json();
	return json;
}

/**
 * Scrape articles from a URL and save to database
 * Communicates with Node.js scraper service via Laravel backend
 * 
 * @param {number} count - Number of articles to scrape
 * @param {string} url - Website URL to scrape from
 * @returns {Promise<Object>} Scraping result with count and details
 */
export async function scrapeArticles(count = 5, url = 'https://beyondchats.com/blogs/') {
	const res = await fetch(`${BASE_URL}/articles/scrape`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ count, url }),
	});
	if (!res.ok) throw new Error(`Failed to scrape articles: ${res.status}`);
	const json = await res.json();
	return json;
}

/**
 * Download article as plain text file
 * Opens download in new window/tab
 * 
 * @param {number} id - Article ID
 */
export function downloadArticle(id) {
	window.open(`${BASE_URL}/articles/${id}/download`, '_blank');
}

/**
 * Enhance an article using AI
 * Triggers complete enhancement pipeline:
 * 1. Google search for related articles
 * 2. Web scraping of references
 * 3. OpenAI LLM enhancement
 * 4. Professional HTML formatting
 * Creates new enhanced article linked via parent_id
 * 
 * @param {number} id - Article ID to enhance
 * @returns {Promise<Object>} New enhanced article data
 */
export async function enhanceArticle(id) {
	const res = await fetch(`${BASE_URL}/articles/${id}/enhance`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) throw new Error(`Failed to enhance article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

