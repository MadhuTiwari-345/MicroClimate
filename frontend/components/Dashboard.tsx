
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Settings, ArrowLeft, Thermometer, Droplets, Wind, 
  Activity, Sun, Plus, Minus, Crosshair, 
  Globe, CloudRain, Cloud, User, Bell, AlertTriangle, MapPin,
  CloudSnow, CloudLightning, X, Clock, Flame, LayoutTemplate, RefreshCw,
  ShieldCheck, Zap, Radar
} from 'lucide-react';
import { getLocationSuggestions, getCoordinates, getCityFromCoordinates, getClimateAnalysis } from '../services/locationservice';
import { fetchWeatherData, WeatherData, getWeatherIconType, getWeatherLabel } from '../services/weatherService';

interface DashboardProps {
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateNotifications?: () => void;
  onNavigateAlerts?: () => void;
}

// Extended Props for direct navigation
interface ExtendedDashboardProps extends DashboardProps {
  onNavigateTo?: (view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore') => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAuthClick?: () => void;
  isLoggedIn?: boolean;
}

interface RecentLocation {
  name: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export const Dashboard: React.FC<ExtendedDashboardProps> = ({ 
  onNavigateHome, 
  onNavigateProfile, 
  onNavigateNotifications,
  onNavigateAlerts,
  onNavigateTo,
  onLocationSelect,
  onZoomIn,
  onZoomOut,
  onAuthClick,
  isLoggedIn
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lon: number}>({ lat: 0, lon: 0 });
  const [climateAnalysis, setClimateAnalysis] = useState<{ anomaly: string, prediction: string } | null>(null);
  
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
      const saved = localStorage.getItem('tempUnit');
      return (saved === 'Fahrenheit (°F)' || saved === 'F') ? 'F' : 'C';
  });

