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
		Log::info('[Service::scrapeAndStore] Starting', ['url' => $url, 'count' => $count, 'oldest' => $oldest]);
		
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
			Log::info('[Service::scrapeAndStore] LLM URL resolved', ['llmUrl' => $llmUrl]);
			
			Log::info('[Service::scrapeAndStore] Calling LLM /scrape endpoint', ['timeout' => 240]);
			$response = Http::timeout(240)
				->post("{$llmUrl}/scrape", [
					'url' => $url,
					'count' => $count,
					'oldest' => $oldest,
				]);
			
			Log::info('[Service::scrapeAndStore] LLM response received', ['status' => $response->status()]);
			
			if (!$response->successful()) {
				Log::error('[Service::scrapeAndStore] LLM returned error', ['status' => $response->status(), 'body' => $response->body()]);
				throw new \Exception('Scraper service error: ' . $response->body());
			}
			
			$scrapedArticles = $response->json('articles', []);
			Log::info('[Service::scrapeAndStore] Articles received from LLM', ['count' => count($scrapedArticles)]);
			
			$savedArticles = collect();
			
			// Process each scraped article
			foreach ($scrapedArticles as $index => $articleData) {
				try {
					Log::debug('[Service::scrapeAndStore] Processing article', ['index' => $index, 'title' => $articleData['title'] ?? 'unknown']);
					
					// Check if article already exists to prevent duplicates
					$existing = Article::where('source_url', $articleData['source_url'])->first();
					
					if ($existing) {
						Log::info('[Service::scrapeAndStore] Article already exists, skipping', ['url' => $articleData['source_url'], 'id' => $existing->id]);
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
					Log::info('[Service::scrapeAndStore] Article saved', ['id' => $article->id, 'title' => $article->title]);
					
				} catch (\Exception $e) {
					Log::error('[Service::scrapeAndStore] Failed to save article', [
						'url' => $articleData['source_url'] ?? 'unknown',
						'error' => $e->getMessage(),
						'trace' => $e->getTraceAsString()
					]);
				}
			}
			
			Log::info('[Service::scrapeAndStore] Complete', ['total_saved' => $savedArticles->count()]);
			return $savedArticles;
			
		} catch (\Exception $e) {
			Log::error('[Service::scrapeAndStore] Exception', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
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
		Log::info('[Service::enhance] Starting', ['article_id' => $article->id, 'title' => $article->title]);
		
		try {
			// Call the enhancement pipeline with complete article data
			// Passing data directly avoids Laravel API fetch hangs
			$llmUrl = env('LLM_SERVICE_URL');
			if (!$llmUrl) {
				$llmUrl = app()->environment('production')
					? 'https://llm-production.up.railway.app'
					: 'http://localhost:3000';
			}
			Log::info('[Service::enhance] LLM URL resolved', ['llmUrl' => $llmUrl]);
			
			Log::info('[Service::enhance] Calling LLM /enhance endpoint', ['article_id' => $article->id, 'timeout' => 300]);
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
			
			Log::info('[Service::enhance] LLM response received', ['status' => $response->status()]);
			
			if (!$response->successful()) {
				Log::error('[Service::enhance] LLM returned error', ['status' => $response->status(), 'body' => $response->body()]);
				throw new \Exception('Enhancement service error: ' . $response->body());
			}
			
			$result = $response->json();
			Log::debug('[Service::enhance] LLM response parsed', ['keys' => array_keys($result)]);
			
			// Validate response contains enhanced content
			if (!isset($result['enhanced']['content'])) {
				Log::error('[Service::enhance] Invalid response structure', ['result' => $result]);
				throw new \Exception('No enhanced content in response');
			}
			
			// Create new article record with enhanced content
			$enhancedData = $result['enhanced'];
			Log::info('[Service::enhance] Creating enhanced article', ['title' => $enhancedData['title']]);
			
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
			
			Log::info('[Service::enhance] Enhanced article created', [
				'original_id' => $article->id,
				'enhanced_id' => $enhancedArticle->id
			]);
			
			// Clear cache to show updated article list
			Cache::forget('articles.all');
			
			return $enhancedArticle;
			
		} catch (\Exception $e) {
			Log::error('[Service::enhance] Exception', [
				'article_id' => $article->id,
				'error' => $e->getMessage(),
				'trace' => $e->getTraceAsString()
			]);
			throw $e;
		}
	}
}
