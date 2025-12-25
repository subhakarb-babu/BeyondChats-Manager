import { useState } from 'react';
import { Download, Trash2, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import { deleteArticle, downloadArticle, enhanceArticle } from '../api/article.api';

export default function ArticleModal({ article, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  if (!article) return null;

  const handleDelete = async () => {
    if (!confirm(`Delete "${article.title}"?`)) return;
    
    setIsDeleting(true);
    try {
      await deleteArticle(article.id);
      onClose();
      if (onDelete) onDelete(article.id);
    } catch (error) {
      alert('Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    downloadArticle(article.id);
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const enhancedArticle = await enhanceArticle(article.id);
      if (enhancedArticle) {
        Object.assign(article, enhancedArticle);
        alert('Article enhanced successfully!');
      }
    } catch (error) {
      alert('Failed to enhance article: ' + error.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cleanContent = (text) => {
    if (!text) return 'No content available';
    if (/<[^>]*>/g.test(text)) {
      return text;
    }
    return text.replace(/<[^>]*>/g, '').trim();
  };

  const isHTML = article.content && /<[^>]*>/g.test(article.content);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{article.title}</h2>
            <div className="article-badges" style={{marginTop: '0.5rem'}}>
              <span className={`badge ${article.version || 'original'}`}>
                {article.version || 'original'}
              </span>
              <span className={`badge ${article.status || 'draft'}`}>
                {article.status || 'draft'}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {article.author && (
            <div className="detail-section">
              <h3>Author</h3>
              <p>{article.author}</p>
            </div>
          )}

          {article.source_url && (
            <div className="detail-section">
              <h3>Source URL</h3>
              <p><a href={article.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} style={{display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle'}} />{article.source_url}</a></p>
            </div>
          )}

          <div className="detail-section">
            <h3><Calendar size={18} style={{display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle'}} />Dates</h3>
            <p>
              <strong>Published:</strong> {formatDate(article.published_at)}<br/>
              <strong>Scraped:</strong> {formatDate(article.scraped_at)}<br/>
              <strong>Created:</strong> {formatDate(article.created_at)}
              {article.enhanced_at && <><br/><strong>Enhanced:</strong> {formatDate(article.enhanced_at)}</>}
            </p>
          </div>

          {article.parent_id && (
            <div className="detail-section">
              <h3>Linked Article</h3>
              <p>Enhanced version of article ID: {article.parent_id}</p>
            </div>
          )}

          <div className="detail-section">
            <h3>Content</h3>
            {isHTML ? (
              <div dangerouslySetInnerHTML={{ __html: cleanContent(article.content) }} />
            ) : (
              <p>{cleanContent(article.content)}</p>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="detail-section">
              <h3>Tags</h3>
              <p>{article.tags.join(', ')}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-enhance"
            onClick={handleEnhance}
            disabled={isEnhancing}
            title="Enhance article using AI: Google search + web scraping + LLM improvement"
          >
            <Sparkles size={18} />
            {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleDownload}
            title="Download article as plain text file"
          >
            <Download size={18} />
            Download as Text
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Permanently delete this article"
          >
            <Trash2 size={18} />
            {isDeleting ? 'Deleting...' : 'Delete Article'}
          </button>
        </div>
      </div>
    </div>
  );
}
