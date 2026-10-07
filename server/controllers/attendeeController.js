import { dbStore } from '../services/dbStore.js';
import { generateQRCodeDataURL } from '../utils/qr.js';
import { processSlipUpload } from '../config/cloudinary.js';
import { maskEmail, maskPhone } from '../middleware/security.js';

/**
 * Get Public Event Configuration & Bank Details
 */
export const getEventConfig = async (req, res) => {
  try {
    const config = {
      eventName: process.env.EVENT_NAME || "Nostalgeste '26",
      tagline: "Rewinding the Time. Reliving the Memories.",
      organizer: process.env.ORGANIZER || "Mahamaya Balika Vidyalaya, Kadawatha",
      date: process.env.EVENT_DATE || "October 31, 2026",
      time: process.env.EVENT_TIME || "8:00 AM",
      venue: process.env.EVENT_VENUE || "Rose Garden, Ragama Rd, Kadawatha",
      paymentDeadline: process.env.PAYMENT_DEADLINE || "October 14, 2026",
      fullTicketPrice: Number(process.env.FULL_TICKET_PRICE) || 6500,
      bank: {
        bankName: process.env.BANK_NAME || "Commercial Bank",
        accountName: process.env.BANK_ACCOUNT_NAME || "Mahamaya 2026 Batch Committee",
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || "8010203040",
        branch: process.env.BANK_BRANCH || "Kadawatha",
      },
    };
    return res.status(200).json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lookup Attendee by NIC / ID (With Privacy Data Masking)
 */
export const getAttendeeByStudentId = async (req, res) => {
  try {
    const queryId = (req.params.studentId || req.params.nic || '').trim().toUpperCase();
    const attendee = await dbStore.findByNic(queryId);

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: `No registration found with NIC: ${queryId}. Please register below!`,
      });
    }

    // Convert Mongoose doc to plain JS object first
    const attendeeObj = attendee.toObject ? attendee.toObject() : { ...attendee };

    let qrCodeDataURL = null;
    let qrToken = attendeeObj.qrToken;
    if (attendeeObj.paymentStatus === 'FULL_APPROVED') {
      if (!qrToken) {
        qrToken = (attendeeObj._id || attendeeObj.id || Math.random().toString(36).substring(2)) + 'PA';
        await dbStore.update(attendeeObj._id || attendeeObj.id, { qrToken });
        attendeeObj.qrToken = qrToken;
      }
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const verifyUrl = `${clientUrl}/?token=${qrToken}`;
      qrCodeDataURL = await generateQRCodeDataURL(verifyUrl);
    }

    // Privacy Masking for public lookup
    const maskedAttendee = {
      ...attendeeObj,
      email: attendeeObj.paymentStatus === 'FULL_APPROVED' ? attendeeObj.email : maskEmail(attendeeObj.email),
      phone: attendeeObj.paymentStatus === 'FULL_APPROVED' ? attendeeObj.phone : maskPhone(attendeeObj.phone),
    };

    return res.status(200).json({
      success: true,
      attendee: maskedAttendee,
      qrCodeDataURL,
    });
  } catch (error) {
    console.error('Error fetching attendee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lookup Attendee by QR Token (for Gate camera / verification pop-up / Digital Pass view)
 */
export const lookupAttendeeByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    const attendee = await dbStore.findByQrToken(token.trim());
    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'No attendee found matching this QR code token.',
      });
    }

    const attendeeObj = attendee.toObject ? attendee.toObject() : { ...attendee };

    let qrCodeDataURL = null;
    if (attendeeObj.paymentStatus === 'FULL_APPROVED') {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const verifyUrl = `${clientUrl}/?token=${attendeeObj.qrToken}`;
      qrCodeDataURL = await generateQRCodeDataURL(verifyUrl);
    }

    return res.status(200).json({
      success: true,
      attendee: {
        _id: attendeeObj._id || attendeeObj.id,
        name: attendeeObj.name,
        nic: attendeeObj.nic || attendeeObj.studentId,
        studentClass: attendeeObj.studentClass || attendeeObj.batch,
        paymentStatus: attendeeObj.paymentStatus,
        ticketUsed: attendeeObj.ticketUsed,
        checkedInAt: attendeeObj.checkedInAt,
        wristbandNumber: attendeeObj.wristbandNumber,
        qrToken: attendeeObj.qrToken,
      },
      qrCodeDataURL,
    });
  } catch (error) {
    console.error('Error looking up token:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate Standalone HTML Digital Invitation Document
 */
export const getHtmlInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).send('<h1>Missing Token</h1>');
    }

    const attendee = await dbStore.findByQrToken(token.trim());
    if (!attendee) {
      return res.status(404).send('<h1>Pass Not Found</h1><p>Invalid or unrecognized QR token.</p>');
    }

    const attendeeObj = attendee.toObject ? attendee.toObject() : { ...attendee };
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${clientUrl}/?token=${attendeeObj.qrToken}`;
    const qrCodeDataURL = await generateQRCodeDataURL(verifyUrl);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nostalgeste '26 Invitation - ${attendeeObj.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif; background: #F4EFF8; color: #2E1A47; padding: 20px 12px; display: flex; justify-content: center; min-height: 100vh; align-items: center; }
    .card { max-width: 480px; width: 100%; background: #fff; border: 3px solid #D4AF37; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(74, 46, 109, 0.2); }
    .header { background: linear-gradient(135deg, #1C0F2D 0%, #3A1E5C 50%, #5E2B87 100%); color: #fff; padding: 28px 20px; text-align: center; border-bottom: 2px solid #D4AF37; }
    .school { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #E5C158; font-weight: bold; }
    .title { font-size: 34px; font-weight: 800; font-style: italic; color: #FFF; margin: 6px 0; }
    .tagline { font-size: 12px; color: #E8DFEE; font-style: italic; }
    .badge { display: inline-block; margin-top: 10px; background: rgba(212,175,55,0.25); border: 1px solid #D4AF37; padding: 4px 14px; border-radius: 20px; font-size: 10px; font-weight: bold; color: #F5E6BA; letter-spacing: 1px; }
    .body { padding: 20px 18px; }
    .info-box { background: #FAF7FD; border: 1px dashed #D4AF37; border-radius: 14px; padding: 14px 16px; margin-bottom: 18px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .info-label { color: #7B6888; font-weight: 500; }
    .info-val { font-weight: bold; color: #2E1A47; }
    .qr-box { text-align: center; background: #fff; border: 2px solid #E8DFEE; border-radius: 18px; padding: 16px; margin-bottom: 18px; }
    .qr-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #4A2E6D; margin-bottom: 10px; }
    .qr-img { width: 200px; height: 200px; border: 2px solid #2E1A47; border-radius: 12px; padding: 6px; }
    .event-box { background: #2E1A47; color: #fff; border-radius: 14px; padding: 14px 16px; font-size: 12px; line-height: 1.6; }
    .event-gold { color: #E5C158; font-weight: bold; }
    .btn-row { display: flex; gap: 8px; margin-top: 16px; }
    .btn { flex: 1; padding: 12px 8px; font-size: 12px; font-weight: bold; border-radius: 12px; text-align: center; text-decoration: none; cursor: pointer; border: none; }
    .btn-gold { background: #D4AF37; color: #1C0F2D; }
    .btn-purple { background: #4A2E6D; color: #fff; }
    .footer { text-align: center; font-size: 11px; color: #8C7A9C; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="school">Mahamaya Balika Vidyalaya • Kadawatha</div>
      <div class="title">Nostalgeste '26</div>
      <div class="tagline">"Rewinding the Time. Reliving the Memories."</div>
      <div class="badge">OFFICIAL ENTRY INVITATION • ADMIT ONE</div>
    </div>
    <div class="body">
      <div class="info-box">
        <div class="info-row"><span class="info-label">Student Name:</span><span class="info-val">${attendeeObj.name}</span></div>
        <div class="info-row"><span class="info-label">NIC Number:</span><span class="info-val">${attendeeObj.nic || attendeeObj.studentId}</span></div>
        <div class="info-row"><span class="info-label">Class:</span><span class="info-val">${attendeeObj.studentClass || attendeeObj.batch}</span></div>
        <div class="info-row"><span class="info-label">Status:</span><span class="info-val" style="color:#22C55E;">FULL PAYMENT VERIFIED ✅</span></div>
      </div>

      <div class="qr-box">
        <div class="qr-title">✨ Gate Entrance QR Pass ✨</div>
        <img class="qr-img" src="${qrCodeDataURL}" alt="Gate QR Code" />
        <p style="font-size: 11px; color: #69338C; margin-top: 8px; font-weight: 600;">Present this QR code at the entrance to receive your wristband</p>
      </div>

      <div class="event-box">
        <div>📅 <span class="event-gold">Saturday, October 31, 2026</span> • ⏰ <span class="event-gold">8:00 AM</span></div>
        <div>📍 <span class="event-gold">Rose Garden, Ragama Rd, Kadawatha</span></div>
      </div>

      <div class="btn-row">
        <a href="${qrCodeDataURL}" download="Nostalgeste26-Pass-${attendeeObj.nic || attendeeObj.studentId}.png" class="btn btn-gold">💾 Save to Gallery</a>
        <button onclick="window.print()" class="btn btn-purple">🖨️ Print Pass</button>
      </div>

      <div class="footer">
        Mahamaya Balika Vidyalaya 2026 Organizing Committee
      </div>
    </div>
  </div>
</body>
</html>`;

    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send(`Error generating invitation: ${err.message}`);
  }
};

