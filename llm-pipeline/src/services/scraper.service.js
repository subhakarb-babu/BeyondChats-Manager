import puppeteer from 'puppeteer';
import { load as loadHtml } from 'cheerio';

/**
 * Scrape article content from a given URL
 * Uses Puppeteer for browser automation and Cheerio for HTML parsing
 * Optimized to skip images/stylesheets for faster loading
 * 
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} Object with url, title, and content
 * @throws {Error} If content cannot be extracted or is too short
 */
export async function scrape(url) {
	const browser = await puppeteer.launch({ headless: 'new' });
	try {
		const page = await browser.newPage();
		
		// Block unnecessary resources to speed up page load
		await page.setRequestInterception(true);
		page.on('request', req => {
			const resourceType = req.resourceType();
			if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
				req.abort(); // Skip loading images, CSS, fonts to save bandwidth
			} else {
				req.continue();
			}
		});

		// Navigate to the page and wait for DOM content
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
		const html = await page.content();
		const $ = loadHtml(html);

		// Extract title from page
		const title = $('h1').first().text().trim() || $('title').text().trim();

		// Common CSS selectors for article content across different blog platforms
		const articleSelectors = [
			'article',                    // Semantic HTML
			'main',                       // Main content area
			'.entry-content',             // WordPress
			'.post-content',              // Generic blog
			'#content',                   // Common ID
			'[role="main"]',              // ARIA role
			'.wp-content',                // WordPress content
			'.content',                   // Generic content container
			'.article-body',              // Custom blogs
			'div[class*="content"]',      // Class containing "content"
		];

		// Try to find article content using multiple selectors
		let content = '';
		for (const selector of articleSelectors) {
			const element = $(selector).first();
			if (element && element.length) {
				content = element.text();
				if (content.length > 200) break; // Found substantial content
			}
		}
		
		// Fallback: extract all paragraph text if container not found
		if (!content || content.length < 100) {
			content = $('p')
				.map((index, el) => $(el).text())
				.get()
				.join(' ');
		}
		
		// Final fallback: use entire body text
		if (!content || content.length < 100) {
			content = $('body').text();
		}

		// Normalize whitespace
		content = content.replace(/\s+/g, ' ').trim();

		// Validate minimum content length
		if (content.length < 100) {
			throw new Error(`Insufficient content extracted (${content.length} chars, minimum 100 required)`);
		}

		return { url, title, content };
		
	} finally {
		await browser.close();
	}
}
