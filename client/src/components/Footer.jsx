import React from 'react';
import { Calendar, Clock, MapPin, Sparkles, Lock } from 'lucide-react';

export default function Footer({ onAdminClick, onContactClick }) {
  return (
    <footer className="bg-royal-950 border-t border-gold-500/30 text-royal-200 mt-16 sm:mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center border-b border-royal-800 pb-6 sm:pb-8 mb-6 sm:mb-8 text-center md:text-left">
          
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <span className="font-serif text-2xl font-bold text-gold-gradient">
                Nostalgeste '26
              </span>
            </div>
            <p className="text-sm text-royal-300 italic">
              "Rewinding the Time. Reliving the Memories."
            </p>
            <p className="text-xs text-royal-400 mt-1">
              Mahamaya Balika Vidyalaya • 2026 Batch
            </p>
          </div>

          <div className="bg-royal-900/60 p-4 rounded-xl border border-gold-500/20 text-xs space-y-2">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-gold-300">
              <Calendar className="w-4 h-4 text-gold-400" />
              <span className="font-medium">Saturday, October 31, 2026</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>Starts at 8:00 AM sharp</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              <span>Rose Garden, Ragama Rd, Kadawatha</span>
            </div>
          </div>

          <div className="text-center md:text-right space-y-2">
            <div className="inline-block bg-amber-500/20 border border-amber-400/40 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
              ⚠️ Balance Due: October 14th
            </div>
            <p className="text-xs text-royal-400">
              Complete your full payment to ensure your wristband and entry pass.
            </p>
            <div>
              <button
                onClick={onContactClick}
                className="text-xs text-gold-400 hover:text-gold-300 underline font-medium"
              >
                Questions? Contact Committee Members &rarr;
              </button>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-royal-400 gap-2">
          <p>© 2026 Mahamaya Balika Vidyalaya Batch Committee. All rights reserved.</p>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onContactClick}
              className="text-royal-300 hover:text-gold-400 transition-colors"
            >
              Support Desk
            </button>

            <button
              onClick={onAdminClick}
              className="text-gold-400 hover:text-gold-300 transition-colors flex items-center space-x-1.5 text-xs font-semibold px-2 py-1 rounded bg-royal-900/60 border border-gold-500/30"
              title="Organizing Committee Portal"
            >
              <Lock className="w-3.5 h-3.5 text-gold-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
