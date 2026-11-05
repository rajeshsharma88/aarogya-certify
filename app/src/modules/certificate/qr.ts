import QRCode from 'qrcode';

/** Public, login-independent verification URL for a certificate. */
export function verificationUrl(certificateNo: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/verify/${encodeURIComponent(certificateNo)}`;
}

/**
 * QR for the public verification *form*, used on sample/marketing certificates.
 * Deliberately not tied to a certificate number: a sample must not encode an ID
 * that would resolve to "not recognized" when someone scans it.
 */
export async function verifyPageQrDataUrl(size = 240): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return QRCode.toDataURL(`${origin}/verify`, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}

export async function qrDataUrl(certificateNo: string, size = 220): Promise<string> {
  return QRCode.toDataURL(verificationUrl(certificateNo), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: { dark: '#134e4a', light: '#ffffff' },
  });
}
