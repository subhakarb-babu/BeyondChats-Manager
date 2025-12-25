import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getArticles } from '../api/article.api';
import ArticleCard from './ArticleCard';
import ArticleModal from './ArticleModal';

/**
 * ArticleList Component
 * 
 * Main article display and management interface
 * Features:
 * - Display all articles in responsive grid
 * - Filter to show enhanced articles only
 * - Manual refresh to reload articles from backend
 * - Click articles to open detailed modal view
 */
export default function ArticleList({ refreshTrigger }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [filterEnhanced, setFilterEnhanced] = useState(false);

  /**
   * Fetch articles from backend API
   */
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load articles when component mounts or when refreshTrigger changes
   */
  useEffect(() => {
    fetchArticles();
  }, [refreshTrigger]);

  /**
   * Remove deleted article from local state
   */
  const handleDelete = (id) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  // Show loading spinner while fetching articles
  if (loading) {
    return (
      <div className="loading" style={{ padding: '4rem', justifyContent: 'center' }}>
        <span className="spinner"></span>
        Loading articles...
      </div>
    );
  }

  // Show error message if API call fails
  if (error) {
    return (
      <div className="status-message error">
        ❌ {error}
      </div>
    );
  }

  // Show empty state if no articles exist
  if (articles.length === 0) {
    return (
      <div className="empty-state">
        <h3>📝 No Articles Yet</h3>
        <p>Scrape some articles to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="article-filter-bar">
        {/* Toggle to show enhanced articles only */}
        <button 
          className={`btn btn-filter ${filterEnhanced ? 'active' : ''}`}
          onClick={() => setFilterEnhanced(!filterEnhanced)}
        >
          <Sparkles size={18} />
          Show Enhanced Articles Only
        </button>
        
        {/* Manual refresh button */}
        <button 
          className="btn btn-filter"
          onClick={fetchArticles}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Articles
        </button>
      </div>

      {/* Display articles in grid, filtered based on selection */}
      <div className="article-grid">
        {articles
          .filter(article => !filterEnhanced || article.version === 'enhanced')
          .map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onView={setSelectedArticle}
            />
          ))}
      </div>

      {/* Modal for viewing/editing article details */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

