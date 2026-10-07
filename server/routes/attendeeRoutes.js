import express from 'express';
import {
  getEventConfig,
  getAttendeeByStudentId,
  lookupAttendeeByToken,
  getHtmlInvitation,
  registerAttendee,
  submitSecondPayment,
  checkInAttendee,
} from '../controllers/attendeeController.js';
import { upload } from '../config/cloudinary.js';
import { registrationLimiter, lookupLimiter } from '../middleware/security.js';

const router = express.Router();

// Public config (Bank details, event info, deadline)
router.get('/config', getEventConfig);

// Standalone HTML Digital Invitation View
router.get('/invitation-html/:token', lookupLimiter, getHtmlInvitation);

// Lookup attendee by Token (from Phone camera QR scan / React pass view)
router.get('/lookup-token/:token', lookupLimiter, lookupAttendeeByToken);

// Lookup attendee by NIC / Student ID (Protected by rate limiter)
router.get('/:studentId', lookupLimiter, getAttendeeByStudentId);

// Register new attendee with slip upload (Protected by registration rate limiter & strict file filter)
router.post('/register', registrationLimiter, upload.single('receipt'), registerAttendee);

// Submit second payment slip (Protected by registration rate limiter & strict file filter)
router.post('/:studentId/second-payment', registrationLimiter, upload.single('receipt'), submitSecondPayment);

// Gate check-in via QR token
router.post('/check-in', checkInAttendee);

export default router;
