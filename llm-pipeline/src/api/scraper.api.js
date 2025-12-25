import express from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { run as runArticleEnhancer } from '../workflows/articleEnhancer.workflow.js';

const app = express();
app.use(express.json());

// Browser instance cache for reuse
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
}

async function scrapeArticles(url, count = 5, oldest = false) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Optimize page loading
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // If fetching oldest, try to jump to the last pagination page
    if (oldest) {
      try {
        const listHtml = await page.content();
        const $list = cheerio.load(listHtml);
        // Common WP pagination selectors
        const pageLinks = $list('a.page-numbers')
          .map((i, el) => $list(el).text().trim())
          .get()
          .filter(t => /^\d+$/.test(t))
          .map(n => parseInt(n, 10));

        const maxPage = pageLinks.length ? Math.max(...pageLinks) : null;
        if (maxPage && maxPage > 1) {
          const lastUrl = url.replace(/\/?$/, '/') + `page/${maxPage}/`;
          await page.goto(lastUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }
      } catch (_) {
        // ignore pagination detection failures; proceed on current page
      }
    }

    await page.waitForSelector('article', { timeout: 10000 });

    const html = await page.content();
    const $ = cheerio.load(html);
    
    const articles = [];
    const articleElements = $('article').slice(0, count);
    
    for (let i = 0; i < articleElements.length && articles.length < count; i++) {
      try {
        const element = articleElements.eq(i);
        const link = element.find('a').attr('href') || element.attr('href');
        
        if (!link) continue;
        
        const fullUrl = link.startsWith('http') ? link : `https://beyondchats.com${link}`;
        
        console.log(`[${i + 1}/${count}] Scraping: ${fullUrl}`);
        
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('h1, .entry-title', { timeout: 5000 });
        
        const articleHtml = await page.content();
        const $article = cheerio.load(articleHtml);
        
        // Extract title with fallbacks
        const title = $article('h1').first().text().trim() || 
                     $article('.entry-title').first().text().trim() ||
                     $article('title').text().replace(/\s*[|–-].*$/, '').trim() ||
                     'Untitled';
        
        // Extract author
        const author = $article('.author').first().text().trim() ||
                      $article('[rel="author"]').first().text().trim() ||
                      $article('.entry-author').first().text().trim() ||
                      null;
        
        // Extract published date
        const publishedAt = $article('time').first().attr('datetime') ||
                           $article('.published').first().attr('datetime') ||
                           $article('.entry-date').first().text().trim() ||
                           null;
        
        // Extract content efficiently
        const contentSelectors = [
          'article .entry-content',
          '.post-content',
          'article',
          'main'
        ];
        
        let content = '';
        let rawHtml = '';
        
        for (const selector of contentSelectors) {
          const contentElement = $article(selector).first();
          if (contentElement.length > 0) {
            const clonedElement = contentElement.clone();
            clonedElement.find('script, style, nav, header, footer, .comments, .sidebar, .related, .share').remove();
            rawHtml = clonedElement.html();
            content = clonedElement.text()
              .replace(/\s+/g, ' ')
              .replace(/\n\s*\n/g, '\n\n')
              .trim();
            if (content.length > 200) {
              break;
            }
          }
        }
        
        // Fallback to paragraphs
        if (!content || content.length < 200) {
          content = $article('p')
            .map((i, el) => $article(el).text().trim())
            .get()
            .filter(text => text.length > 20)
            .join('\n\n');
        }
        
        if (!content) {
          console.warn(`[${i + 1}] No content found for ${fullUrl}`);
          continue;
        }
        
        articles.push({
          title,
          content: content, // Raw content - formatting happens in enhancement
          raw_html: rawHtml,
          source_url: fullUrl,
          author,
          published_at: publishedAt
        });
        
        console.log(`[${i + 1}] ✓ Scraped & Formatted: "${title.substring(0, 50)}..."`);
        
      } catch (error) {
        console.error(`[${i + 1}] ✗ Failed:`, error.message);
      }
    }
    
    await page.close();
    return articles;
    
  } catch (error) {
    await page.close();
    throw error;
  }
}

