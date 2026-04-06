
import React, { useState } from 'react';
import { Diamond, Menu, X, User } from 'lucide-react';
import { UserData } from '../App';

interface NavbarProps {
  onNavigate: (view: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore' | 'about') => void;
  currentView: 'landing' | 'dashboard' | 'profile' | 'notifications' | 'alerts' | 'admin' | 'explore' | 'about';
  isLoggedIn: boolean;
  user: UserData | null;
  onAuthClick: (mode: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, isLoggedIn, user, onAuthClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', id: 'landing', action: () => onNavigate('landing') },
    { name: 'Explore', id: 'explore', action: () => onNavigate('explore') }, 
    { name: 'About', id: 'about', action: () => onNavigate('about') },
    { name: 'Dashboard', id: 'dashboard', action: () => onNavigate('dashboard') },
    { name: 'Admin', id: 'admin', action: () => onNavigate('admin') },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo (Left) */}
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => onNavigate('landing')}>
            <div className="relative flex items-center justify-center w-8 h-8 mr-3 bg-[#00C2FF]/10 rounded-lg group-hover:bg-[#00C2FF]/20 transition-colors">
              <Diamond className="w-5 h-5 text-[#00C2FF] transform rotate-45" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              MicroClimate
            </span>
          </div>

          {/* Right Side Container (Links + Auth) */}
          <div className="hidden md:flex items-center space-x-10">
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={link.action}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentView === link.id 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Auth Buttons / User Profile */}
            {isLoggedIn ? (
              <button 
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-3 group"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-gray-400 group-hover:text-white">Welcome,</p>
                  <p className="text-sm font-bold text-white">{user?.name.split(' ')[0] || 'User'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1E2330] border border-white/10 flex items-center justify-center shadow-lg group-hover:border-[#00C2FF] transition-all overflow-hidden">
                  {/* Mock User Avatar */}
                   <div className="w-full h-full bg-gradient-to-br from-[#FFE4C4] to-[#FFDAB9] flex items-end justify-center">
                      <User className="w-8 h-8 text-gray-600 translate-y-1" /> 
                   </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => onAuthClick('login')}
                  className="text-white hover:text-[#00C2FF] font-medium px-4 py-2 text-sm transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={() => onAuthClick('signup')}
                  className="bg-[#00C2FF] hover:bg-[#00A0D6] text-black font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(0,194,255,0.3)] hover:shadow-[0_0_25px_rgba(0,194,255,0.5)]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0B0E14] border-b border-white/5">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  link.action();
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  currentView === link.id ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col space-y-2">
              {!isLoggedIn ? (
                <>
                  <button 
                    onClick={() => { onAuthClick('login'); setIsMobileMenuOpen(false); }}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium text-left"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { onAuthClick('signup'); setIsMobileMenuOpen(false); }}
                    className="bg-[#00C2FF] text-black font-semibold block px-3 py-2 rounded-md text-base text-center"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                 <button 
                    onClick={() => { onNavigate('profile'); setIsMobileMenuOpen(false); }}
                    className="bg-[#1E2330] text-white font-semibold block px-3 py-2 rounded-md text-base text-center border border-white/10"
                  >
                    Go to Profile
                  </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
