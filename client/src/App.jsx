import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StudentPortal from './pages/StudentPortal';
import AdminDashboard from './pages/AdminDashboard';
import GateScanner from './pages/GateScanner';
import ContactPage from './pages/ContactPage';
import VerifyTokenModal from './components/VerifyTokenModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('student');
  const [scannedToken, setScannedToken] = useState(null);

  useEffect(() => {
    // Check URL parameters on mount
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const tabParam = urlParams.get('tab');
    const adminParam = urlParams.get('admin');

    if (token) {
      setScannedToken(token);
    } else if (tabParam === 'admin' || adminParam === 'true' || window.location.pathname.includes('/admin')) {
      setActiveTab('admin');
    } else if (tabParam === 'scanner' || window.location.pathname.includes('/scanner')) {
      setActiveTab('scanner');
    } else if (tabParam === 'contact' || window.location.pathname.includes('/contact')) {
      setActiveTab('contact');
    }

    // Secret committee hotkeys: Alt+A for Admin, Alt+S for Scanner, Alt+P for Pass, Alt+C for Contact
    const handleKeyDown = (e) => {
      if ((e.altKey || (e.ctrlKey && e.shiftKey)) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setActiveTab('admin');
      } else if ((e.altKey || (e.ctrlKey && e.shiftKey)) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setActiveTab('scanner');
      } else if ((e.altKey || (e.ctrlKey && e.shiftKey)) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveTab('student');
      } else if ((e.altKey || (e.ctrlKey && e.shiftKey)) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setActiveTab('contact');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseVerifyModal = () => {
    setScannedToken(null);
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="pb-12">
          {activeTab === 'student' && <StudentPortal onGoToContact={() => setActiveTab('contact')} />}
          {activeTab === 'contact' && <ContactPage onBackToPass={() => setActiveTab('student')} />}
          {activeTab === 'scanner' && <GateScanner />}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>
      </div>

      <Footer 
        onAdminClick={() => setActiveTab('admin')} 
        onContactClick={() => setActiveTab('contact')}
      />

      {/* Auto-open verification modal when scanned by any phone camera */}
      {scannedToken && (
        <VerifyTokenModal
          token={scannedToken}
          onClose={handleCloseVerifyModal}
        />
      )}
    </div>
  );
}
