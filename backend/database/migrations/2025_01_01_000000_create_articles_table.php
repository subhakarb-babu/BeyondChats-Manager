<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up() {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            
            // Basic article information
            $table->string('title', 500);
            $table->text('excerpt')->nullable(); // Short summary/preview
            
            // Content storage - multiple formats
            $table->longText('content'); // Clean plain text content
            $table->longText('raw_html')->nullable(); // Original HTML from scraping
            $table->mediumText('content_markdown')->nullable(); // Markdown version
            
            // Metadata
            $table->string('source_url', 1000)->unique(); // Prevent duplicates
            $table->string('content_hash', 64)->nullable()->index(); // MD5/SHA256 for duplicate detection
            $table->string('author', 255)->nullable();
            $table->string('slug', 500)->nullable()->index(); // URL-friendly version
            $table->json('tags')->nullable(); // Store as JSON array
            $table->json('metadata')->nullable(); // Additional flexible metadata
            
            // Version control
            $table->string('version', 50)->default('original')->index(); // original, enhanced, updated
            $table->unsignedBigInteger('parent_id')->nullable()->index(); // Reference to original article
            $table->foreign('parent_id')->references('id')->on('articles')->onDelete('cascade');
            
            // Status tracking
            $table->string('status', 50)->default('draft')->index(); // draft, published, failed, archived
            $table->text('error_message')->nullable(); // Store error details if processing fails
            
            // Timestamps
            $table->timestamp('scraped_at')->nullable(); // When article was scraped
            $table->timestamp('published_at')->nullable(); // Original publish date
            $table->timestamp('enhanced_at')->nullable(); // When LLM enhancement completed
            $table->timestamps(); // created_at, updated_at
            $table->softDeletes(); // deleted_at for soft deletes
            
            // Performance indexes
            $table->index(['status', 'version', 'created_at']); // Common query pattern
            $table->index('scraped_at');
            $table->index('published_at');
        });
        
        // Full-text search indexes (PostgreSQL specific) - create after table
        if (config('database.default') === 'pgsql') {
            DB::statement('CREATE INDEX articles_title_fulltext ON articles USING gin(to_tsvector(\'english\', title))');
            DB::statement('CREATE INDEX articles_content_fulltext ON articles USING gin(to_tsvector(\'english\', content))');
        }
    }
    
    public function down() {
        Schema::dropIfExists('articles');
    }
};
