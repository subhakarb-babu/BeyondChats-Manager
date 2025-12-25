import { useState } from 'react';
import { Settings, Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { scrapeArticles } from '../api/article.api';


export default function ControlPanel({ onScrapeComplete }) {
  const [count, setCount] = useState(5);
  const [url, setUrl] = useState('https://beyondchats.com/blogs/');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await scrapeArticles(count, url);
      setMessage({
        type: 'success',
        text: result.message || `Successfully scraped ${result.data?.length || 0} articles`
      });
      if (onScrapeComplete) {
        onScrapeComplete(); // Trigger article list refresh
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to scrape articles'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="control-panel">
      <h2><Settings size={24} style={{marginRight: '0.75rem', verticalAlign: 'middle'}} className="icon-inline" /> Scraper Control</h2>
      
      {/* Status message (success or error) */}
      {message && (
        <div className={`status-message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} style={{marginRight: '0.75rem', verticalAlign: 'middle'}} className="icon-inline" />
          ) : (
            <AlertCircle size={18} style={{marginRight: '0.75rem', verticalAlign: 'middle'}} className="icon-inline" />
          )}
          {message.text}
        </div>
      )}
      
      {/* Configuration inputs */}
      <div className="control-group">
        <div className="input-group">
          <label>Number of Articles</label>
          <input
            type="number"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>
        
        <div className="input-group">
          <label>Source URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            placeholder="https://beyondchats.com/blogs/"
          />
        </div>
      </div>
      
      {/* Scrape action button */}
      <button
        className="btn btn-primary"
        onClick={handleScrape}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader size={18} className="spinner" />
            Scraping...
          </>
        ) : (
          <>
            <Zap size={18} />
            Start Scraping
          </>
        )}
      </button>
    </div>
  );
}
