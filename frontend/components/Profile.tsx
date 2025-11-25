
import React, { useState, useEffect } from 'react';
import { 
  Bell, Settings, User, LogOut, Shield, MapPin, 
  ChevronDown, Diamond, ArrowLeft, LayoutTemplate, Clock
} from 'lucide-react';
import { UserData } from '../App';

interface ProfileProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'profile' | 'admin' | 'explore' | 'alerts' | 'notifications') => void;
  onLogout: () => void;
  user: UserData | null;
  onLocationSelect?: (lat: number, lon: number) => void;
}

type TabType = 'account' | 'settings' | 'saved' | 'security';

interface SavedLoc {
    name: string;
    lat: number;
    lon: number;
    timestamp: number;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate, onLogout, user, onLocationSelect }) => {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  
  // Form States
  const [name, setName] = useState(user?.name || 'Alex Johnson');
  const [email, setEmail] = useState(user?.email || 'alex.johnson@email.com');
  
  // Saved Locations State
  const [savedLocations, setSavedLocations] = useState<SavedLoc[]>([]);
  
  // Units with persistence (Initialize from localStorage)
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem('tempUnit') || 'Celsius (°C)');
  const [windUnit, setWindUnit] = useState(() => localStorage.getItem('windUnit') || 'km/h');

  // Save to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('windUnit', windUnit);
  }, [windUnit]);

  // Load recent locations from localStorage
  useEffect(() => {
      const recents = localStorage.getItem('recentLocations');
      if (recents) {
          try {
              setSavedLocations(JSON.parse(recents));
          } catch (e) {
              console.error("Failed to load locations");
          }
      }
  }, []);

  const handleLogout = () => {
    onLogout();
    onNavigate('landing');
  };

  const handleLocationClick = (loc: SavedLoc) => {
      if (onLocationSelect) {
          onLocationSelect(loc.lat, loc.lon);
      }
      onNavigate('dashboard');
  };

  const menuItems = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'saved', name: 'Saved Locations', icon: MapPin },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#00C2FF] selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="border-b border-white/5 bg-[#0B0E14] sticky top-0 z-30" role="banner" aria-label="Global Navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center cursor-pointer group focus:outline-none" 
              onClick={() => onNavigate('landing')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('landing')}
              role="button"
              tabIndex={0}
              aria-label="Go to Landing Page"
            >
              <div className="flex items-center justify-center w-8 h-8 mr-3 bg-[#00C2FF]/10 rounded-lg group-hover:bg-[#00C2FF]/20 transition-colors group-focus:ring-2 group-focus:ring-[#00C2FF]">
                <Diamond className="w-5 h-5 text-[#00C2FF] transform rotate-45" fill="currentColor" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-focus:underline">MicroClimate</span>
            </div>

            <div className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main Menu">
              <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors focus:text-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF] rounded px-2 py-1">Dashboard</button>
              <button onClick={() => onNavigate('explore')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors focus:text-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF] rounded px-2 py-1">Map Explorer</button>
              <button onClick={() => onNavigate('alerts')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors focus:text-white focus:outline-none focus:ring-2 focus:ring-[#00C2FF] rounded px-2 py-1">Data Insights</button>
              <span className="text-sm font-medium text-[#00C2FF] relative py-5 border-b-2 border-[#00C2FF]" aria-current="page">Profile</span>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                className="p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" aria-hidden="true" />
              </button>
              <button 
                onClick={() => onNavigate('notifications')}
                className="p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
                aria-label="Notifications, 1 unread"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#00C2FF] rounded-full border-2 border-[#0B0E14]" aria-hidden="true"></span>
              </button>
              <div 
                className="w-8 h-8 rounded-full bg-[#1E2330] border border-white/10 flex items-center justify-center overflow-hidden" 
                role="img" 
                aria-label="User Avatar"
              >
                 <div className="w-full h-full bg-gradient-to-br from-[#FFE4C4] to-[#FFDAB9] flex items-end justify-center">
                    <User className="w-6 h-6 text-gray-600 translate-y-1" aria-hidden="true" /> 
                 </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center text-gray-400 hover:text-[#00C2FF] mb-6 transition-colors group focus:outline-none focus:text-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF] rounded px-2 py-1 w-fit"
          aria-label="Back to Dashboard"
        >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="relative mb-8 p-6 rounded-2xl bg-[#161B26] border border-white/5 overflow-hidden" role="region" aria-label="User Info">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00C2FF] to-blue-600"></div>
          <div className="flex items-center space-x-6 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#1E2330] border-2 border-[#00C2FF] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,194,255,0.3)]">
                 <div className="w-full h-full bg-gradient-to-br from-[#FFE4C4] to-[#FFDAB9] flex items-end justify-center">
                    <User className="w-16 h-16 text-gray-600 translate-y-2" aria-hidden="true" /> 
                 </div>
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#00C2FF] rounded-full border-2 border-[#161B26] flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{name}</h1>
              <p className="text-gray-400 text-sm">{email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 space-y-1" role="tablist" aria-orientation="vertical" aria-label="Profile Sections">
            {menuItems.map((item) => (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={activeTab === item.id}
                aria-controls={`panel-${item.id}`}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C2FF] ${
                  activeTab === item.id ? 'bg-[#1E2330] text-white border-l-2 border-[#00C2FF] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 mr-3 ${activeTab === item.id ? 'text-[#00C2FF]' : 'text-gray-500'}`} aria-hidden="true" />
                {item.name}
              </button>
            ))}
            
            {/* Admin Panel Link */}
            <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
              <button 
                onClick={() => onNavigate('admin')}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
              >
                <LayoutTemplate className="w-4 h-4 mr-3 text-gray-500" aria-hidden="true" />
                Admin Panel
              </button>
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4 mr-3" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div 
            className="lg:col-span-3 bg-[#0B0E14] rounded-2xl border border-white/5 p-6 min-h-[500px]"
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === 'settings' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-semibold text-white mb-2">Settings</h2>
                <p className="text-gray-400 text-sm mb-8">Manage your application preferences and privacy.</p>

                <div className="mb-8">
                  <h3 className="text-[#00C2FF] text-sm font-semibold mb-4 uppercase tracking-wider">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="temp-unit" className="block text-sm font-medium text-gray-300">Temperature Units</label>
                      <div className="relative">
                        <select 
                          id="temp-unit"
                          value={tempUnit}
                          onChange={(e) => setTempUnit(e.target.value)}
                          className="w-full appearance-none bg-[#161B26] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-colors cursor-pointer"
                        >
                          <option value="Celsius (°C)">Celsius (°C)</option>
                          <option value="Fahrenheit (°F)">Fahrenheit (°F)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="wind-unit" className="block text-sm font-medium text-gray-300">Wind Speed Units</label>
                      <div className="relative">
                        <select 
                          id="wind-unit"
                          value={windUnit}
                          onChange={(e) => setWindUnit(e.target.value)}
                          className="w-full appearance-none bg-[#161B26] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-colors cursor-pointer"
                        >
                          <option value="km/h">km/h</option>
                          <option value="mph">mph</option>
                          <option value="knots">knots</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="animate-fade-in">
                 <h2 className="text-xl font-semibold text-white mb-2">Account Details</h2>
                 <div className="space-y-6 max-w-xl mt-6">
                   <div className="space-y-2">
                     <label htmlFor="full-name" className="block text-sm font-medium text-gray-300">Full Name</label>
                     <input 
                        id="full-name"
                        type="text" 
                        value={name} 
                        onChange={e=>setName(e.target.value)} 
                        className="w-full bg-[#161B26] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label htmlFor="email-address" className="block text-sm font-medium text-gray-300">Email Address</label>
                     <input 
                        id="email-address"
                        type="email" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        className="w-full bg-[#161B26] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF]" 
                     />
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'saved' && (
               <div className="animate-fade-in">
                 <h2 className="text-xl font-semibold text-white mb-2">Saved Locations</h2>
                 <p className="text-gray-400 text-sm mb-6">Access your pinned locations quickly.</p>
                 
                 {savedLocations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedLocations.map((loc, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleLocationClick(loc)} 
                                className="bg-[#161B26] border border-white/5 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#00C2FF]/50 transition-all group w-full text-left focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
                                aria-label={`View weather for ${loc.name}`}
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-[#00C2FF]/10 flex items-center justify-center mr-4 text-[#00C2FF]">
                                        <MapPin className="w-5 h-5" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-[#00C2FF] transition-colors">{loc.name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center mt-1">
                                            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                                            {new Date(loc.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                 ) : (
                    <div className="mt-6 p-8 bg-[#161B26] rounded-lg border border-white/5 text-center text-gray-500 text-sm flex flex-col items-center">
                        <MapPin className="w-8 h-8 mb-3 opacity-50" aria-hidden="true" />
                        No saved locations yet. Pin a location from the dashboard to see it here.
                    </div>
                 )}
               </div>
            )}

            {activeTab === 'security' && (
               <div className="animate-fade-in">
                 <h2 className="text-xl font-semibold text-white mb-2">Security</h2>
                 <p className="text-gray-400 text-sm">Update password and security settings.</p>
                 <div className="mt-6 p-4 bg-[#161B26] rounded-lg border border-white/5 text-center text-gray-500 text-sm" role="alert">
                    Security settings are managed by your organization provider in this demo.
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
