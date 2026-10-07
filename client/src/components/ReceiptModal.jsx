import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

export default function ReceiptModal({ attendee, onClose }) {
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!attendee) return null;

  const receipts = attendee.receipts || [];
  const currentReceipt = receipts[selectedReceiptIndex] || receipts[0];

  const getNormalizedUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('https://res.cloudinary.com') || url.startsWith('http://res.cloudinary.com')) return url;
    if (url.includes('/uploads/')) {
      const filename = url.split('/uploads/')[1];
      return `/uploads/${filename}`;
    }
    return url;
  };

  const normalizedUrl = getNormalizedUrl(currentReceipt?.url);
  const isPdf =
    normalizedUrl.toLowerCase().includes('.pdf') ||
    currentReceipt?.originalFilename?.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-royal-950 text-white rounded-2xl w-full max-w-4xl border-2 border-gold-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/30 bg-royal-900">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-gold-gradient">
                Payment Verification Slip
              </h3>
              <span className="text-xs bg-gold-500/20 text-gold-300 border border-gold-500/40 px-2 py-0.5 rounded-full font-mono">
                {attendee.studentId}
              </span>
            </div>
            <p className="text-xs text-royal-200">
              {attendee.name} • {attendee.batch} • {attendee.phone}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-royal-800 text-royal-200 hover:text-white hover:bg-royal-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Selector Tabs if multiple */}
        {receipts.length > 1 && (
          <div className="flex items-center space-x-2 px-6 py-2.5 bg-royal-900/60 border-b border-royal-800">
            <span className="text-xs text-royal-300 font-medium">Uploaded Receipts:</span>
            {receipts.map((rcpt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedReceiptIndex(idx);
                  handleReset();
                }}
                className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${
                  selectedReceiptIndex === idx
                    ? 'bg-gold-500 text-royal-950 shadow-sm'
                    : 'bg-royal-800 text-royal-200 hover:bg-royal-700'
                }`}
              >
                {rcpt.paymentType === 'FIRST_HALF'
                  ? '1. First Half Slip'
                  : rcpt.paymentType === 'SECOND_HALF'
                  ? '2. Second Half Slip'
                  : 'Full Payment Slip'}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar & Image Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-royal-950 overflow-hidden relative min-h-[350px]">
          
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 bg-royal-900/90 backdrop-blur-md p-1.5 rounded-xl border border-gold-500/30">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-royal-800 text-royal-200 hover:text-gold-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-royal-800 text-royal-200 hover:text-gold-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 rounded-lg hover:bg-royal-800 text-royal-200 hover:text-gold-300 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="text-xs px-2 py-1 rounded-lg hover:bg-royal-800 text-royal-300 hover:text-white transition-colors"
            >
              Reset
            </button>
            {normalizedUrl && (
              <a
                href={normalizedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg hover:bg-royal-800 text-gold-400 hover:text-gold-300 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Image / PDF Container with Zoom & Rotate */}
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4 max-h-[60vh]">
            {normalizedUrl ? (
              isPdf ? (
                <div className="w-full h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center bg-royal-900/60 rounded-xl p-6 text-center space-y-4 border border-gold-500/20">
                  <FileText className="w-16 h-16 text-gold-400 mx-auto animate-pulse" />
                  <div>
                    <h4 className="font-bold text-base text-white">PDF Payment Receipt Attached</h4>
                    <p className="text-xs text-royal-300 mt-1 max-w-sm">
                      {currentReceipt.originalFilename || 'bank_transfer_slip.pdf'}
                    </p>
                  </div>
                  <a
                    href={normalizedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gold-500 hover:bg-gold-400 text-royal-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow-gold-glow transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View & Download PDF Receipt &rarr;</span>
                  </a>
                </div>
              ) : (
                <img
                  src={normalizedUrl}
                  alt="Payment Slip"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg border border-gold-500/20 shadow-2xl"
                />
              )
            ) : (
              <div className="text-center p-8 text-royal-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-royal-600" />
                <p>No receipt image available.</p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer with details */}
        <div className="px-6 py-4 bg-royal-900 border-t border-gold-500/20 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <div className="text-royal-300 space-y-0.5">
            <div>
              <strong className="text-white">Uploaded On: </strong>
              {currentReceipt?.uploadedAt ? new Date(currentReceipt.uploadedAt).toLocaleString() : 'N/A'}
            </div>
            <div>
              <strong className="text-white">Payment Type: </strong>
              <span className="text-gold-300 font-semibold">{currentReceipt?.paymentType || 'N/A'}</span>
              {currentReceipt?.amount ? ` (Rs. ${currentReceipt.amount.toLocaleString()})` : ''}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-royal-800 hover:bg-royal-700 text-white font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
