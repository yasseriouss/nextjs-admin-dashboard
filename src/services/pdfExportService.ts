import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * High-fidelity client-side PDF exporter using html2canvas & jsPDF.
 * Renders the given DOM element into a crisp, vector-scaled A4 PDF.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options?: {
    scale?: number;
    marginMm?: number;
  }
): Promise<void> {
  const scale = options?.scale ?? 2; // 2x for sharp 300dpi-equivalent print quality
  const marginMm = options?.marginMm ?? 8;

  // Render element to high-res canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: 'rgb(255, 255, 255)',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  const printableWidth = pdfWidth - marginMm * 2;

  // Calculate proportional height in mm
  const imgHeightMm = (canvas.height * printableWidth) / canvas.width;

  // Initialize jsPDF (portrait, mm, a4)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (imgHeightMm <= pdfHeight - marginMm * 2) {
    // Single page fit
    pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidth, imgHeightMm);
  } else {
    // Multi-page slicing if document exceeds one page
    let remainingHeight = imgHeightMm;
    let positionY = marginMm;
    const pageAvailableHeight = pdfHeight - marginMm * 2;

    pdf.addImage(imgData, 'JPEG', marginMm, positionY, printableWidth, imgHeightMm);
    remainingHeight -= pageAvailableHeight;

    while (remainingHeight > 0) {
      pdf.addPage();
      positionY -= pageAvailableHeight;
      pdf.addImage(imgData, 'JPEG', marginMm, positionY, printableWidth, imgHeightMm);
      remainingHeight -= pageAvailableHeight;
    }
  }

  // Ensure clean .pdf extension
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(safeFilename);
}

/**
 * Print utility using an isolated hidden iframe.
 * Avoids browser window.print() issues inside embedded iframes.
 */
export function printCleanElement(
  element: HTMLElement, 
  title: string, 
  isArabic: boolean
): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // Extract all stylesheets from current document to preserve Tailwind CSS styling
  const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
  ${styleElements}
  <style>
    @page { 
      size: A4 portrait; 
      margin: 8mm; 
    }
    * { 
      box-sizing: border-box; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    body { 
      font-family: ${isArabic ? "'Cairo'" : "'Montserrat'"}, system-ui, -apple-system, sans-serif !important; 
      margin: 0; 
      padding: 10px; 
      background: white !important; 
      color: var(--color-navy, rgb(15, 45, 82)) !important; 
    }
  </style>
</head>
<body>
  ${element.outerHTML}
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print failed in iframe, falling back to window.print', e);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (_) {}
      }, 2000);
    }
  }, 500);
}
