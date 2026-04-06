
import React, { useState } from 'react';
import { Search, Crosshair, Globe } from 'lucide-react';
import { getMicroclimateSnapshot } from '../services/geminiService';

interface HeroProps {
  onExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSnapshot(null);
    const result = await getMicroclimateSnapshot(searchQuery);
    setSnapshot(result);
    setLoading(false);
  };

  const handleUseLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLoading(true);
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setSearchQuery(coords);
          const result = await getMicroclimateSnapshot(`Coordinates: ${coords}`);
          setSnapshot(result);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Could not access your location. Please ensure permissions are granted.");
        }
      );
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center pt-20 sm:pt-32 min-h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Background Gradients (Over the 3D Earth) to ensure text readability */}
      <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent via-[#050505]/10 to-[#050505]/80 pointer-events-none"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white tracking-tight mb-6 drop-shadow-2xl">
          Visualize Earth’s <br/>
          <span className="text-white block mt-2">
            Microclimates
          </span>
        </h1>
        
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 mb-12 font-light leading-relaxed antialiased">
          Your World, In Detail. Explore high-resolution climate data from anywhere on the planet.
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-3xl mb-10 relative group">
          <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl blur-xl group-hover:bg-brand-accent/10 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
          <form onSubmit={handleSearch} className="relative flex items-center w-full h-16 bg-[#1E2330]/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 hover:border-white/20 hover:bg-[#1E2330]/60 transition-all shadow-2xl">
            <Search className="w-6 h-6 text-gray-400 mr-4" />
            <input 
              type="text" 
              placeholder="Search for city, region, or enter Pincode/Zip..." 
              className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg font-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent ml-2"></div>
            )}
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-lg">
          <button 
            onClick={handleUseLocation}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-xl bg-[#0B0E14]/60 hover:bg-[#1E2330]/80 text-brand-accent font-medium border border-white/10 backdrop-blur-md transition-all duration-200 group"
          >
            <Crosshair className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
            Use My Location
          </button>
          
          <button 
            onClick={onExplore}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-xl bg-brand-accent hover:bg-brand-accentHover text-black font-bold transition-all duration-200 shadow-[0_0_20px_rgba(0,194,255,0.2)] hover:shadow-[0_0_30px_rgba(0,194,255,0.4)]"
          >
            <Globe className="w-5 h-5 mr-3" />
            Explore Earth
          </button>
        </div>

        {/* Quick Result Display (Hidden if no search) */}
        {snapshot && (
          <div className="mt-10 p-6 bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 rounded-xl max-w-2xl w-full text-left animate-fade-in-up shadow-2xl z-20">
            <h3 className="text-brand-accent text-sm font-semibold uppercase tracking-wider mb-2">Microclimate Snapshot</h3>
            <p className="text-gray-200 leading-relaxed">{snapshot}</p>
          </div>
        )}

      </div>
    </div>
  );
};
