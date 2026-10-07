import QRCode from 'qrcode';

/**
 * Generates a Base64 Data URL for a given QR payload
 * Uses brand purple colors (#4A2E6D) for high-end styling
 */
export const generateQRCodeDataURL = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 400,
      color: {
        dark: '#2E1A47', // Brand royal purple
        light: '#FFFFFF', // Crisp white background
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generates a PNG Buffer for email attachment or file download
 */
export const generateQRCodeBuffer = async (text) => {
  try {
    const buffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 500,
      color: {
        dark: '#2E1A47',
        light: '#FFFFFF',
      },
    });
    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw error;
  }
};
