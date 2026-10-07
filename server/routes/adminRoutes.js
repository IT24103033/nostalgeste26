import express from 'express';
import {
  adminLogin,
  requireAdmin,
  getMetrics,
  getAllAttendees,
  updateAttendeeStatus,
  resendTicketEmail,
  exportAttendeesCsv,
  manualAddAttendee,
  deleteAttendee,
} from '../controllers/adminController.js';
import { adminLoginLimiter } from '../middleware/security.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Public auth endpoint (Protected by brute-force limiter)
router.post('/login', adminLoginLimiter, adminLogin);

// Protected admin endpoints
router.use(requireAdmin);

router.get('/metrics', getMetrics);
router.get('/attendees', getAllAttendees);
router.post('/attendees/manual-add', upload.single('receipt'), manualAddAttendee);
router.put('/attendees/:id/status', updateAttendeeStatus);
router.delete('/attendees/:id', deleteAttendee);
router.post('/attendees/:id/resend-email', resendTicketEmail);
router.get('/export-csv', exportAttendeesCsv);

export default router;