/**
 * Register New Attendee with Initial Payment Slip (Half or Full)
 */
export const registerAttendee = async (req, res) => {
  try {
    const { nic, studentId, name, email, phone, studentClass, batch, paymentChoice } = req.body;

    const userNic = (nic || studentId || '').trim().toUpperCase();
    const userClass = (studentClass || batch || '').trim().toUpperCase();

    // Input validations
    if (!userNic || !name || !email || !phone || !userClass) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: NIC Number, Name, Email, Phone, Class.',
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Check if student already exists
    const existing = await dbStore.findByNic(userNic);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A registration with NIC ${userNic} already exists. Please check status instead.`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a bank deposit receipt slip.',
      });
    }

    // Process slip upload (Cloudinary with local disk fallback)
    const { url: slipUrl, publicId } = await processSlipUpload(req.file, req);

    const isFull = paymentChoice === 'FULL';
    const halfPrice = Number(process.env.HALF_TICKET_PRICE) || 1500;
    const fullPrice = Number(process.env.FULL_TICKET_PRICE) || 3000;
    const initialAmount = isFull ? fullPrice : halfPrice;

    const newAttendee = await dbStore.create({
      nic: userNic,
      studentId: userNic,
      name: name.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;'), // Basic XSS sanitization
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      studentClass: userClass,
      paymentChoice: isFull ? 'FULL' : 'HALF',
      paymentStatus: 'PENDING_FIRST_HALF',
      amountPaid: initialAmount,
      receipts: [
        {
          url: slipUrl,
          publicId,
          paymentType: isFull ? 'FULL' : 'FIRST_HALF',
          amount: initialAmount,
          originalFilename: req.file.originalname,
          uploadedAt: new Date(),
        },
      ],
    });

    console.log(`✅ Student registered successfully in MongoDB: ${newAttendee.name} (${newAttendee.nic})`);

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your payment slip is now under review.',
      attendee: newAttendee,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit Second Payment Slip for HALF_APPROVED attendees
 */
export const submitSecondPayment = async (req, res) => {
  try {
    const queryId = (req.params.studentId || req.params.nic || '').trim().toUpperCase();
    const attendee = await dbStore.findByNic(queryId);

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: `Student with NIC ${queryId} not found.`,
      });
    }

    if (attendee.paymentStatus !== 'HALF_APPROVED' && attendee.paymentStatus !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Second payment cannot be uploaded in current status: ${attendee.paymentStatus}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload the second half payment slip.',
      });
    }

    const { url: slipUrl, publicId } = await processSlipUpload(req.file, req);

    const halfPrice = Number(process.env.HALF_TICKET_PRICE) || 1500;
    const fullPrice = Number(process.env.FULL_TICKET_PRICE) || 3000;

    const receipts = attendee.receipts ? [...attendee.receipts] : [];
    receipts.push({
      url: slipUrl,
      publicId,
      paymentType: 'SECOND_HALF',
      amount: halfPrice,
      originalFilename: req.file.originalname,
      uploadedAt: new Date(),
    });

    const updated = await dbStore.update(attendee._id || attendee.id, {
      receipts,
      amountPaid: fullPrice,
      paymentStatus: 'PENDING_SECOND_HALF',
      rejectionReason: null,
    });

    return res.status(200).json({
      success: true,
      message: 'Second half slip uploaded successfully! It is now under review by the committee.',
      attendee: updated,
    });
  } catch (error) {
    console.error('Second payment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Gate Check-In via QR Token
 */
export const checkInAttendee = async (req, res) => {
  try {
    let { qrToken, wristbandNumber } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_TOKEN',
        message: 'QR token is required for check-in.',
      });
    }

    // Extract token if full URL was scanned
    if (qrToken.includes('token=')) {
      try {
        const url = new URL(qrToken);
        qrToken = url.searchParams.get('token') || qrToken;
      } catch (e) {
        const match = qrToken.match(/token=([a-zA-Z0-9]+)/);
        if (match) qrToken = match[1];
      }
    }

    const cleanInput = qrToken.trim();
    let attendee = await dbStore.findByQrToken(cleanInput);

    // Fallback: If not found by QR token, search by 12-digit NIC
    if (!attendee) {
      attendee = await dbStore.findByNic(cleanInput.toUpperCase());
    }

    if (!attendee) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_TICKET',
        message: 'Invalid Ticket! QR Token or NIC not recognized in event database.',
      });
    }

    if (attendee.paymentStatus !== 'FULL_APPROVED') {
      return res.status(400).json({
        success: false,
        code: 'PAYMENT_INCOMPLETE',
        message: `Payment Incomplete! Status: ${attendee.paymentStatus}. Full payment required before gate entry.`,
        attendee: {
          name: attendee.name,
          nic: attendee.nic || attendee.studentId,
          studentClass: attendee.studentClass || attendee.batch,
          paymentStatus: attendee.paymentStatus,
        },
      });
    }

    if (attendee.ticketUsed) {
      const formattedTime = new Date(attendee.checkedInAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return res.status(400).json({
        success: false,
        code: 'ALREADY_USED',
        message: `ALREADY USED! Scanned at ${formattedTime}${attendee.wristbandNumber ? ` (Wristband: ${attendee.wristbandNumber})` : ''}`,
        attendee: {
          name: attendee.name,
          nic: attendee.nic || attendee.studentId,
          studentClass: attendee.studentClass || attendee.batch,
          checkedInAt: attendee.checkedInAt,
          wristbandNumber: attendee.wristbandNumber,
        },
      });
    }

    // Valid check-in
    const updated = await dbStore.update(attendee._id || attendee.id, {
      ticketUsed: true,
      checkedInAt: new Date(),
      wristbandNumber: wristbandNumber ? wristbandNumber.toString().trim() : attendee.wristbandNumber,
    });

    return res.status(200).json({
      success: true,
      code: 'VALID_ENTRY',
      message: `Valid Entry! Issue Wristband to ${updated.name} (${updated.studentClass || updated.batch})`,
      attendee: {
        name: updated.name,
        nic: updated.nic || updated.studentId,
        studentClass: updated.studentClass || updated.batch,
        phone: updated.phone,
        email: updated.email,
        wristbandNumber: updated.wristbandNumber,
        checkedInAt: updated.checkedInAt,
      },
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
