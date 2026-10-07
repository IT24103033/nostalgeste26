import nodemailer from 'nodemailer';
import { generateQRCodeBuffer } from './qr.js';

let transporterPromise = null;

const getTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const cleanUser = process.env.EMAIL_USER.trim();
    const cleanPass = process.env.EMAIL_PASS.trim().replace(/\s+/g, '');

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });
  }

  // Fallback to Ethereal for testing if credentials are not set
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      console.log('📧 Nodemailer using Ethereal Test Account:', testAccount.user);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }
  return transporterPromise;
};

export const sendTicketEmail = async (attendee) => {
  try {
    const transporter = await getTransporter();
    const qrBuffer = await generateQRCodeBuffer(attendee.qrToken);

    const eventName = process.env.EVENT_NAME || "Nostalgeste '26";
    const eventDate = process.env.EVENT_DATE || 'October 31, 2026';
    const eventTime = process.env.EVENT_TIME || '8:00 AM';
    const eventVenue = process.env.EVENT_VENUE || 'Rose Garden, Ragama Rd, Kadawatha';
    const organizer = process.env.ORGANIZER || 'Mahamaya Balika Vidyalaya, Kadawatha';
    const userNic = attendee.nic || attendee.studentId || '';
    const userClass = attendee.studentClass || attendee.batch || '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background-color: #F7F4FA;
      margin: 0;
      padding: 20px;
      color: #2E1A47;
    }
    .ticket-container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #D4AF37;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(74, 46, 109, 0.15);
    }
    .ticket-header {
      background: linear-gradient(135deg, #2E1A47 0%, #4A2E6D 50%, #69338C 100%);
      color: #FFFFFF;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    .sub-tagline {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #E5C158;
      margin-bottom: 8px;
    }
    .title {
      font-size: 38px;
      font-weight: bold;
      font-style: italic;
      color: #FFF;
      margin: 0 0 6px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .quote {
      font-size: 13px;
      color: #E8DFEE;
      font-style: italic;
      margin: 0;
    }
    .ticket-badge {
      display: inline-block;
      margin-top: 12px;
      padding: 4px 16px;
      background: rgba(212, 175, 55, 0.2);
      border: 1px solid #D4AF37;
      border-radius: 20px;
      color: #F3E5AB;
      font-size: 11px;
      letter-spacing: 2px;
      font-weight: bold;
    }
    .ticket-body {
      padding: 30px 25px;
    }
    .attendee-card {
      background: #FAF7FC;
      border: 1px dashed #D4AF37;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .qr-section {
      text-align: center;
      padding: 20px;
      background: #FFFFFF;
      border: 1px solid #E8DFEE;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .qr-img {
      width: 220px;
      height: 220px;
      border-radius: 8px;
      border: 2px solid #D4AF37;
      padding: 8px;
      background: #FFFFFF;
    }
    .qr-instruction {
      font-size: 12px;
      color: #69338C;
      margin-top: 10px;
      font-weight: bold;
    }
    .event-details {
      background: #4A2E6D;
      color: #FFFFFF;
      padding: 16px 20px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.6;
    }
    .event-details strong {
      color: #E5C158;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: #7B6888;
      border-top: 1px solid #E8DFEE;
      background: #FAF7FC;
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="ticket-header">
      <div class="sub-tagline">Join us for a day of nostalgia & cherished memories</div>
      <div class="title">${eventName}</div>
      <div class="quote">Rewinding the Time. Reliving the Memories.</div>
      <div class="ticket-badge">OFFICIAL ENTRY PASS • ADMIT ONE</div>
    </div>

    <div class="ticket-body">
      <p style="font-size: 15px; line-height: 1.5; text-align: center; margin-bottom: 20px;">
        Dear <strong>${attendee.name}</strong>,<br/>
        Your payment has been verified and your ticket for <strong>${eventName}</strong> is confirmed!
      </p>

      <div class="attendee-card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #7B6888; font-size: 13px;">Student Name:</td>
            <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #2E1A47; font-size: 14px;">${attendee.name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #7B6888; font-size: 13px;">NIC Number:</td>
            <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #4A2E6D; font-size: 14px;">${userNic}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #7B6888; font-size: 13px;">Class:</td>
            <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #2E1A47; font-size: 14px;">${userClass}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #7B6888; font-size: 13px;">Payment Status:</td>
            <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #15803d; font-size: 13px;">✓ FULLY PAID</td>
          </tr>
        </table>
      </div>

      <div class="qr-section">
        <img src="cid:ticketqr" alt="Ticket QR Code" class="qr-img" />
        <div class="qr-instruction">
          📱 Present this QR code at the gate entrance for wristband verification
        </div>
        <div style="font-size: 10px; color: #9E9E9E; margin-top: 4px;">Pass Token: ${attendee.qrToken}</div>
      </div>

      <div class="event-details">
        <strong>🏫 Institution:</strong> ${organizer}<br/>
        <strong>📅 Date:</strong> ${eventDate}<br/>
        <strong>⏰ Time:</strong> ${eventTime}<br/>
        <strong>📍 Venue:</strong> ${eventVenue}<br/>
        <strong>👔 Dress Code:</strong> Semi-formal / Elegant attire
      </div>
    </div>

    <div class="footer">
      This is a digitally verified e-ticket. Non-transferable.<br/>
      Nostalgeste '26 Organizing Committee • Mahamaya Balika Vidyalaya, Kadawatha
    </div>
  </div>
</body>
</html>
    `;

    const fromAddress = process.env.EMAIL_USER
      ? `"Nostalgeste '26" <${process.env.EMAIL_USER.trim()}>`
      : (process.env.EMAIL_FROM || '"Nostalgeste 26" <tickets@nostalgeste26.com>');

    const mailOptions = {
      from: fromAddress,
      to: attendee.email,
      subject: `🎟️ Your Official Ticket for Nostalgeste '26 - ${attendee.name}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Nostalgeste26-Ticket-${userNic}.png`,
          content: qrBuffer,
          cid: 'ticketqr',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${attendee.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending ticket email:', error);
    return { success: false, error: error.message };
  }
};
