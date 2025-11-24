
import React, { useState } from 'react';
import { 
  LayoutGrid, Map as MapIcon, Layers, Users, Bell, Settings, 
  ChevronDown, AlertTriangle, MessageSquare, Shield, Download, Check, ArrowLeft,
  Plus, Star, Clock, MoreHorizontal, Search, ExternalLink
} from 'lucide-react';
import { UserData } from '../App';

interface NotificationsPageProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'explore') => void;
  user: UserData | null;
  onLocationSelect?: (lat: number, lon: number) => void;
}

interface Notification {
  id: number;
  type: 'warning' | 'comment' | 'system' | 'update';
  title: string;
  time: string;
  message: string;
  read: boolean;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate, user, onLocationSelect }) => {
  const [activeSection, setActiveSection] = useState<'notifications' | 'team' | 'maps' | 'layers'>('notifications');
  const [filter, setFilter] = useState('All');
  
  // Mock Notification Data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'warning',
      title: 'High UV Index Warning',
      time: '5m ago',
      message: "A UV index of 11 is forecast for your 'Downtown Core' map.",
      read: false,
      icon: AlertTriangle,
      color: 'text-red-500',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      id: 2,
      type: 'comment',
      title: 'Alex Chen commented on your map',
      time: '30m ago',
      message: "Shared map: 'Frost Anomaly Zone'.",
      read: false,
      icon: MessageSquare,
      color: 'text-green-500',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 3,
      type: 'system',
      title: 'Your user role has been updated',
      time: '2h ago',
      message: "Your new role is 'Administrator' with expanded permissions.",
      read: true,
      icon: Shield,
      color: 'text-blue-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 4,
      type: 'update',
      title: 'System Update: New Data Layer',
      time: 'Yesterday',
      message: "A new precipitation data layer is now available for all regions.",
      read: true,
      icon: Download,
      color: 'text-cyan-500',
      borderColor: 'border-cyan-500',
      bgColor: 'bg-cyan-500/10'
    }
  ]);

  // Sidebar Items
  const sidebarItems = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutGrid, action: () => onNavigate('dashboard') },
    { name: 'Maps', id: 'maps', icon: MapIcon, action: () => setActiveSection('maps') },
    { name: 'Data Layers', id: 'layers', icon: Layers, action: () => setActiveSection('layers') },
    { name: 'Team', id: 'team', icon: Users, action: () => setActiveSection('team') },
    { name: 'Notifications', id: 'notifications', icon: Bell, action: () => setActiveSection('notifications') },
  ];

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
      if (filter === 'All') return true;
      if (filter === 'Warnings') return n.type === 'warning';
      if (filter === 'System') return n.type === 'system' || n.type === 'update';
      if (filter === 'Comments') return n.type === 'comment';
      return true;
  });

  // --- RENDERERS ---

  const renderNotificationsView = () => (
     <div className="animate-fade-in">
        <header className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-bold">Notification Center</h1>
            <button 
              onClick={markAllRead}
              className="flex items-center px-4 py-2 bg-[#1E2330] hover:bg-[#2a3040] rounded-lg text-sm font-medium transition-colors border border-white/5"
            >
                <Check className="w-4 h-4 mr-2" />
                Mark All as Read
            </button>
        </header>

        {/* Filters & Sort */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex space-x-2">
                {['All', 'Warnings', 'System', 'Comments'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === tab 
                                ? 'bg-[#1E2330] text-white border border-white/10' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <button className="flex items-center text-sm text-gray-400 hover:text-white">
                Sort: Newest First
                <ChevronDown className="w-4 h-4 ml-1" />
            </button>
        </div>

        {/* Notification List */}
        <div className="space-y-4">
            {filteredNotifications.length > 0 ? filteredNotifications.map((notif) => (
                <div 
                    key={notif.id} 
                    className={`group relative bg-[#0B0E14] border border-white/5 rounded-xl p-5 pl-6 flex items-start hover:bg-[#11141A] transition-all overflow-hidden animate-fade-in ${!notif.read ? 'bg-[#0B0E14]' : 'opacity-75'}`}
                >
                    {/* Left Border Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${notif.bgColor} ${notif.borderColor} border-l-4 ${!notif.read ? 'opacity-100' : 'opacity-30'}`}></div>
                    
                    <div className={`mt-1 p-2 rounded-lg bg-[#1E2330] mr-4 shrink-0`}>
                        <notif.icon className={`w-5 h-5 ${notif.color}`} />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                            <h3 className={`text-base font-semibold ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                              {notif.title}
                              {!notif.read && <span className="inline-block w-2 h-2 bg-[#00C2FF] rounded-full ml-2 mb-0.5"></span>}
                            </h3>
                            <span className="text-xs text-gray-500">{notif.time}</span>
                        </div>
                        <p className="text-sm text-gray-400">{notif.message}</p>
                    </div>
                </div>
            )) : (
              <div className="text-center py-12 text-gray-500">No notifications in this category.</div>
            )}
        </div>
     </div>
  );

  const renderTeamView = () => (
     <div className="animate-fade-in">
         <header className="flex items-center justify-between mb-10">
             <div>
                <h1 className="text-3xl font-bold mb-2">Team Members</h1>
                <p className="text-gray-400">Manage collaborators and project roles.</p>
             </div>
             <button className="flex items-center px-4 py-2 bg-[#00C2FF] text-black font-bold rounded-lg hover:bg-[#00A0D6] transition-colors">
                 <Plus className="w-4 h-4 mr-2" /> Invite Member
             </button>
         </header>

         <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden">
             {[
                 { name: user?.name || 'Alex Johnson', role: 'Owner', email: 'alex.johnson@microclimate.io', status: 'Online', color: 'bg-green-500' },
                 { name: 'Sarah Connor', role: 'Editor', email: 'sarah.c@microclimate.io', status: 'Offline', color: 'bg-gray-500' },
                 { name: 'Dr. Aris', role: 'Meteorologist', email: 'aris@research.edu', status: 'Online', color: 'bg-green-500' },
                 { name: 'Mike Ross', role: 'Viewer', email: 'm.ross@partners.com', status: 'In Meeting', color: 'bg-yellow-500' },
             ].map((member, i) => (
                 <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-[#161B26] transition-colors">
                     <div className="flex items-center">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center mr-4 border border-white/10">
                             <span className="font-bold text-white">{member.name.charAt(0)}</span>
                         </div>
                         <div>
                             <h3 className="font-bold text-white">{member.name}</h3>
                             <p className="text-sm text-gray-500">{member.email}</p>
                         </div>
                     </div>
                     <div className="flex items-center space-x-6">
                         <span className="px-3 py-1 rounded-full bg-[#1E2330] border border-white/10 text-xs font-medium text-gray-300">{member.role}</span>
                         <div className="flex items-center">
                             <div className={`w-2 h-2 rounded-full ${member.color} mr-2`}></div>
                             <span className="text-sm text-gray-400">{member.status}</span>
                         </div>
                         <button className="p-2 text-gray-500 hover:text-white transition-colors">
                             <MoreHorizontal className="w-5 h-5" />
                         </button>
                     </div>
                 </div>
             ))}
         </div>
     </div>
  );

  const renderMapsView = () => (
      <div className="animate-fade-in">
         <header className="flex items-center justify-between mb-10">
             <div>
                <h1 className="text-3xl font-bold mb-2">Saved Maps</h1>
                <p className="text-gray-400">Access your saved visualizations and shared projects.</p>
             </div>
             <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input 
                    type="text" 
                    placeholder="Search maps..." 
                    className="w-full bg-[#161B26] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-white focus:border-[#00C2FF] focus:outline-none"
                 />
             </div>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
                 { title: 'Downtown Heat Map', date: 'Edited 2h ago', type: 'Thermal', loc: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
                 { title: 'Coastal Erosion Model', date: 'Edited yesterday', type: 'Topographic', loc: 'Pacific Coast', lat: 36.6002, lon: -121.8947 },
                 { title: 'Storm Track Analysis', date: 'Edited Oct 24', type: 'Atmospheric', loc: 'Atlantic Ocean', lat: 25.0, lon: -60.0 },
                 { title: 'Urban Air Quality', date: 'Edited Oct 20', type: 'AQI Sensor', loc: 'New York, NY', lat: 40.7128, lon: -74.0060 },
             ].map((map, i) => (
                 <div key={i} className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden group hover:border-[#00C2FF]/50 transition-all">
                     <div className="h-40 bg-[#1E2330] relative">
                         {/* Mock Map Preview */}
                         <div className="absolute inset-0 flex items-center justify-center">
                             <MapIcon className="w-12 h-12 text-gray-600 opacity-20" />
                         </div>
                         <div className="absolute top-3 right-3">
                             <button className="p-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-gray-300 hover:text-white transition-colors">
                                 <Star className="w-4 h-4" />
                             </button>
                         </div>
                     </div>
                     <div className="p-5">
                         <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold text-[#00C2FF] uppercase tracking-wide">{map.type}</span>
                             <span className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {map.date}</span>
                         </div>
                         <h3 className="text-lg font-bold text-white mb-1">{map.title}</h3>
                         <p className="text-sm text-gray-400 mb-4">{map.loc}</p>
                         
                         <button 
                            onClick={() => {
                                if (onLocationSelect) onLocationSelect(map.lat, map.lon);
                                onNavigate('explore');
                            }}
                            className="w-full py-2 bg-[#161B26] hover:bg-[#00C2FF] hover:text-black text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center"
                         >
                             Open Map <ExternalLink className="w-3 h-3 ml-2" />
                         </button>
                     </div>
                 </div>
             ))}
             
             {/* Create New Card */}
             <button 
                onClick={() => onNavigate('explore')}
                className="bg-[#161B26]/50 border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center h-full min-h-[300px] hover:bg-[#161B26] hover:border-[#00C2FF]/50 transition-all group"
             >
                 <div className="w-16 h-16 rounded-full bg-[#1E2330] flex items-center justify-center mb-4 group-hover:bg-[#00C2FF]/20 transition-colors">
                     <Plus className="w-8 h-8 text-gray-400 group-hover:text-[#00C2FF]" />
                 </div>
                 <span className="text-lg font-bold text-gray-300 group-hover:text-white">Create New Map</span>
             </button>
         </div>
      </div>
  );

  const renderLayersView = () => (
      <div className="flex items-center justify-center h-[60vh] text-center">
          <div>
              <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Data Layers Library</h2>
              <p className="text-gray-400 max-w-md">
                  Manage global datasets and import custom GeoJSON/TIFF layers for analysis. 
                  <br/><span className="text-sm text-gray-600">(Feature coming in v2.1)</span>
              </p>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B0E14] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 flex items-center justify-center">
                <div className="w-4 h-4 bg-[#00C2FF] rotate-45"></div>
            </div>
            <span className="text-lg font-bold">MicroClimate</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
           {/* BACK BUTTON ADDED */}
           <button
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-2 border border-white/5"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Back to Home
            </button>

          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                (item.id === activeSection)
                  ? 'bg-[#1E2330] text-white border border-white/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${(item.id === activeSection) ? 'text-[#00C2FF]' : 'text-gray-500'}`} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => onNavigate('profile')}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-4"
          >
            <Settings className="w-5 h-5 mr-3 text-gray-500" />
            Settings
          </button>
          
          <div className="flex items-center p-3 rounded-xl bg-[#161B26] border border-white/5">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mr-3 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                {user?.name.charAt(0) || 'G'}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.name || 'Guest User'}</p>
                <p className="text-xs text-gray-500 truncate">Lead Meteorologist</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#050505] p-8 custom-scrollbar">
         {activeSection === 'notifications' && renderNotificationsView()}
         {activeSection === 'team' && renderTeamView()}
         {activeSection === 'maps' && renderMapsView()}
         {activeSection === 'layers' && renderLayersView()}
      </main>
    </div>
  );
};
