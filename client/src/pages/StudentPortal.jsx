import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Phone,
  HelpCircle,
  Clock,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getEventConfig,
  getAttendeeByStudentId,
} from '../services/api';
import BankDetailsCard from '../components/BankDetailsCard';
import TicketCard from '../components/TicketCard';

export default function StudentPortal({ onGoToContact }) {
  const [eventConfig, setEventConfig] = useState(null);
  const [searchNic, setSearchNic] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Unified Search State: { type: 'IDLE' | 'NOT_FOUND' | 'FULL_APPROVED' | 'PENDING' | 'REJECTED' | 'ERROR', nic: '', attendee: null, qrCodeDataURL: null, errorMsg: '' }
  const [searchResult, setSearchResult] = useState({
    type: 'IDLE',
    nic: '',
    attendee: null,
    qrCodeDataURL: null,
    errorMsg: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const resultCardRef = useRef(null);

  useEffect(() => {
    loadConfig();

    // Check if NIC parameter passed in URL (e.g. ?nic=200612345678)
    const urlParams = new URLSearchParams(window.location.search);
    const nicParam = urlParams.get('nic');
    if (nicParam) {
      setSearchNic(nicParam);
      executeSearch(nicParam);
    }
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getEventConfig();
      if (data?.config) {
        setEventConfig(data.config);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const executeSearch = async (nicToSearch) => {
    const cleanNic = (nicToSearch || '').trim().toUpperCase();
    if (!cleanNic) return;

    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await getAttendeeByStudentId(cleanNic);
      if (res.success && res.attendee) {
        const rawAttendee = res.attendee._doc ? { ...res.attendee._doc, ...res.attendee } : res.attendee;
        const normalizedAttendee = {
          ...rawAttendee,
          name: rawAttendee.name || res.attendee.name || '',
          studentClass: rawAttendee.studentClass || rawAttendee.batch || res.attendee.studentClass || res.attendee.batch || '',
          paymentStatus: rawAttendee.paymentStatus || rawAttendee.status || res.attendee.paymentStatus || res.attendee.status || '',
          nic: rawAttendee.nic || rawAttendee.studentId || res.attendee.nic || res.attendee.studentId || cleanNic,
        };

        const status = normalizedAttendee.paymentStatus;
        let resultType = 'PENDING';

        if (status === 'FULL_APPROVED') {
          resultType = 'FULL_APPROVED';
        } else if (status === 'REJECTED') {
          resultType = 'REJECTED';
        } else {
          resultType = 'PENDING';
        }

        setSearchResult({
          type: resultType,
          nic: cleanNic,
          attendee: normalizedAttendee,
          qrCodeDataURL: res.qrCodeDataURL || null,
          errorMsg: '',
        });

        // If full approved, trigger celebratory confetti
        if (resultType === 'FULL_APPROVED') {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#D4AF37', '#4A2E6D', '#E5C158', '#22C55E'],
          });
        }
      } else {
        throw new Error('No attendee data');
      }
    } catch (err) {
      const is404 = err.response?.status === 404 || !err.response;
      if (is404) {
        setSearchResult({
          type: 'NOT_FOUND',
          nic: cleanNic,
          attendee: null,
          qrCodeDataURL: null,
          errorMsg: `NIC "${cleanNic}" is not registered in our database.`,
        });
      } else {
        setSearchResult({
          type: 'ERROR',
          nic: cleanNic,
          attendee: null,
          qrCodeDataURL: null,
          errorMsg: err.response?.data?.message || 'Server error occurred while checking status. Please try again.',
        });
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    executeSearch(searchNic);
  };

  const handleClearSearch = () => {
    setSearchResult({
      type: 'IDLE',
      nic: '',
      attendee: null,
      qrCodeDataURL: null,
      errorMsg: '',
    });
    setSearchNic('');
    setSuccessMsg('');
  };

  const fullPrice = eventConfig?.fullTicketPrice || 6500;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-3 sm:space-y-4 pt-2">
        <div className="inline-flex items-center space-x-2 bg-royal-900/10 border border-gold-500/40 px-3.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span className="text-[11px] sm:text-xs font-semibold text-royal-800 tracking-wider uppercase">
            Official Ticket Status & Digital Pass Portal
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-royal-950 tracking-tight px-2">
          Nostalgeste <span className="italic text-gold-gradient font-serif">'26</span>
        </h1>

        <p className="text-royal-700 text-sm sm:text-lg max-w-2xl mx-auto italic px-4">
          "Rewinding the Time. Reliving the Memories."
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-sm font-medium text-royal-600 px-2">
          <span className="bg-white/90 px-2.5 sm:px-3 py-1 rounded-full border border-lavender-300">
            Mahamaya Balika Vidyalaya • Kadawatha
          </span>
          <span className="text-royal-300 hidden sm:inline">•</span>
          <span className="bg-gold-500/20 text-royal-900 px-2.5 sm:px-3 py-1 rounded-full border border-gold-500/40 font-bold">
            October 31, 2026 at 8:00 AM
          </span>
        </div>
      </div>

      {/* Bank Details Banner */}
      <BankDetailsCard
        bank={eventConfig?.bank}
        prices={eventConfig}
        deadline={eventConfig?.paymentDeadline}
      />

      {/* ========================================================= */}
      {/* STEP 1: NIC STATUS LOOKUP SEARCH BOX                     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border-2 border-gold-500/30 transition-all">
        <div className="max-w-xl mx-auto text-center space-y-2 sm:space-y-3 mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-royal-100 text-royal-900 px-3 py-1 rounded-full text-xs font-bold border border-royal-200">
            <Search className="w-3.5 h-3.5 text-royal-700" />
            <span>Check Ticket & Pass Status</span>
          </div>
          <h2 className="font-serif text-xl sm:text-3xl font-bold text-royal-950">
            Check Your Pass or Payment Status
          </h2>
          <p className="text-xs sm:text-sm text-royal-600 px-2">
            Enter your <strong>NIC Number</strong> to view, download, or print your official Golden QR Gate Pass.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Enter 12-Digit NIC No. (e.g. 200429103702)"
                value={searchNic}
                onChange={(e) => setSearchNic(e.target.value.toUpperCase())}
                className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border-2 border-royal-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/30 outline-none text-royal-950 font-bold placeholder:text-royal-400 uppercase text-xs sm:text-base transition-all bg-lavender-50/50"
              />
              <Search className="w-4 sm:w-5 h-4 sm:h-5 text-royal-400 absolute left-3.5 top-3.5 sm:top-4" />
            </div>

            <button
              type="submit"
              disabled={loading || !searchNic.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-royal-950 via-royal-900 to-royal-800 hover:from-royal-900 hover:to-royal-700 text-gold-300 font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 shrink-0 text-xs sm:text-sm border border-gold-500/40"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-gold-400" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Check Pass</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Global Success Notification */}
        {successMsg && (
          <div className="mt-4 max-w-xl mx-auto bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-900 flex items-start space-x-3 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950">Success</div>
              <div>{successMsg}</div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* STATUS RESULT SECTION (Directly displayed upon lookup)    */}
      {/* ========================================================= */}
      <div ref={resultCardRef} className="scroll-mt-20">

        {/* ------------------------------------------------------- */}
        {/* RESULT CASE 1: NIC NOT REGISTERED                      */}
        {/* ------------------------------------------------------- */}
        {searchResult.type === 'NOT_FOUND' && (
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/70 border-3 border-amber-400 rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-2xl max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center space-x-1.5 bg-amber-200/80 text-amber-950 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border border-amber-400">
                  <span>NIC Not Found in System</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-950">
                  No Registration Found for <span className="font-mono text-royal-950 bg-amber-200/60 px-2 py-0.5 rounded-lg">{searchResult.nic}</span>
                </h3>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed pt-1">
                  We checked our records and this National Identity Card (NIC) number has not been registered yet.
                </p>
              </div>
            </div>

            {/* How to register callout */}
            <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 space-y-4 shadow-sm">
              <div className="flex items-start space-x-3 text-xs sm:text-sm text-royal-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-royal-950">How to get your Official Ticket Pass:</span>
                  <p className="text-royal-600 text-xs mt-0.5">
                    1. Deposit <strong>Rs. {fullPrice.toLocaleString()}</strong> to the official committee bank account.<br/>
                    2. Send your deposit receipt slip along with your <strong>Full Name, NIC, and Class</strong> to the Organizing Committee via WhatsApp.<br/>
                    3. The committee will verify and issue your official Golden QR Pass immediately.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onGoToContact && (
                  <button
                    type="button"
                    onClick={onGoToContact}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold py-3.5 px-5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Receipt to Committee on WhatsApp &rarr;</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="bg-royal-100 hover:bg-royal-200 text-royal-800 font-bold py-3.5 px-5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all border border-royal-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Another NIC</span>
                </button>
              </div>
            </div>

            {/* Helper notice */}
            <div className="text-[11px] sm:text-xs text-amber-800/90 bg-amber-100/50 p-3 rounded-xl border border-amber-200 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Did you already send your deposit receipt?</strong> Please allow a few minutes for committee members to confirm the bank transfer and register your pass. If you have questions, reach out to the committee contacts.
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* RESULT CASE 2: FULL PAYMENT APPROVED (Active Golden Pass) */}
        {/* ------------------------------------------------------- */}
        {searchResult.type === 'FULL_APPROVED' && searchResult.attendee && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Status Summary Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border-2 border-emerald-400 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-emerald-600/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/40 border-2 border-emerald-300 flex items-center justify-center text-white shrink-0">
                    <CheckCircle2 className="w-7 h-7 text-emerald-200" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-emerald-200 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                      Payment Verified & Approved
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                      Full Pass Active: {searchResult.attendee.name}
                    </h3>
                  </div>
                </div>

                <span className="bg-gold-400 text-royal-950 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md shrink-0">
                  Full Ticket (Rs. {fullPrice.toLocaleString()})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-600/40">
                  <span className="text-emerald-200 block text-[10px] uppercase font-bold">NIC Number</span>
                  <span className="font-mono font-bold text-white">{searchResult.attendee.nic || searchResult.attendee.studentId}</span>
                </div>
                <div className="bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-600/40">
                  <span className="text-emerald-200 block text-[10px] uppercase font-bold">Class</span>
                  <span className="font-bold text-white">{searchResult.attendee.studentClass || searchResult.attendee.batch}</span>
                </div>
                <div className="bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-600/40">
                  <span className="text-emerald-200 block text-[10px] uppercase font-bold">Event Date</span>
                  <span className="font-bold text-white">Oct 31, 2026</span>
                </div>
                <div className="bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-600/40">
                  <span className="text-emerald-200 block text-[10px] uppercase font-bold">Gate Status</span>
                  <span className="font-bold text-emerald-200">
                    {searchResult.attendee.ticketUsed ? 'Checked In' : 'Admit One Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Golden Ticket Component */}
            <TicketCard
              attendee={searchResult.attendee}
              qrCodeDataURL={searchResult.qrCodeDataURL}
              eventConfig={eventConfig}
            />

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs text-royal-700 hover:text-royal-950 font-bold underline inline-flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Another NIC</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* RESULT CASE 3: PENDING REVIEW                          */}
        {/* ------------------------------------------------------- */}
        {searchResult.type === 'PENDING' && searchResult.attendee && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 border-3 border-amber-400 shadow-2xl max-w-2xl mx-auto text-center space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full border border-amber-300">
                Payment Verification in Progress
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-royal-950">
                Verification in Progress
              </h3>
              <p className="text-xs sm:text-sm text-royal-700 max-w-md mx-auto leading-relaxed">
                Hello <strong>{searchResult.attendee.name}</strong> (Class: {searchResult.attendee.studentClass || searchResult.attendee.batch})! Your registration is currently being cross-checked by the committee.
              </p>
            </div>

            {/* Verification Steps Visualizer */}
            <div className="bg-lavender-50 rounded-2xl p-4 sm:p-5 border border-lavender-300 text-left space-y-3">
              <div className="flex items-center space-x-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-royal-900 font-semibold">1. Student Details & Slip Received</span>
              </div>
              <div className="flex items-center space-x-3 text-xs sm:text-sm">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />
                <span className="text-amber-950 font-bold bg-amber-100/80 px-2 py-0.5 rounded">
                  2. Committee Bank Cross-Check (Active)
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-royal-400">
                <div className="w-5 h-5 rounded-full border-2 border-royal-300 flex items-center justify-center text-[10px] font-bold">3</div>
                <span>3. Golden QR Gate Pass Issued</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              {onGoToContact && (
                <button
                  type="button"
                  onClick={onGoToContact}
                  className="bg-royal-100 hover:bg-royal-200 text-royal-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact Committee for Inquiries</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs text-royal-600 hover:text-royal-900 font-semibold underline px-3 py-2"
              >
                Search Another NIC
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* RESULT CASE 4: REJECTED                                */}
        {/* ------------------------------------------------------- */}
        {searchResult.type === 'REJECTED' && searchResult.attendee && (
          <div className="bg-rose-50 border-3 border-rose-300 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl max-w-2xl mx-auto space-y-5 text-rose-950 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-8 sm:w-9 h-8 sm:h-9 text-rose-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-extrabold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                  Notice
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-900 mt-0.5">
                  Deposit Needs Committee Review
                </h3>
                <p className="text-xs text-rose-700">
                  For NIC: {searchResult.attendee.nic || searchResult.attendee.studentId} ({searchResult.attendee.name})
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 text-xs sm:text-sm text-rose-950 space-y-1">
              <strong className="text-rose-900">Reason from Committee:</strong>
              <div className="p-2.5 bg-rose-50 rounded-lg font-medium text-rose-900 border border-rose-200">
                {searchResult.attendee.rejectionReason || 'Receipt was unclear or deposit amount mismatched. Please contact the committee.'}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-rose-200 text-xs">
              {onGoToContact && (
                <button
                  type="button"
                  onClick={onGoToContact}
                  className="text-rose-800 hover:text-rose-950 font-bold underline"
                >
                  Contact Committee on WhatsApp &rarr;
                </button>
              )}
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-rose-700 hover:text-rose-900 underline font-medium"
              >
                Search Another NIC
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* RESULT CASE 5: GENERAL ERROR                           */}
        {/* ------------------------------------------------------- */}
        {searchResult.type === 'ERROR' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 max-w-xl mx-auto text-center space-y-3 animate-in fade-in">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <div className="font-bold text-rose-950 text-sm">{searchResult.errorMsg}</div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              Try Again
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
