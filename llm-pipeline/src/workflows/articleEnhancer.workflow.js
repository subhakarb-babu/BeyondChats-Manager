import { fetchLatest, createEnhanced } from '../services/laravelApi.service.js';
import { searchGoogle } from '../services/googleSearch.service.js';
import { scrape } from '../services/scraper.service.js';
import { enhance } from '../services/llm.service.js';
import { formatEnhancedContent } from '../services/contentFormatter.service.js';

export async function run(originalArticle = null, articleId = null) {
	let original;
	
	if (originalArticle) {
		console.log(`[Workflow] Step 1: Using provided article data`);
		original = originalArticle;
	} else {
		console.log(`[Workflow] Step 1: Fetching latest article from database`);
		original = await fetchLatest();
	}
	
	console.log(`[Workflow] ✓ Article ready: "${original.title}" (ID: ${original.id})`);
	
	const searchQuery = original.title || 'technology trends';
	console.log(`[Workflow] Search query: "${searchQuery}"`);

	console.log(`[Workflow] Step 2: Searching Google for "${searchQuery}"`);
	let referenceLinks = [];
	try {
		referenceLinks = await searchGoogle(searchQuery, 2);
		console.log(`[Workflow] ✓ Found ${referenceLinks.length} potential references`);
	} catch (error) {
		console.log(`[Workflow] ⚠ Google search failed, will use original article: ${error.message}`);
		if (original.source_url) {
			referenceLinks = [{ url: original.source_url, title: original.title || 'Source' }];
		} else {
			throw error;
		}
	}

	console.log(`[Workflow] Step 3: Scraping ${referenceLinks.length} reference article(s)`);
	const references = [];
	
	for (const { url, title } of referenceLinks) {
		try {
			console.log(`[Workflow] → Scraping: ${url}`);
			const { content } = await scrape(url);
			references.push({ url, title, content });
			console.log(`[Workflow] ✓ Successfully scraped (${content.length} chars)`);
		} catch (error) {
			console.log(`[Workflow] ⚠ Scrape failed for ${url}: ${error.message}`);
			if (url === original.source_url && original.content) {
				console.log(`[Workflow] ℹ Using original article as reference`);
				references.push({ url, title, content: original.content });
			}
		}
	}
	
	if (references.length < 1) {
		console.log(`[Workflow] ⚠ No references scraped, using original article`);
		references.push({
			url: original.source_url || 'original',
			title: original.title || 'Original Article',
			content: original.content
		});
	}
	console.log(`[Workflow] ✓ ${references.length} reference(s) prepared`);

	console.log(`[Workflow] Step 4: Calling OpenAI to enhance content`);
	const enhancedText = await enhance({ 
		originalText: original.content, 
		references 
	});
	console.log(`[Workflow] ✓ Content enhanced by LLM (${enhancedText.length} chars)`);

	console.log(`[Workflow] Step 5: Formatting enhanced content as HTML`);
	const formattedContent = formatEnhancedContent(enhancedText, references);
	console.log(`[Workflow] ✓ Content formatted with professional styling (${formattedContent.length} chars)`);

	console.log(`[Workflow] Step 6: Returning enhanced article to backend`);
	const enhancedTitle = `${original.title} (Enhanced)`;

	return {
		success: true,
		original: { id: original.id, title: original.title },
		references: references.map(r => ({ url: r.url, title: r.title })),
		enhanced: {
			id: original.id,
			title: enhancedTitle,
			content: formattedContent,
			source_url: `${original.source_url}#enhanced`,
			author: original.author,
		},
	};
}
