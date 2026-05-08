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

        setIssHistory(h => [...h, [lat, lon]].slice(-15));

        // Reverse Geocoding
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const geoData = await geoRes.json();
          setLocationName(geoData.city || geoData.locality || geoData.principalSubdivision || 'Ocean / Unknown');
        } catch (e) {
          setLocationName('Ocean');
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
    const interval = setInterval(fetchISSLocation, 15000);
    return () => clearInterval(interval);
  }, [fetchISSLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Satellite className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Nexus Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchISSLocation}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh ISS
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: ISS Tracker & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Card */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm h-[400px] flex flex-col relative">
             <div className="absolute top-4 left-4 z-[400] bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm pointer-events-none">
                <p className="text-sm font-semibold text-muted-foreground">Current Location</p>
                <p className="text-lg font-bold">{locationName}</p>
                {issData && (
                  <div className="flex gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Lat:</span> {issData.lat.toFixed(4)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lon:</span> {issData.lon.toFixed(4)}
                    </div>
                  </div>
                )}
             </div>
             <ISSMap issData={issData} history={issHistory} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[300px]">
             <Charts speedHistory={speedHistory} news={news} />
          </div>
        </div>

        {/* Right Column: News & Astros */}
        <div className="space-y-6 flex flex-col h-full">
           <AstronautsList astronauts={astronauts} />
           <NewsDashboard news={news} setNews={setNews} />
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
