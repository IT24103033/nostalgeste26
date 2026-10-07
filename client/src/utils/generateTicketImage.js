/**
 * Generate a luxury high-resolution Invitation Pass PNG (1200 x 1750 px)
 * Renders cleanly to Canvas with zero external dependencies and triggers instant download.
 */
export const downloadFullTicketPassImage = async (attendee, qrCodeDataURL) => {
  if (!attendee) return;

  const width = 1200;
  const height = 1750;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  // 1. Full Canvas Background (Deep Royal Night / Warm glow)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0F061C');
  bgGrad.addColorStop(0.5, '#1D0C36');
  bgGrad.addColorStop(1, '#0B0414');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Card Outer Rounded Container with Gold Glow
  const cardMarginX = 60;
  const cardMarginY = 60;
  const cardW = width - cardMarginX * 2;
  const cardH = height - cardMarginY * 2;
  const cardRadius = 40;

  // Helper to draw rounded rectangle path
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Outer Golden Card Fill & Border
  ctx.save();
  ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
  ctx.shadowBlur = 30;
  roundRect(cardMarginX, cardMarginY, cardW, cardH, cardRadius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();
  ctx.restore();

  // Clip all contents inside the card
  ctx.save();
  roundRect(cardMarginX, cardMarginY, cardW, cardH, cardRadius);
  ctx.clip();

  // 3. Header Background (Deep Royal Purple Gradient)
  const headerH = 340;
  const headerGrad = ctx.createLinearGradient(0, cardMarginY, 0, cardMarginY + headerH);
  headerGrad.addColorStop(0, '#1E0A3C');
  headerGrad.addColorStop(0.6, '#381368');
  headerGrad.addColorStop(1, '#260B4C');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(cardMarginX, cardMarginY, cardW, headerH);

  // Header bottom gold border
  ctx.strokeStyle = '#E5C158';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cardMarginX, cardMarginY + headerH);
  ctx.lineTo(cardMarginX + cardW, cardMarginY + headerH);
  ctx.stroke();

  // School Subtitle
  ctx.fillStyle = '#E5C158';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAHAMAYA BALIKA VIDYALAYA • KADAWATHA', width / 2, cardMarginY + 65);

  // Event Main Title (Serif Gold)
  ctx.fillStyle = '#FCE38A';
  ctx.font = 'italic bold 76px Georgia, serif';
  ctx.fillText("Nostalgeste '26", width / 2, cardMarginY + 155);

  // Tagline
  ctx.fillStyle = '#D8B4FE';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('"Rewinding the Time. Reliving the Memories."', width / 2, cardMarginY + 205);

  // Badge: "Official Entry Pass • Admit One"
  const badgeW = 420;
  const badgeH = 46;
  const badgeX = (width - badgeW) / 2;
  const badgeY = cardMarginY + 245;
  roundRect(badgeX, badgeY, badgeW, badgeH, 23);
  ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#F5D77F';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFF2CC';
  ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
  ctx.fillText('OFFICIAL ENTRY PASS • ADMIT ONE', width / 2, badgeY + 30);

  // 4. Perforated Tear Line
  const tearY = cardMarginY + headerH + 20;
  ctx.save();
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardMarginX + 40, tearY);
  ctx.lineTo(cardMarginX + cardW - 40, tearY);
  ctx.stroke();
  ctx.restore();

  // 5. Student Information Box
  const infoX = cardMarginX + 45;
  const infoY = tearY + 30;
  const infoW = cardW - 90;
  const infoH = 240;

  roundRect(infoX, infoY, infoW, infoH, 24);
  ctx.fillStyle = '#FAF7FD';
  ctx.fill();
  ctx.strokeStyle = '#E2D4F0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Left: Student Name
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6B46C1';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('STUDENT NAME', infoX + 35, infoY + 45);

  ctx.fillStyle = '#1A0B2E';
  ctx.font = 'bold 36px Georgia, serif';
  const displayName = attendee.name ? (attendee.name.length > 22 ? attendee.name.substring(0, 20) + '...' : attendee.name) : 'Student';
  ctx.fillText(displayName, infoX + 35, infoY + 90);

  // Right: NIC Number
  const rightColX = infoX + infoW - 35;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6B46C1';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('NIC NUMBER', rightColX, infoY + 45);

  const studentNic = attendee.nic || attendee.studentId || 'N/A';
  ctx.fillStyle = '#1E1B4B';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(studentNic, rightColX, infoY + 90);

  // Info Divider
  ctx.strokeStyle = '#E9D8FD';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(infoX + 35, infoY + 115);
  ctx.lineTo(rightColX, infoY + 115);
  ctx.stroke();

  // Row 2: Class
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6B46C1';
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
  ctx.fillText('CLASS', infoX + 35, infoY + 155);

  ctx.fillStyle = '#1E1B4B';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(attendee.studentClass || attendee.batch || '2026', infoX + 35, infoY + 195);

  // Row 2 Right: Status Pill
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6B46C1';
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
  ctx.fillText('PAYMENT STATUS', rightColX, infoY + 155);

  const statusPillW = 320;
  const statusPillH = 42;
  const statusPillX = rightColX - statusPillW;
  const statusPillY = infoY + 168;

  roundRect(statusPillX, statusPillY, statusPillW, statusPillH, 12);
  ctx.fillStyle = '#ECFDF5';
  ctx.fill();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.stroke();

  const displayPrice = (attendee.amountPaid || 6500).toLocaleString();
  ctx.fillText(`✓ FULL PAYMENT (Rs. ${displayPrice})`, statusPillX + statusPillW / 2, statusPillY + 27);

  // 6. QR Code Section
  const qrBoxW = 480;
  const qrBoxH = 500;
  const qrBoxX = (width - qrBoxW) / 2;
  const qrBoxY = infoY + infoH + 30;

  roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.stroke();

  // QR Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#381368';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('✨ GATE ENTRANCE QR CODE ✨', width / 2, qrBoxY + 45);

  // Load and draw QR code image onto canvas
  if (qrCodeDataURL) {
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
      qrImg.src = qrCodeDataURL;
    });

    const qrSize = 320;
    const qrImgX = (width - qrSize) / 2;
    const qrImgY = qrBoxY + 70;

    // Draw inner white container with border
    roundRect(qrImgX - 10, qrImgY - 10, qrSize + 20, qrSize + 20, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#1E0A3C';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.drawImage(qrImg, qrImgX, qrImgY, qrSize, qrSize);
  }

  // Token Snippet
  ctx.fillStyle = '#64748B';
  ctx.font = '16px monospace';
  const tokenPreview = attendee.qrToken ? `Pass ID: ${attendee.qrToken.substring(0, 18).toUpperCase()}...` : 'Verified Pass';
  ctx.fillText(tokenPreview, width / 2, qrBoxY + 425);

  ctx.fillStyle = '#475569';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Present this pass at the gate for fast-track entry & wristband.', width / 2, qrBoxY + 460);

  // 7. Event Details Footer Bar
  const footerX = infoX;
  const footerY = qrBoxY + qrBoxH + 25;
  const footerW = infoW;
  const footerH = 110;

  roundRect(footerX, footerY, footerW, footerH, 20);
  ctx.fillStyle = '#1A0B2E';
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FCE38A';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('🗓️ Saturday, October 31, 2026   •   ⏰ 8:00 AM', width / 2, footerY + 45);

  ctx.fillStyle = '#E9D8FD';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText('📍 Rose Garden, Ragama Rd, Kadawatha', width / 2, footerY + 82);

  // 8. Bottom Tiny Legal Text
  ctx.fillStyle = '#7E22CE';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('Mahamaya Balika Vidyalaya • Nostalgeste 2026 Organizing Committee', width / 2, cardMarginY + cardH - 25);

  ctx.restore(); // Restore clipping

  // 9. Convert Canvas to Blob / PNG and Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Nostalgeste26-Invitation-Pass-${attendee.nic || attendee.studentId || 'Ticket'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }, 'image/png');
};
