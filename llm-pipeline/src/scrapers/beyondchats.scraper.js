import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

/**
 * Scrape one article from BeyondChats blog
 */
async function scrapeOneArticle() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();
    
    console.log('Navigating to BeyondChats blogs...');
    await page.goto('https://beyondchats.com/blogs/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Page loaded, extracting content...');
    
    // Get the page HTML
    const html = await page.content();
    const $ = cheerio.load(html);

    // Try to find article cards or links
    console.log('\n=== Analyzing page structure ===');
    
    // Look for common article selectors
    const articleSelectors = [
      'article',
      '.blog-post',
      '.post',
      '.card',
      'a[href*="blog"]',
      'a[href*="article"]',
    ];

    let foundArticles = false;
    for (const selector of articleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        foundArticles = true;
        
        // Get the first article
        const firstElement = elements.first();
        console.log('\nFirst article HTML preview:');
        console.log(firstElement.html()?.substring(0, 500));
        
        // Try to extract link
        const link = firstElement.attr('href') || firstElement.find('a').attr('href');
        if (link) {
          console.log('\nArticle link found:', link);
          
          // Navigate to the article page
          const fullUrl = link.startsWith('http') ? link : `https://beyondchats.com${link}`;
          console.log(`\nNavigating to article: ${fullUrl}`);
          
          await page.goto(fullUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Get article content
          const articleHtml = await page.content();
          const $article = cheerio.load(articleHtml);
          
          // Extract title
          const title = $article('h1').first().text().trim() || 
                       $article('title').text().trim() ||
                       $article('.title').first().text().trim();
          
          // Extract content - try multiple selectors
          const contentSelectors = ['article', '.content', '.post-content', '.blog-content', 'main', '.main'];
          let content = '';
          
          for (const contentSelector of contentSelectors) {
            const contentElement = $article(contentSelector).first();
            if (contentElement.length > 0) {
              // Remove script and style tags
              contentElement.find('script, style, nav, header, footer').remove();
              content = contentElement.text().trim();
              if (content.length > 100) {
                console.log(`\nExtracted content using selector: ${contentSelector}`);
                break;
              }
            }
          }
          
          // If no content found, get all paragraph text
          if (!content || content.length < 100) {
            content = $article('p').map((i, el) => $article(el).text()).get().join('\n\n').trim();
          }
          
          const article = {
            title,
            content: content.substring(0, 1000), // First 1000 chars for preview
            source_url: fullUrl,
            fullContentLength: content.length
          };
          
          console.log('\n=== EXTRACTED ARTICLE ===');
          console.log('Title:', article.title);
          console.log('URL:', article.source_url);
          console.log('Content Length:', article.fullContentLength, 'characters');
          console.log('\nContent Preview (first 500 chars):');
          console.log(article.content.substring(0, 500));
          
          return article;
        }
      }
    }

    if (!foundArticles) {
      console.log('No articles found with standard selectors. Dumping page structure...');
      console.log('Body preview:', $('body').html()?.substring(0, 1000));
    }

  } catch (error) {
    console.error('Error scraping article:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if executed directly
scrapeOneArticle()
  .then(() => {
    console.log('\nScraping completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScraping failed:', error);
    process.exit(1);
  });

export { scrapeOneArticle };
