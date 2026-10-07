import React from 'react';
import { Sparkles, ShieldCheck, Ticket, Users } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-40 bg-royal-950/95 backdrop-blur-md border-b border-gold-500/30 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Title */}
          <div 
            onClick={() => setActiveTab('student')}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-200 p-[1.5px] sm:p-[2px] shadow-gold-glow group-hover:scale-105 transition-transform duration-300 shrink-0">
              <div className="w-full h-full rounded-full bg-royal-900 flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-gold-gradient">
                  Nostalgeste '26
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-gold-500/20 text-gold-300 border border-gold-500/40 px-1.5 sm:px-2 py-0.5 rounded-full hidden md:inline-block">
                  Invite Only
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-royal-300 tracking-normal font-light truncate max-w-[140px] sm:max-w-none">
                Mahamaya Balika Vidyalaya
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'student'
                  ? 'bg-gold-500 text-royal-950 shadow-gold-glow font-bold'
                  : 'text-royal-200 hover:text-white hover:bg-royal-800/60'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">Pass</span>
            </button>

            {/* Committee Contacts / Support */}
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'contact'
                  ? 'bg-gold-500 text-royal-950 shadow-gold-glow font-bold'
                  : 'text-royal-200 hover:text-white hover:bg-royal-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">Help</span>
            </button>

            {/* Admin Portal Tab */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-gold-500 text-royal-950 shadow-gold-glow font-bold'
                  : 'text-gold-300 hover:text-white bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-gold-400" />
              <span>Admin</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
