import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Hash,
  X,
  ExternalLink,
  Download,
  Printer,
  MessageCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { checkInAttendee } from '../services/api';
import TicketCard from './TicketCard';
import axios from 'axios';

export default function VerifyTokenModal({ token, onClose }) {
  const [loading, setLoading] = useState(true);
  const [attendee, setAttendee] = useState(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);
  const [statusState, setStatusState] = useState(null); // 'VALID', 'USED', 'INCOMPLETE', 'INVALID'
  const [message, setMessage] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [wristbandInput, setWristbandInput] = useState('');
  const [checkInDone, setCheckInDone] = useState(false);

  useEffect(() => {
    if (token) {
      verifyTokenInfo();
    }
  }, [token]);

  const verifyTokenInfo = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/attendees/lookup-token/${token.trim()}`);
      if (res.data?.success) {
        const att = res.data.attendee;
        setAttendee(att);
        setQrCodeDataURL(res.data.qrCodeDataURL || null);

        if (att.paymentStatus !== 'FULL_APPROVED') {
          setStatusState('INCOMPLETE');
          setMessage(`Payment Incomplete (${att.paymentStatus}). Full payment of Rs. 6,500 required for gate entry.`);
        } else if (att.ticketUsed) {
          setStatusState('USED');
          setMessage(`Ticket Scanned at ${new Date(att.checkedInAt).toLocaleTimeString()} (Wristband #${att.wristbandNumber || '1'})`);
        } else {
          setStatusState('VALID');
          setMessage('Verified Official Nostalgeste \'26 Digital Entry Pass');
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#D4AF37', '#4A2E6D', '#22C55E', '#E5C158'],
          });
        }
      }
    } catch (err) {
      setStatusState('INVALID');
      setMessage(err.response?.data?.message || 'Invalid or unrecognized QR token.');
    } finally {
      setLoading(false);
    }
  };

  const handleGateCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await checkInAttendee({
        qrToken: token.trim(),
        wristbandNumber: wristbandInput ? `#${wristbandInput}` : '',
      });

      if (res.success) {
        setCheckInDone(true);
        setStatusState('USED');
        setMessage(res.message);
        if (res.attendee) {
          setAttendee((prev) => ({
            ...prev,
            ...res.attendee,
            ticketUsed: true,
          }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-7 border-4 border-gold-500 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200 relative my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-royal-100 text-royal-700 hover:bg-royal-200 transition-colors z-10"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin text-gold-600 mx-auto" />
            <p className="font-serif text-xl font-bold text-royal-950">
              Unlocking Your Golden Invitation Pass...
            </p>
            <p className="text-xs text-royal-500">Mahamaya Balika Vidyalaya • Nostalgeste '26</p>
          </div>
        ) : (
          <>
            {/* Case 1: VALID & FULL APPROVED PASS */}
            {attendee && attendee.paymentStatus === 'FULL_APPROVED' ? (
              <div className="space-y-4 pt-1">
                <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-950 px-3.5 py-1 rounded-full text-xs font-extrabold border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Official Verified Ticket • Admit One</span>
                </div>

                {/* Render Full Golden Invitation Card */}
                <TicketCard
                  attendee={attendee}
                  qrCodeDataURL={qrCodeDataURL}
                />

                <div className="pt-2 border-t border-lavender-200 flex items-center justify-between text-xs">
                  <a
                    href={`/api/attendees/invitation-html/${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-royal-700 hover:text-royal-950 font-bold underline inline-flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Standalone HTML Invitation</span>
                  </a>

                  <button
                    onClick={onClose}
                    className="text-royal-500 hover:text-royal-800 font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : statusState === 'INCOMPLETE' && attendee ? (
              /* Case 2: INCOMPLETE / PENDING PASS */
              <div className="space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                    Payment Under Verification
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-royal-950 pt-2">
                    {attendee.name}
                  </h3>
                  <p className="text-xs text-royal-600">
                    Class: {attendee.studentClass || attendee.batch} • NIC: {attendee.nic || attendee.studentId}
                  </p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 text-xs text-amber-950 space-y-2 text-left">
                  <div className="font-bold text-amber-900">Verification Pending</div>
                  <p>
                    Your ticket registration has been recorded. Full payment of <strong>Rs. 6,500</strong> is required before your Golden QR Gate Pass is activated.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-royal-900 hover:bg-royal-800 text-gold-300 font-bold py-3 rounded-xl border border-gold-500/40 text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Case 3: INVALID PASS */
              <div className="space-y-5 py-6">
                <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center text-rose-600 mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-bold text-rose-950">
                    Invalid QR Pass
                  </h3>
                  <p className="text-xs text-rose-700 mt-1">
                    {message || 'This pass token could not be verified in our database.'}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-royal-900 text-gold-300 font-bold py-3 rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
