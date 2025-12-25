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
	const disablePuppeteer = process.env.DISABLE_PUPPETEER === 'true';
	let html;
	let $;
	let browser;
    
	try {
		if (!disablePuppeteer) {
			browser = await puppeteer.launch({
				headless: true,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--disable-gpu'
				]
			});
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
			html = await page.content();
			$ = loadHtml(html);
		} else {
			// Fallback: use fetch + cheerio (no headless browser)
			const resp = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				}
			});
			html = await resp.text();
			$ = loadHtml(html);
		}

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
        
	} catch (err) {
		// If puppeteer failed, fallback to fetch + cheerio
		if (!disablePuppeteer) {
			try {
				const resp = await fetch(url, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
					}
				});
				const text = await resp.text();
				const _$ = loadHtml(text);
				const title = _$('h1').first().text().trim() || _$('title').text().trim();
				let content = _$('article, main, .entry-content, .post-content, #content, [role="main"], .wp-content, .content, .article-body, div[class*="content"]').first().text();
				if (!content || content.length < 100) {
					content = _$('p').map((i, el) => _$(el).text()).get().join(' ');
				}
				content = content.replace(/\s+/g, ' ').trim();
				if (content.length < 100) throw new Error('Insufficient content in fallback');
				return { url, title, content };
			} catch (fallbackErr) {
				throw fallbackErr;
			}
		}
		throw err;
	} finally {
		try { if (browser) await browser.close(); } catch (_) {}
	}
}
