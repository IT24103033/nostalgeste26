import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for Admin Login to prevent brute-force attacks
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login requests per window
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many failed admin login attempts. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for student registrations and slip uploads
 */
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 registrations/payments per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many registration requests from this IP. Please wait a few minutes.',
  },
});

/**
 * Rate limiter for public status lookups
 */
export const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many status lookups. Please slow down.',
  },
});

/**
 * Privacy helper to mask emails in public API responses
 * e.g., "sanduni@gmail.com" -> "s******@gmail.com"
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 6))}${user[user.length - 1]}@${domain}`;
};

/**
 * Privacy helper to mask phone numbers in public API responses
 * e.g., "0771234567" -> "077****567"
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-3);
  return `${start}****${end}`;
};
