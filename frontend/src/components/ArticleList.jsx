import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getArticles } from '../api/article.api';
import ArticleCard from './ArticleCard';
import ArticleModal from './ArticleModal';

export default function ArticleList({ refreshTrigger }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [filterEnhanced, setFilterEnhanced] = useState(false);

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

  useEffect(() => {
    fetchArticles();
  }, [refreshTrigger]);

  const handleDelete = (id) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <div className="loading" style={{ padding: '4rem', justifyContent: 'center' }}>
        <span className="spinner"></span>
        Loading articles...
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-message error">
        ❌ {error}
      </div>
    );
  }

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
        <button 
          className={`btn btn-filter ${filterEnhanced ? 'active' : ''}`}
          onClick={() => setFilterEnhanced(!filterEnhanced)}
        >
          <Sparkles size={18} />
          Show Enhanced Articles Only
        </button>
        
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

