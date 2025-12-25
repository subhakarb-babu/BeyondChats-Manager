import { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import ArticleList from './components/ArticleList';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleScrapeComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>📰 BeyondChats Article Manager</h1>
          <p>Scrape, enhance, and manage articles with AI-powered insights</p>
        </div>
      </div>

      <div className="container">
        <ControlPanel onScrapeComplete={handleScrapeComplete} />
        
        <div style={{ marginTop: '2rem' }}>
          <ArticleList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}

