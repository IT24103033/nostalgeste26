import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import attendeeRoutes from './routes/attendeeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers from Railway / Cloudflare
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// 1. HTTP Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded images to be loaded
    contentSecurityPolicy: false, // Avoid breaking external CDN/font assets in dev
  })
);

// 2. NoSQL Injection Prevention (Sanitize inputs)
app.use(mongoSanitize());

// 3. CORS Configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 4. Body Parsers with tight payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists and serve statically
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/attendees', attendeeRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    event: process.env.EVENT_NAME || "Nostalgeste '26",
    security: 'Hardened (Helmet, Rate-Limit, Mongo-Sanitize, Data Masking)',
    timestamp: new Date().toISOString(),
  });
});

// Serve Production React Frontend if built
const candidateDistPaths = [
  path.join(process.cwd(), 'client', 'dist'),
  path.resolve('client/dist'),
  path.resolve('../client/dist'),
  path.join(path.dirname(new URL(import.meta.url).pathname), '../client/dist'),
];
const effectiveDist = candidateDistPaths.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) || null;

if (effectiveDist) {
  // Static assets with caching for hashed files, no-cache for index.html
  app.use(
    express.static(effectiveDist, {
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(effectiveDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send("🎟️ Nostalgeste '26 API is running securely!");
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred. Please try again.',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Nostalgeste '26 Server listening on port ${PORT}`);
  console.log(`🔒 Security active: Helmet, MongoSanitize, Rate-Limiting & File Validation`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});
