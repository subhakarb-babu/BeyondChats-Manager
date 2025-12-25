<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up() {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->longText('raw_html')->nullable();
            $table->mediumText('content_markdown')->nullable();
            $table->string('source_url', 1000)->unique();
            $table->string('content_hash', 64)->nullable()->index();
            $table->string('author', 255)->nullable();
            $table->string('slug', 500)->nullable()->index();
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->string('version', 50)->default('original')->index();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->foreign('parent_id')->references('id')->on('articles')->onDelete('cascade');
            $table->string('status', 50)->default('draft')->index();
            $table->text('error_message')->nullable();
            $table->timestamp('scraped_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('enhanced_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'version', 'created_at']);
            $table->index('scraped_at');
            $table->index('published_at');
        });
        
        if (config('database.default') === 'pgsql') {
            DB::statement('CREATE INDEX articles_title_fulltext ON articles USING gin(to_tsvector(\'english\', title))');
            DB::statement('CREATE INDEX articles_content_fulltext ON articles USING gin(to_tsvector(\'english\', content))');
        }
    }
    
    public function down() {
        Schema::dropIfExists('articles');
    }
};
