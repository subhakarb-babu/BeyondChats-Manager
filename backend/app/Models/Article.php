<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model {
    use SoftDeletes;
    
    protected $fillable = [
        'title',
        'excerpt',
        'content',
        'raw_html',
        'content_markdown',
        'source_url',
        'content_hash',
        'author',
        'slug',
        'tags',
        'metadata',
        'version',
        'parent_id',
        'status',
        'error_message',
        'scraped_at',
        'published_at',
        'enhanced_at',
    ];
    
    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
        'scraped_at' => 'datetime',
        'published_at' => 'datetime',
        'enhanced_at' => 'datetime',
    ];
    
    protected $dates = [
        'scraped_at',
        'published_at',
        'enhanced_at',
        'deleted_at',
    ];
    
    // Relationships
    public function parent(): BelongsTo {
        return $this->belongsTo(Article::class, 'parent_id');
    }
    
    public function versions(): HasMany {
        return $this->hasMany(Article::class, 'parent_id');
    }
    
    // Scopes
    public function scopePublished($query) {
        return $query->where('status', 'published');
    }
    
    public function scopeOriginal($query) {
        return $query->where('version', 'original');
    }
    
    public function scopeEnhanced($query) {
        return $query->where('version', 'enhanced');
    }
    
    // Accessors & Mutators
    public function setContentAttribute($value) {
        $this->attributes['content'] = $value;
        $this->attributes['content_hash'] = hash('sha256', $value);
    }
    
    public function getExcerptAttribute($value) {
        return $value ?? substr(strip_tags($this->content), 0, 200) . '...';
    }
}
