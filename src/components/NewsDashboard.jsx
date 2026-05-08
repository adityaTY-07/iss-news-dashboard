import React, { useState, useEffect } from 'react';
import { Newspaper, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CACHE_KEY = 'news_cache';
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 mins

const NewsDashboard = ({ news, setNews }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('science');

  const fetchNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check cache
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS && parsed.category === category) {
            setNews(parsed.data);
            setLoading(false);
            return;
          }
        } catch (e) {
          // invalid cache
        }
      }
    }

    try {
      // Try Vercel Serverless Function first
      let res = null;
      try {
        res = await fetch(`/api/news?category=${category}`, { cache: 'no-store' });
      } catch (err) {
        // network error
      }
      let data;
      
      const contentType = res?.headers?.get("content-type");
      if (!res || !res.ok || !contentType || !contentType.includes("application/json")) {
        // Fallback to direct call if running locally without Vercel CLI
        const apiKey = import.meta.env.VITE_NEWS_API_KEY;
        if (!apiKey) {
          throw new Error("Missing News API Key. Check your .env file or Vercel settings.");
        }
        res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=10&apiKey=${apiKey}`, { cache: 'no-store' });
      }
      
      data = await res.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || "Failed to fetch news");
      }

      const articles = data.articles || [];
      setNews(articles);

      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        category,
        data: articles
      }));

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category]); // refetch when category changes

  const filteredNews = news.filter(n => n.title?.toLowerCase().includes(search.toLowerCase()) || n.source?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden h-[450px]">
      <div className="p-4 border-b flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Latest News</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search news..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm bg-muted border rounded-full focus:outline-none focus:ring-2 focus:ring-primary w-[150px] transition-all"
            />
          </div>
          
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm bg-muted border rounded-full px-3 py-1.5 focus:outline-none"
          >
            <option value="science">Science</option>
            <option value="technology">Tech</option>
            <option value="general">General</option>
          </select>

          <button 
            onClick={() => fetchNews(true)}
            className="p-1.5 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
            title="Refresh News"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => fetchNews(true)} className="underline font-semibold">Retry</button>
          </div>
        )}

        {loading && !error && news.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredNews.slice(0, 5).map((article, idx) => ( // Show 5 as requested
            <div key={idx} className="flex flex-col sm:flex-row gap-4 group">
              {article.urlToImage && (
                <div className="w-full sm:w-32 h-32 sm:h-24 shrink-0 overflow-hidden rounded-lg">
                  <img 
                    src={article.urlToImage} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {article.source.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : ''}
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base leading-tight mb-2 line-clamp-2">
                  {article.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {article.description}
                </p>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Read More <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        )}
        
        {!loading && filteredNews.length === 0 && !error && (
          <p className="text-sm text-center text-muted-foreground py-8">No articles found.</p>
        )}
      </div>
    </div>
  );
};

export default NewsDashboard;
