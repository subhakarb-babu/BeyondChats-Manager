import { User, Calendar } from 'lucide-react';

/**
 * ArticleCard Component
 * 
 * Preview card for article in grid/list view
 * Shows:
 * - Title and version/status badges
 * - Author and publication date
 * - Truncated content preview
 * - Clickable to open full article modal
 */
export default function ArticleCard({ article, onView }) {
  /**
   * Format date to readable short format
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Truncate content preview to specified length
   * Removes HTML tags for plain text display
   */
  const truncateContent = (text, maxLength = 200) => {
    if (!text) return 'No content';
    const cleaned = text.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned;
  };

  return (
    <div className="article-list-item" onClick={() => onView && onView(article)}>
      {/* Card header with title and badges */}
      <div className="article-list-header">
        <h3>{article.title}</h3>
        <div className="article-badges">
          <span className={`badge ${article.version || 'original'}`}>
            {article.version || 'original'}
          </span>
          <span className={`badge ${article.status || 'draft'}`}>
            {article.status || 'draft'}
          </span>
        </div>
      </div>
      
      {/* Card metadata */}
      <div className="article-list-meta">
        {article.author && (
          <span className="meta-item">
            <User size={16} />
            {article.author}
          </span>
        )}
        <span className="meta-item">
          <Calendar size={16} />
          {formatDate(article.published_at || article.created_at)}
        </span>
      </div>
      
      {/* Content preview */}
      <p className="article-list-preview">
        {truncateContent(article.content)}
      </p>
    </div>
  );
}

