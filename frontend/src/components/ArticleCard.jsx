import { User, Calendar } from 'lucide-react';

export default function ArticleCard({ article, onView }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (text, maxLength = 200) => {
    if (!text) return 'No content';
    const cleaned = text.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned;
  };

  return (
    <div className="article-list-item" onClick={() => onView && onView(article)}>
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
      
      <p className="article-list-preview">
        {truncateContent(article.content)}
      </p>
    </div>
  );
}

