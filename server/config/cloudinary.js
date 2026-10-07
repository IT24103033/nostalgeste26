import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer disk storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate safe alphanumeric filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `slip-${uniqueSuffix}${ext}`);
  },
});

// Strict File Filter: Only allow legitimate image formats and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.heic', '.heif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Security Error: Invalid file type. Only JPG, PNG, WebP, and PDF deposit slips are permitted.'
      ),
      false
    );
  }
};

export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only 1 file per request
  },
});

/**
 * Uploads file to Cloudinary if credentials are valid,
 * otherwise falls back safely to local disk storage URL.
 */
export const processSlipUpload = async (file, req) => {
  if (!file) return { url: '', publicId: '' };

  const hasCloudinaryKeys = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (hasCloudinaryKeys) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
        api_key: process.env.CLOUDINARY_API_KEY.trim(),
        api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      });

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'nostalgeste26_slips',
        transformation: [{ width: 1200, crop: 'limit' }],
      });

      console.log(`☁️ Cloudinary Upload Success for ${file.originalname}: ${result.secure_url}`);
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err) {
      console.warn(`⚠️ Cloudinary upload warning (${err.message}). Using local storage URL.`);
    }
  }

  // Fallback to local server URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const localUrl = `${baseUrl}/uploads/${file.filename}`;
  return {
    url: localUrl,
    publicId: file.filename,
  };
};

export { cloudinary };
