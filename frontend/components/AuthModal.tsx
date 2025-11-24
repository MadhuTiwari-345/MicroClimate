import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { UserData } from '../App';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onLogin: (user: UserData) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'login', onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sync internal mode with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    setTimeout(() => {
      // If signing up, use the entered name. If logging in, simulate a fetched user name.
      const finalName = mode === 'signup' ? name : 'Alex Johnson';
      onLogin({ name: finalName, email });
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header Gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00C2FF] to-blue-600"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'login' 
                ? 'Enter your credentials to access your dashboard.' 
                : 'Sign up to start analyzing global microclimates.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-[#00C2FF] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#161B26] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] transition-colors"
                  required
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-[#00C2FF] transition-colors" />
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#161B26] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] transition-colors"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-[#00C2FF] transition-colors" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161B26] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] transition-colors"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-[#00C2FF] hover:bg-[#00A0D6] text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(0,194,255,0.2)] hover:shadow-[0_0_30px_rgba(0,194,255,0.4)] flex items-center justify-center mt-6"
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[#00C2FF] hover:text-white font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};