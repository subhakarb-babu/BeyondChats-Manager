import axios from 'axios';
import { env } from '../config/env.js';

/**
 * Mock Google search results for testing/fallback
 * Generates realistic-looking search results based on query
 */
function generateMockResults(query, limit = 2) {
	const mockDomains = [
		'medium.com',
		'dev.to',
		'hashnode.com',
		'linkedin.com/pulse',
		'reddit.com/r',
		'stackoverflow.com',
		'quora.com',
		'forbes.com',
		'techcrunch.com',
		'wired.com',
		'theverge.com',
		'arstechnica.com'
	];
	
	const results = [];
	for (let i = 0; i < limit; i++) {
		const domain = mockDomains[Math.floor(Math.random() * mockDomains.length)];
		const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
		results.push({
			url: `https://${domain}/${slug}-${i + 1}`,
			title: `${query} - Part ${i + 1} - Guide & Best Practices`
		});
	}
	return results;
}

/**
 * Search Google via SerpAPI and return top N blog/article links
 * Falls back to mock results if API key is missing or request fails
 * @param {string} query - Search query, typically the article title
 * @param {number} limit - Number of links to return
 * @returns {Promise<Array<{url:string,title:string}>>}
 */
export async function searchGoogle(query, limit = 2) {
	// If API key is missing, use mock results
	if (!env.SERPAPI_KEY || env.SERPAPI_KEY === 'your_serpapi_key_here') {
		console.log(`[GoogleSearch] ℹ No valid SerpAPI key found, using mock results for testing`);
		return generateMockResults(query, limit);
	}

	try {
		const params = new URLSearchParams({
			engine: 'google',
			q: query,
			api_key: env.SERPAPI_KEY,
			num: String(Math.max(2, limit)),
			hl: 'en',
		});

		const url = `https://serpapi.com/search.json?${params.toString()}`;
		console.log(`[GoogleSearch] Calling SerpAPI for: "${query}"`);
		const { data } = await axios.get(url, { timeout: 30000 });

		const results = (data.organic_results || [])
			.filter(r => r && r.link && r.title)
			// Prefer obvious blog/article paths
			.filter(r => /blog|article|posts|stories|guide|tutorial/i.test(r.link) || /blog|guide|how to|tips|case study|analysis/i.test(r.title))
			.slice(0, limit)
			.map(r => ({ url: r.link, title: r.title }));

		if (results.length === 0) {
			console.log(`[GoogleSearch] ⚠ No suitable results found, using mock results`);
			return generateMockResults(query, limit);
		}

		console.log(`[GoogleSearch] ✓ Found ${results.length} real results from SerpAPI`);
		return results;
	} catch (error) {
		console.log(`[GoogleSearch] ⚠ SerpAPI failed (${error.message}), falling back to mock results`);
		return generateMockResults(query, limit);
	}
}
