
import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Earth3D } from './components/Earth3D';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { Intro } from './components/Intro';
import { AuthModal } from './components/AuthModal';
import { NotificationsPage } from './components/NotificationsPage';
import { AlertsPage } from './components/AlertsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { ExplorePage } from './components/ExplorePage';
import { AboutPage } from './components/AboutPage';

// Define User Interface
export interface UserData {
  name: string;
  email: string;
}

// Setup main app layout
const App: React.FC = () => {
  // Initial view is 'intro' for first time experience
  const [currentView, setCurrentView] = useState<'intro' | 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore' | 'about'>('intro');
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2.5);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleNavigate = (view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore' | 'about', query?: string) => {
    setCurrentView(view);
    // Store search query if provided and navigating to explore
    if (view === 'explore' && query) {
      setSearchQuery(query);
    }
    // Reset location marker when going back to landing
    if (view === 'landing') {
      setIsLocationActive(false);
      setMarkerPosition(null);
      setZoomLevel(2.5);
      setSearchQuery(undefined);
    }
  };

  const handleIntroFinish = () => {
    setCurrentView('landing');
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    setIsLocationActive(true);
    setMarkerPosition({ lat, lon });
  };
  
  const handleZoomIn = () => {
      setZoomLevel(prev => Math.max(prev - 0.5, 1.2));
  };
  
  const handleZoomOut = () => {
      setZoomLevel(prev => Math.min(prev + 0.5, 5.0));
  };

  const handleLogin = (userData: UserData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleAuthOpen = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Handle 3D Globe Click
  const handleEarthLocationClick = (lat: number, lon: number) => {
      if (currentView === 'dashboard' || currentView === 'explore') {
          handleLocationSelect(lat, lon);
          // Dispatch custom event so Dashboard/Explore can listen and update weather
          const event = new CustomEvent('earth-click', { detail: { lat, lon } });
          window.dispatchEvent(event);
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white overflow-hidden selection:bg-[#00C2FF] selection:text-black">
      
      {/* Global Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      {/* Persistent 3D Background - Only visible on Landing, Dashboard, Explore, Profile (partial) */}
      {/* Hidden on Notifications, Alerts, Admin, and About pages as they have solid backgrounds */}
      {(currentView === 'landing' || currentView === 'dashboard' || currentView === 'explore' || currentView === 'profile' || currentView === 'intro') && (
        <Earth3D 
            viewMode={currentView === 'profile' ? 'landing' : (currentView === 'intro' ? 'intro' : (currentView === 'dashboard' || currentView === 'explore' ? 'dashboard' : 'landing'))} 
            showMarker={isLocationActive} 
            markerPosition={markerPosition}
            zoomLevel={zoomLevel}
            onLocationClick={handleEarthLocationClick}
            reduceEffects={currentView === 'dashboard'}
        />
      )}
      
      {/* Intro Tutorial Overlay */}
      {currentView === 'intro' && (
        <Intro onFinish={handleIntroFinish} />
      )}

      {/* Only show Navbar on Landing Page */}
      {currentView === 'landing' && (
        <Navbar 
          currentView={currentView} 
          onNavigate={handleNavigate}
          isLoggedIn={isLoggedIn}
          user={user}
          onAuthClick={handleAuthOpen}
        />
      )}
      
      <main className="flex-grow relative z-10 h-full">
        {currentView === 'landing' && (
          <Hero onExplore={(query) => handleNavigate('explore', query)} />
        )}
        
        {currentView === 'dashboard' && (
          <Dashboard 
            onNavigateHome={() => handleNavigate('landing')} 
            onNavigateProfile={() => handleNavigate('profile')}
            onNavigateNotifications={() => handleNavigate('notifications')}
            onNavigateAlerts={() => handleNavigate('alerts')}
            onNavigateTo={handleNavigate}
            onLocationSelect={handleLocationSelect}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onAuthClick={() => handleAuthOpen('login')}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentView === 'explore' && (
          <ExplorePage 
            searchQuery={searchQuery}
            onNavigate={handleNavigate}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocationSelect={handleLocationSelect}
          />
        )}

        {currentView === 'profile' && (
          <Profile 
            onNavigate={handleNavigate} 
            onLogout={handleLogout}
            user={user}
            onLocationSelect={handleLocationSelect}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsPage 
            onNavigate={handleNavigate}
            user={user}
            onLocationSelect={handleLocationSelect}
          />
        )}

        {currentView === 'alerts' && (
          <AlertsPage 
            onNavigate={handleNavigate}
            onLocationSelect={handleLocationSelect}
            user={user}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard 
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'about' && (
          <AboutPage 
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
};

export default App;