// Fallback scraper using fetch + cheerio (no headless browser)
async function scrapeArticlesCheerio(url, count = 5, oldest = false) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = [];
  $('article a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('http')) links.push(href);
    if (links.length >= count) return false;
  });
  const picked = links.slice(0, count);
  const out = [];
  for (const fullUrl of picked) {
    try {
      const ar = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const articleHtml = await ar.text();
      const $article = cheerio.load(articleHtml);
      const title = $article('h1').first().text().trim() || $article('title').text().trim() || 'Untitled';
      const author = $article('.author, [rel="author"], .entry-author').first().text().trim() || null;
      const publishedAt = $article('time').first().attr('datetime') || $article('.published').first().attr('datetime') || $article('.entry-date').first().text().trim() || null;
      let content = $article('article .entry-content, .post-content, article, main').first().text().replace(/\s+/g, ' ').trim();
      if (!content || content.length < 200) {
        content = $article('p').map((i, el) => $article(el).text().trim()).get().filter(t => t.length > 20).join('\n\n');
      }
      out.push({ title, content, raw_html: null, source_url: fullUrl, author, published_at: publishedAt });
    } catch (_) {
      // skip failures
    }
  }
  return out;
}

app.post('/scrape', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url = 'https://beyondchats.com/blogs/', count = 5 } = req.body;
    
    if (count < 1 || count > 50) {
      console.error('[Scrape] Invalid count:', count);
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 50'
      });
    }
    
    console.log(`\n━━━ Scraping Started ━━━`);
    console.log(`URL: ${url}`);
    console.log(`Count: ${count}`);
    console.log(`Body received: ${JSON.stringify(req.body)}\n`);
    
    let articles;
    try {
      articles = await scrapeArticles(url, count, !!req.body.oldest);
    } catch (err) {
      console.error(`[Scrape] Puppeteer failed, falling back: ${err.message}`);
      articles = await scrapeArticlesCheerio(url, count, !!req.body.oldest);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n━━━ Scraping Completed ━━━`);
    console.log(`Articles: ${articles.length}/${count}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Returning ${articles.length} articles\n`);
    
    res.json({
      success: true,
      articles,
      count: articles.length,
      duration: `${duration}s`
    });
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n━━━ Scraping Failed ━━━`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Duration: ${duration}s\n`);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

app.post('/enhance', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('\n━━━ Article Enhancement Started ━━━');
    
    const { article, articleId } = req.body;
    console.log('[Enhance] Request body:', { hasArticle: !!article, articleId, articleTitle: article?.title });
    
    // If article data is provided, use it directly; otherwise fetch by ID
    let enhanceResult;
    if (article) {
      console.log(`[Enhance] Using provided article data: "${article.title}"`);
      console.log('[Enhance] Calling articleEnhancer workflow');
      enhanceResult = await runArticleEnhancer(article);
      console.log('[Enhance] Workflow returned:', { success: enhanceResult.success, hasEnhanced: !!enhanceResult.enhanced });
    } else {
      console.log(`[Enhance] Fetching article by ID: ${articleId}`);
      enhanceResult = await runArticleEnhancer(null, articleId);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('━━━ Article Enhancement Completed ━━━');
    console.log(`Duration: ${duration}s`);
    console.log(`Enhanced ID: ${enhanceResult.enhanced?.id || 'N/A'}\n`);
    
    res.json({
      success: true,
      ...enhanceResult,
      duration: `${duration}s`
    });
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n━━━ Article Enhancement Failed ━━━');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Duration: ${duration}s\n`);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'scraper',
    browser: browserInstance ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browser...');
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Scraper API ready on port ${PORT}`);
  console.log(`   Health: /health | Scrape: POST /scrape | Enhance: POST /enhance`);
  console.log(`${'='.repeat(50)}\n`);
});
