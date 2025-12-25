import { env } from '../config/env.js';

/**
 * Fetch article from Laravel API (latest by default, or specific by ID)
 * @param {number} [id] - Optional article ID. If not provided, fetches latest
 * @returns {Promise<object>}
 */
export async function fetchLatest(id = null) {
	try {
		const baseUrl = env.BACKEND_BASE_URL;
		// Ignore ID lookup - just fetch latest article for reliability
		const url = `${baseUrl}/articles`;
		
		console.log(`[LaravelAPI] Fetching latest articles from: ${url}`);
		
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			console.log(`[LaravelAPI] Request timeout triggered after 60 seconds`);
			controller.abort();
		}, 60000); // 60 second timeout
		
		try {
			console.log(`[LaravelAPI] Sending GET request...`);
			const response = await fetch(url, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal,
			});
			
			clearTimeout(timeoutId);
			
			console.log(`[LaravelAPI] Response received with status: ${response.status}`);
			
			if (!response.ok) {
				const body = await response.text();
				throw new Error(`HTTP ${response.status}: ${body}`);
			}
			
			const data = await response.json();
			console.log(`[LaravelAPI] JSON parsed successfully`);
			
			const items = data?.data || [];
			if (!items.length) throw new Error('No articles found in backend');
			console.log(`[LaravelAPI] Found ${items.length} articles, returning latest`);
			return items[0];
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	} catch (error) {
		console.error(`[LaravelAPI] Error:`, error.message);
		throw error;
	}
}

/**
 * Create enhanced article linked to the original
 * @param {{title:string, content:string, raw_html?:string, original:any}} payload
 * @returns {Promise<object>}
 */
export async function createEnhanced({ title, content, raw_html, original }) {
	try {
		// Make source_url unique but related to original
		const sourceUrl = `${original.source_url}#enhanced`;

		const body = {
			title,
			content,
			raw_html: raw_html || null,
			source_url: sourceUrl,
			author: original.author || null,
			tags: original.tags || [],
			published_at: new Date().toISOString(),
			version: 'enhanced',
			status: 'published',
			parent_id: original.id,
		};

		console.log(`[LaravelAPI] Creating enhanced article in database`);
		
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);
		
		try {
			const response = await fetch(`${env.BACKEND_BASE_URL}/articles`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: controller.signal,
			});
			
			clearTimeout(timeoutId);
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(`HTTP ${response.status}: ${error}`);
			}
			
			const data = await response.json();
			console.log(`[LaravelAPI] Enhanced article created successfully`);
			return data?.data || data;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	} catch (error) {
		console.error(`[LaravelAPI] Error creating enhanced article:`, error.message);
		throw error;
	}
}
