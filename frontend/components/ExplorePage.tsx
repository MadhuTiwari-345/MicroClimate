import { fetchForecastByCity } from "../services/api";
// frontend/components/ExplorePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Search, Globe, LayoutGrid, Calendar, Settings, HelpCircle,
  Share2, ChevronDown, ChevronUp, ArrowRight, Plus, Minus,
  Navigation, Snowflake, Tornado, Loader2,
  Sun, Droplets, Wind, Activity, Layers, User
} from 'lucide-react';
import { getCoordinates, getCityFromCoordinates } from '../services/locationservice';
import { fetchWeatherData, WeatherData } from '../services/weatherService';

interface ExplorePageProps {
  onNavigate: (
    view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore'
  ) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  // 👇 comes from App, updated when user chooses a place
  markerPosition: { lat: number; lon: number } | null;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onNavigate,
  onZoomIn,
  onZoomOut,
  onLocationSelect,
  markerPosition,
}) => {
  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'layers' | 'events'>('overview');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [savedViewsOpen, setSavedViewsOpen] = useState(true);
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Data State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState('San Francisco, CA');

  // Layers
  const [layers, setLayers] = useState([
    { id: 'temp', name: 'Temperature', active: true, icon: Sun, color: 'text-orange-400' },
    { id: 'wind', name: 'Wind Speed', active: false, icon: Wind, color: 'text-teal-400' },
    { id: 'precip', name: 'Precipitation', active: false, icon: Droplets, color: 'text-blue-400' },
    { id: 'clouds', name: 'Cloud Cover', active: false, icon: Activity, color: 'text-gray-400' },
  ]);

  // Events
  const events = [
    { id: 1, title: 'Arctic Sea Ice Minimum', location: 'Arctic Ocean', lat: 85.0, lon: 0.0, type: 'cryosphere' },
    { id: 2, title: 'Amazon Rainforest Drought', location: 'Manaus, Brazil', lat: -3.119, lon: -60.021, type: 'drought' },
    { id: 3, title: 'Tropical Storm Julian', location: 'North Atlantic', lat: 25.0, lon: -60.0, type: 'storm' },
    { id: 4, title: 'Sahara Dust Plume', location: 'Canary Islands', lat: 28.2916, lon: -16.6291, type: 'atmosphere' },
  ];

  // Lists
  const [searchHistory, setSearchHistory] = useState([
    { name: 'London, UK', time: '2 mins ago' },
    { name: 'New York, USA', time: '1 hour ago' },
  ]);

  const [savedViews, setSavedViews] = useState([
    { name: 'Tokyo Heat Island', id: 1, lat: 35.6762, lon: 139.6503 },
    { name: 'Atlantic Pressure Zones', id: 2, lat: 25.0343, lon: -77.3963 },
  ]);

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 👉 When markerPosition from App changes (Hero / globe click / etc)
  useEffect(() => {
    if (!markerPosition) return;
    const { lat, lon } = markerPosition;

    async function load() {
      setLoading(true);
      try {
        // Get the city name from the coordinates using reverse geocoding
        const cityName = await getCityFromCoordinates(lat, lon).catch(() => null);
        
        // Fetch weather using the city name, or fallback to coordinates
        const data = await fetchForecastByCity(cityName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        setWeather(data);
        
        // Update location name to what the backend resolved
        if (data?.city) {
          setCurrentLocationName(data.city);
        } else if (cityName) {
          setCurrentLocationName(cityName);
        }
      } catch (err) {
        console.error("Failed to load weather for marker position:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [markerPosition]);

  // 👉 Search bar handler
  const handleLocationSearch = async (query: string) => {
  if (!query.trim()) return;
  setLoading(true);

  try {
    // Fetch weather data directly using the query (city name)
    const data = await fetchForecastByCity(query);
    
    if (!data) {
      showToast("Location not found");
      return;
    }

    // Update weather state
    setWeather(data);
    
    // Update location name from the response
    setCurrentLocationName(data.city || query);
    
    // Tell the App the new location (for globe marker)
    if (onLocationSelect && data.lat && data.lon) {
      onLocationSelect(data.lat, data.lon);
    }

    // Update search query and history
    setSearchQuery(query);
    setSearchHistory(prev => [
      { name: query, time: "Just now" },
      ...prev.slice(0, 4)
    ]);

  } catch (e) {
    console.error("Search failed", e);
    showToast("Could not fetch weather - location may not exist");
  } finally {
    setLoading(false);
  }
};

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLocationSearch(searchQuery);
  };

  const handleSaveView = () => {
    if (!savedViews.find((v) => v.name === currentLocationName) && weather) {
      setSavedViews([...savedViews, { name: currentLocationName, id: Date.now(), lat: 0, lon: 0 }]);
      showToast('View saved successfully');
    } else {
      showToast('View already saved');
    }
  };

  const handleViewClick = (view: typeof savedViews[0]) => {
    setSearchQuery(view.name);
    if (view.lat !== 0) {
      if (onLocationSelect) onLocationSelect(view.lat, view.lon);
      handleLocationSearch(view.name);
    } else {
      handleLocationSearch(view.name);
    }
  };

  const handleEventClick = (lat: number, lon: number, title: string) => {
    if (onLocationSelect) onLocationSelect(lat, lon);
    handleLocationSearch(`${lat}, ${lon}`);
    setCurrentLocationName(title);
    setSearchQuery(title);
  };

  const handleRecenter = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onLocationSelect) onLocationSelect(latitude, longitude);
          handleLocationSearch(`${latitude}, ${longitude}`);
          showToast('Re-centered to your location');
        },
        () => showToast('Location access denied')
      );
    }
  };

  const toggleLayer = (id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l)));
  };

  // 👉 Default load only if NO marker is set
  

  // 👉 Listen for earth-click events from Earth3D (optional)
  

  return (
    <div className="fixed inset-0 z-50 pointer-events-none font-sans text-white overflow-hidden">
      {/* Visual Grid Overlay Effect */}
      {weatherOverlay && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20 animate-pulse">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #00C2FF 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#0B0E14]/90 border border-[#00C2FF]/30 text-[#00C2FF] px-4 py-2 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(0,194,255,0.2)] animate-fade-in-up">
          {toast}
        </div>
      )}

      {/* Sidebar */}
      <div className="absolute top-0 left-0 bottom-0 w-[420px] flex pointer-events-auto z-40">
        {/* Icon Rail */}
        <div className="w-16 bg-[#0B0E14] border-r border-white/5 hôm flex flex-col items-center py-6 space-y-8 z-20 shadow-2xl">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C2FF] to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,194,255,0.3)] cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onNavigate('landing')}
          >
            <Globe className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 flex flex-col items-center space-y-6 w-full mt-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              title="Overview"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeTab === 'layers'
                  ? 'bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              title="Map Layers"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeTab === 'events'
                  ? 'bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              title="Global Events"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center space-y-4 mb-4">
            <button
              onClick={() => showToast('Settings unavailable in demo')}
              className="w-10 h-10 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => showToast('Help center unavailable in demo')}
              className="w-10 h-10 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content panel */}
        <div className="flex-1 bg-[#0B0E14]/95 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 overflow-y-auto custom-scrollbar z-10 shadow-2xl">
          {/* User header */}
          <div className="flex items-center mb-8 pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-[#FFE4C4] flex items-center justify-center mr-4 border-2 border-[#1E2330] shadow-lg relative overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#FFE4C4] to-[#FFDAB9] flex items-end justify-center">
                <User className="w-8 h-8 text-gray-600 translate-y-1" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B0E14]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">AstroClima</h2>
              <p className="text-xs text-[#00C2FF] font-medium tracking-wide">Data Voyager</p>
            </div>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              {/* Weather cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#161B26] border border-white/5 p-4 rounded-2xl hover:border-[#00C2FF]/30 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-400 group-hover:text-[#00C2FF] transition-colors">
                      Temperature
                    </p>
                    <Sun className="w-3 h-3 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1 font-mono">
                    {loading ? '...' : weather ? `${Math.round(weather.current.temperature)}°C` : '--'}
                  </p>
                  <p className="text-[10px] font-medium text-green-400 bg-green-400/10 inline-block px-1.5 rounded">
                    +1.2%
                  </p>
                </div>

                <div className="bg-[#161B26] border border-white/5 p-4 rounded-2xl hover:border-[#00C2FF]/30 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-400 group-hover:text-[#00C2FF] transition-colors">
                      Humidity
                    </p>
                    <Droplets className="w-3 h-3 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1 font-mono">
                    {loading ? '...' : weather ? `${weather.current.humidity}%` : '--'}
                  </p>
                  <p className="text-[10px] font-medium text-red-400 bg-red-400/10 inline-block px-1.5 rounded">
                    -0.5%
                  </p>
                </div>

                <div className="bg-[#161B26] border border-white/5 p-4 rounded-2xl hover:border-[#00C2FF]/30 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-400 group-hover:text-[#00C2FF] transition-colors">
                      Wind Speed
                    </p>
                    <Wind className="w-3 h-3 text-teal-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1 font-mono">
                    {loading ? '...' : weather ? `${Math.round(weather.current.windSpeed)}` : '--'}{' '}
                    <span className="text-xs">km/h</span>
                  </p>
                  <p className="text-[10px] font-medium text-green-400 bg-green-400/10 inline-block px-1.5 rounded">
                    +3.0%
                  </p>
                </div>

                <div className="bg-[#161B26] border border-white/5 p-4 rounded-2xl hover:border-[#00C2FF]/30 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-400 group-hover:text-[#00C2FF] transition-colors">
                      Air Quality
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1 font-mono">
                    {loading ? '...' : weather ? weather.aqi : '--'}
                  </p>
                  <p className="text-[10px] font-medium text-red-400 bg-red-400/10 inline-block px-1.5 rounded">
                    -1.8%
                  </p>
                </div>
              </div>

              {/* View dashboard CTA */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0099CC] text-black font-bold shadow-[0_0_20px_rgba(0,194,255,0.4)] hover:shadow-[0_0_30px_rgba(0,194,255,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center mb-6"
              >
                View Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </button>

              {/* Search history */}
              <div className="mb-4 border-t border-white/5 pt-4">
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-white py-2 hover:text-[#00C2FF] transition-colors"
                >
                  Search History {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {historyOpen && (
                  <div className="mt-2 space-y-1 animate-fade-in">
                    {searchHistory.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handleLocationSearch(item.name)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer group"
                      >
                        <span className="text-xs text-gray-400 group-hover:text-white">{item.name}</span>
                        <span className="text-[10px] text-gray-600">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved views */}
              <div className="mb-4 border-t border-white/5 pt-4">
                <button
                  onClick={() => setSavedViewsOpen(!savedViewsOpen)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-white py-2 hover:text-[#00C2FF] transition-colors"
                >
                  Saved Views {savedViewsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {savedViewsOpen && (
                  <div className="mt-2 space-y-2 animate-fade-in">
                    {savedViews.map((view) => (
                      <div
                        key={view.id}
                        onClick={() => handleViewClick(view)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#161B26] border border-white/5 hover:border-[#00C2FF]/50 hover:bg-[#00C2FF]/5 cursor-pointer group transition-all"
                      >
                        <span className="text-xs text-gray-300 group-hover:text-white font-medium">{view.name}</span>
                        <Share2 className="w-3 h-3 text-gray-600 group-hover:text-[#00C2FF]" />
                      </div>
                    ))}
                    <button
                      onClick={handleSaveView}
                      className="w-full py-2 mt-2 text-xs font-medium text-[#00C2FF] bg-[#00C2FF]/10 rounded-lg hover:bg-[#00C2FF]/20 transition-colors flex items-center justify-center border border-[#00C2FF]/20"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Save Current View
                    </button>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="mt-auto pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-white mb-3">
                  Comments on "{currentLocationName.split(',')[0]}"
                </h3>
                <div className="bg-[#161B26] p-3 rounded-xl border border-white/5">
                  <p className="text-xs font-bold text-white mb-1">Alex</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Fascinating data. The urban heat effect is more pronounced than I expected in this region.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LAYERS TAB */}
          {activeTab === 'layers' && (
            <div className="animate-fade-in h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-2">Data Layers</h2>
              <p className="text-xs text-gray-400 mb-6">Toggle layers to visualize different climate data.</p>

              <div className="space-y-3">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      layer.active ? 'bg-[#00C2FF]/10 border-[#00C2FF]/30' : 'bg-[#161B26] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                          layer.active ? 'bg-[#00C2FF]/20' : 'bg-white/5'
                        }`}
                      >
                        <layer.icon className={`w-5 h-5 ${layer.active ? layer.color : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${layer.active ? 'text-white' : 'text-gray-400'}`}>
                          {layer.name}
                        </h3>
                        <p className="text-[10px] text-gray-500">{layer.active ? 'Visible' : 'Hidden'}</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${layer.active ? 'bg-[#00C2FF]' : 'bg-gray-700'}`}>
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          layer.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto p-4 bg-[#161B26] rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-white mb-2">Layer Opacity</h4>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-[#00C2FF]" />
                </div>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="animate-fade-in h-full flex flex-col">
              <h2 className="text-xl font-bold text-white mb-2">Global Events</h2>
              <p className="text-xs text-gray-400 mb-6">Significant climate anomalies happening now.</p>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event.lat, event.lon, event.title)}
                    className="group bg-[#161B26] border border-white/5 rounded-xl p-4 hover:border-[#00C2FF]/50 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C2FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 bg-white/5 text-[9px] uppercase tracking-wider text-gray-400 rounded border border-white/5">
                        {event.type}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#00C2FF] -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#00C2FF] transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center">
                      <Globe className="w-3 h-3 mr-1" /> {event.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top search bar */}
      <div className="absolute top-6 left-[460px] right-6 z-30 flex items-center justify-between pointer-events-auto">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl group">
          <div className="absolute inset-0 bg-[#00C2FF]/5 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00C2FF] group-hover:text-white transition-colors z-10" />
          <input
            type="text"
            placeholder="Search city or coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 placeholder-gray-500 shadow-2xl transition-all focus:bg-[#161B26]"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
            </div>
          )}
        </form>

        <div className="flex items-center bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-2.5 shadow-xl">
          <span className="text-xs text-gray-300 mr-3 font-medium">Weather Overlay</span>
          <button
            onClick={() => setWeatherOverlay(!weatherOverlay)}
            className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${
              weatherOverlay ? 'bg-[#00C2FF]' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                weatherOverlay ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute bottom-8 right-8 z-30 flex flex-col space-y-2 pointer-events-auto">
        <button
          onClick={onZoomIn}
          className="w-12 h-12 bg-[#161B26]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-[#00C2FF] hover:text-black text-white transition-colors shadow-lg"
          title="Zoom In"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-12 h-12 bg-[#161B26]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-[#00C2FF] hover:text-black text-white transition-colors shadow-lg"
          title="Zoom Out"
        >
          <Minus className="w-6 h-6" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-12 h-12 bg-[#161B26]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-[#00C2FF] hover:text-black text-white transition-colors mt-2 shadow-lg"
          title="Re-center"
        >
          <Navigation className="w-5 h-5 transform -rotate-45" />
        </button>
      </div>
    </div>
  );
};