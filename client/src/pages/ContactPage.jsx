import React from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  HeartHandshake,
  Users,
  Ticket,
} from 'lucide-react';

export default function ContactPage({ onBackToPass }) {
  const committeeMembers = [
    {
      name: 'Dihansa Sanudini',
      role: 'Head Coordinator & Batch Rep',
      class: '13-A',
      phone: '075 765 0348',
      rawPhone: '94771234567',
      email: 'sanduni.mbv2026@gmail.com',
      avatarColor: 'from-amber-500 to-gold-400',
      responsibilities: 'General event inquiries, registration assistance, timetable & venue access.',
      badge: 'Main Coordinator',
    },
    {
      name: 'Rashmi Jayasuriya',
      role: 'Treasurer & Slip Verifications',
      class: '13-C',
      phone: '071 987 6543',
      rawPhone: '94719876543',
      email: 'treasurer.mbv2026@gmail.com',
      avatarColor: 'from-emerald-500 to-teal-400',
      responsibilities: 'Bank transfer issues, slip re-uploads, 2nd half balance verification.',
      badge: 'Finance & Payments',
    },
    {
      name: 'Sujana Dinuwara',
      role: 'IT & Digital Ticketing Lead',
      phone: '076 537 6323',
      rawPhone: '94704567890',
      email: 'sujanadinuwara@gmail.com',
      avatarColor: 'from-blue-600 to-indigo-400',
      responsibilities: 'QR Pass download issues, email delivery, barcode verification errors.',
      badge: 'Tech & Pass Support',
    },
    {
      name: 'Tharushi Fernando',
      role: 'Gate & Hospitality Lead',
      class: '13-E',
      phone: '078 333 4455',
      rawPhone: '94783334455',
      email: 'hospitality.mbv2026@gmail.com',
      avatarColor: 'from-rose-500 to-pink-400',
      responsibilities: 'Wristband allocation, dietary requirements, entrance dress code guidelines.',
      badge: 'Gate & Hospitality',
    },
  ];

  const openWhatsApp = (rawPhone, name, role) => {
    const text = `👋 Hello ${name} (${role}),\nI am contacting you regarding an inquiry for Nostalgeste '26 School Batch Party.\n\nMy Details:\n• Name:\n• NIC / Class:\n• My Question / Issue:`;
    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-royal-950 via-royal-900 to-royal-950 text-white rounded-3xl p-6 sm:p-10 border-2 border-gold-500/40 shadow-2xl text-center space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-royal-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center space-x-2 bg-gold-500/20 border border-gold-400/40 px-3.5 py-1 rounded-full text-xs font-semibold text-gold-300">
          <HeartHandshake className="w-3.5 h-3.5 text-gold-400" />
          <span>Student Support Center</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-gold-gradient">
          Organizing Committee & Help Desk
        </h1>

        <p className="text-xs sm:text-sm text-royal-200 max-w-2xl mx-auto leading-relaxed">
          Need help with your bank transfer slip, ticket approval, or event inquiries? Our dedicated committee members are ready to assist you.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onBackToPass}
            className="bg-gold-500 hover:bg-gold-400 text-royal-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-gold-glow flex items-center space-x-1.5"
          >
            <Ticket className="w-4 h-4" />
            <span>Go to Student Pass</span>
          </button>
        </div>
      </div>

      {/* Committee Contacts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gold-600" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-royal-950">
              Committee Representatives
            </h2>
          </div>
          <span className="text-[11px] text-royal-500">Tap WhatsApp or Call for instant help</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {committeeMembers.map((member, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-royal-200 shadow-lg hover:shadow-xl transition-all duration-300 space-y-4 relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${member.avatarColor} p-0.5 shadow-md flex items-center justify-center text-white font-bold text-lg font-serif`}
                  >
                    <div className="w-full h-full rounded-[14px] bg-royal-950 flex items-center justify-center text-gold-300">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-royal-950">
                      {member.name}
                    </h3>
                    <p className="text-xs text-royal-600 font-medium">
                      {member.role} {member.class && <>• <span className="font-bold text-royal-800">Class {member.class}</span></>}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-wider bg-gold-100 text-gold-900 border border-gold-300 px-2 py-0.5 rounded-full">
                  {member.badge}
                </span>
              </div>

              <p className="text-xs text-royal-600 bg-lavender-50/70 p-3 rounded-xl border border-royal-100/80 leading-relaxed">
                {member.responsibilities}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => openWhatsApp(member.rawPhone, member.name, member.role)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <a
                  href={`tel:${member.rawPhone}`}
                  className="bg-royal-100 hover:bg-royal-200 text-royal-900 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-royal-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-royal-700" />
                  <span>Call {member.phone.slice(0, 7)}...</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Help Banner */}
      <div className="bg-royal-950 text-gold-200 rounded-2xl p-5 border border-gold-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-gold-400 shrink-0" />
          <div>
            <div className="font-bold text-sm text-white">Support Hours</div>
            <div className="text-xs text-royal-300">
              Committee members are available daily from 8:00 AM to 10:00 PM.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const text = `👋 Hello Nostalgeste '26 Committee Helpdesk, I need assistance with my student pass.`;
            window.open(`https://wa.me/94771234567?text=${encodeURIComponent(text)}`, '_blank');
          }}
          className="bg-gold-500 hover:bg-gold-400 text-royal-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-gold-glow flex items-center space-x-1.5"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Quick Helpdesk</span>
        </button>
      </div>

    </div>
  );
}
