import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Mail,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  MessageCircle,
  UserPlus,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  QrCode,
  Phone,
  ArrowRight,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  adminLogin,
  adminLogout,
  getAdminMetrics,
  getAdminAttendees,
  updateAttendeeStatus,
  resendTicketEmail,
  exportAttendeesCsvApi,
  adminManualAddAttendee,
  adminDeleteAttendee,
} from '../services/api';
import ReceiptModal from '../components/ReceiptModal';
import GateScanner from './GateScanner';

const LOCKOUT_SECONDS = 60;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const predefinedClasses = ['C1', 'C2', 'A1', 'A2', 'BM'];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('nostalgeste_admin_token')
  );
  const [adminSubTab, setAdminSubTab] = useState('verification'); // 'verification' | 'scanner'
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Brute-force lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Dashboard Data State
  const [metrics, setMetrics] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [checkInFilter, setCheckInFilter] = useState('ALL');

  // Receipt Modal State
  const [selectedAttendee, setSelectedAttendee] = useState(null);

  // Action / Feedback
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Rejection Modal Prompt
  const [rejectingAttendee, setRejectingAttendee] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete Confirmation Modal
  const [deletingAttendee, setDeletingAttendee] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Manual Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingStudentLoading, setAddingStudentLoading] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [addForm, setAddForm] = useState({
    name: '',
    nic: '',
    studentClass: 'C1',
    customClass: '',
    phone: '',
    email: '',
    paymentStatus: 'FULL_APPROVED',
    paymentChoice: 'FULL',
    amountPaid: '6500',
    notes: 'Direct Cash / WhatsApp Confirmation',
  });

  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAddStudentError('Receipt file exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setAddStudentError('');
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setReceiptPreview(previewUrl);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleRemoveReceiptFile = () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  // Post-Add WhatsApp Dispatch Modal
  const [newlyAddedStudent, setNewlyAddedStudent] = useState(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Lockout countdown effect
  useEffect(() => {
    let interval;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Inactivity auto-lock effect
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLogout();
        alert('Session expired due to 15 minutes of inactivity for security.');
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, statusFilter, classFilter, checkInFilter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await adminLogin(password);
      if (res.success) {
        setIsAuthenticated(true);
        setFailedAttempts(0);
        setPassword('');
      }
    } catch (err) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= 3) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setLoginError(`Security Lockout: 3 failed attempts. Please wait ${LOCKOUT_SECONDS}s.`);
      } else {
        setLoginError(err.response?.data?.message || `Invalid password. (${3 - nextFailures} attempts remaining)`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setAttendees([]);
    setMetrics(null);
    setPassword('');
  };

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [metricsRes, attendeesRes] = await Promise.all([
        getAdminMetrics(),
        getAdminAttendees({
          search,
          status: statusFilter,
          studentClass: classFilter,
          ticketUsed: checkInFilter,
        }),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.metrics);
      if (attendeesRes.success) setAttendees(attendeesRes.attendees);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusUpdate = async (id, action, reason = null) => {
    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await updateAttendeeStatus(id, {
        action,
        rejectionReason: reason,
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Action '${action}' completed successfully!`,
        });
        loadDashboardData();
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update status.',
      });
    } finally {
      setActionLoadingId(null);
      setRejectingAttendee(null);
      setRejectReason('');
    }
  };

  const handleResendEmail = async (id) => {
    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await resendTicketEmail(id);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: res.message + (res.previewUrl ? ` (Preview: ${res.previewUrl})` : ''),
        });
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send ticket email.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatWhatsAppNumber = (phoneStr) => {
    let clean = (phoneStr || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '94' + clean.slice(1);
    } else if (!clean.startsWith('94') && clean.length === 9) {
      clean = '94' + clean;
    }
    return clean;
  };

  const getWhatsAppMessageText = (att) => {
    const name = att.name || 'Student';
    const nic = att.nic || att.studentId || '';
    const studentClass = att.studentClass || att.batch || '2026';
    const isFull = att.paymentStatus === 'FULL_APPROVED';
    const passUrl = `${window.location.origin}/?token=${att.qrToken}`;

    if (isFull) {
      return `🎟️ *NOSTALGESTE '26 - OFFICIAL ENTRY TICKET* 🎟️\nMahamaya Balika Vidyalaya, Kadawatha\n\nHello *${name}*, your batch party ticket registration is confirmed! 🎉\n\n📋 *Ticket Details:*\n• Name: *${name}*\n• NIC: *${nic}*\n• Class: *${studentClass}*\n• Status: *FULL PAYMENT VERIFIED (Rs. 6,500)* ✅\n• Date: *Saturday, Oct 31, 2026 at 8:00 AM*\n• Venue: *Rose Garden, Ragama Rd, Kadawatha*\n\n📱 *View & Download Your Golden QR Pass:*\n${passUrl}\n\n⚠️ _Please have your QR pass ready on your phone at the entrance gate to receive your official wristband._\n— *Nostalgeste '26 Organizing Committee*`;
    } else {
      return `👋 Hello *${name}*!\nYour registration for *Nostalgeste '26* (NIC: ${nic}) has been recorded by the committee.\nCheck your status anytime at: ${window.location.origin}\n— *Mahamaya 2026 Committee*`;
    }
  };

  const openWhatsApp = (att) => {
    const phone = formatWhatsAppNumber(att.phone);
    const message = getWhatsAppMessageText(att);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyWhatsAppText = (att) => {
    const text = getWhatsAppMessageText(att);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    setAddStudentError('');

    const cleanName = (addForm.name || '').trim();
    const cleanNic = (addForm.nic || '').trim().toUpperCase();
    const rawPhone = (addForm.phone || '').trim();
    const cleanEmail = (addForm.email || '').trim().toLowerCase();

    // 1. Name Validation
    if (!cleanName || cleanName.length < 2) {
      setAddStudentError('Please enter a valid student name (at least 2 letters).');
      return;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {
      setAddStudentError('Student name can only contain letters, spaces, dots, and hyphens.');
      return;
    }

    // 2. NIC Validation (strictly 12 digits)
    const is12DigitNic = /^\d{12}$/.test(cleanNic);
    if (!is12DigitNic) {
      setAddStudentError('Invalid NIC number! NIC must be exactly 12 digits (e.g. 200429103702).');
      return;
    }

    // 3. Phone Validation (Sri Lankan 07xxxxxxxx or 947xxxxxxxx)
    const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
    let validPhone = '';
    if (digitsOnly.length === 10 && digitsOnly.startsWith('07')) {
      validPhone = digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('947')) {
      validPhone = '0' + digitsOnly.slice(2);
    } else if (digitsOnly.length === 9 && digitsOnly.startsWith('7')) {
      validPhone = '0' + digitsOnly;
    } else {
      setAddStudentError('Invalid phone number! Please enter a valid 10-digit Sri Lankan phone number (e.g. 0771234567). Letters are not allowed.');
      return;
    }

    // 4. Email Validation (if provided)
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAddStudentError('Invalid email format (e.g. student@gmail.com).');
      return;
    }

    const finalClass =
      addForm.studentClass === 'Other / Custom'
        ? addForm.customClass.trim() || 'Other'
        : addForm.studentClass;

    setAddingStudentLoading(true);

    try {
      let payload;
      if (receiptFile) {
        const formData = new FormData();
        formData.append('name', cleanName);
        formData.append('nic', cleanNic);
        formData.append('studentClass', finalClass);
        formData.append('phone', validPhone);
        if (cleanEmail) formData.append('email', cleanEmail);
        formData.append('paymentChoice', 'FULL');
        formData.append('paymentStatus', 'FULL_APPROVED');
        formData.append('amountPaid', Number(addForm.amountPaid) || 6500);
        formData.append('notes', addForm.notes.trim());
        formData.append('receipt', receiptFile);
        payload = formData;
      } else {
        payload = {
          name: cleanName,
          nic: cleanNic,
          studentClass: finalClass,
          phone: validPhone,
          email: cleanEmail,
          paymentChoice: 'FULL',
          paymentStatus: 'FULL_APPROVED',
          amountPaid: Number(addForm.amountPaid) || 6500,
          notes: addForm.notes.trim(),
        };
      }

      const res = await adminManualAddAttendee(payload);

      if (res.success && res.attendee) {
        setShowAddModal(false);
        setNewlyAddedStudent(res.attendee);
        loadDashboardData();

        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#22C55E', '#D4AF37', '#4A2E6D', '#E5C158'],
        });

        // Reset form & file
        handleRemoveReceiptFile();
        setAddForm({
          name: '',
          nic: '',
          studentClass: 'C1',
          customClass: '',
          phone: '',
          email: '',
          paymentStatus: 'FULL_APPROVED',
          paymentChoice: 'FULL',
          amountPaid: '6500',
          notes: 'Direct Cash / WhatsApp Confirmation',
        });
      }
    } catch (err) {
      setAddStudentError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setAddingStudentLoading(false);
    }
  };

  const handleDeleteAttendee = async () => {
    if (!deletingAttendee) return;
    setDeletingLoading(true);
    try {
      const res = await adminDeleteAttendee(deletingAttendee._id || deletingAttendee.id);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Attendee ${deletingAttendee.name} deleted successfully.`,
        });
        setDeletingAttendee(null);
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete attendee.');
    } finally {
      setDeletingLoading(false);
    }
  };

  const exportCsv = async () => {
    setExportingCsv(true);
    try {
      const blob = await exportAttendeesCsvApi();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Nostalgeste26-Attendees-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV. Ensure you have authorized admin session.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-gold-500/40 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-royal-950 border-2 border-gold-500 flex items-center justify-center text-gold-400 mx-auto shadow-gold-glow">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-royal-950">
              Admin Portal
            </h2>
            <p className="text-xs text-royal-600 mt-1">
              Authorized Committee Members Only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                Security Password / PIN
              </label>
              <input
                type="password"
                required
                disabled={lockoutTimer > 0}
                placeholder={lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Enter committee password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-royal-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 outline-none text-royal-950 text-sm bg-lavender-50/50 disabled:bg-gray-100 disabled:opacity-75"
              />
            </div>

            {lockoutTimer > 0 ? (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Brute-force protection: Please wait <strong>{lockoutTimer}s</strong> before trying again.</span>
              </div>
            ) : loginError ? (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
                {loginError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loginLoading || lockoutTimer > 0 || !password}
              className="w-full bg-royal-950 hover:bg-royal-900 text-gold-300 font-bold py-3.5 rounded-xl border border-gold-500/40 shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              {loginLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <p className="text-[11px] text-royal-500">
            Mahamaya Balika Vidyalaya 2026 Batch Party Gate & Verification System
          </p>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Top Bar / Header */}
      <div className="bg-royal-950 text-white rounded-3xl p-4 sm:p-6 border-2 border-gold-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 shrink-0 shadow-sm">
            <ShieldCheck className="w-6 sm:w-7 h-6 sm:h-7" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-gold-gradient">
              Committee Portal
            </h1>
            <p className="text-[11px] sm:text-xs text-royal-300">
              Nostalgeste '26 • Verification & Gate Scanner
            </p>
          </div>
        </div>

        {/* View Switcher: Attendees vs Gate Scanner */}
        <div className="flex items-center bg-royal-900/90 p-1.5 rounded-2xl border border-gold-500/30 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setAdminSubTab('verification')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              adminSubTab === 'verification'
                ? 'bg-gold-500 text-royal-950 shadow-gold-glow'
                : 'text-royal-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Slips & Passes</span>
          </button>

          <button
            onClick={() => setAdminSubTab('scanner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              adminSubTab === 'scanner'
                ? 'bg-gold-500 text-royal-950 shadow-gold-glow'
                : 'text-royal-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Gate QR Scanner</span>
          </button>
        </div>

        {/* Action Buttons: Add Student, Export, Refresh, Logout */}
        <div className="flex items-center justify-center sm:justify-end flex-wrap gap-2 w-full sm:w-auto">
          {adminSubTab === 'verification' && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shrink-0 border border-emerald-400/40"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Student</span>
              </button>

              <button
                onClick={exportCsv}
                disabled={exportingCsv}
                className="bg-gold-500 hover:bg-gold-400 text-royal-950 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-gold-glow disabled:opacity-50 shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{exportingCsv ? 'Exporting...' : 'CSV'}</span>
              </button>

              <button
                onClick={loadDashboardData}
                className="p-2 sm:p-2.5 rounded-xl bg-royal-900 hover:bg-royal-800 text-gold-300 border border-gold-500/30 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}

          <button
            onClick={handleLogout}
            className="p-2 sm:p-2.5 rounded-xl bg-royal-900 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* When QR Scanner sub-tab is active */}
      {adminSubTab === 'scanner' ? (
        <GateScanner />
      ) : (
        <>
          {/* Metrics Cards Grid */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-royal-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-royal-500 font-semibold mb-1">
                    Registered
                  </div>
                  <div className="font-serif text-xl sm:text-3xl font-bold text-royal-950">
                    {metrics.total}
                  </div>
                </div>
                <div className="text-[10px] text-royal-400 mt-1 truncate">
                  {metrics.dbMode}
                </div>
              </div>

              <div className="bg-emerald-50 p-3 sm:p-4 rounded-2xl border border-emerald-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-800 font-semibold mb-1">
                    Full Passes
                  </div>
                  <div className="font-serif text-xl sm:text-3xl font-bold text-emerald-700">
                    {metrics.fullApproved}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">
                  Golden QR active
                </div>
              </div>

              <div className="bg-amber-50 p-3 sm:p-4 rounded-2xl border border-amber-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-800 font-semibold mb-1">
                    Pending Review
                  </div>
                  <div className="font-serif text-xl sm:text-3xl font-bold text-amber-700">
                    {metrics.pendingTotal}
                  </div>
                </div>
                <div className="text-[10px] text-amber-600 mt-1">
                  Awaiting confirmation
                </div>
              </div>

              <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl border border-blue-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-blue-800 font-semibold mb-1">
                    Gate In
                  </div>
                  <div className="font-serif text-xl sm:text-3xl font-bold text-blue-700">
                    {metrics.checkedIn}
                  </div>
                </div>
                <div className="text-[10px] text-blue-600 mt-1">
                  Wristbands issued
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 lg:col-span-1 bg-gold-50 p-3 sm:p-4 rounded-2xl border border-gold-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gold-900 font-semibold mb-1">
                    Revenue
                  </div>
                  <div className="font-serif text-lg sm:text-2xl font-bold text-gold-800">
                    Rs. {metrics.totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-gold-700 mt-1">
                  Verified collections
                </div>
              </div>

            </div>
          )}

          {/* Feedback notification message */}
          {feedbackMsg && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950'
                  : 'bg-rose-50 border-2 border-rose-400 text-rose-950'
              }`}
            >
              <div className="flex items-center space-x-2">
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
              <button
                onClick={() => setFeedbackMsg(null)}
                className="text-royal-500 hover:text-royal-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-royal-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search NIC, Name, Phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/50"
                />
                <Search className="w-4 h-4 text-royal-400 absolute left-3 top-3" />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/50 font-semibold"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="FULL_APPROVED">Full Payment Approved</option>
                <option value="PENDING_FIRST_HALF">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Class filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/50 font-semibold"
              >
                <option value="ALL">All Classes</option>
                <option value="C1">Class C1</option>
                <option value="C2">Class C2</option>
                <option value="A1">Class A1</option>
                <option value="A2">Class A2</option>
                <option value="BM">Class BM</option>
              </select>

              {/* Check-In filter */}
              <select
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/50 font-semibold"
              >
                <option value="ALL">All Gate Check-In Statuses</option>
                <option value="true">Scanned at Gate</option>
                <option value="false">Not Checked In Yet</option>
              </select>

            </div>
          </div>

          {/* Attendees Table Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-royal-200 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-royal-100 flex items-center justify-between bg-lavender-50/50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-royal-700" />
                <h3 className="font-serif text-base sm:text-lg font-bold text-royal-950">
                  Attendee Verification List ({attendees.length})
                </h3>
              </div>
              <span className="text-[11px] text-royal-500 hidden sm:inline">
                Click "View Slip" or green WhatsApp button to dispatch pass
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-royal-900">
                <thead className="bg-royal-950 text-gold-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">NIC Number</th>
                    <th className="py-3.5 px-4">Name & Contact</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Paid</th>
                    <th className="py-3.5 px-4">Receipt Slip</th>
                    <th className="py-3.5 px-4">Gate Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-royal-100">
                  {attendees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-royal-400">
                        No attendees match your search filter.
                      </td>
                    </tr>
                  ) : (
                    attendees.map((att) => {
                      const attId = att._id || att.id;
                      const isPendingFirst = att.paymentStatus === 'PENDING_FIRST_HALF';
                      const isPendingSecond = att.paymentStatus === 'PENDING_SECOND_HALF';
                      const isHalfApproved = att.paymentStatus === 'HALF_APPROVED';
                      const isFullApproved = att.paymentStatus === 'FULL_APPROVED';
                      const isRejected = att.paymentStatus === 'REJECTED';
                      const isLoading = actionLoadingId === attId;

                      return (
                        <tr key={attId} className="hover:bg-lavender-50/70 transition-colors">
                          
                          {/* NIC */}
                          <td className="py-3.5 px-4 font-mono font-bold text-royal-950">
                            {att.nic || att.studentId}
                          </td>

                          {/* Name & Contact */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-royal-950">{att.name}</div>
                            <div className="text-[11px] text-royal-500">{att.email}</div>
                            <div className="text-[11px] text-royal-500 font-mono">{att.phone}</div>
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-4">
                            <span className="bg-royal-100 text-royal-800 px-2 py-0.5 rounded font-bold text-[11px]">
                              {att.studentClass || att.batch}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {isPendingFirst && (
                              <span className="inline-flex items-center space-x-1 text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-bold border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending 1st</span>
                              </span>
                            )}
                            {isPendingSecond && (
                              <span className="inline-flex items-center space-x-1 text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-bold border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending 2nd</span>
                              </span>
                            )}
                            {isHalfApproved && (
                              <span className="inline-flex items-center space-x-1 text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full font-bold border border-purple-300">
                                <CheckCircle2 className="w-3 h-3 text-purple-700" />
                                <span>1st Half OK</span>
                              </span>
                            )}
                            {isFullApproved && (
                              <span className="inline-flex items-center space-x-1 text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full font-bold border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Full Approved</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center space-x-1 text-rose-900 bg-rose-100 px-2.5 py-1 rounded-full font-bold border border-rose-300">
                                <X className="w-3 h-3 text-rose-700" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Paid Amount */}
                          <td className="py-3.5 px-4 font-bold text-royal-950">
                            Rs. {att.amountPaid?.toLocaleString() || 0}
                          </td>

                          {/* Receipt */}
                          <td className="py-3.5 px-4">
                            {att.receipts && att.receipts.length > 0 ? (
                              <button
                                onClick={() => setSelectedAttendee(att)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-royal-100 hover:bg-royal-200 text-royal-800 font-bold rounded-lg transition-colors text-[11px]"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Slip</span>
                              </button>
                            ) : (
                              <span className="text-royal-400 italic text-[11px]">Manual / No slip</span>
                            )}
                          </td>

                          {/* Gate Check-In Status */}
                          <td className="py-3.5 px-4">
                            {att.ticketUsed ? (
                              <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded font-bold text-[11px] border border-blue-300">
                                <Check className="w-3 h-3 text-blue-700" />
                                <span>Scanned #{att.wristbandNumber || 1}</span>
                              </span>
                            ) : (
                              <span className="text-royal-400 text-[11px]">Not yet</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              
                              {/* WhatsApp Dispatch Button */}
                              <button
                                onClick={() => openWhatsApp(att)}
                                className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors"
                                title="Send Ticket / Pass via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                              </button>

                              {/* Approve 1st Half */}
                              {isPendingFirst && att.paymentChoice === 'HALF' && (
                                <button
                                  onClick={() => handleStatusUpdate(attId, 'APPROVE_FIRST_HALF')}
                                  disabled={isLoading}
                                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                                >
                                  Approve 1st
                                </button>
                              )}

                              {/* Approve Full */}
                              {(isPendingFirst || isPendingSecond || isHalfApproved) && (
                                <button
                                  onClick={() => handleStatusUpdate(attId, 'APPROVE_FULL')}
                                  disabled={isLoading}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors flex items-center space-x-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve Full</span>
                                </button>
                              )}

                              {/* Reject */}
                              {!isFullApproved && !isRejected && (
                                <button
                                  onClick={() => {
                                    setRejectingAttendee(att);
                                    setRejectReason('Receipt photo is unclear or bank reference missing.');
                                  }}
                                  disabled={isLoading}
                                  className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold px-2 py-1 rounded-lg text-[11px] transition-colors"
                                >
                                  Reject
                                </button>
                              )}

                              {/* Resend Email */}
                              {isFullApproved && (
                                <button
                                  onClick={() => handleResendEmail(attId)}
                                  disabled={isLoading}
                                  className="p-1.5 rounded-lg bg-royal-100 hover:bg-royal-200 text-royal-700 transition-colors"
                                  title="Resend Ticket Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Attendee Button */}
                              <button
                                onClick={() => setDeletingAttendee(att)}
                                className="p-1.5 rounded-lg bg-royal-100 hover:bg-rose-100 text-royal-400 hover:text-rose-700 transition-colors"
                                title="Delete Attendee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-royal-100">
              {attendees.length === 0 ? (
                <div className="p-8 text-center text-royal-400 text-xs">
                  No attendees match the filter.
                </div>
              ) : (
                attendees.map((att) => {
                  const attId = att._id || att.id;
                  const isPendingFirst = att.paymentStatus === 'PENDING_FIRST_HALF';
                  const isPendingSecond = att.paymentStatus === 'PENDING_SECOND_HALF';
                  const isHalfApproved = att.paymentStatus === 'HALF_APPROVED';
                  const isFullApproved = att.paymentStatus === 'FULL_APPROVED';
                  const isRejected = att.paymentStatus === 'REJECTED';
                  const isLoading = actionLoadingId === attId;

                  return (
                    <div key={attId} className="p-4 space-y-3 bg-white">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-royal-950 text-sm">{att.name}</div>
                          <div className="font-mono text-xs text-royal-600 font-semibold">{att.nic || att.studentId} • {att.phone}</div>
                        </div>
                        <span className="bg-royal-100 text-royal-800 px-2 py-0.5 rounded text-xs font-bold">
                          {att.studentClass || att.batch}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center text-xs">
                        {isPendingFirst && <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-semibold">Pending 1st</span>}
                        {isPendingSecond && <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-semibold">Pending 2nd</span>}
                        {isHalfApproved && <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded font-semibold">Half Approved</span>}
                        {isFullApproved && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-semibold">Full Approved</span>}
                        {isRejected && <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded font-semibold">Rejected</span>}

                        <span className="font-bold text-royal-950">Rs. {att.amountPaid?.toLocaleString() || 0}</span>

                        {att.ticketUsed && (
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            Scanned #{att.wristbandNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-royal-50">
                        <div className="flex space-x-2 items-center">
                          {att.receipts && att.receipts.length > 0 ? (
                            <button
                              onClick={() => setSelectedAttendee(att)}
                              className="text-xs text-royal-800 font-bold bg-royal-100 px-2.5 py-1.5 rounded-lg flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Slip</span>
                            </button>
                          ) : <span className="text-xs text-royal-400">No slip</span>}

                          <button
                            onClick={() => openWhatsApp(att)}
                            className="text-xs text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center space-x-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span>WhatsApp</span>
                          </button>
                        </div>

                        <div className="flex space-x-1.5">
                          {isPendingFirst && att.paymentChoice === 'HALF' && (
                            <button
                              onClick={() => handleStatusUpdate(attId, 'APPROVE_FIRST_HALF')}
                              disabled={isLoading}
                              className="bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs"
                            >
                              Approve 1st
                            </button>
                          )}

                          {(isPendingFirst || isPendingSecond || isHalfApproved) && (
                            <button
                              onClick={() => handleStatusUpdate(attId, 'APPROVE_FULL')}
                              disabled={isLoading}
                              className="bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Full Pass</span>
                            </button>
                          )}

                          {!isFullApproved && !isRejected && (
                            <button
                              onClick={() => {
                                setRejectingAttendee(att);
                                setRejectReason('Receipt photo is unclear.');
                              }}
                              disabled={isLoading}
                              className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1.5 rounded-lg text-xs"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => setDeletingAttendee(att)}
                            className="p-1.5 rounded-lg bg-royal-100 text-royal-400 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Receipt Viewer Modal */}
          {selectedAttendee && (
            <ReceiptModal
              attendee={selectedAttendee}
              onClose={() => setSelectedAttendee(null)}
            />
          )}

          {/* Rejection Note Prompt Modal */}
          {rejectingAttendee && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-rose-300">
                <div className="flex items-center space-x-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-serif text-lg font-bold">Reject Payment Slip</h3>
                </div>

                <p className="text-xs text-royal-600">
                  Please specify the reason for rejecting <strong>{rejectingAttendee.name}</strong>'s slip ({rejectingAttendee.nic || rejectingAttendee.studentId}).
                </p>

                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Receipt photo is unclear, please upload a clearer image."
                  className="w-full p-3 rounded-xl border border-royal-200 text-xs focus:border-rose-500 outline-none"
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setRejectingAttendee(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-royal-100 text-royal-800 hover:bg-royal-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(rejectingAttendee._id || rejectingAttendee.id, 'REJECT', rejectReason)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingAttendee && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border-2 border-rose-400 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-rose-950">Delete Attendee?</h3>
                  <p className="text-xs text-royal-600 mt-1">
                    Are you sure you want to delete <strong>{deletingAttendee.name}</strong> (NIC: {deletingAttendee.nic || deletingAttendee.studentId})? This action cannot be undone.
                  </p>
                </div>

                <div className="flex justify-center space-x-2 pt-2">
                  <button
                    onClick={() => setDeletingAttendee(null)}
                    disabled={deletingLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-royal-100 text-royal-800 hover:bg-royal-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAttendee}
                    disabled={deletingLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                  >
                    {deletingLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* MODAL 1: MANUAL ADD STUDENT MODAL                       */}
          {/* ======================================================= */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border-3 border-gold-500 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between border-b border-royal-100 pb-3">
                  <div className="flex items-center space-x-2.5 text-royal-950">
                    <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-royal-900">
                      <UserPlus className="w-5 h-5 text-gold-700" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold">Manual Add Student</h3>
                      <p className="text-[11px] text-royal-500">For Cash Payments or Direct WhatsApp Receipts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleRemoveReceiptFile();
                      setShowAddModal(false);
                    }}
                    className="p-1 rounded-lg text-royal-400 hover:text-royal-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Error Banner */}
                {addStudentError && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl text-xs text-rose-950 flex items-start space-x-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{addStudentError}</span>
                  </div>
                )}

                <form onSubmit={handleManualAddSubmit} className="space-y-4 text-left">
                  
                  {/* Name & NIC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kasun Perera"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                        NIC Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 200429103702"
                        value={addForm.nic}
                        onChange={(e) => setAddForm({ ...addForm, nic: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm uppercase font-mono font-bold outline-none focus:border-gold-500 bg-lavender-50/40"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                        WhatsApp / Mobile No. *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0771234567"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/40 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. student@gmail.com"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/40"
                      />
                    </div>
                  </div>

                  {/* Class & Payment Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                        Class *
                      </label>
                      <select
                        value={addForm.studentClass}
                        onChange={(e) => setAddForm({ ...addForm, studentClass: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-royal-200 text-xs sm:text-sm outline-none focus:border-gold-500 bg-lavender-50/40 font-semibold"
                      >
                        {predefinedClasses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      {addForm.studentClass === 'Other / Custom' && (
                        <input
                          type="text"
                          required
                          placeholder="Type Class"
                          value={addForm.customClass}
                          onChange={(e) => setAddForm({ ...addForm, customClass: e.target.value })}
                          className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gold-500 text-xs outline-none uppercase"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                        Payment Mode *
                      </label>
                      <div className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gold-500 text-royal-950 border border-gold-600 shadow-sm text-center">
                        Full Payment Pass (Rs. 6,500)
                      </div>
                    </div>
                  </div>

                  {/* Payment Receipt Slip Upload (Optional - WhatsApp Slip / Bank Receipt) */}
                  <div>
                    <label className="flex items-center justify-between text-xs uppercase font-bold text-royal-700 mb-1">
                      <span className="flex items-center space-x-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-gold-600" />
                        <span>Payment Receipt Slip (WhatsApp / Bank)</span>
                      </span>
                      <span className="text-[10px] font-semibold text-royal-500 normal-case bg-royal-100 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    </label>

                    {!receiptFile ? (
                      <label className="flex flex-col items-center justify-center p-3.5 sm:p-4 border-2 border-dashed border-royal-200 hover:border-gold-500 rounded-2xl bg-lavender-50/40 hover:bg-gold-50/30 transition-all cursor-pointer group">
                        <UploadCloud className="w-7 h-7 text-royal-400 group-hover:text-gold-600 transition-colors mb-1" />
                        <span className="text-xs font-bold text-royal-800 group-hover:text-royal-950 text-center">
                          Click to upload WhatsApp slip / bank receipt
                        </span>
                        <span className="text-[10px] text-royal-500 mt-0.5">
                          PNG, JPG, WEBP, or PDF (Max 10MB)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                          onChange={handleReceiptFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {receiptPreview ? (
                            <img
                              src={receiptPreview}
                              alt="Slip preview"
                              className="w-11 h-11 object-cover rounded-xl border border-emerald-300 shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-royal-950 truncate">{receiptFile.name}</p>
                            <p className="text-[10px] text-emerald-700 font-medium">
                              {(receiptFile.size / 1024).toFixed(1)} KB • Attached ✅
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveReceiptFile}
                          className="p-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex-shrink-0"
                          title="Remove slip"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-royal-700 mb-1">
                      Admin Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Collected cash / WhatsApp bank receipt"
                      value={addForm.notes}
                      onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-royal-200 text-xs outline-none focus:border-gold-500 bg-lavender-50/40"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-royal-100">
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveReceiptFile();
                        setShowAddModal(false);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-royal-100 text-royal-800 hover:bg-royal-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingStudentLoading}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{addingStudentLoading ? 'Saving...' : 'Register & Issue Pass'}</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* MODAL 2: POST-ADD WHATSAPP PASS DISPATCH MODAL          */}
          {/* ======================================================= */}
          {newlyAddedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-4 border-emerald-500 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
                
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    Pass Successfully Issued!
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-royal-950 pt-1">
                    {newlyAddedStudent.name}
                  </h3>
                  <p className="text-xs text-royal-600">
                    NIC: <strong className="font-mono">{newlyAddedStudent.nic || newlyAddedStudent.studentId}</strong> • Class: <strong>{newlyAddedStudent.studentClass || newlyAddedStudent.batch}</strong>
                  </p>
                </div>

                {/* Summary Box */}
                <div className="bg-lavender-50 rounded-2xl p-4 border border-lavender-300 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-lavender-200 pb-1.5">
                    <span className="text-royal-500">Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Full Pass (Rs. 6,500)
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-lavender-200 pb-1.5">
                    <span className="text-royal-500">WhatsApp:</span>
                    <span className="font-mono font-bold text-royal-950">{newlyAddedStudent.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-royal-500">QR Pass Token:</span>
                    <span className="font-mono text-[11px] text-royal-800 truncate max-w-[200px]">{newlyAddedStudent.qrToken}</span>
                  </div>
                </div>

                {/* Action Buttons: 1-Click WhatsApp Send, Copy, Close */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => openWhatsApp(newlyAddedStudent)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span>Send Pass on WhatsApp ({newlyAddedStudent.phone}) &rarr;</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppText(newlyAddedStudent)}
                      className="bg-royal-100 hover:bg-royal-200 text-royal-900 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all border border-royal-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedWhatsApp ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.open(`${window.location.origin}/?token=${newlyAddedStudent.qrToken}`, '_blank');
                      }}
                      className="bg-gold-500/20 hover:bg-gold-500/30 text-royal-950 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all border border-gold-500/40"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Pass</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewlyAddedStudent(null)}
                    className="w-full text-xs text-royal-500 hover:text-royal-800 font-medium py-2"
                  >
                    Close & Return to Attendees
                  </button>
                </div>

              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
