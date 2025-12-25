<?php
namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * ArticleService
 * 
 * Handles all article operations including:
 * - Listing and retrieving articles
 * - Creating new articles from scraper data
 * - Managing article enhancement via LLM pipeline
 * - Cache management for performance
 */
class ArticleService {
	/**
	 * Retrieve all articles, ordered by most recent first
	 * 
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function list() {
		return Article::latest()->get();
	}
	
	/**
	 * Create a new article with provided data
	 * Automatically sets defaults and generates slug from title
	 * 
	 * @param array $data Article data (title, content, author, etc.)
	 * @return Article The created article model
	 */
	public function create(array $data) {
		// Set sensible defaults
		$data['status'] = $data['status'] ?? 'draft';
		$data['version'] = $data['version'] ?? 'original';
		$data['scraped_at'] = $data['scraped_at'] ?? now();
		
		// Generate URL-friendly slug from title
		if (!isset($data['slug']) && isset($data['title'])) {
			$data['slug'] = Str::slug($data['title']);
		}
		
		return Article::create($data);
	}
	
	/**
	 * Scrape articles from a given URL and save them to database
	 * Communicates with Node.js scraper service via HTTP
	 * Handles multi-page scraping and deduplication
	 * 
	 * @param string $url The website URL to scrape
	 * @param int $count Number of articles to extract
	 * @param bool $oldest Whether to scrape oldest articles first
	 * @return \Illuminate\Support\Collection Collection of saved articles
	 * @throws \Exception If scraper service fails or returns error
	 */
	public function scrapeAndStore(string $url, int $count = 5, bool $oldest = false) {
		try {
			// Allow longer runtime for scraping and AI formatting
			@set_time_limit(300); // 5 minutes

			// Call the Node.js scraper service with extended timeout
			$llmUrl = env('LLM_SERVICE_URL');
			if (!$llmUrl) {
				$llmUrl = app()->environment('production')
					? 'https://llm-production.up.railway.app'
					: 'http://localhost:3000';
			}
			$response = Http::timeout(240)
				->post("{$llmUrl}/scrape", [
					'url' => $url,
					'count' => $count,
					'oldest' => $oldest,
				]);
			
			if (!$response->successful()) {
				throw new \Exception('Scraper service error: ' . $response->body());
			}
			
			$scrapedArticles = $response->json('articles', []);
			$savedArticles = collect();
			
			// Process each scraped article
			foreach ($scrapedArticles as $articleData) {
				try {
					// Check if article already exists to prevent duplicates
					$existing = Article::where('source_url', $articleData['source_url'])->first();
					
					if ($existing) {
						Log::info('Article already exists', ['url' => $articleData['source_url']]);
						continue;
					}
					
					// Create and save the article
					$article = $this->create([
						'title' => $articleData['title'] ?? 'Untitled',
						'content' => $articleData['content'] ?? '',
						'raw_html' => $articleData['raw_html'] ?? null,
						'source_url' => $articleData['source_url'],
						'author' => $articleData['author'] ?? null,
						'published_at' => $articleData['published_at'] ?? null,
						'status' => 'published',
						'version' => 'original',
					]);
					
					$savedArticles->push($article);
					Log::info('Article saved', ['id' => $article->id, 'title' => $article->title]);
					
				} catch (\Exception $e) {
					Log::error('Failed to save article', [
						'url' => $articleData['source_url'] ?? 'unknown',
						'error' => $e->getMessage()
					]);
				}
			}
			
			return $savedArticles;
			
		} catch (\Exception $e) {
			Log::error('Scraping failed', ['error' => $e->getMessage()]);
			throw $e;
		}
	}

	/**
	 * Enhance an article using AI
	 * 
	 * Sends the article to the LLM enhancement pipeline which:
	 * 1. Searches Google for related articles
	 * 2. Scrapes reference materials
	 * 3. Uses OpenAI to enhance content with better structure and context
	 * 4. Formats output as professional HTML
	 * 
	 * The enhanced article is saved as a new record linked via parent_id
	 * 
	 * @param Article $article The article to enhance
	 * @return Article The newly created enhanced article
	 * @throws \Exception If enhancement service fails
	 */
	public function enhance(Article $article) {
		try {
			// Call the enhancement pipeline with complete article data
			// Passing data directly avoids Laravel API fetch hangs
			$llmUrl = env('LLM_SERVICE_URL');
			if (!$llmUrl) {
				$llmUrl = app()->environment('production')
					? 'https://llm-production.up.railway.app'
					: 'http://localhost:3000';
			}
			$response = Http::timeout(300)
				->connectTimeout(10)
				->post("{$llmUrl}/enhance", [
					'article' => [
						'id' => $article->id,
						'title' => $article->title,
						'content' => $article->content,
						'source_url' => $article->source_url,
						'author' => $article->author,
					],
				]);
			
			if (!$response->successful()) {
				throw new \Exception('Enhancement service error: ' . $response->body());
			}
			
			$result = $response->json();
			
			// Validate response contains enhanced content
			if (!isset($result['enhanced']['content'])) {
				throw new \Exception('No enhanced content in response');
			}
			
			// Create new article record with enhanced content
			$enhancedData = $result['enhanced'];
			$enhancedArticle = $this->create([
				'title' => $enhancedData['title'],
				'content' => $enhancedData['content'], // Professionally formatted HTML
				'source_url' => $enhancedData['source_url'],
				'author' => $enhancedData['author'] ?? $article->author,
				'status' => 'published',
				'version' => 'enhanced',
				'parent_id' => $article->id, // Link to original article
				'enhanced_at' => now(),
			]);
			
			Log::info('Article enhanced successfully', [
				'original_id' => $article->id,
				'enhanced_id' => $enhancedArticle->id
			]);
			
			// Clear cache to show updated article list
			Cache::forget('articles.all');
			
			return $enhancedArticle;
			
		} catch (\Exception $e) {
			Log::error('Enhancement failed', [
				'article_id' => $article->id,
				'error' => $e->getMessage()
			]);
			throw $e;
		}
	}
}
