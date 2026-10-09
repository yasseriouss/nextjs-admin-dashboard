import { formatNumber } from '../i18n/format';
import { jsPDF } from 'jspdf';
import { Unit } from '../types';

interface BrochurePdfOptions {
  qrCodeDataUrl?: string;
  isArabic?: boolean;
  agentName?: string;
  agentPhone?: string;
  companyEmail?: string;
}

/**
 * Generates and downloads a high-quality, professionally formatted PDF Brochure 
 * for a specific property unit using the jsPDF library.
 */
export async function generateUnitBrochurePdf(
  unit: Unit,
  options?: BrochurePdfOptions
): Promise<void> {
  const priceNum = Number(unit.price) || 0;
  const sizeNum = Number(unit.size) || 0;
  const pricePerMeter = sizeNum > 0 && priceNum > 0 ? Math.round(priceNum / sizeNum) : 0;
  
  const agentName = options?.agentName || unit.agent || 'Eng. Karim Samy';
  const agentPhone = options?.agentPhone || unit.ownerPhone || '+20 100 876 5432';
  const companyEmail = options?.companyEmail || 'sales@6october-realestate.com';

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const refCode = `BRC-6O-${unit.id}-${new Date().getFullYear()}`;

  // Initialize jsPDF A4 portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // ---------------------------------------------------------------------------
  // 1. TOP HEADER BANNER (Navy Dark Blue Background)
  // ---------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Gold accent line under header
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 36, pageWidth, 1.8, 'F');

  // Brand title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('6th of OCTOBER REAL ESTATE CRM', margin, 15);

  // Brand subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Property Portfolio & Luxury Investment Advisory • West Cairo', margin, 21);
  doc.text('Prepared Specifically For Prospective Buyers & Investors', margin, 27);

  // Document Reference badge (Top right)
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 52, 9, 52, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text('BUYER PROPERTY DOSSIER', pageWidth - margin - 52 + 4, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Ref: ${refCode}`, pageWidth - margin - 52 + 4, 20);
  doc.text(`Date: ${issueDate}`, pageWidth - margin - 52 + 4, 24);

  // ---------------------------------------------------------------------------
  // 2. HERO PROPERTY & PRICING HIGHLIGHT CARD (y = 42)
  // ---------------------------------------------------------------------------
  let curY = 43;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'FD');

  // Left strip color accent
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, curY, 3.5, 38, 1.5, 1.5, 'F');

  // Compound Name
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  const compoundTitle = unit.compound.toUpperCase();
  doc.text(compoundTitle, margin + 8, curY + 11);

  // Location & Property Type Badges
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Location: ${unit.area} - 6th of October / Sheikh Zayed`, margin + 8, curY + 18);

  // Small badges for ID, Type, Status
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin + 8, curY + 23, 24, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(67, 56, 202);
  doc.text(`ID: ${unit.id}`, margin + 11, curY + 28);

  // Type badge
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 35, curY + 23, 40, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`${unit.propertyType} (${unit.unitType})`, margin + 38, curY + 28);

  // Status badge
  const isAvailable = (unit.status || '').toLowerCase().includes('avail');
  const isReserved = (unit.status || '').toLowerCase().includes('reserv');
  const statusColor = isAvailable 
    ? { bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87], label: 'STATUS: AVAILABLE' }
    : isReserved
    ? { bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9], label: 'STATUS: RESERVED' }
    : { bg: [255, 228, 230], border: [254, 205, 211], text: [190, 18, 60], label: 'STATUS: SOLD' };

  doc.setFillColor(statusColor.bg[0], statusColor.bg[1], statusColor.bg[2]);
  doc.setDrawColor(statusColor.border[0], statusColor.border[1], statusColor.border[2]);
  doc.roundedRect(margin + 78, curY + 23, 36, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(statusColor.text[0], statusColor.text[1], statusColor.text[2]);
  doc.text(statusColor.label, margin + 80.5, curY + 27.8);

  // Right Side Price Container
  const priceBoxWidth = 62;
  const priceBoxX = margin + contentWidth - priceBoxWidth - 4;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(priceBoxX, curY + 4, priceBoxWidth, 30, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('TOTAL ASKING PRICE', priceBoxX + 6, curY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(245, 158, 11);
  doc.text(`${formatNumber(priceNum)} ${unit.currency}`, priceBoxX + 6, curY + 20);

  if (pricePerMeter > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Avg: ${formatNumber(pricePerMeter)} ${unit.currency} / m²`, priceBoxX + 6, curY + 28);
  }

  // ---------------------------------------------------------------------------
  // 3. KEY SPECIFICATIONS GRID (y = 86)
  // ---------------------------------------------------------------------------
  curY = 86;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KEY PROPERTY FEATURES & BUYER SPECIFICATIONS', margin, curY);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 62, curY - 1, margin + contentWidth, curY - 1);

  curY += 5;

  const specs = [
    { label: 'Total Unit Size', value: `${unit.size} m² (Square Meters)` },
    { label: 'Bedrooms', value: `${unit.beds} Bedrooms` },
    { label: 'Bathrooms', value: `${unit.baths || 2} Luxury Bathrooms` },
    { label: 'Floor Level', value: unit.floor ? `Floor ${unit.floor}` : 'Typical Floor Level' },
    { label: 'Finishing Type', value: 'Super Lux Finished (Turnkey)' },
    { label: 'Delivery Schedule', value: unit.deliveryDate || 'Ready to Move (Immediate)' },
    { label: 'Property View', value: 'Panoramic Green Landscape View' },
    { label: 'Ownership Deed', value: 'Verified Title & Land Share' }
  ];

  const colWidth = (contentWidth - 6) / 2; // 88mm each
  const cardHeight = 12.5;

  specs.forEach((item, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const x = margin + col * (colWidth + 6);
    const y = curY + row * (cardHeight + 3);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

    // Indicator bullet
    doc.setFillColor(37, 99, 235);
    doc.circle(x + 4, y + 6.2, 1.2, 'F');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + 8, y + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.value, x + 8, y + 10);
  });

  curY += Math.ceil(specs.length / 2) * (cardHeight + 3) + 5;

  // ---------------------------------------------------------------------------
  // 4. COMPOUND HIGHLIGHTS & AMENITIES (y ~ 152)
  // ---------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`PROJECT AMENITIES & LIFESTYLE • ${compoundTitle}`, margin, curY);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 80, curY - 1, margin + contentWidth, curY - 1);

  curY += 5;

  const amenities = [
    '24/7 Gated Security & Smart CCTV Surveillance System',
    'Prime Strategic Location Near 26th of July Corridor & Malls',
    'Luxury Clubhouse, Modern Gym, Tennis & Padel Courts',
    'Lush Green Parks, Walking Tracks & Artificial Lagoons',
    'Dedicated Underground Private Parking Bay for Residents',
    'Full Facility Management, Generator Backup & Daily Upkeep'
  ];

  const amenColWidth = (contentWidth - 6) / 2;
  amenities.forEach((text, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const ax = margin + col * (amenColWidth + 6);
    const ay = curY + row * 9.5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(ax, ay, amenColWidth, 8, 1, 1, 'FD');

    // Checkmark dot
    doc.setFillColor(16, 185, 129);
    doc.circle(ax + 3.5, ay + 4, 1.4, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(text, ax + 7.5, ay + 5.2);
  });

  curY += Math.ceil(amenities.length / 2) * 9.5 + 5;

  // ---------------------------------------------------------------------------
  // 5. FINANCIAL TERMS & PAYMENT PROPOSALS (y ~ 194)
  // ---------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('APPROVED BUYER PURCHASE OPTIONS & PAYMENT SCHEDULE', margin, curY);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 85, curY - 1, margin + contentWidth, curY - 1);

  curY += 5;

  const planWidth = (contentWidth - 6) / 2;
  const planHeight = 26;

  // Option 1: Cash Offer Card
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, curY, planWidth, planHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61);
  doc.text('OPTION 1: CASH PAYMENT (8% DISCOUNT)', margin + 5, curY + 6);

  const cashDiscount = Math.round(priceNum * 0.08);
  const netCash = priceNum - cashDiscount;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Immediate full settlement benefit:`, margin + 5, curY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatNumber(netCash)} ${unit.currency}`, margin + 5, curY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Instant savings: -${formatNumber(cashDiscount)} ${unit.currency}`, margin + 5, curY + 23);

  // Option 2: Installment Plan Card
  const instX = margin + planWidth + 6;
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(instX, curY, planWidth, planHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202);
  doc.text('OPTION 2: INSTALLMENT PLAN (UP TO 5 YRS)', instX + 5, curY + 6);

  const downPayment = Math.round(priceNum * 0.20);
  const remaining = priceNum - downPayment;
  const quarterly = Math.round(remaining / 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`20% Down Payment: ${formatNumber(downPayment)} ${unit.currency}`, instX + 5, curY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Quarterly: ${formatNumber(quarterly)} ${unit.currency}`, instX + 5, curY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Equal quarterly installments over 5 years (20 quarters)', instX + 5, curY + 23);

  curY += planHeight + 6;

  // ---------------------------------------------------------------------------
  // 6. AGENT CONTACT & VERIFICATION FOOTER (y ~ 236 to 280)
  // ---------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'F');

  // Agent Icon & Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11);
  doc.text('ASSIGNED INVESTMENT CONSULTANT', margin + 6, curY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(agentName, margin + 6, curY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Phone: ${agentPhone}  •  Email: ${companyEmail}`, margin + 6, curY + 22);
  doc.text('Headquarters: 26th of July Corridor, Westown Hub, 6th of October City', margin + 6, curY + 28);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text('Certified Real Estate Brokerage License No. 6428/GZ • All Rights Reserved', margin + 6, curY + 34);

  // QR Code Box on right
  const qrBoxSize = 30;
  const qrBoxX = margin + contentWidth - qrBoxSize - 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrBoxX, curY + 4, qrBoxSize, qrBoxSize, 2, 2, 'F');

  if (options?.qrCodeDataUrl) {
    try {
      doc.addImage(options.qrCodeDataUrl, 'PNG', qrBoxX + 2, curY + 5.5, qrBoxSize - 4, qrBoxSize - 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SCAN TO VERIFY', qrBoxX + 5, curY + 31.5);
    } catch (e) {
      // Fallback text if QR image fails
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('DIGITAL ID', qrBoxX + 6, curY + 15);
      doc.text(unit.id, qrBoxX + 6, curY + 20);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DIGITAL ID', qrBoxX + 6, curY + 15);
    doc.text(unit.id, qrBoxX + 6, curY + 20);
  }

  // Bottom Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This document is a certified real estate brochure. Prices and availability are subject to contract terms.', margin, pageHeight - 5);

  // Trigger download
  const safeCompound = (unit.compound || 'Compound').replace(/\s+/g, '_');
  const filename = `PDF_Brochure_${unit.id}_${safeCompound}.pdf`;
  doc.save(filename);
}
