// /mnt/data/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Settings,
  ArrowLeft,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Sun,
  Plus,
  Minus,
  Crosshair,
  Globe,
  CloudRain,
  Cloud,
  User,
  Bell,
  AlertTriangle,
  MapPin,
  CloudSnow,
  CloudLightning,
  X,
  Clock,
  Flame,
  LayoutTemplate,
  RefreshCw,
} from "lucide-react";
import {
  getLocationSuggestions,
  getCoordinates,
  getCityFromCoordinates,
} from "../services/locationservice";
import { getWeatherIconType, getWeatherLabel } from "../services/weatherService";
import { fetchForecastByCity } from "../services/api";
import type { ForecastResponse } from "../services/api";

interface DashboardProps {
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateNotifications?: () => void;
  onNavigateAlerts?: () => void;
}

interface ExtendedDashboardProps extends DashboardProps {
  onNavigateTo?: (
    view:
      | "landing"
      | "dashboard"
      | "profile"
      | "notifications"
      | "alerts"
      | "admin"
      | "explore"
  ) => void;
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

type HoverPoint = {
  x: number;
  y: number;
  time: string;
  temp: number;
  wind?: number;
};

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
  isLoggedIn,
}) => {
  // --- Local state ---
  const [searchQuery, setSearchQuery] = useState("San Francisco, CA");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  // current coords used for refresh etc. Default to SF.
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number }>(
    { lat: 37.7749, lon: -122.4194 }
  );

  const [tempUnit, setTempUnit] = useState<"C" | "F">(() => {
    const saved = localStorage.getItem("tempUnit");
    return saved === "F" || saved === "Fahrenheit (°F)" ? "F" : "C";
  });

  const [windUnit, setWindUnit] = useState<"km/h" | "mph" | "knots">(() => {
    const saved = localStorage.getItem("windUnit");
    if (saved === "mph") return "mph";
    if (saved === "knots") return "knots";
    return "km/h";
  });

  useEffect(() => {
    localStorage.setItem("tempUnit", tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem("windUnit", windUnit);
  }, [windUnit]);

  const [activeMetric, setActiveMetric] = useState("Temperature");
  const [weather, setWeather] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [hoveredPoint, setHoveredPoint] = useState<HoverPoint | null>(null);
  const [hoveredWindPoint, setHoveredWindPoint] = useState<HoverPoint | null>(null);

  const [alertVisible, setAlertVisible] = useState(true);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);

  // --- Helpers ---
  const formatTemp = useCallback(
    (c: number) => Math.round(tempUnit === "C" ? c : c * (9 / 5) + 32),
    [tempUnit]
  );
  const formatWind = useCallback(
    (kmh: number) => {
      if (windUnit === "km/h") return Math.round(kmh);
      if (windUnit === "mph") return Math.round(kmh * 0.621371);
      if (windUnit === "knots") return Math.round(kmh * 0.539957);
      return Math.round(kmh);
    },
    [windUnit]
  );

  const addToRecentLocations = useCallback((name: string, lat: number, lon: number) => {
    setRecentLocations((prev) => {
      const filtered = prev.filter(
        (loc) => loc.name !== name && (Math.abs(loc.lat - lat) > 0.01 || Math.abs(loc.lon - lon) > 0.01)
      );
      const newLocation = { name, lat, lon, timestamp: Date.now() };
      const updated = [newLocation, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("recentLocations", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const extractCityName = (s?: string) => {
    if (!s) return "";
    return s.split(",")[0].trim();
  };

  // loadWeatherData now uses backend forecast by city name (safe)
  const loadWeatherData = useCallback(
    async (lat: number, lon: number, cityName?: string) => {
      setLoading(true);
      // maintain current coords for refresh
      setCurrentCoords({ lat, lon });

      try {
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

        // use only the primary city name when calling backend
        const cityForBackend = extractCityName(finalName);

        const data = await fetchForecastByCity(cityForBackend);
        if (!data) throw new Error("No data returned from backend");

        // backend may return lat/lon; if so, update current coords
        // (not all backends do — fail gracefully)
        // @ts-ignore
        if (typeof data.lat === "number" && typeof data.lon === "number") {
          // update coords if available
          // don't overwrite with zeros
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const newLat = (data as any).lat;
          const newLon = (data as any).lon;
          if (!isNaN(newLat) && !isNaN(newLon)) {
            setCurrentCoords({ lat: newLat, lon: newLon });
            if (onLocationSelect) onLocationSelect(newLat, newLon);
          }
        }

        setWeather(data);
        setAlertVisible(true);

        if (finalName) {
          try {
            // try to get coords from our locationservice for recents
            const coords = await getCoordinates(finalName).catch(() => null);
            if (coords && coords.lat && coords.lon) {
              addToRecentLocations(finalName, coords.lat, coords.lon);
            } else {
              addToRecentLocations(finalName, lat, lon);
            }
          } catch {
            addToRecentLocations(finalName, lat, lon);
          }
        }
      } catch (error) {
        console.error("Error loading weather data:", error);
      } finally {
        setLoading(false);
      }
    },
    [addToRecentLocations, onLocationSelect]
  );

  const handleRefresh = async () => {
    await loadWeatherData(currentCoords.lat, currentCoords.lon, searchQuery);
  };

  // Initial Load
  useEffect(() => {
    const savedRecents = localStorage.getItem("recentLocations");
    if (savedRecents) {
      try {
        setRecentLocations(JSON.parse(savedRecents));
      } catch (e) {
        console.error("Failed to parse recent locations", e);
      }
    }

    (async () => {
      // Use the extracted city name to call backend cleanly
      const initialCity = extractCityName(searchQuery) || "San Francisco";
      try {
        const data = await fetchForecastByCity(initialCity);
        if (data) {
          setWeather(data);
          // @ts-ignore
          if (typeof data.lat === "number" && typeof data.lon === "number") {
            // @ts-ignore
            setCurrentCoords({ lat: data.lat, lon: data.lon });
          }
        } else {
          // fallback to calling our loadWeatherData with coords
          await loadWeatherData(37.7749, -122.4194, "San Francisco, CA");
        }
      } catch (e) {
        // fallback: use coords
        await loadWeatherData(37.7749, -122.4194, "San Francisco, CA");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Listen for Earth Click Events
  useEffect(() => {
    const handleEarthClickEvent = (e: Event) => {
      // some emitters used CustomEvent; handle both shapes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (e as any).detail || {};
      const lat = Number(detail.lat);
      const lon = Number(detail.lon);
      if (isNaN(lat) || isNaN(lon)) return;

      (async () => {
        try {
          if (onLocationSelect) onLocationSelect(lat, lon);
          setLocationAccuracy(null);
          const city = await getCityFromCoordinates(lat, lon);
          await loadWeatherData(lat, lon, city);
        } catch (err) {
          await loadWeatherData(lat, lon);
        }
      })();
    };

    window.addEventListener("earth-click", handleEarthClickEvent as EventListener);
    return () => window.removeEventListener("earth-click", handleEarthClickEvent as EventListener);
  }, [onLocationSelect, loadWeatherData]);

  // Debounced Autocomplete Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && showSuggestions) {
        try {
          const results = await getLocationSuggestions(searchQuery);
          setSuggestions(results || []);
          setSelectedSuggestionIndex(-1);
        } catch (e) {
          setSuggestions([]);
        }
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

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      }
      // else let form submit handle it
    } else if (e.key === "Escape") {
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

    try {
      const coords = await getCoordinates(suggestion).catch(() => null);
      // call backend using just the city name part
      const cityForBackend = extractCityName(suggestion);
      const data = await fetchForecastByCity(cityForBackend);
      if (data) {
        setWeather(data);
        // update coords from response if available
        // @ts-ignore
        if (typeof data.lat === "number" && typeof data.lon === "number") {
          // @ts-ignore
          setCurrentCoords({ lat: data.lat, lon: data.lon });
        } else if (coords) {
          setCurrentCoords({ lat: coords.lat, lon: coords.lon });
        }
        addToRecentLocations(suggestion, coords?.lat ?? currentCoords.lat, coords?.lon ?? currentCoords.lon);
        if (onLocationSelect && coords) onLocationSelect(coords.lat, coords.lon);
      }
    } catch (e) {
      console.error("Suggestion search failed:", e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationAccuracy(null);

    if (searchQuery.trim()) {
      try {
        const cityForBackend = extractCityName(searchQuery);
        const data = await fetchForecastByCity(cityForBackend);
        if (data) {
          setWeather(data);
          // update coords if backend returned them
          // @ts-ignore
          if (typeof data.lat === "number" && typeof data.lon === "number") {
            // @ts-ignore
            setCurrentCoords({ lat: data.lat, lon: data.lon });
            // @ts-ignore
            if (onLocationSelect) onLocationSelect(data.lat, data.lon);
          } else {
            // fallback: try to resolve coordinates for recents
            const coords = await getCoordinates(searchQuery).catch(() => null);
            if (coords) {
              setCurrentCoords({ lat: coords.lat, lon: coords.lon });
              addToRecentLocations(searchQuery, coords.lat, coords.lon);
            }
          }
        }
      } catch (err) {
        console.error("Search failed:", err);
      }
    }
  };

  const handleUseLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (onLocationSelect) onLocationSelect(latitude, longitude);
        setLocationAccuracy(Math.round(accuracy));
        try {
          const city = await getCityFromCoordinates(latitude, longitude);
          await loadWeatherData(latitude, longitude, city);
        } catch (err) {
          await loadWeatherData(latitude, longitude);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not retrieve your location.");
      }
    );
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      onNavigateProfile();
    } else if (onAuthClick) {
      onAuthClick();
    }
  };

  const handleRecentClick = async (loc: RecentLocation) => {
    if (onLocationSelect) onLocationSelect(loc.lat, loc.lon);
    setSearchQuery(loc.name);
    setLocationAccuracy(null);
    await loadWeatherData(loc.lat, loc.lon, loc.name);
  };

  const getIcon = (code: number) => {
    const type = getWeatherIconType(code);
    switch (type) {
      case "cloud":
        return Cloud;
      case "rain":
        return CloudRain;
      case "snow":
        return CloudSnow;
      case "storm":
        return CloudLightning;
      default:
        return Sun;
    }
  };

  // Alert Logic - Checks thresholds to generate critical alerts
  const getAlert = () => {
    if (!weather || !weather.current) return null;

    const cur = weather.current;
    // guard values
    const temp = typeof cur.temperature === "number" ? cur.temperature : NaN;
    const wind = typeof cur.windSpeed === "number" ? cur.windSpeed : NaN;
    const code = typeof cur.weatherCode === "number" ? cur.weatherCode : NaN;

    if (!isNaN(temp) && temp > 35)
      return {
        type: "Heatwave Warning",
        message: `Extreme heat detected (${formatTemp(temp)}°). Stay hydrated and avoid sun.`,
        icon: Flame,
        color: "text-orange-500",
        border: "border-orange-500",
        bg: "bg-orange-500/10",
        animate: true,
      };
    if (!isNaN(temp) && temp < -10)
      return {
        type: "Deep Freeze",
        message: `Temperatures are critically low (${formatTemp(temp)}°). Risk of frostbite.`,
        icon: Thermometer,
        color: "text-blue-300",
        border: "border-blue-300",
        bg: "bg-blue-300/10",
        animate: true,
      };

    if (!isNaN(wind) && wind > 100)
      return {
        type: "Hurricane Warning",
        message: `Hurricane force winds (${formatWind(wind)} ${windUnit}). Seek shelter immediately.`,
        icon: Wind,
        color: "text-red-600",
        border: "border-red-600",
        bg: "bg-red-600/10",
        animate: true,
      };

    if ([95, 96, 99].includes(code))
      return {
        type: "Severe Thunderstorm",
        message: "Lightning and heavy rain expected. Stay indoors.",
        icon: CloudLightning,
        color: "text-yellow-400",
        border: "border-yellow-400",
        bg: "bg-yellow-400/10",
        animate: false,
      };

    if ([71, 73, 75, 85, 86].includes(code) && !isNaN(wind) && wind > 40)
      return {
        type: "Blizzard Conditions",
        message: "Heavy snow and high winds. Visibility reduced.",
        icon: CloudSnow,
        color: "text-white",
        border: "border-white",
        bg: "bg-white/10",
        animate: true,
      };

    if (weather.current.uvIndex >= 8)
      return {
        type: "High UV Index",
        message: `UV Index is ${weather.current.uvIndex}. Use sun protection.`,
        icon: Sun,
        color: "text-pink-500",
        border: "border-pink-500",
        bg: "bg-pink-500/10",
        animate: false,
      };

    if ((weather.aqi || 0) > 150)
      return {
        type: "Poor Air Quality",
        message: `AQI is ${weather.aqi}. Limit outdoor activities.`,
        icon: Activity,
        color: "text-purple-500",
        border: "border-purple-500",
        bg: "bg-purple-500/10",
        animate: false,
      };

    return null;
  };

  const activeAlert = getAlert();

  // --- Render ---
  return (
    <div className="relative w-full h-screen text-white overflow-hidden font-sans selection:bg-[#00C2FF] selection:text-black pointer-events-none">
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
                placeholder="Search for a new location"
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
                    index === selectedSuggestionIndex ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <MapPin className={`w-4 h-4 mr-3 ${index === selectedSuggestionIndex ? "text-white" : "text-[#00C2FF]"}`} />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top Right Controls */}
        <div className="pointer-events-auto flex items-center space-x-3">
          <button
            onClick={() => onNavigateTo && onNavigateTo("admin")}
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
            className={`w-9 h-9 rounded-full bg-[#1E2330] border flex items-center justify-center transition-all shadow-lg overflow-hidden ${
              isLoggedIn ? "border-[#00C2FF]" : "border-white/20 hover:border-white"
            }`}
            title={isLoggedIn ? "Profile" : "Log In"}
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
        <div className="absolute top-20 left-[340px] right-4 z-30 pointer-events-auto animate-fade-in">
          <div
            className={`border backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-lg ${activeAlert.bg} ${activeAlert.border} ${
              activeAlert.animate ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center mr-3 flex-shrink-0">
                <activeAlert.icon className={`w-4 h-4 ${activeAlert.color}`} />
              </div>
              <div>
                <h4 className={`${activeAlert.color} text-sm font-bold`}>{activeAlert.type}</h4>
                <p className="text-gray-200 text-xs">{activeAlert.message}</p>
              </div>
            </div>
            <button onClick={() => setAlertVisible(false)} className="p-1 hover:bg-black/20 rounded-full text-gray-300 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Map Controls (Right Side) */}
      <div className="absolute top-24 right-4 z-20 flex flex-col space-y-2 pointer-events-auto">
        <button onClick={onZoomIn} className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 text-gray-300" title="Zoom In">
          <Plus className="w-5 h-5" />
        </button>
        <button onClick={onZoomOut} className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 text-gray-300" title="Zoom Out">
          <Minus className="w-5 h-5" />
        </button>
        <button onClick={handleUseLocation} className="p-2 bg-[#0B0E14]/80 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 text-[#00C2FF] mt-2" title="Use My Location">
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Left Sidebar */}
      <div className="absolute top-4 bottom-4 left-4 w-[300px] flex flex-col space-y-4 z-20 pointer-events-auto overflow-y-auto pr-2 custom-scrollbar">
        {/* Header */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#0088BB] flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold">MicroClimate</h1>
                <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{searchQuery}</p>
                {/* Location Accuracy Indicator */}
                {locationAccuracy !== null && (
                  <span className="inline-block mt-0.5 text-[9px] text-[#00C2FF] bg-[#00C2FF]/10 px-1.5 py-0.5 rounded font-medium border border-[#00C2FF]/20">
                    Accuracy: ±{locationAccuracy}m
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={(e) => { e.stopPropagation(); handleRefresh(); }} className={`text-gray-500 hover:text-[#00C2FF] transition-colors p-1 rounded-full hover:bg-white/5 ${loading ? "animate-spin text-[#00C2FF]" : ""}`} title="Refresh Data" disabled={loading}>
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
              <button onClick={() => setTempUnit("C")} className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${tempUnit === "C" ? "bg-[#00C2FF] text-black shadow-sm" : "text-gray-400 hover:text-white"}`}>°C</button>
              <button onClick={() => setTempUnit("F")} className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${tempUnit === "F" ? "bg-[#00C2FF] text-black shadow-sm" : "text-gray-400 hover:text-white"}`}>°F</button>
            </div>
            {/* Wind Toggle */}
            <div className="flex bg-black/20 rounded p-0.5">
              <button onClick={() => setWindUnit("km/h")} className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${windUnit === "km/h" ? "bg-teal-400 text-black shadow-sm" : "text-gray-400 hover:text-white"}`}>km/h</button>
              <button onClick={() => setWindUnit("mph")} className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${windUnit === "mph" ? "bg-teal-400 text-black shadow-sm" : "text-gray-400 hover:text-white"}`}>mph</button>
              <button onClick={() => setWindUnit("knots")} className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${windUnit === "knots" ? "bg-teal-400 text-black shadow-sm" : "text-gray-400 hover:text-white"}`}>kn</button>
            </div>
          </div>
        </div>

        {/* Metrics List */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shrink-0">
          {loading ? (
            <div className="p-8 flex justify-center text-gray-500 text-xs">Loading data...</div>
          ) : (
            <>
              <button onClick={() => setActiveMetric("Temperature")} className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2 hover:bg-white/5 ${activeMetric === "Temperature" ? "border-[#00C2FF] bg-[#00C2FF]/10 text-white" : "border-transparent text-gray-400"}`}>
                <div className="flex items-center">
                  <Thermometer className={`w-4 h-4 mr-3 ${activeMetric === "Temperature" ? "text-[#00C2FF]" : "text-gray-500"}`} />
                  <span>Temperature</span>
                </div>
                <span className="font-mono text-white">{weather?.current ? `${formatTemp(weather.current.temperature)}°${tempUnit}` : "--"}</span>
              </button>

              <button onClick={() => setActiveMetric("Humidity")} className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2 hover:bg-white/5 ${activeMetric === "Humidity" ? "border-blue-400 bg-blue-400/10 text-white" : "border-transparent text-gray-400"}`}>
                <div className="flex items-center">
                  <Droplets className={`w-4 h-4 mr-3 ${activeMetric === "Humidity" ? "text-blue-400" : "text-gray-500"}`} />
                  <span>Humidity</span>
                </div>
                <span className="font-mono text-white">{weather?.current ? `${weather.current.humidity}%` : "--"}</span>
              </button>

              <button onClick={() => setActiveMetric("Wind")} className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-l-2 hover:bg-white/5 ${activeMetric === "Wind" ? "border-teal-400 bg-teal-400/10 text-white" : "border-transparent text-gray-400"}`}>
                <div className="flex items-center">
                  <Wind className={`w-4 h-4 mr-3 ${activeMetric === "Wind" ? "text-teal-400" : "text-gray-500"}`} />
                  <span>Wind Speed</span>
                </div>
                <span className="font-mono text-white">{weather?.current ? `${formatWind(weather.current.windSpeed)} ` : "--"} <span className="text-[9px]">{windUnit}</span></span>
              </button>

              {/* UV Index */}
              <button className={`w-full flex flex-col px-4 py-3 text-sm transition-all border-l-2 border-transparent text-gray-400 hover:bg-white/5`}>
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center">
                    <Sun className={`w-4 h-4 mr-3 text-orange-400`} />
                    <span>UV Index</span>
                  </div>
                  <span className="font-mono text-white">{weather?.current ? weather.current.uvIndex : "--"}</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" style={{ width: `${Math.min((weather?.current?.uvIndex || 0) * 10, 100)}%` }} />
                </div>
              </button>

              {/* AQI */}
              <button className={`w-full flex flex-col px-4 py-3 text-sm transition-all border-l-2 border-transparent text-gray-400 hover:bg-white/5`}>
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center">
                    <Activity className={`w-4 h-4 mr-3 text-green-400`} />
                    <span>AQI</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`font-mono font-bold mr-2 ${(weather?.aqi || 0) > 100 ? "text-red-400" : (weather?.aqi || 0) > 50 ? "text-yellow-400" : "text-green-400"}`}>
                      {weather?.aqi ?? "--"}
                    </span>
                    <span className="text-[9px] uppercase text-gray-500">{(weather?.aqi || 0) <= 50 ? "Good" : (weather?.aqi || 0) <= 100 ? "Moderate" : "Unhealthy"}</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-purple-600" style={{ width: `${Math.min((weather?.aqi || 0) / 3, 100)}%` }} />
                </div>
              </button>
            </>
          )}
        </div>

        {/* 7-Day Forecast */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0">
          <h3 className="text-xs font-semibold text-gray-200 mb-3">7-Day Forecast</h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {weather?.daily?.map((d, i) => {
                const Icon = getIcon(d.code);
                const label = getWeatherLabel(d.code);
                const dayLabel = i === 0 ? "Today" : new Date(d.date).toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <div key={i} className="group flex items-center justify-between text-xs p-1.5 hover:bg-white/5 rounded transition-colors relative cursor-default">
                    <span className="w-10 text-gray-400 font-medium">{dayLabel}</span>

                    <div className="flex items-center justify-center w-8 relative">
                      <Icon className="w-4 h-4 text-gray-300" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black border border-white/20 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {label}
                      </span>
                    </div>

                    <div className="flex items-center justify-center w-12 text-blue-400">
                      <span className="text-[9px] text-gray-600">-</span>
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
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-2">
          <h3 className="text-xs font-semibold text-gray-200 mb-2">Hourly Temp Trend</h3>
          <div className="w-full bg-[#161B26] rounded-lg relative overflow-hidden flex flex-col h-24" onMouseLeave={() => setHoveredPoint(null)}>
            {weather?.hourly && weather.hourly.length > 0 ? (
              (() => {
                const validHourly = weather.hourly.filter((h) => typeof h.temperature === "number" && !isNaN(h.temperature));
                if (validHourly.length === 0) return <div className="h-full flex items-center justify-center text-[10px] text-gray-500">No data available</div>;

                const temps = validHourly.map((h) => h.temperature);
                const min = Math.min(...temps);
                const max = Math.max(...temps);

                const range = max - min;
                const padding = range === 0 ? 2 : range * 0.2;
                const effectiveMin = min - padding;
                const effectiveRange = range === 0 ? padding * 2 : range + padding * 2;

                const points = validHourly.map((h, i) => {
                  const x = validHourly.length > 1 ? (i / (validHourly.length - 1)) * 100 : 50;
                  let y = 50;
                  if (effectiveRange !== 0) {
                    y = 100 - ((h.temperature - effectiveMin) / effectiveRange) * 100;
                  }
                  return { x, y, temp: h.temperature, time: h.time } as HoverPoint;
                });

                const lineD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(" ")}` : `M 0,${points[0].y} L 100,${points[0].y}`;
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
                      <path d={pathD} fill="url(#gradTemp)" />
                      <path d={lineD} fill="none" stroke="#00C2FF" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <span className="absolute right-1 top-0 text-[8px] text-gray-600 font-mono">{formatTemp(max)}°</span>
                    <span className="absolute right-1 bottom-0 text-[8px] text-gray-600 font-mono">{formatTemp(min)}°</span>

                    <div className="absolute inset-0 w-full h-full flex items-stretch">
                      {points.map((p, i) => (
                        <div key={i} className="flex-1 hover:bg-white/5 relative group/point cursor-pointer" onMouseEnter={() => setHoveredPoint(p)}>
                          <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/point:opacity-100 shadow-[0_0_8px_#00C2FF] pointer-events-none" style={{ top: `${p.y}%`, left: "50%", transform: "translate(-50%, -50%)" }} />
                        </div>
                      ))}
                    </div>

                    {hoveredPoint && (
                      <div className="absolute bg-[#0B0E14]/95 backdrop-blur-md border border-white/20 rounded-lg p-2 pointer-events-none z-50 shadow-2xl min-w-[100px]" style={{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y}%`, transform: `translate(${hoveredPoint.x < 20 ? "10px" : hoveredPoint.x > 80 ? "-110%" : "-50%"}, -120%)` }}>
                        <div className="text-gray-400 text-[10px] font-medium mb-1.5 pb-1 border-b border-white/10 flex items-center justify-between">
                          <span>{new Date(hoveredPoint.time).toLocaleDateString([], { weekday: "short" })}</span>
                          <span>{new Date(hoveredPoint.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400 flex items-center">
                              <Thermometer className="w-3 h-3 mr-1" /> Temp
                            </span>
                            <span className="text-[#00C2FF] font-bold font-mono">{formatTemp(hoveredPoint.temp)}°{tempUnit}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              loading && <div className="h-full flex items-center justify-center text-[10px] text-gray-500">Loading...</div>
            )}
          </div>
        </div>

        {/* Hourly Wind Graph */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
          <h3 className="text-xs font-semibold text-gray-200 mb-2">Hourly Wind Trend</h3>
          <div className="w-full bg-[#161B26] rounded-lg relative overflow-hidden flex flex-col h-24" onMouseLeave={() => setHoveredWindPoint(null)}>
            {weather?.hourly && weather.hourly.length > 0 ? (
              (() => {
                // filter by hourly windSpeed
                const validHourly = weather.hourly.filter((h) => typeof h.windSpeed === "number" && !isNaN(h.windSpeed));
                if (validHourly.length === 0) return <div className="h-full flex items-center justify-center text-[10px] text-gray-500">No data available</div>;

                const winds = validHourly.map((h) => h.windSpeed);
                const min = Math.min(...winds);
                const max = Math.max(...winds);

                const range = max - min;
                const padding = range === 0 ? 2 : range * 0.2;
                const effectiveMin = Math.max(0, min - padding);
                const effectiveRange = range === 0 ? padding * 2 : range + padding * 2;

                const points = validHourly.map((h, i) => {
                  const x = validHourly.length > 1 ? (i / (validHourly.length - 1)) * 100 : 50;
                  let y = 50;
                  if (effectiveRange !== 0) {
                    y = 100 - ((h.windSpeed - effectiveMin) / effectiveRange) * 100;
                  }
                  return { x, y, temp: h.temperature, wind: h.windSpeed, time: h.time } as HoverPoint;
                });

                const lineD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(" ")}` : `M 0,${points[0].y} L 100,${points[0].y}`;
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
                      <path d={pathD} fill="url(#gradWind)" />
                      <path d={lineD} fill="none" stroke="#2dd4bf" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <span className="absolute right-1 top-0 text-[8px] text-gray-600 font-mono">{formatWind(max)}</span>
                    <span className="absolute right-1 bottom-0 text-[8px] text-gray-600 font-mono">{formatWind(min)}</span>

                    <div className="absolute inset-0 w-full h-full flex items-stretch">
                      {points.map((p, i) => (
                        <div key={i} className="flex-1 hover:bg-white/5 relative group/point cursor-pointer" onMouseEnter={() => setHoveredWindPoint(p)}>
                          <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover/point:opacity-100 shadow-[0_0_8px_#2dd4bf] pointer-events-none" style={{ top: `${p.y}%`, left: "50%", transform: "translate(-50%, -50%)" }} />
                        </div>
                      ))}
                    </div>

                    {hoveredWindPoint && (
                      <div className="absolute bg-[#0B0E14]/95 backdrop-blur-md border border-white/20 rounded-lg p-2 pointer-events-none z-50 shadow-2xl min-w-[100px]" style={{ left: `${hoveredWindPoint.x}%`, top: `${hoveredWindPoint.y}%`, transform: `translate(${hoveredWindPoint.x < 20 ? "10px" : hoveredWindPoint.x > 80 ? "-110%" : "-50%"}, -120%)` }}>
                        <div className="text-gray-400 text-[10px] font-medium mb-1.5 pb-1 border-b border-white/10 flex items-center justify-between">
                          <span>{new Date(hoveredWindPoint.time).toLocaleDateString([], { weekday: "short" })}</span>
                          <span>{new Date(hoveredWindPoint.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400 flex items-center">
                              <Thermometer className="w-3 h-3 mr-1" /> Temp
                            </span>
                            <span className="text-[#00C2FF] font-bold font-mono">{formatTemp(hoveredWindPoint.temp)}°{tempUnit}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400 flex items-center">
                              <Wind className="w-3 h-3 mr-1" /> Wind
                            </span>
                            <span className="text-teal-400 font-bold font-mono">{formatWind(hoveredWindPoint.wind ?? 0)} {windUnit}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              loading && <div className="h-full flex items-center justify-center text-[10px] text-gray-500">Loading...</div>
            )}
          </div>
        </div>

        {/* Precipitation */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-200">Daily Rain Chance</h3>
            <CloudRain className="w-3 h-3 text-blue-400" />
          </div>
          {loading ? (
            <div className="h-24 bg-white/5 rounded animate-pulse" />
          ) : (
            <div className="flex items-end justify-between h-24 space-x-2 px-1">
              {weather?.daily?.map((d, i) => {
                const prob = 0;
                const dayLabel = new Date(d.date).toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full bg-[#161B26] rounded-t-sm overflow-hidden h-16 flex items-end">
                      <div className="w-full bg-blue-500/80 transition-all duration-500 group-hover:bg-blue-400" style={{ height: `${prob}%` }} />
                    </div>
                    <span className="text-[9px] text-blue-400 font-bold mt-1">{prob}%</span>
                    <span className="text-[8px] text-gray-500 uppercase">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
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
                <button key={idx} onClick={() => handleRecentClick(loc)} className="flex items-center justify-between w-full p-2 rounded-lg bg-[#161B26] hover:bg-white/5 transition-colors group">
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

export default Dashboard;
