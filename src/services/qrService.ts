import QRCode from 'qrcode';

/**
 * Returns the deep-link direct URL for a given unit ID in the web application.
 * Canonical scheme: `${origin}/units/${unitId}`.
 */
export function getUnitDirectUrl(unitId: string): string {
  if (typeof window === 'undefined') {
    return `https://6o-crm.applet/units/${encodeURIComponent(unitId)}`;
  }
  return `${window.location.origin}/units/${encodeURIComponent(unitId)}`;
}

/**
 * Resolves legacy QR deep links (`?unitId=`, `?unit=`, `#unit=`) to the
 * canonical `/units/:unitId` path. Returns null when no legacy param exists.
 */
export function resolveLegacyUnitLocation(search: string, hash: string): string | null {
  const q = new URLSearchParams(search);
  const legacy = q.get('unitId') ?? q.get('unit')
    ?? (hash.startsWith('#unit=') ? decodeURIComponent(hash.slice(6)) : null);
  return legacy ? `/units/${encodeURIComponent(legacy)}` : null;
}

/**
 * Generates a high-quality base64 Data URL for the unit's direct page QR code.
 */
export async function generateUnitQrCodeDataUrl(
  unitId: string, 
  options?: {
    darkColor?: string;
    lightColor?: string;
    width?: number;
  }
): Promise<string> {
  const directUrl = getUnitDirectUrl(unitId);
  try {
    const dataUrl = await QRCode.toDataURL(directUrl, {
      width: options?.width || 360,
      margin: 2,
      color: {
        dark: options?.darkColor || '#0F2D52', // no-hex-allow: QRCode canvas generator requires hex color
        light: options?.lightColor || '#FFFFFF', // no-hex-allow: QRCode canvas generator requires hex color
      },
      errorCorrectionLevel: 'H'
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    // Fallback simple SVG data URI
    return '';
  }
}

/**
 * Initiates an instant download of the QR code as a PNG file.
 */
export function downloadQrCodeImage(dataUrl: string, unitId: string) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `QR_Unit_${unitId}_6O_RealEstate.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
