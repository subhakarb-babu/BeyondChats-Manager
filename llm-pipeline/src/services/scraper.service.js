import puppeteer from 'puppeteer';
import { load as loadHtml } from 'cheerio';

export async function scrape(url) {
	console.log('[Scraper::scrape] Starting', { url });
	const disablePuppeteer = process.env.DISABLE_PUPPETEER === 'true';
	console.log('[Scraper::scrape] DISABLE_PUPPETEER:', disablePuppeteer);
	
	let html;
	let $;
	let browser;
	
	try {
		if (!disablePuppeteer) {
			console.log('[Scraper::scrape] Launching Puppeteer browser');
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
			console.log('[Scraper::scrape] Browser launched successfully');
			
			const page = await browser.newPage();
			console.log('[Scraper::scrape] Page created');
			
			// Block unnecessary resources to speed up page load
			await page.setRequestInterception(true);
			page.on('request', req => {
				const resourceType = req.resourceType();
				if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
				req.abort();
				} else {
					req.continue();
				}
			});
			
			console.log('[Scraper::scrape] Navigating to URL', { url });

			console.log('[Scraper::scrape] Page loaded');
			
			html = await page.content();
			$ = loadHtml(html);
			console.log('[Scraper::scrape] HTML parsed with cheerio');
		} else {
			console.log('[Scraper::scrape] DISABLE_PUPPETEER is true, using fetch + cheerio');
			const resp = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				}
			});
			console.log('[Scraper::scrape] Fetch completed', { status: resp.status });
			html = await resp.text();
			$ = loadHtml(html);
		}

		const title = $('h1').first().text().trim() || $('title').text().trim();
		console.log('[Scraper::scrape] Title extracted:', { title });

		const articleSelectors = [
			'article',
			'main',
			'.entry-content',
			'.post-content',
			'#content',
			'[role="main"]',
			'.wp-content',
			'.content',
			'.article-body',
			'div[class*="content"]',
		];

		// Try to find article content using multiple selectors
		// Try to find article content using multiple selectors
		let content = '';
		for (const selector of articleSelectors) {
			const element = $(selector).first();
			if (element && element.length) {
				content = element.text();
				console.log('[Scraper::scrape] Content found with selector', { selector, contentLength: content.length });
				if (content.length > 200) break;
			}
		}
		
		if (!content || content.length < 100) {
			console.log('[Scraper::scrape] Fallback to paragraphs');
			content = $('p')
				.map((index, el) => $(el).text())
				.get()
				.join(' ');
		}
		
		if (!content || content.length < 100) {
			console.log('[Scraper::scrape] Final fallback to body');
			content = $('body').text();
		}

		// Normalize whitespace
		// Normalize whitespace
		content = content.replace(/\s+/g, ' ').trim();
		console.log('[Scraper::scrape] Content normalized', { contentLength: content.length });

		if (content.length < 100) {
			console.error('[Scraper::scrape] Insufficient content', { contentLength: content.length, required: 100 });
			throw new Error(`Insufficient content extracted (${content.length} chars, minimum 100 required)`);
		}

		console.log('[Scraper::scrape] Success', { url, titleLength: title.length, contentLength: content.length });
		return { url, title, content };
		
	} catch (err) {
		console.error('[Scraper::scrape] Error', { error: err.message, stack: err.stack });
		if (!disablePuppeteer) {
			console.log('[Scraper::scrape] Attempting fetch+cheerio fallback after Puppeteer error');
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
				if (content.length < 100) {
					console.error('[Scraper::scrape] Fallback insufficient content', { contentLength: content.length });
					throw new Error('Insufficient content in fallback');
				}
				console.log('[Scraper::scrape] Fallback success', { url, titleLength: title.length, contentLength: content.length });
				return { url, title, content };
			} catch (fallbackErr) {
				console.error('[Scraper::scrape] Fallback failed', { error: fallbackErr.message });
				throw fallbackErr;
			}
		}
		throw err;
	} finally {
		try { if (browser) { console.log('[Scraper::scrape] Closing browser'); await browser.close(); console.log('[Scraper::scrape] Browser closed'); } } catch (_) {}
	}
}
