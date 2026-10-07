import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, CheckCircle2, Sparkles, MapPin, Calendar, Clock, ShieldCheck, MessageCircle, QrCode, Image as ImageIcon, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadFullTicketPassImage } from '../utils/generateTicketImage';

export default function TicketCard({ attendee, qrCodeDataURL, eventConfig }) {
  const ticketRef = useRef(null);
  const [downloadingFull, setDownloadingFull] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti when full ticket is viewed!
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#4A2E6D', '#E5C158', '#9466BF'],
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFullPass = async () => {
    setDownloadingFull(true);
    try {
      await downloadFullTicketPassImage(attendee, qrCodeDataURL);
    } catch (err) {
      console.error('Error downloading full pass:', err);
      alert('Could not generate pass image. Falling back to QR download.');
      handleDownloadQROnly();
    } finally {
      setDownloadingFull(false);
    }
  };

  const handleDownloadQROnly = () => {
    if (!qrCodeDataURL) return;
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `Nostalgeste26-QR-${attendee.nic || attendee.studentId}.png`;
    link.click();
  };

  const handleShareWhatsApp = () => {
    const name = attendee.name || 'Student';
    const nic = attendee.nic || attendee.studentId || '';
    const studentClass = attendee.studentClass || attendee.batch || '2026';
    const passUrl = `${window.location.origin}/?token=${attendee.qrToken}`;

    const message = `🌟 *Nostalgeste '26 - My Official Ticket Pass* 🌟\n\nName: *${name}*\nClass: *${studentClass}*\nNIC: *${nic}*\nStatus: *FULLY PAID & VERIFIED* ✅\nEvent Date: Saturday, Oct 31, 2026 at 8:00 AM\nVenue: Rose Garden, Kadawatha\n\n🎟️ *View & Scan My Pass:* ${passUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const userNic = attendee.nic || attendee.studentId || 'N/A';
  const userClass = attendee.studentClass || attendee.batch || '2026';

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full px-2 sm:px-0">
      
      {/* Celebration Banner */}
      <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 sm:px-5 py-3 rounded-2xl mb-5 sm:mb-6 shadow-lg flex items-center justify-between no-print">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <div>
            <div className="font-bold text-xs sm:text-sm">Payment Verified & Approved!</div>
            <div className="text-[11px] sm:text-xs text-emerald-100">Your pass is ready for gate check-in on Oct 31st</div>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
      </div>

      {/* Ticket Pass Container */}
      <div 
        id="printable-ticket"
        ref={ticketRef}
        className="w-full bg-white text-royal-950 rounded-3xl overflow-hidden shadow-2xl border-3 sm:border-4 border-gold-500/80 relative"
        style={{
          boxShadow: '0 20px 40px -15px rgba(74, 46, 109, 0.3), 0 0 25px rgba(212, 175, 55, 0.25)',
        }}
      >
        {/* Decorative Watercolor Header */}
        <div className="bg-gradient-to-br from-royal-950 via-royal-900 to-royal-800 text-white p-5 sm:p-8 text-center relative overflow-hidden border-b-2 border-gold-500/60">
          
          <div className="relative z-10 space-y-1 sm:space-y-1.5">
            <div className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.2em] text-gold-300">
              Mahamaya Balika Vidyalaya • Kadawatha
            </div>
            
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-gold-gradient italic py-1">
              Nostalgeste '26
            </h1>
            
            <p className="text-xs sm:text-sm text-royal-200 italic">
              "Rewinding the Time. Reliving the Memories."
            </p>

            <div className="pt-2">
              <span className="inline-block bg-gold-500/20 text-gold-200 border border-gold-400/50 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase shadow-sm">
                Official Entry Pass • Admit One
              </span>
            </div>
          </div>
        </div>

        {/* Perforated ticket tear line divider */}
        <div className="relative flex items-center justify-between px-3 bg-lavender-50">
          <div className="w-6 h-6 rounded-full bg-lavender-100 -ml-6 border-r border-gold-500/30" />
          <div className="flex-1 border-t-2 border-dashed border-gold-400/60 my-1 mx-2" />
          <div className="w-6 h-6 rounded-full bg-lavender-100 -mr-6 border-l border-gold-500/30" />
        </div>

        {/* Ticket Body */}
        <div className="p-4 sm:p-8 bg-gradient-to-b from-lavender-50 to-white">
          
          {/* Attendee Details Grid */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gold-500/30 shadow-sm mb-5 space-y-3">
            <div className="flex justify-between items-start border-b border-lavender-200 pb-3">
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-royal-500 font-semibold block">
                  Student Name
                </span>
                <span className="font-serif text-base sm:text-xl font-bold text-royal-950">
                  {attendee.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-royal-500 font-semibold block">
                  NIC Number
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-royal-800 bg-royal-100/70 px-2 sm:px-2.5 py-0.5 rounded-md border border-royal-200">
                  {userNic}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-royal-500 font-medium block">
                  Class
                </span>
                <span className="font-bold text-royal-900 text-xs sm:text-sm">{userClass}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-royal-500 font-medium block">
                  Status & Access
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>FULL PAYMENT (Rs. {(attendee.amountPaid || eventConfig?.fullTicketPrice || 6500).toLocaleString()})</span>
                  </span>
                  {attendee.ticketUsed ? (
                    <span className="inline-flex items-center space-x-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>GATE SCANNED #{attendee.wristbandNumber || 1}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-gold-800 font-bold bg-gold-100/60 px-2 py-0.5 rounded border border-gold-300 text-[10px]">
                      <Sparkles className="w-3 h-3 text-gold-600" />
                      <span>VALID FOR GATE ENTRY</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gold-500/40 text-center shadow-md flex flex-col items-center justify-center relative">
            <div className="text-[11px] sm:text-xs uppercase tracking-widest font-bold text-royal-700 mb-3 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Gate Entrance QR Code</span>
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            </div>

            {qrCodeDataURL ? (
              <div className="p-2 bg-white rounded-xl border-2 border-royal-900 shadow-inner">
                <img
                  src={qrCodeDataURL}
                  alt="Ticket QR Code"
                  className="w-44 h-44 sm:w-56 sm:h-56 object-contain"
                />
              </div>
            ) : (
              <div className="w-44 h-44 bg-lavender-100 rounded-xl flex items-center justify-center text-xs text-royal-500">
                Generating QR...
              </div>
            )}

            <div className="mt-2.5 text-[10px] sm:text-[11px] font-mono text-royal-500 break-all">
              Token: <span className="text-royal-800 font-semibold">{attendee.qrToken?.substring(0, 16)}...</span>
            </div>

            <p className="text-[11px] sm:text-xs text-royal-600 mt-1.5 font-medium px-2">
              Present this code at the gate on October 31st to receive your official wristband.
            </p>
          </div>

          {/* Event Schedule Footer */}
          <div className="mt-5 bg-royal-950 text-white rounded-xl p-3.5 sm:p-4 text-xs space-y-1.5 border border-gold-500/30">
            <div className="flex flex-wrap items-center gap-2 text-gold-300">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <span className="font-semibold">Saturday, Oct 31, 2026</span>
              </div>
              <span className="text-royal-400">•</span>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <span>8:00 AM</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-royal-200 text-[11px] sm:text-xs">
              <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>Rose Garden, Ragama Rd, Kadawatha</span>
            </div>
          </div>

        </div>

        {/* Ticket Bottom Banner */}
        <div className="bg-lavender-200/70 px-4 py-2.5 text-center border-t border-gold-500/20 text-[10px] text-royal-600">
          Mahamaya Balika Vidyalaya Nostalgeste '26 Official Entry Pass
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2.5 mt-5 no-print">
        {/* Primary Action: Download Full Golden Invitation Pass Card */}
        <button
          onClick={handleDownloadFullPass}
          disabled={downloadingFull}
          className="w-full bg-gradient-to-r from-amber-400 via-gold-500 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-royal-950 font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-gold-glow text-sm sm:text-base border-2 border-amber-300"
        >
          {downloadingFull ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating High-Res Invitation Pass...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 text-royal-950" />
              <span>Download Full Invitation Pass</span>
              <Sparkles className="w-4 h-4 text-royal-900" />
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Share WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-royal-900 hover:bg-royal-800 text-gold-200 border border-gold-500/40 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>

          <button
            onClick={handleDownloadQROnly}
            className="bg-royal-100 hover:bg-royal-200 text-royal-800 border border-royal-300 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs"
            title="Download QR code image file only"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Save QR Only</span>
          </button>
        </div>
      </div>

    </div>
  );
}
