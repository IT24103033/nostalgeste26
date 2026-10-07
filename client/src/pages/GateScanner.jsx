import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Hash,
  ArrowRight,
  Lock,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { checkInAttendee } from '../services/api';

// Web Audio API Sound Synthesizer for instant gate feedback
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      // Pleasant double-chime (C6 -> G6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      osc1.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.12); // G6
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);
    } else {
      // Harsh low buzzer (sawtooth 160Hz -> 120Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.warn('Audio playback not supported/blocked:', err);
  }
};

const LOCKOUT_SECONDS = 60;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function GateScanner() {
  // Gate Security Access State
  const [isUnlocked, setIsUnlocked] = useState(
    !!sessionStorage.getItem('nostalgeste_gate_unlocked') ||
      !!localStorage.getItem('nostalgeste_admin_token')
  );
  const [gatePin, setGatePin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Brute-force PIN lockout state
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [pinLockoutTimer, setPinLockoutTimer] = useState(0);

  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual token entry
  const [manualToken, setManualToken] = useState('');

  // Wristband Auto-incrementer
  const [wristbandNumber, setWristbandNumber] = useState(1);
  const [autoIncrement, setAutoIncrement] = useState(true);

  // Scan Result State
  const [scanResult, setScanResult] = useState(null);
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [recentScans, setRecentScans] = useState([]);

  const html5QrCodeRef = useRef(null);

  // PIN Lockout countdown effect
  useEffect(() => {
    let interval;
    if (pinLockoutTimer > 0) {
      interval = setInterval(() => {
        setPinLockoutTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pinLockoutTimer]);

  // Inactivity auto-lock effect for scanner
  useEffect(() => {
    if (!isUnlocked) return;

    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLockGate();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isUnlocked]);

  useEffect(() => {
    if (isUnlocked) {
      // Enumerate camera devices
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            setCameras(devices);
            // Prefer back camera for mobile
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment')
            );
            setSelectedCamera(backCam ? backCam.id : devices[0].id);
          }
        })
        .catch((err) => {
          console.warn('Unable to get cameras:', err);
        });
    }

    return () => {
      stopScanner();
    };
  }, [isUnlocked]);

  const handleUnlockGate = (e) => {
    e.preventDefault();
    if (pinLockoutTimer > 0) return;

    setPinError('');
    const validPins = ['2026', 'nostalgeste2026', 'gate2026'];
    if (validPins.includes(gatePin.trim().toLowerCase())) {
      sessionStorage.setItem('nostalgeste_gate_unlocked', 'true');
      setIsUnlocked(true);
      setFailedPinAttempts(0);
      setGatePin('');
    } else {
      const nextFails = failedPinAttempts + 1;
      setFailedPinAttempts(nextFails);
      if (nextFails >= 3) {
        setPinLockoutTimer(LOCKOUT_SECONDS);
        setPinError(`Security Lockout: 3 wrong PIN attempts. Please wait ${LOCKOUT_SECONDS}s.`);
      } else {
        setPinError(`Invalid Gate PIN. (${3 - nextFails} attempts remaining)`);
      }
    }
  };

  const handleLockGate = () => {
    stopScanner();
    sessionStorage.removeItem('nostalgeste_gate_unlocked');
    setIsUnlocked(false);
    setGatePin('');
  };

  const startScanner = async () => {
    if (!selectedCamera) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        selectedCamera,
        config,
        (decodedText) => {
          handleTokenScan(decodedText);
        },
        (errorMessage) => {
          // ignore frame scan misses
        }
      );

      setScannerActive(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      alert('Could not start camera scanner. Please grant camera permissions in your browser.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setScannerActive(false);
  };

  const handleTokenScan = async (token) => {
    if (loadingCheckIn) return;
    setLoadingCheckIn(true);

    try {
      const res = await checkInAttendee({
        qrToken: token.trim(),
        wristbandNumber: wristbandNumber ? `#${wristbandNumber}` : '',
      });

      if (res.success) {
        if (soundEnabled) playSound('success');
        const resultData = {
          type: 'VALID_ENTRY',
          message: res.message,
          attendee: res.attendee,
          timestamp: new Date(),
        };
        setScanResult(resultData);
        setRecentScans((prev) => [resultData, ...prev.slice(0, 9)]);

        if (autoIncrement) {
          setWristbandNumber((prev) => Number(prev) + 1);
        }
      }
    } catch (err) {
      if (soundEnabled) playSound('error');
      const errRes = err.response?.data;
      const code = errRes?.code || 'INVALID_TICKET';
      const msg = errRes?.message || 'Check-in failed. Please verify ticket status.';

      const resultData = {
        type: code,
        message: msg,
        attendee: errRes?.attendee,
        timestamp: new Date(),
      };
      setScanResult(resultData);
      setRecentScans((prev) => [resultData, ...prev.slice(0, 9)]);
    } finally {
      setLoadingCheckIn(false);
      setManualToken('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleTokenScan(manualToken.trim());
  };

  // Gate Staff PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-gold-500/40 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-royal-950 border-2 border-gold-500 flex items-center justify-center text-gold-400 mx-auto shadow-gold-glow">
            <KeyRound className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-royal-950">
              Gate Staff Access
            </h2>
            <p className="text-xs text-royal-600 mt-1">
              Authorized gate volunteers & security check-in only
            </p>
          </div>

          <form onSubmit={handleUnlockGate} className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                Gate Staff PIN Code
              </label>
              <input
                type="password"
                required
                disabled={pinLockoutTimer > 0}
                placeholder={pinLockoutTimer > 0 ? `Locked (${pinLockoutTimer}s)` : 'Enter 4-digit PIN'}
                value={gatePin}
                onChange={(e) => setGatePin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-royal-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 outline-none text-royal-950 text-center font-bold tracking-widest text-lg bg-lavender-50/50 disabled:bg-gray-100 disabled:opacity-75"
              />
            </div>

            {pinLockoutTimer > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4 text-amber-700 animate-pulse" />
                <span>PIN entry locked. Try again in {pinLockoutTimer}s.</span>
              </div>
            ) : (
              pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {pinError}
                </div>
              )
            )}

            <button
              type="submit"
              disabled={pinLockoutTimer > 0}
              className="w-full bg-royal-900 hover:bg-royal-800 text-gold-300 font-bold py-3.5 rounded-xl border border-gold-500/40 shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              <span>Unlock Gate Scanner</span>
            </button>

            <div className="text-[11px] text-center text-royal-400">
              Authorized gate volunteers & security check-in only.
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
      
      {/* Header */}
      <div className="bg-royal-950 text-white rounded-3xl p-4 sm:p-6 border-2 border-gold-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
            <QrCode className="w-6 sm:w-7 h-6 sm:h-7" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-gold-gradient">
              Gate Check-In Scanner
            </h1>
            <p className="text-[11px] sm:text-xs text-royal-200">
              Nostalgeste '26 • Entrance Wristband Station
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 sm:p-2.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-semibold ${
              soundEnabled
                ? 'bg-gold-500/20 border-gold-500/40 text-gold-300'
                : 'bg-royal-900 border-royal-800 text-royal-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chimes ON' : 'Muted'}</span>
          </button>

          <button
            onClick={handleLockGate}
            className="p-2 sm:p-2.5 rounded-xl bg-royal-900 hover:bg-rose-900 text-royal-300 hover:text-rose-200 border border-royal-800 transition-colors"
            title="Lock Scanner"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wristband Number Settings Box */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-royal-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-royal-700" />
          <span className="font-bold text-royal-950">Next Wristband #:</span>
          <input
            type="number"
            value={wristbandNumber}
            onChange={(e) => setWristbandNumber(e.target.value)}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-royal-300 text-center font-bold text-sm text-royal-950 bg-lavender-50"
          />
        </div>

        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoIncrement}
            onChange={(e) => setAutoIncrement(e.target.checked)}
            className="rounded border-royal-300 text-gold-600 focus:ring-gold-500"
          />
          <span className="text-royal-700 font-medium">Auto-increment (+1) on valid scan</span>
        </label>
      </div>

      {/* Live Scan Result Card */}
      {scanResult && (
        <div
          className={`rounded-3xl p-5 sm:p-8 border-3 shadow-2xl text-center transition-all animate-in fade-in zoom-in-95 duration-200 ${
            scanResult.type === 'VALID_ENTRY'
              ? 'bg-gradient-to-b from-emerald-900 to-emerald-950 text-white border-emerald-400 shadow-emerald-900/40'
              : scanResult.type === 'ALREADY_USED'
              ? 'bg-gradient-to-b from-rose-900 to-rose-950 text-white border-rose-500 shadow-rose-900/40'
              : scanResult.type === 'PAYMENT_INCOMPLETE'
              ? 'bg-gradient-to-b from-amber-900 to-amber-950 text-white border-amber-400 shadow-amber-900/40'
              : 'bg-gradient-to-b from-rose-900 to-rose-950 text-white border-rose-500'
          }`}
        >
          {scanResult.type === 'VALID_ENTRY' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-300">
                <CheckCircle2 className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400 px-3 py-1 rounded-full">
                  ENTRY GRANTED
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-emerald-100 mt-2">
                  {scanResult.attendee?.name}
                </h2>
                <div className="text-emerald-200 text-xs sm:text-sm mt-1">
                  Class: <strong>{scanResult.attendee?.studentClass || scanResult.attendee?.batch}</strong> • NIC: <strong>{scanResult.attendee?.nic || scanResult.attendee?.studentId}</strong>
                </div>
              </div>

              <div className="bg-emerald-950/60 rounded-2xl p-3.5 sm:p-4 border border-emerald-400/40 max-w-xs mx-auto">
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                  Assigned Wristband
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-extrabold text-gold-300 mt-1">
                  {scanResult.attendee?.wristbandNumber || `#${wristbandNumber - 1}`}
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-emerald-200/80">
                Ticket authenticated. Hand wristband to student.
              </p>
            </div>
          )}

          {scanResult.type === 'ALREADY_USED' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-rose-500/20 border-2 border-rose-300 flex items-center justify-center mx-auto text-rose-300">
                <XCircle className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-rose-500/40 text-rose-200 border border-rose-400 px-3 py-1 rounded-full">
                  ALREADY USED / DUPLICATE
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-rose-100 mt-2">
                  Already Checked In!
                </h2>
                <p className="text-xs text-rose-200 mt-1">
                  {scanResult.message}
                </p>
              </div>

              {scanResult.attendee && (
                <div className="bg-rose-950/70 rounded-xl p-2.5 border border-rose-400/30 text-xs text-rose-200 max-w-xs mx-auto">
                  <strong>Holder: </strong> {scanResult.attendee.name} ({scanResult.attendee.nic || scanResult.attendee.studentId})
                </div>
              )}
            </div>
          )}

          {scanResult.type === 'PAYMENT_INCOMPLETE' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-amber-500/20 border-2 border-amber-300 flex items-center justify-center mx-auto text-amber-300">
                <AlertTriangle className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-amber-500/40 text-amber-200 border border-amber-400 px-3 py-1 rounded-full">
                  PAYMENT INCOMPLETE
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-100 mt-2">
                  Remaining Balance Required
                </h2>
                <p className="text-xs text-amber-200 mt-1">
                  {scanResult.message}
                </p>
              </div>

              <div className="bg-amber-950/70 rounded-xl p-2.5 border border-amber-400/30 text-xs text-amber-200 max-w-xs mx-auto">
                Direct student to <strong>Cashier Desk</strong> to clear balance.
              </div>
            </div>
          )}

          {scanResult.type === 'INVALID_TICKET' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-rose-500/20 border-2 border-rose-300 flex items-center justify-center mx-auto text-rose-300">
                <XCircle className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-rose-500/40 text-rose-200 border border-rose-400 px-3 py-1 rounded-full">
                  UNRECOGNIZED PASS
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-rose-100 mt-2">
                  Invalid QR Token
                </h2>
                <p className="text-xs text-rose-200 mt-1">
                  This QR code does not belong to any approved Nostalgeste '26 ticket.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Scanner Viewport */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-gold-500/40 shadow-xl space-y-3 sm:space-y-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Camera className="w-4 h-4 text-royal-700" />
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              disabled={scannerActive}
              className="px-3 py-2 rounded-xl border border-royal-200 text-xs bg-lavender-50 outline-none w-full sm:w-64"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={scannerActive ? stopScanner : startScanner}
            className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2 ${
              scannerActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-royal-900 hover:bg-royal-800 text-gold-300 border border-gold-500/40'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{scannerActive ? 'Stop Camera' : 'Start Camera Scanner'}</span>
          </button>
        </div>

        {/* Video Box */}
        <div className="relative rounded-2xl overflow-hidden bg-black min-h-[260px] sm:min-h-[280px] flex items-center justify-center border-2 border-royal-950">
          <div id="qr-reader" className="w-full max-w-sm" />
          
          {!scannerActive && (
            <div className="absolute inset-0 bg-royal-950 flex flex-col items-center justify-center p-6 text-center text-royal-300 space-y-3">
              <QrCode className="w-14 sm:w-16 h-14 sm:h-16 text-gold-400 opacity-60" />
              <p className="text-xs max-w-xs">
                Tap <strong>"Start Camera Scanner"</strong> to scan attendees at the entrance.
              </p>
            </div>
          )}
        </div>

        {/* Manual Token Entry Fallback */}
        <div className="pt-2 border-t border-royal-100">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Type 12-digit NIC or paste QR Token..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-royal-200 text-xs outline-none bg-lavender-50/50 uppercase font-mono"
            />
            <button
              type="submit"
              disabled={loadingCheckIn || !manualToken.trim()}
              className="bg-royal-900 hover:bg-royal-800 text-gold-300 text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-gold-500/30 transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <span>Verify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Recent Scans Feed */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-royal-200 shadow-sm space-y-2.5">
          <div className="font-serif text-sm font-bold text-royal-950 flex items-center justify-between">
            <span>Recent Gate Scans ({recentScans.length})</span>
            <span className="text-[10px] text-royal-400 font-sans">Live history</span>
          </div>

          <div className="divide-y divide-royal-100 text-xs">
            {recentScans.map((scan, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {scan.type === 'VALID_ENTRY' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-royal-950">
                      {scan.attendee?.name || 'Unknown'}
                    </span>{' '}
                    <span className="text-royal-500 text-[10px]">
                      ({scan.attendee?.studentClass || scan.attendee?.batch || 'Class'})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-[10px] text-royal-700 font-semibold">
                    {scan.attendee?.wristbandNumber || scan.type}
                  </div>
                  <div className="text-[9px] text-royal-400">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
