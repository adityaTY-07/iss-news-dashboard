import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, RefreshCw, Satellite } from 'lucide-react';
import ISSMap from './components/ISSMap';
import AstronautsList from './components/AstronautsList';
import NewsDashboard from './components/NewsDashboard';
import Charts from './components/Charts';
import Chatbot from './components/Chatbot';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [issData, setIssData] = useState(null);
  const [issHistory, setIssHistory] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [astronauts, setAstronauts] = useState({ number: 0, people: [] });
  const [news, setNews] = useState([]);
  const [locationName, setLocationName] = useState('Loading...');

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Toggle Dark Mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Haversine formula
  const calculateSpeed = (lat1, lon1, lat2, lon2, timeDiffMs) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // in km
    const hours = timeDiffMs / (1000 * 60 * 60);
    return distance / hours; // km/h
  };

  const fetchISSLocation = useCallback(async () => {
    try {
      const response = await fetch('/open-notify/iss-now.json');
      const data = await response.json();
      
      if (data.message === 'success') {
        const { latitude, longitude } = data.iss_position;
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const timestamp = data.timestamp;

        setIssData(prev => {
          if (prev) {
            const timeDiff = (timestamp - prev.timestamp) * 1000;
            if (timeDiff > 0) {
              const speed = calculateSpeed(prev.lat, prev.lon, lat, lon, timeDiff);
              setSpeedHistory(s => [...s, { time: new Date().toLocaleTimeString(), speed: Math.round(speed) }].slice(-30));
              data.speed = Math.round(speed);
            } else {
              data.speed = prev.speed; // fallback
            }
          }
          return { lat, lon, timestamp, speed: data.speed || 0 };
        });

        setIssHistory(h => [...h, [lat, lon]].slice(-50)); // Keep up to 50 for the tracked positions UI

        // Reverse Geocoding
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const geoData = await geoRes.json();
          setLocationName(geoData.city || geoData.locality || geoData.principalSubdivision || 'Over ocean / remote area');
        } catch (e) {
          setLocationName('Over ocean / remote area');
        }
      }
    } catch (error) {
      console.error("Error fetching ISS location", error);
    }
  }, []);

  const fetchAstronauts = async () => {
    try {
      const response = await fetch('/open-notify/astros.json');
      const data = await response.json();
      if (data.message === 'success') {
        setAstronauts({ number: data.number, people: data.people });
      }
    } catch (error) {
      console.error("Error fetching astronauts", error);
    }
  };

  useEffect(() => {
    fetchISSLocation();
    fetchAstronauts();
    if (autoRefresh) {
      const interval = setInterval(fetchISSLocation, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchISSLocation, autoRefresh]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-4 md:p-8 font-sans">
      
      {/* Header Card */}
      <header className="bg-card border rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center shadow-sm">
        <div>
          <p className="text-xs font-bold text-[#0ea5e9] tracking-widest mb-1 uppercase">Mission Control Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Real-Time ISS and News Intelligence</h1>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="mt-4 md:mt-0 px-4 py-2 border rounded-full text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
        >
          {darkMode ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </header>

      {/* Main Grid Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: ISS Tracker & News */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tracking Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h2 className="text-lg font-bold">ISS Live Tracking</h2>
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <button 
                  onClick={fetchISSLocation}
                  className="px-4 py-1.5 bg-card border rounded-full text-sm font-medium hover:bg-muted transition-colors text-muted-foreground shadow-sm"
                >
                  Refresh Now
                </button>
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-1.5 border rounded-full text-sm font-medium transition-colors shadow-sm ${autoRefresh ? 'bg-background border-muted-foreground/30 text-foreground' : 'bg-card text-muted-foreground'}`}
                >
                  Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Latitude / Longitude</p>
                <p className="font-bold text-lg">{issData ? `${issData.lat.toFixed(3)}, ${issData.lon.toFixed(3)}` : '--'}</p>
              </div>
              <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Speed</p>
                <p className="font-bold text-lg">{issData ? `${issData.speed.toFixed(2)} km/h` : '--'}</p>
              </div>
              <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Nearest Place</p>
                <p className="font-bold text-sm leading-tight line-clamp-2">{locationName}</p>
              </div>
              <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Tracked Positions</p>
                <p className="font-bold text-lg">{issHistory.length}</p>
              </div>
            </div>

            {/* Map */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm h-[400px]">
              <ISSMap issData={issData} history={issHistory} />
            </div>
          </section>

          {/* News Section */}
          <section>
            <NewsDashboard news={news} setNews={setNews} />
          </section>

        </div>

        {/* Right Column: Charts & Astros */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
           <Charts speedHistory={speedHistory} />
           <AstronautsList astronauts={astronauts} />
        </div>

      </main>

      {/* Chatbot Floating UI */}
      <Chatbot 
        dashboardData={{
          iss: issData,
          locationName,
          astronauts,
          newsSummaries: news.slice(0, 5).map(n => n.title) // Send top 5 news titles to save context window
        }}
      />
    </div>
  );
}

export default App;
