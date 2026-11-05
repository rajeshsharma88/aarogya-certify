import QRCode from 'qrcode';

/** Public, login-independent verification URL for a certificate. */
export function verificationUrl(certificateNo: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/verify/${encodeURIComponent(certificateNo)}`;
}

export async function qrDataUrl(certificateNo: string, size = 220): Promise<string> {
  return QRCode.toDataURL(verificationUrl(certificateNo), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: { dark: '#134e4a', light: '#ffffff' },
  });
}
