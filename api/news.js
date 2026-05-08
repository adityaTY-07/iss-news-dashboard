export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // We use Spaceflight News API which is free, requires no auth, and perfectly fits the theme!
    // It also bypasses the strict CORS and Vercel IP blocking from NewsAPI.org
    const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=10`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Spaceflight API returned " + response.status);
    }
    
    const data = await response.json();
    
    // Map to NewsAPI format so the frontend doesn't need to change
    const mappedArticles = data.results.map(article => ({
      title: article.title,
      description: article.summary,
      url: article.url,
      urlToImage: article.image_url,
      publishedAt: article.published_at,
      source: { name: article.news_site }
    }));
    
    res.status(200).json({ status: "ok", articles: mappedArticles });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
