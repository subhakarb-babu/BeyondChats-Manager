<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Services\ArticleService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class ArticleController extends Controller {
    public function __construct(protected ArticleService $service) {}

    public function index() {
        $articles = Cache::remember('articles.all', 300, function () {
            return $this->service->list();
        });
        
        return response()->json([
            'success' => true,
            'data' => $articles,
            'count' => $articles->count()
        ]);
    }

    public function store(Request $request) {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:500',
            'content' => 'required|string',
            'source_url' => 'required|url|unique:articles,source_url',
            'raw_html' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $article = $this->service->create($request->all());
            Cache::forget('articles.all');
            
            return response()->json([
                'success' => true,
                'message' => 'Article created successfully',
                'data' => $article
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create article',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function scrape(Request $request) {
        $validator = Validator::make($request->all(), [
            'count' => 'nullable|integer|min:1|max:50',
            'url' => 'nullable|url',
            'oldest' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $count = $request->input('count', 5);
            $url = $request->input('url', 'https://beyondchats.com/blogs/');
            $oldest = (bool)$request->input('oldest', false);
            
            \Log::info('[Scrape] Request received', ['url' => $url, 'count' => $count, 'oldest' => $oldest]);

            $articles = $this->service->scrapeAndStore($url, $count, $oldest);
            Cache::forget('articles.all');
            
            \Log::info('[Scrape] Success', ['articles_count' => $articles->count()]);
            
            return response()->json([
                'success' => true,
                'message' => "Successfully scraped {$articles->count()} articles",
                'data' => $articles
            ], 201);
        } catch (\Exception $e) {
            \Log::error('[Scrape] Failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Scraping failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id) {
        try {
            $article = \App\Models\Article::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $article
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        }
    }

    public function update(Request $request, $id) {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:500',
            'content' => 'sometimes|required|string',
            'excerpt' => 'nullable|string',
            'raw_html' => 'nullable|string',
            'author' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'status' => 'nullable|in:draft,published,archived,failed',
            'version' => 'nullable|in:original,enhanced,updated',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $article = \App\Models\Article::findOrFail($id);
            $article->update($request->all());
            try {
                Cache::forget('articles.all');
            } catch (\Exception $e) {
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Article updated successfully',
                'data' => $article->fresh()
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id) {
        try {
            $article = \App\Models\Article::findOrFail($id);
            $title = $article->title;
            $article->delete();
            try {
                Cache::forget('articles.all');
            } catch (\Exception $e) {
            }
            
            return response()->json([
                'success' => true,
                'message' => "Article '{$title}' deleted successfully"
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function download($id) {
        try {
            $article = \App\Models\Article::findOrFail($id);
            
            $cleanContent = html_entity_decode($article->content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $cleanContent = strip_tags($cleanContent);
            $cleanContent = preg_replace('/\s+/', ' ', $cleanContent);
            $cleanContent = trim($cleanContent);
            $cleanContent = wordwrap($cleanContent, 100, "\n", false);
            
            $content = "================================================================================\n";
            $content .= "ARTICLE DETAILS\n";
            $content .= "================================================================================\n\n";
            $content .= "Title: {$article->title}\n";
            $content .= "Author: " . ($article->author ?? 'Unknown') . "\n";
            $content .= "Source: {$article->source_url}\n";
            $content .= "Published: " . ($article->published_at ? $article->published_at->format('F d, Y') : 'N/A') . "\n";
            $content .= "Scraped: " . ($article->scraped_at ? $article->scraped_at->format('F d, Y h:i A') : 'N/A') . "\n";
            $content .= "Version: " . ucfirst($article->version) . "\n";
            $content .= "Status: " . ucfirst($article->status) . "\n";
            $content .= "\n================================================================================\n";
            $content .= "CONTENT\n";
            $content .= "================================================================================\n\n";
            $content .= $cleanContent;
            $content .= "\n\n================================================================================\n";
            $content .= "END OF ARTICLE\n";
            $content .= "================================================================================\n";
            
            $filename = \Illuminate\Support\Str::slug($article->title) . '.txt';
            
            return response($content, 200)
                ->header('Content-Type', 'text/plain; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
                
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Download failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function enhance($id) {
        try {
            $article = \App\Models\Article::findOrFail($id);
            
            $enhancedArticle = $this->service->enhance($article);
            
            Cache::forget('articles.all');
            
            return response()->json([
                'success' => true,
                'message' => 'Article enhanced successfully',
                'data' => $enhancedArticle
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Enhancement failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
