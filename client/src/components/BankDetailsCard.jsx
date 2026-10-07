import React, { useState } from 'react';
import { Building2, Copy, Check, AlertCircle, Sparkles, CreditCard } from 'lucide-react';

export default function BankDetailsCard({ bank, prices, deadline = "October 14, 2026" }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const bankInfo = bank || {
    bankName: "Commercial Bank",
    accountName: "Mahamaya 2026 Batch Committee",
    accountNumber: "8010203040",
    branch: "Kadawatha",
  };

  const fullPrice = prices?.fullTicketPrice || 6500;

  return (
    <div className="bg-gradient-to-br from-royal-900 via-royal-800 to-royal-950 text-white rounded-2xl p-6 sm:p-8 border-2 border-gold-500/50 shadow-2xl relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-royal-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gold-gradient">
              Official Bank Deposit Details
            </h3>
            <p className="text-xs sm:text-sm text-royal-200">
              Transfer funds via Bank Deposit / Online Banking / CDM Machine
            </p>
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 bg-gold-500/15 border border-gold-500/40 px-3.5 py-1.5 rounded-full self-start sm:self-center">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span className="text-xs font-semibold text-gold-300">
            Deadline: {deadline}
          </span>
        </div>
      </div>

      {/* Single Ticket Price Card */}
      <div className="mb-6">
        <div className="bg-royal-950/70 p-5 rounded-2xl border-2 border-gold-500/40 hover:border-gold-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-300">Official Entry Pass</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">All-Inclusive</span>
            </div>
            <div className="font-serif text-3xl font-extrabold text-gold-400">
              Rs. {fullPrice.toLocaleString()}
            </div>
            <p className="text-xs sm:text-sm text-royal-200 mt-1">
              Complete batch party pass includes entry, catering, entertainment & official wristband.
            </p>
          </div>

          <div className="bg-royal-900/80 px-4 py-3 rounded-xl border border-gold-500/20 text-xs text-gold-200 text-left sm:text-right shrink-0">
            <div className="font-bold text-gold-300">How to get your Pass:</div>
            <div>Deposit Rs. {fullPrice.toLocaleString()} & send slip to committee</div>
          </div>
        </div>
      </div>

      {/* Bank Account Grid */}
      <div className="bg-royal-950/80 rounded-xl p-5 border border-gold-500/30 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
          
          <div>
            <span className="text-xs text-royal-400 uppercase tracking-wider block mb-1">Bank Name</span>
            <p className="font-semibold text-white text-sm">{bankInfo.bankName}</p>
          </div>

          <div>
            <span className="text-xs text-royal-400 uppercase tracking-wider block mb-1">Account Name</span>
            <p className="font-semibold text-white text-sm">{bankInfo.accountName}</p>
          </div>

          <div>
            <span className="text-xs text-royal-400 uppercase tracking-wider block mb-1">Account Number</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-bold text-gold-400">{bankInfo.accountNumber}</span>
              <button
                onClick={() => copyToClipboard(bankInfo.accountNumber)}
                className="p-1 rounded bg-royal-800 hover:bg-gold-500/30 text-gold-300 hover:text-gold-200 transition-colors"
                title="Copy Account Number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <span className="text-[10px] text-emerald-400 font-medium">Copied to clipboard!</span>}
          </div>

          <div>
            <span className="text-xs text-royal-400 uppercase tracking-wider block mb-1">Branch</span>
            <p className="font-semibold text-white text-sm">{bankInfo.branch}</p>
          </div>

        </div>

        {/* Reference Instruction Banner */}
        <div className="flex items-start space-x-2.5 bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 text-xs text-gold-200">
          <AlertCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-gold-300 font-semibold">Important Deposit Note: </strong>
            Please write or enter your <strong>Student ID</strong> in the reference / remark field of your bank transfer so the committee can verify your deposit immediately.
          </div>
        </div>
      </div>

    </div>
  );
}
