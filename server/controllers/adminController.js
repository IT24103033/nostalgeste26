import jwt from 'jsonwebtoken';
import { AsyncParser } from 'json2csv';
import { dbStore } from '../services/dbStore.js';
import { sendTicketEmail } from '../utils/mailer.js';
import { processSlipUpload } from '../config/cloudinary.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nostalgeste_secret_jwt_key_2026_super_secure';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nostalgeste2026';

/**
 * Admin Login Endpoint
 */
export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin PIN / Password.',
      });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully.',
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Auth Middleware
 */
export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization required. Please log in as Admin.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

/**
 * Dashboard Metrics
 */
export const getMetrics = async (req, res) => {
  try {
    const metrics = await dbStore.getMetrics();
    return res.status(200).json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error computing metrics:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get All Attendees with Search & Filters
 */
export const getAllAttendees = async (req, res) => {
  try {
    const { search, status, studentClass, ticketUsed, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const attendees = await dbStore.getAll({
      search,
      status,
      studentClass,
      ticketUsed,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      count: attendees.length,
      attendees,
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Attendee Status (Approve First Half, Approve Full, Reject)
 */
export const updateAttendeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, wristbandNumber } = req.body;

    const attendee = await dbStore.findById(id);
    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Attendee record not found.' });
    }

    const halfPrice = Number(process.env.HALF_TICKET_PRICE) || 1500;
    const fullPrice = Number(process.env.FULL_TICKET_PRICE) || 3000;

    let emailResult = null;
    const updates = {};

    switch (action) {
      case 'APPROVE_FIRST_HALF':
        updates.paymentStatus = 'HALF_APPROVED';
        updates.amountPaid = halfPrice;
        updates.rejectionReason = null;
        break;

      case 'APPROVE_FULL':
        updates.paymentStatus = 'FULL_APPROVED';
        updates.amountPaid = fullPrice;
        updates.rejectionReason = null;
        // Trigger Email with QR code
        const attendeeData = attendee.toObject ? attendee.toObject() : { ...attendee };
        emailResult = await sendTicketEmail({ ...attendeeData, ...updates });
        if (emailResult.success) {
          updates.emailSent = true;
          updates.emailSentAt = new Date();
        }
        break;

      case 'REJECT':
        updates.paymentStatus = 'REJECTED';
        updates.rejectionReason = rejectionReason || 'Payment receipt unclear or invalid. Please re-upload.';
        break;

      case 'MANUAL_CHECKIN':
        updates.ticketUsed = true;
        updates.checkedInAt = new Date();
        if (wristbandNumber) {
          updates.wristbandNumber = wristbandNumber.toString().trim();
        }
        break;

      case 'RESET_CHECKIN':
        updates.ticketUsed = false;
        updates.checkedInAt = null;
        updates.wristbandNumber = '';
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }

    const updated = await dbStore.update(id, updates);

    return res.status(200).json({
      success: true,
      message: `Status updated successfully to ${updated.paymentStatus}.`,
      attendee: updated,
      emailResult,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Resend Ticket Email
 */
export const resendTicketEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const attendee = await dbStore.findById(id);

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Attendee not found.' });
    }

    if (attendee.paymentStatus !== 'FULL_APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send ticket email. Attendee must be in FULL_APPROVED status.',
      });
    }

    const emailResult = await sendTicketEmail(attendee);
    if (emailResult.success) {
      await dbStore.update(id, {
        emailSent: true,
        emailSentAt: new Date(),
      });
      return res.status(200).json({
        success: true,
        message: `Ticket successfully re-sent to ${attendee.email}`,
        previewUrl: emailResult.previewUrl,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${emailResult.error}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export Attendees as CSV
 */
export const exportAttendeesCsv = async (req, res) => {
  try {
    const attendees = await dbStore.getAll({ sortBy: 'nic', sortOrder: 'asc' });

    const fields = [
      { label: 'NIC Number', value: (row) => row.nic || row.studentId || '' },
      { label: 'Name', value: 'name' },
      { label: 'Class', value: (row) => row.studentClass || row.batch || '' },
      { label: 'Email', value: (row) => (row.email && !row.email.endsWith('@nostalgeste26.local') ? row.email : 'N/A') },
      { label: 'Phone', value: 'phone' },
      { label: 'Payment Status', value: 'paymentStatus' },
      { label: 'Amount Paid (LKR)', value: 'amountPaid' },
      { label: 'Checked In', value: (row) => (row.ticketUsed ? 'YES' : 'NO') },
      {
        label: 'Checked In Time',
        value: (row) => (row.checkedInAt ? new Date(row.checkedInAt).toLocaleString() : ''),
      },
      { label: 'Wristband #', value: 'wristbandNumber' },
      { label: 'Registered Date', value: (row) => new Date(row.createdAt).toLocaleDateString() },
      { label: 'QR Token', value: 'qrToken' },
    ];

    const parser = new AsyncParser({ fields });
    const csv = await parser.parse(attendees).promise();

    res.header('Content-Type', 'text/csv');
    res.attachment(`Nostalgeste26-Attendees-${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manual Add Student by Admin (Cash / In-Person / Direct WhatsApp Slip)
 */
export const manualAddAttendee = async (req, res) => {
  try {
    const { name, nic, studentClass, phone, email, paymentStatus, amountPaid, notes } = req.body;

    const cleanName = (name || '').trim();
    const cleanNic = (nic || '').trim().toUpperCase();
    const rawPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanClass = (studentClass || 'C1').trim();

    // 1. Name Validation
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid student name (at least 2 characters).',
      });
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {
      return res.status(400).json({
        success: false,
        message: 'Student name can only contain letters, spaces, dots, and hyphens.',
      });
    }

    // 2. NIC Validation (Sri Lankan NIC: strictly 12 digits)
    const is12DigitNic = /^\d{12}$/.test(cleanNic);
    if (!is12DigitNic) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NIC format! NIC must be exactly 12 digits (e.g. 200429103702).',
      });
    }

    // 3. Phone Validation (Sri Lankan Mobile / WhatsApp: 07xxxxxxxx or 947xxxxxxxx)
    const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
    let cleanPhone = '';
    if (digitsOnly.length === 10 && digitsOnly.startsWith('07')) {
      cleanPhone = digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('947')) {
      cleanPhone = '0' + digitsOnly.slice(2);
    } else if (digitsOnly.length === 9 && digitsOnly.startsWith('7')) {
      cleanPhone = '0' + digitsOnly;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid Mobile/WhatsApp number! Please enter a valid 10-digit Sri Lankan phone number (e.g. 0771234567 or 94771234567).',
      });
    }

    // 4. Email Validation (if provided)
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format (e.g. student@gmail.com).',
      });
    }

    // Check if student already exists
    const existing = await dbStore.findByNic(cleanNic);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An attendee with NIC ${cleanNic} is already registered (${existing.name}).`,
      });
    }

    const fullPrice = Number(process.env.FULL_TICKET_PRICE) || 6500;
    const calculatedAmount = amountPaid ? Number(amountPaid) : fullPrice;

    // Process slip upload if admin attached a file (WhatsApp slip or bank receipt)
    const receipts = [];
    if (req.file) {
      const { url: slipUrl, publicId } = await processSlipUpload(req.file, req);
      receipts.push({
        url: slipUrl,
        publicId,
        paymentType: 'FULL',
        amount: calculatedAmount,
        originalFilename: req.file.originalname,
        uploadedAt: new Date(),
      });
    } else {
      receipts.push({
        url: '/uploads/manual_admin_entry.png',
        paymentType: 'FULL',
        amount: calculatedAmount,
        originalFilename: 'Manual Admin Entry / Cash',
        uploadedAt: new Date(),
      });
    }

    const newAttendee = await dbStore.create({
      nic: cleanNic,
      studentId: cleanNic,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      studentClass: cleanClass,
      paymentChoice: 'FULL',
      paymentStatus: paymentStatus || 'FULL_APPROVED',
      amountPaid: calculatedAmount,
      notes: notes || 'Manually added by Admin',
      receipts,
    });

    return res.status(201).json({
      success: true,
      message: `Attendee ${newAttendee.name} (${cleanNic}) registered successfully!`,
      attendee: newAttendee,
      qrToken: newAttendee.qrToken,
    });
  } catch (error) {
    console.error('Error in manualAddAttendee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Attendee
 */
export const deleteAttendee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbStore.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Attendee record not found.' });
    }
    return res.status(200).json({ success: true, message: 'Attendee deleted successfully.' });
  } catch (error) {
    console.error('Error deleting attendee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