  const [windUnit, setWindUnit] = useState<'km/h' | 'mph' | 'knots'>(() => {
      const saved = localStorage.getItem('windUnit');
      if (saved === 'mph') return 'mph';
      if (saved === 'knots') return 'knots';
      return 'km/h';
  });

  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('windUnit', windUnit);
  }, [windUnit]);

  const [activeMetric, setActiveMetric] = useState('Temperature');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, time: string, temp: number, wind: number} | null>(null);
  const [hoveredWindPoint, setHoveredWindPoint] = useState<{x: number, y: number, time: string, temp: number, wind: number} | null>(null);
  const [alertVisible, setAlertVisible] = useState(true);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);

  const formatTemp = useCallback((c: number) => Math.round(tempUnit === 'C' ? c : c * 9/5 + 32), [tempUnit]);
  
  const formatWind = useCallback((kmh: number) => {
      if (windUnit === 'km/h') return Math.round(kmh);
      if (windUnit === 'mph') return Math.round(kmh * 0.621371);
      if (windUnit === 'knots') return Math.round(kmh * 0.539957);
      return Math.round(kmh);
  }, [windUnit]);

  const addToRecentLocations = useCallback((name: string, lat: number, lon: number) => {
      setRecentLocations(prev => {
          const filtered = prev.filter(loc => loc.name !== name && (Math.abs(loc.lat - lat) > 0.01 || Math.abs(loc.lon - lon) > 0.01));
          const newLocation = { name, lat, lon, timestamp: Date.now() };
          const updated = [newLocation, ...filtered].slice(0, 5);
          localStorage.setItem('recentLocations', JSON.stringify(updated));
          return updated;
      });
  }, []);

  const loadWeatherData = useCallback(async (lat: number, lon: number, cityName?: string) => {
    setLoading(true);
    setCurrentCoords({ lat, lon });
    setClimateAnalysis(null); // Reset analysis while loading
    
    try {
        const data = await fetchWeatherData(lat, lon);
        setWeather(data);
        setAlertVisible(true); 
        
        let finalName = cityName;

        if (!finalName) {
            try {
                finalName = await getCityFromCoordinates(lat, lon);
                setSearchQuery(finalName);
            } catch (e) {
                finalName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                setSearchQuery(finalName);
            }
        } else {
            setSearchQuery(finalName);
        }
        
        if (finalName) {
            addToRecentLocations(finalName, lat, lon);
            getClimateAnalysis(lat, lon).then(analysis => {
                setClimateAnalysis(analysis);
            });
        }
    } catch (error) {
        console.error("Error loading weather data:", error);
    } finally {
        setLoading(false);
    }
  }, [addToRecentLocations]);

  const handleRefresh = () => {
      loadWeatherData(currentCoords.lat, currentCoords.lon, searchQuery);
  };

  useEffect(() => {
    const savedRecents = localStorage.getItem('recentLocations');
    if (savedRecents) {
      try {
        setRecentLocations(JSON.parse(savedRecents));
      } catch (e) {
        console.error("Failed to parse recent locations", e);
      }
    }

    // Check if navigating from Explore with location data
    const storedCoords = sessionStorage.getItem('dashboardCoords');
    const storedLocation = sessionStorage.getItem('dashboardLocation');
    
    if (storedCoords && storedLocation) {
      try {
        const coords = JSON.parse(storedCoords);
        loadWeatherData(coords.lat, coords.lon, storedLocation);
        // Clean up sessionStorage after use
        sessionStorage.removeItem('dashboardCoords');
        sessionStorage.removeItem('dashboardLocation');
      } catch (e) {
        console.error("Failed to parse dashboard coords", e);
      }
    }
    // No default load - user must search or use location
  }, [loadWeatherData]);

  useEffect(() => {
      const handleEarthClickEvent = (e: CustomEvent) => {
          const { lat, lon } = e.detail;
          if (onLocationSelect) onLocationSelect(lat, lon);
          setLocationAccuracy(null); 
          loadWeatherData(lat, lon);
      };
      window.addEventListener('earth-click' as any, handleEarthClickEvent);
      return () => window.removeEventListener('earth-click' as any, handleEarthClickEvent);
  }, [onLocationSelect, loadWeatherData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && showSuggestions) {
        const results = await getLocationSuggestions(searchQuery);
        setSuggestions(results);
        setSelectedSuggestionIndex(-1);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showSuggestions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setLocationAccuracy(null); 
    
    const coords = await getCoordinates(suggestion);
    if (coords) {
      if (onLocationSelect) onLocationSelect(coords.lat, coords.lon);
      loadWeatherData(coords.lat, coords.lon, suggestion);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationAccuracy(null); 
    if (searchQuery.trim()) {
        const coords = await getCoordinates(searchQuery);
        if (coords) {
          if (onLocationSelect) onLocationSelect(coords.lat, coords.lon);
          loadWeatherData(coords.lat, coords.lon, searchQuery);
        }
    }
  };
  
  const handleUseLocation = () => {
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
              async (position) => {
                  const { latitude, longitude, accuracy } = position.coords;
                  if (onLocationSelect) onLocationSelect(latitude, longitude);
                  setLocationAccuracy(Math.round(accuracy)); 
                  loadWeatherData(latitude, longitude, "Current Location");
              },
              (error) => {
                  console.error("Geolocation error:", error);
                  alert("Could not retrieve your location.");
              }
          );
      } else {
          alert("Geolocation is not supported by this browser.");
      }
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      onNavigateProfile();
    } else if (onAuthClick) {
      onAuthClick();
    }
  };

  const handleRecentClick = (loc: RecentLocation) => {
      if (onLocationSelect) onLocationSelect(loc.lat, loc.lon);
      setSearchQuery(loc.name);
      setLocationAccuracy(null); 
      loadWeatherData(loc.lat, loc.lon, loc.name);
  };

  const getIcon = (code: number) => {
    const type = getWeatherIconType(code);
    switch(type) {
        case 'cloud': return Cloud;
        case 'rain': return CloudRain;
        case 'snow': return CloudSnow;
        case 'storm': return CloudLightning;
        default: return Sun;
    }
  };

  const getAlert = () => {
      if (!weather) return null;
      
      if (weather.current.temperature > 35) return { type: 'Heatwave Warning', message: `Extreme heat detected (${formatTemp(weather.current.temperature)}°). Stay hydrated and avoid sun.`, icon: Flame, color: 'text-orange-500', border: 'border-orange-500', bg: 'bg-orange-500/10', animate: true };
      if (weather.current.temperature < -10) return { type: 'Deep Freeze', message: `Temperatures are critically low (${formatTemp(weather.current.temperature)}°). Risk of frostbite.`, icon: Thermometer, color: 'text-blue-300', border: 'border-blue-300', bg: 'bg-blue-300/10', animate: true };
      if (weather.current.windSpeed > 100) return { type: 'Hurricane Warning', message: `Hurricane force winds (${formatWind(weather.current.windSpeed)} ${windUnit}). Seek shelter immediately.`, icon: Wind, color: 'text-red-600', border: 'border-red-600', bg: 'bg-red-600/10', animate: true };
      if ([95, 96, 99].includes(weather.current.weatherCode)) return { type: 'Severe Thunderstorm', message: 'Lightning and heavy rain expected. Stay indoors.', icon: CloudLightning, color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400/10', animate: false };
      if ([71, 73, 75, 85, 86].includes(weather.current.weatherCode) && weather.current.windSpeed > 40) return { type: 'Blizzard Conditions', message: 'Heavy snow and high winds. Visibility reduced.', icon: CloudSnow, color: 'text-white', border: 'border-white', bg: 'bg-white/10', animate: true };
      if (weather.current.uvIndex >= 8) return { type: 'High UV Index', message: `UV Index is ${weather.current.uvIndex}. Use sun protection.`, icon: Sun, color: 'text-pink-500', border: 'border-pink-500', bg: 'bg-pink-500/10', animate: false };
      if (weather.aqi > 150) return { type: 'Poor Air Quality', message: `AQI is ${weather.aqi}. Limit outdoor activities.`, icon: Activity, color: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-500/10', animate: false };
      
      return null;
  };

  const calculateSafetyScore = () => {
      if (!weather) return { score: 0, color: 'text-gray-500', bg: 'bg-gray-500/20', label: 'Loading', description: 'Analyzing...', needleRotation: 0 };
      
      let score = 100;
      let desc = 'Conditions are optimal.';

      if (weather.aqi > 50) { score -= (weather.aqi - 50) / 2; desc = 'Air quality is deteriorating.'; }
      if (weather.current.temperature > 35) { score -= (weather.current.temperature - 35) * 3; desc = 'Extreme heat risk.'; }
      if (weather.current.temperature < 0) { score -= Math.abs(weather.current.temperature) * 2; desc = 'Freezing conditions.'; }
      if (weather.current.windSpeed > 30) { score -= (weather.current.windSpeed - 30); desc = 'High wind advisory.'; }
      if ([95, 96, 99].includes(weather.current.weatherCode)) { score -= 40; desc = 'Storm alert active.'; }

      score = Math.max(0, Math.min(100, Math.round(score)));
      const needleRotation = (score / 100) * 180 - 90; // -90 to 90 degrees

      if (score >= 70) return { score, color: 'text-green-400', bg: 'bg-green-400/10', stroke: '#4ade80', label: 'Safe', description: desc, needleRotation };
      if (score >= 40) return { score, color: 'text-yellow-400', bg: 'bg-yellow-400/10', stroke: '#facc15', label: 'Moderate', description: desc, needleRotation };
      return { score, color: 'text-red-500', bg: 'bg-red-500/10', stroke: '#ef4444', label: 'Unsafe', description: desc, needleRotation };
  };

  const activeAlert = getAlert();
  const safety = calculateSafetyScore();

  return (
    <div className="absolute inset-0 w-full h-screen text-white overflow-hidden font-sans selection:bg-[#00C2FF] selection:text-black animate-fade-in z-20 pointer-events-auto">
      
      {/* Top Bar */}
      <div className="absolute top-4 left-[340px] right-4 z-20 flex items-center justify-between">
        {/* Search Area */}
        <div className="pointer-events-auto w-full max-w-md relative">
           <form onSubmit={handleSearch} className="relative group z-50">
            <div className="absolute inset-0 bg-[#00C2FF]/5 rounded-xl blur-lg group-hover:bg-[#00C2FF]/10 transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative flex items-center bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-colors hover:border-white/20">
              <Search className="w-5 h-5 text-gray-400 ml-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search city, Pincode (India/US), or region..."
                className="w-full bg-transparent border-none outline-none text-sm text-white px-4 py-3 placeholder-gray-500"
              />
            </div>
          </form>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 animate-fade-in">
               {suggestions.map((suggestion, index) => (
                 <button
                   key={index}
                   onClick={() => handleSuggestionClick(suggestion)}
                   className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors border-b border-white/5 last:border-0 ${
                     index === selectedSuggestionIndex ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                   }`}
                 >
                   <MapPin className={`w-4 h-4 mr-3 ${index === selectedSuggestionIndex ? 'text-white' : 'text-[#00C2FF]'}`} />
                   {suggestion}
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* Top Right Controls */}
        <div className="pointer-events-auto flex items-center space-x-3">
          <button 
            onClick={() => onNavigateTo && onNavigateTo('admin')}
            className="flex items-center px-4 py-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors text-[#00C2FF]"
          >
            <LayoutTemplate className="w-4 h-4 mr-2" />
            Admin Panel
          </button>

          <button 
            onClick={onNavigateAlerts}
            className="flex items-center px-4 py-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors text-red-400"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Global Alerts
          </button>
          <button 
            onClick={onNavigateProfile}
            className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </button>
          
          <button 
            onClick={onNavigateNotifications}
            className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00C2FF] rounded-full"></span>
          </button>

          <button 
            onClick={handleProfileClick}
            className={`w-9 h-9 rounded-full bg-[#1E2330] border flex items-center justify-center transition-all shadow-lg overflow-hidden ${isLoggedIn ? 'border-[#00C2FF]' : 'border-white/20 hover:border-white'}`}
            title={isLoggedIn ? 'Profile' : 'Log In'}
          >
             {isLoggedIn ? (
               <div className="w-full h-full bg-gradient-to-br from-[#FFE4C4] to-[#FFDAB9] flex items-end justify-center">
                  <User className="w-7 h-7 text-gray-600 translate-y-1" /> 
               </div>
             ) : (
               <User className="w-5 h-5 text-gray-300" />
             )}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlert && alertVisible && (
        <div className="absolute top-20 left-[340px] right-4 z-30 pointer-events-auto animate-slide-up">
           <div className={`border backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-lg ${activeAlert.bg} ${activeAlert.border} ${activeAlert.animate ? 'animate-pulse' : ''}`}>
               <div className="flex items-center">
                   <div className={`w-8 h-8 rounded-full bg-black/20 flex items-center justify-center mr-3 flex-shrink-0`}>
                      <activeAlert.icon className={`w-4 h-4 ${activeAlert.color}`} />
                   </div>
                   <div>
                      <h4 className={`${activeAlert.color} text-sm font-bold`}>{activeAlert.type}</h4>
                      <p className="text-gray-200 text-xs">{activeAlert.message}</p>
                   </div>
               </div>
               <button 
                   onClick={() => setAlertVisible(false)} 
                   className="p-1 hover:bg-black/20 rounded-full text-gray-300 hover:text-white transition-colors"
               >
                   <X className="w-4 h-4" />
               </button>
           </div>
        </div>
      )}

      {/* Map Controls (Right Side) */}
      <div className="absolute top-24 right-4 z-20 flex flex-col space-y-2 pointer-events-auto">
        <button 
            onClick={onZoomIn}
            className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 text-gray-300 transition-transform active:scale-95"
            title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button 
            onClick={onZoomOut}
            className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 text-gray-300 transition-transform active:scale-95"
            title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button 
            onClick={handleUseLocation}
            className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 text-[#00C2FF] mt-2 transition-transform active:scale-95"
            title="Use My Location"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Left Sidebar */}
      <div className="absolute top-4 bottom-4 left-4 w-[300px] flex flex-col space-y-4 z-10 pointer-events-auto overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Header */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#0088BB] flex items-center justify-center shadow-lg">
                 <Globe className="w-5 h-5 text-white" />
               </div>
               <div>
                 <h1 className="text-sm font-bold">MicroClimate</h1>
                 <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                    {searchQuery}
                 </p>
                 {/* Location Accuracy Indicator */}
                 {locationAccuracy !== null && (
                    <span className="inline-block mt-0.5 text-[9px] text-[#00C2FF] bg-[#00C2FF]/10 px-1.5 py-0.5 rounded font-medium border border-[#00C2FF]/20">
                      Accuracy: ±{locationAccuracy}m
                    </span>
                 )}
               </div>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                    className={`text-gray-500 hover:text-[#00C2FF] transition-colors p-1 rounded-full hover:bg-white/5 ${loading ? 'animate-spin text-[#00C2FF]' : ''}`}
                    title="Refresh Data"
                    disabled={loading}
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={onNavigateHome} className="text-gray-500 hover:text-white transition-colors p-1" title="Back to Home">
                    <ArrowLeft className="w-4 h-4" />
                </button>
            </div>
          </div>
          
          {/* Unit Toggles */}
          <div className="bg-[#161B26] rounded-lg p-1.5 flex flex-col gap-1.5">
            {/* Temp Toggle */}
            <div className="flex bg-black/20 rounded p-0.5">
                <button 
                  onClick={() => setTempUnit('C')}
                  className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${tempUnit === 'C' ? 'bg-[#00C2FF] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  °C
                </button>
                <button 
                  onClick={() => setTempUnit('F')}
                  className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${tempUnit === 'F' ? 'bg-[#00C2FF] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  °F
                </button>
            </div>
            {/* Wind Toggle */}
            <div className="flex bg-black/20 rounded p-0.5">
                <button 
                  onClick={() => setWindUnit('km/h')}
                  className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${windUnit === 'km/h' ? 'bg-teal-400 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  km/h
                </button>
                <button 
                  onClick={() => setWindUnit('mph')}
                  className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${windUnit === 'mph' ? 'bg-teal-400 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  mph
                </button>
                 <button 
                  onClick={() => setWindUnit('knots')}
                  className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${windUnit === 'knots' ? 'bg-teal-400 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  kn
                </button>
            </div>
          </div>
        </div>

        {/* Improved Microclimate Gauge Meter */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-5 shrink-0 mb-4 transform transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Safety Meter</h3>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${safety.bg} ${safety.color} border-opacity-30`}>
                    {safety.label.toUpperCase()}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                 {/* Semi-Circle Gauge */}
                 <div className="relative w-24 h-12 overflow-hidden">
                     <div className="absolute bottom-0 left-0 w-full h-full bg-[#1E2330] rounded-t-full"></div>
                     <div 
                        className={`absolute bottom-0 left-0 w-full h-full rounded-t-full origin-bottom transition-transform duration-1000`}
                        style={{ 
                            background: `conic-gradient(from 180deg, ${safety.stroke} 0%, transparent ${safety.score}%, transparent 100%)`,
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                        }}
                     ></div>
                     {/* Needle */}
                     <div 
                        className="absolute bottom-0 left-1/2 w-1 h-full bg-white origin-bottom transition-transform duration-1000 ease-out z-10"
                        style={{ transform: `translateX(-50%) rotate(${safety.needleRotation}deg)` }}
                     >
                         <div className="w-2 h-2 bg-white rounded-full absolute bottom-0 left-1/2 -translate-x-1/2"></div>
                     </div>
                     {/* Mask to create arc thickness */}
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 bg-[#0B0E14] rounded-t-full z-0"></div>
                 </div>
                 
                 <div className="flex-1">
                     <span className="text-2xl font-bold text-white block leading-none mb-1">{safety.score}</span>
                     <p className="text-[9px] text-gray-400">Live Score</p>
                 </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5">
                 <p className={`text-xs font-medium leading-tight ${safety.color}`}>
                     {safety.description}
                 </p>
            </div>
        </div>

        {/* Metrics List */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shrink-0">
           {loading ? (
               <div className="p-8 space-y-3">
                   <div className="h-8 bg-white/5 rounded animate-pulse"></div>
                   <div className="h-8 bg-white/5 rounded animate-pulse delay-75"></div>
                   <div className="h-8 bg-white/5 rounded animate-pulse delay-150"></div>
               </div>
           ) : (
              <>
                <button
                  onClick={() => setActiveMetric('Temperature')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2 hover:bg-white/5 ${activeMetric === 'Temperature' ? 'border-[#00C2FF] bg-[#00C2FF]/10 text-white' : 'border-transparent text-gray-400'}`}
                >
                   <div className="flex items-center">
                       <Thermometer className={`w-4 h-4 mr-3 ${activeMetric === 'Temperature' ? 'text-[#00C2FF]' : 'text-gray-500'}`} />
                       <span>Temperature</span>
                   </div>
                   <span className="font-mono text-white">{formatTemp(weather?.current.temperature || 0)}°{tempUnit}</span>
                </button>

                <button
                  onClick={() => setActiveMetric('Humidity')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2 hover:bg-white/5 ${activeMetric === 'Humidity' ? 'border-blue-400 bg-blue-400/10 text-white' : 'border-transparent text-gray-400'}`}
                >
                   <div className="flex items-center">
                       <Droplets className={`w-4 h-4 mr-3 ${activeMetric === 'Humidity' ? 'text-blue-400' : 'text-gray-500'}`} />
                       <span>Humidity</span>
                   </div>
                   <span className="font-mono text-white">{weather?.current.humidity}%</span>
                </button>

                <button
                  onClick={() => setActiveMetric('Wind')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2 hover:bg-white/5 ${activeMetric === 'Wind' ? 'border-teal-400 bg-teal-400/10 text-white' : 'border-transparent text-gray-400'}`}
                >
                   <div className="flex items-center">
                       <Wind className={`w-4 h-4 mr-3 ${activeMetric === 'Wind' ? 'text-teal-400' : 'text-gray-500'}`} />
                       <span>Wind Speed</span>
                   </div>
                   <span className="font-mono text-white">{formatWind(weather?.current.windSpeed || 0)} <span className="text-[9px]">{windUnit}</span></span>
                </button>

                {/* Enhanced UV Index */}
                <button className={`w-full flex flex-col px-4 py-3 text-sm transition-all border-l-2 border-transparent text-gray-400 hover:bg-white/5`}>
                   <div className="flex items-center justify-between w-full mb-1">
                       <div className="flex items-center">
                           <Sun className={`w-4 h-4 mr-3 text-orange-400`} />
                           <span>UV Index</span>
                       </div>
                       <span className="font-mono text-white">{weather?.current.uvIndex}</span>
                   </div>
                   <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                       <div 
                           className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-1000" 
                           style={{ width: `${Math.min((weather?.current.uvIndex || 0) * 10, 100)}%` }}
                       ></div>
                   </div>
                </button>

                {/* Enhanced AQI - Prominently Displayed */}
                <button className={`w-full flex flex-col px-4 py-3 text-sm transition-all border-l-2 border-transparent text-gray-400 hover:bg-white/5`}>
                   <div className="flex items-center justify-between w-full mb-1">
                       <div className="flex items-center">
                           <Activity className={`w-4 h-4 mr-3 text-green-400`} />
                           <span>AQI</span>
                       </div>
                       <div className="flex items-center">
                          <span className={`font-mono font-bold mr-2 ${(weather?.aqi || 0) > 100 ? 'text-red-400' : (weather?.aqi || 0) > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {weather?.aqi}
                          </span>
                          <span className="text-[9px] uppercase text-gray-500">
                             {(weather?.aqi || 0) <= 50 ? 'Good' : (weather?.aqi || 0) <= 100 ? 'Moderate' : 'Unhealthy'}
                          </span>
                       </div>
                   </div>
                   <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                       <div 
                           className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-purple-600 transition-all duration-1000" 
                           style={{ width: `${Math.min((weather?.aqi || 0) / 3, 100)}%` }}
                       ></div>
                   </div>
                </button>
              </>
           )}
        </div>

        {/* 7-Day Forecast Section - Enhanced with High/Low/Condition/Precip */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 transform transition-transform hover:scale-[1.01]">
          <h3 className="text-xs font-semibold text-gray-200 mb-3">7-Day Forecast</h3>
          {loading ? (
              <div className="space-y-2">
                  {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-6 bg-white/5 rounded animate-pulse"></div>)}
              </div>
          ) : (
              <div className="space-y-2">
                {weather?.daily.map((d, i) => {
                  const Icon = getIcon(d.code);
                  const label = getWeatherLabel(d.code);
                  const dayLabel = i === 0 ? 'Today' : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={i} className="group flex items-center justify-between text-xs p-1.5 hover:bg-white/5 rounded transition-colors relative cursor-default">
                        <span className="w-10 text-gray-400 font-medium">{dayLabel}</span>
                        
                        {/* Icon with tooltip */}
                        <div className="flex items-center justify-center w-8 relative">
                            <Icon className="w-4 h-4 text-gray-300 group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black border border-white/20 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {label}
                            </span>
                        </div>

                        <div className="flex items-center justify-center w-12 text-blue-400">
                            {false ? (
                                <>
                                   <Droplets className="w-3 h-3 mr-1" />
                                   <span className="text-[9px]">0%</span>
                                </>
                            ) : (
                                <span className="text-[9px] text-gray-600">-</span>
                            )}
                        </div>
                        <div className="flex items-center justify-end w-16 font-mono">
                            <span className="text-gray-500">{formatTemp(d.minTemp)}°</span>
                            <span className="text-gray-700 mx-1">/</span>
                            <span className="text-white">{formatTemp(d.maxTemp)}°</span>
                        </div>
                    </div>
                  );
                })}
              </div>
          )}
        </div>

        {/* Hourly Temp Graph */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-2 transform transition-transform hover:scale-[1.01]">
          <h3 className="text-xs font-semibold text-gray-200 mb-2">Hourly Temp Trend</h3>
          <div className="w-full bg-[#161B26] rounded-lg relative overflow-hidden flex flex-col h-24" onMouseLeave={() => setHoveredPoint(null)}>
             {weather && weather.hourly && weather.hourly.length > 0 ? (
               (() => {
                 // Robust Filter: Ensure temp is a number and not NaN
                 const validHourly = weather.hourly.filter(h => typeof h.temperature === 'number' && !isNaN(h.temperature));
                 
                 // Fallback if no valid data found
                 if (validHourly.length === 0) return <div className="h-full flex items-center justify-center text-[10px] text-gray-500">No data available</div>;

                 const temps = validHourly.map(h => h.temperature);
                 const min = Math.min(...temps);
                 const max = Math.max(...temps);
                 
                 const range = max - min;
                 // Handle flat line case (range is 0)
                 const padding = range === 0 ? 2 : range * 0.2;
                 const effectiveMin = min - padding;
                 const effectiveRange = range === 0 ? padding * 2 : range + (padding * 2);

                 const points = validHourly.map((h, i) => {
                    const x = validHourly.length > 1 
                        ? (i / (validHourly.length - 1)) * 100 
                        : 50; // Center if only 1 point
                    
                    let y = 50;
                    if (effectiveRange !== 0) {
                         y = 100 - ((h.temperature - effectiveMin) / effectiveRange) * 100;
                    }
                    return {x, y, temp: h.temperature, wind: h.windSpeed, time: h.time};
                 });

                 // Create Path
                 // If only 1 point, handle gracefully
                 const lineD = points.length > 1 
                    ? `M ${points.map(p => `${p.x},${p.y}`).join(' ')}`
                    : `M 0,${points[0].y} L 100,${points[0].y}`;

                 const pathD = `${lineD} L 100,100 L 0,100 Z`;

                 return (
                    <div className="relative w-full h-full group">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                           <defs>
                               <linearGradient id="gradTemp" x1="0%" y1="0%" x2="0%" y2="100%">
                                   <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.4" />
                                   <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
                               </linearGradient>
                           </defs>
                           <path d={pathD} fill="url(#gradTemp)" className="animate-fade-in" />
                           <path d={lineD} fill="none" stroke="#00C2FF" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-line" />
                           {/* Pulse Dot at end */}
                           {points.length > 0 && (
                             <circle cx={points[points.length-1].x + '%'} cy={points[points.length-1].y + '%'} r="3" fill="white" className="animate-pulse" />
                           )}
                        </svg>
                        
                        <span className="absolute right-1 top-0 text-[8px] text-gray-600 font-mono">{formatTemp(max)}°</span>
                        <span className="absolute right-1 bottom-0 text-[8px] text-gray-600 font-mono">{formatTemp(min)}°</span>

                        <div className="absolute inset-0 w-full h-full flex items-stretch">
                           {points.map((p, i) => (
                               <div 
                                   key={i}
                                   className="flex-1 hover:bg-white/5 relative group/point cursor-pointer"
                                   onMouseEnter={() => setHoveredPoint(p)}
                               >
                                   <div 
                                       className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/point:opacity-100 shadow-[0_0_8px_#00C2FF] pointer-events-none transition-opacity"
                                       style={{ 
                                           top: `${p.y}%`, 
                                           left: '50%', 
                                           transform: 'translate(-50%, -50%)' 
                                       }}
                                   />
                               </div>
                           ))}
                        </div>

                        {hoveredPoint && (
                            <div 
                               className="absolute bg-[#0B0E14]/95 backdrop-blur-md border border-white/20 rounded-lg p-2 pointer-events-none z-50 shadow-2xl min-w-[100px] animate-scale-in"
                               style={{ 
                                   left: `${hoveredPoint.x}%`, 
                                   top: `${hoveredPoint.y}%`, 
                                   transform: `translate(${hoveredPoint.x < 20 ? '10px' : hoveredPoint.x > 80 ? '-110%' : '-50%'}, -120%)`
                               }}
                            >
                               <div className="text-gray-400 text-[10px] font-medium mb-1.5 pb-1 border-b border-white/10 flex items-center justify-between">
                                   <span>{new Date(hoveredPoint.time).toLocaleDateString([], {weekday: 'short'})}</span>
                                   <span>{new Date(hoveredPoint.time).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</span>
                               </div>
                               <div className="space-y-1">
                                   <div className="flex items-center justify-between text-[10px]">
                                       <span className="text-gray-400 flex items-center"><Thermometer className="w-3 h-3 mr-1"/> Temp</span>
                                       <span className="text-[#00C2FF] font-bold font-mono">{formatTemp(hoveredPoint.temp)}°{tempUnit}</span>
                                   </div>
                                   <div className="flex items-center justify-between text-[10px]">
                                       <span className="text-gray-400 flex items-center"><Wind className="w-3 h-3 mr-1"/> Wind</span>
                                       <span className="text-teal-400 font-bold font-mono">{formatWind(hoveredPoint.wind)} {windUnit}</span>
                                   </div>
                               </div>
                            </div>
                        )}
                    </div>
                 );
               })()
             ) : (
                loading && <div className="h-full w-full animate-pulse bg-white/5 rounded-lg"></div>
             )}
          </div>
        </div>

        {/* Hourly Wind Graph */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4 transform transition-transform hover:scale-[1.01]">
          <h3 className="text-xs font-semibold text-gray-200 mb-2">Hourly Wind Trend</h3>
          <div className="w-full bg-[#161B26] rounded-lg relative overflow-hidden flex flex-col h-24" onMouseLeave={() => setHoveredWindPoint(null)}>
             {weather && weather.hourly && weather.hourly.length > 0 ? (
               (() => {
                 const validHourly = weather.hourly.filter(h => typeof h.windSpeed === 'number' && !isNaN(h.windSpeed));
                 if (validHourly.length === 0) return <div className="h-full flex items-center justify-center text-[10px] text-gray-500">No data available</div>;

                 const winds = validHourly.map(h => h.windSpeed);
                 const min = Math.min(...winds);
                 const max = Math.max(...winds);
                 
                 const range = max - min;
                 const padding = range === 0 ? 2 : range * 0.2;
                 const effectiveMin = Math.max(0, min - padding);
                 const effectiveRange = range === 0 ? padding * 2 : range + (padding * 2);

                 const points = validHourly.map((h, i) => {
                    const x = validHourly.length > 1 
                        ? (i / (validHourly.length - 1)) * 100 
                        : 50;
                    let y = 50;
                    if (effectiveRange !== 0) {
                         y = 100 - ((h.windSpeed - effectiveMin) / effectiveRange) * 100;
                    }
                    return {x, y, temp: h.temperature, wind: h.windSpeed, time: h.time};
                 });

                 const lineD = points.length > 1
                    ? `M ${points.map(p => `${p.x},${p.y}`).join(' ')}`
                    : `M 0,${points[0].y} L 100,${points[0].y}`;

                 const pathD = `${lineD} L 100,100 L 0,100 Z`;

                 return (
                    <div className="relative w-full h-full group">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                           <defs>
                               <linearGradient id="gradWind" x1="0%" y1="0%" x2="0%" y2="100%">
                                   <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                                   <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                               </linearGradient>
                           </defs>
                           <path d={pathD} fill="url(#gradWind)" className="animate-fade-in" />
                           <path d={lineD} fill="none" stroke="#2dd4bf" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-line" />
                           {/* Pulse Dot */}
                           {points.length > 0 && (
                             <circle cx={points[points.length-1].x + '%'} cy={points[points.length-1].y + '%'} r="3" fill="white" className="animate-pulse" />
                           )}
                        </svg>
                        
                        <span className="absolute right-1 top-0 text-[8px] text-gray-600 font-mono">{formatWind(max)}</span>
                        <span className="absolute right-1 bottom-0 text-[8px] text-gray-600 font-mono">{formatWind(min)}</span>

                        <div className="absolute inset-0 w-full h-full flex items-stretch">
                           {points.map((p, i) => (
                               <div 
                                   key={i}
                                   className="flex-1 hover:bg-white/5 relative group/point cursor-pointer"
                                   onMouseEnter={() => setHoveredWindPoint(p)}
                               >
                                   <div 
                                       className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/point:opacity-100 shadow-[0_0_8px_#2dd4bf] pointer-events-none transition-opacity"
                                       style={{ 
                                           top: `${p.y}%`, 
                                           left: '50%', 
                                           transform: 'translate(-50%, -50%)' 
                                       }}
                                   />
                               </div>
                           ))}
                        </div>

                        {hoveredWindPoint && (
                            <div 
                               className="absolute bg-[#0B0E14]/95 backdrop-blur-md border border-white/20 rounded-lg p-2 pointer-events-none z-50 shadow-2xl min-w-[100px] animate-scale-in"
                               style={{ 
                                   left: `${hoveredWindPoint.x}%`, 
                                   top: `${hoveredWindPoint.y}%`, 
                                   transform: `translate(${hoveredWindPoint.x < 20 ? '10px' : hoveredWindPoint.x > 80 ? '-110%' : '-50%'}, -120%)`
                               }}
                            >
                               <div className="text-gray-400 text-[10px] font-medium mb-1.5 pb-1 border-b border-white/10 flex items-center justify-between">
                                   <span>{new Date(hoveredWindPoint.time).toLocaleDateString([], {weekday: 'short'})}</span>
                                   <span>{new Date(hoveredWindPoint.time).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</span>
                               </div>
                               <div className="space-y-1">
                                   <div className="flex items-center justify-between text-[10px]">
                                       <span className="text-gray-400 flex items-center"><Thermometer className="w-3 h-3 mr-1"/> Temp</span>
                                       <span className="text-[#00C2FF] font-bold font-mono">{formatTemp(hoveredWindPoint.temp)}°{tempUnit}</span>
                                   </div>
                                   <div className="flex items-center justify-between text-[10px]">
                                       <span className="text-gray-400 flex items-center"><Wind className="w-3 h-3 mr-1"/> Wind</span>
                                       <span className="text-teal-400 font-bold font-mono">{formatWind(hoveredWindPoint.wind)} {windUnit}</span>
                                   </div>
                               </div>
                            </div>
                        )}
                    </div>
                 );
               })()
             ) : (
                loading && <div className="h-full w-full animate-pulse bg-white/5 rounded-lg"></div>
             )}
          </div>
        </div>

        {/* Precipitation */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4 transform transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-200">Daily Rain Chance</h3>
              <CloudRain className="w-3 h-3 text-blue-400" />
          </div>
          {loading ? (
              <div className="h-24 bg-white/5 rounded animate-pulse"></div>
          ) : (
              <div className="flex items-end justify-between h-24 space-x-2 px-1">
                  {weather?.daily.map((d, i) => {
                      const prob = 0; // precipProb not available
                      const dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                          <div key={i} className="flex flex-col items-center flex-1 group">
                              <div className="relative w-full bg-[#161B26] rounded-t-sm overflow-hidden h-16 flex items-end">
                                  <div 
                                    className="w-full bg-blue-500/80 transition-all duration-1000 ease-out group-hover:bg-blue-400"
                                    style={{ height: `${prob}%` }}
                                  ></div>
                              </div>
                              <span className="text-[9px] text-blue-400 font-bold mt-1">{prob}%</span>
                              <span className="text-[8px] text-gray-500 uppercase">{dayLabel}</span>
                          </div>
                      );
                  })}
              </div>
          )}
        </div>

        {/* Interactive Portals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pointer-events-auto z-20">
            {/* Anomaly Portal */}
            <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-red-500/20 rounded-2xl p-5 relative overflow-hidden group transition-all hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <h3 className="text-sm font-bold text-red-400 flex items-center"><Zap className="w-4 h-4 mr-2 animate-pulse"/> Anomaly Reports</h3>
                    <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">Live Feed</span>
                </div>
                <div className="relative z-10 min-h-[60px]">
                    {loading ? (
                        <div className="space-y-2">
                            <div className="h-3 bg-red-500/10 rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-red-500/10 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-300 leading-relaxed">
                            {climateAnalysis ? climateAnalysis.anomaly : "Scanning local telemetry for thermal anomalies..."}
                        </p>
                    )}
                </div>
            </div>

            {/* Prediction Portal */}
            <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-[#00C2FF]/20 rounded-2xl p-5 relative overflow-hidden group transition-all hover:border-[#00C2FF]/40 hover:shadow-[0_0_20px_rgba(0,194,255,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <h3 className="text-sm font-bold text-[#00C2FF] flex items-center"><Radar className="w-4 h-4 mr-2 animate-spin-slow"/> Prediction Model</h3>
                    <span className="text-[10px] bg-[#00C2FF]/20 text-[#00C2FF] px-2 py-0.5 rounded border border-[#00C2FF]/30">AI Forecast</span>
                </div>
                <div className="relative z-10 min-h-[60px]">
                     {loading ? (
                        <div className="space-y-2">
                            <div className="h-3 bg-[#00C2FF]/10 rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-[#00C2FF]/10 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-300 leading-relaxed">
                            {climateAnalysis ? climateAnalysis.prediction : "Calculating predictive atmospheric models..."}
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Recent Locations */}
        {recentLocations.length > 0 && (
          <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-200">Recent Locations</h3>
                <Clock className="w-3 h-3 text-gray-500" />
            </div>
            <div className="flex flex-col space-y-2">
               {recentLocations.map((loc, idx) => (
                 <button 
                   key={idx} 
                   onClick={() => handleRecentClick(loc)}
                   className="flex items-center justify-between w-full p-2 rounded-lg bg-[#161B26] hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10"
                 >
                    <div className="flex items-center">
                       <MapPin className="w-3 h-3 text-[#00C2FF] mr-2" />
                       <span className="text-[10px] text-gray-300 group-hover:text-white truncate max-w-[150px]">{loc.name}</span>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
