import React from 'react';
import { Sparkles, QrCode, ShieldCheck, Ticket, Users } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const isAdminSession = !!localStorage.getItem('nostalgeste_admin_token');

  return (
    <header className="sticky top-0 z-40 bg-royal-950/95 backdrop-blur-md border-b border-gold-500/30 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Title */}
          <div 
            onClick={() => setActiveTab('student')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-200 p-[2px] shadow-gold-glow group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full bg-royal-900 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-2xl font-bold tracking-wide text-gold-gradient">
                  Nostalgeste '26
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-gold-500/20 text-gold-300 border border-gold-500/40 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Invite Only
                </span>
              </div>
              <p className="text-[11px] text-royal-200 tracking-wider font-light">
                Mahamaya Balika Vidyalaya • Kadawatha
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'student'
                  ? 'bg-gold-500 text-royal-950 shadow-gold-glow font-semibold'
                  : 'text-royal-100 hover:text-white hover:bg-royal-800/60'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Student Pass</span>
            </button>

            {/* Committee Contacts / Support */}
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'contact'
                  ? 'bg-gold-500 text-royal-950 shadow-gold-glow font-semibold'
                  : 'text-royal-100 hover:text-white hover:bg-royal-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Help & Committee</span>
            </button>

            {/* Admin Portal Tab */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-gold-500 text-royal-950 shadow-gold-glow font-semibold'
                  : 'text-royal-200 hover:text-white hover:bg-royal-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              <span>Admin</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
