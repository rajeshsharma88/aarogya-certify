import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import type { Certificate } from '../../types';
import { qrDataUrl, verificationUrl } from './qr';

const BRAND = '#0f766e';
const BRAND_DARK = '#134e4a';
const SAFFRON = '#f59e0b';
const INK = '#0f172a';

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 24, fontFamily: 'Helvetica' },
  frame: { flex: 1, borderWidth: 3, borderColor: BRAND, borderRadius: 10, padding: 10 },
  inner: { flex: 1, borderWidth: 1, borderColor: SAFFRON, borderRadius: 6, padding: 30, alignItems: 'center' },
  eyebrow: { fontSize: 9, letterSpacing: 3, color: BRAND, textTransform: 'uppercase', marginBottom: 6 },
  org: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: BRAND_DARK, letterSpacing: 1 },
  subtitle: { fontSize: 8.5, color: '#64748b', letterSpacing: 2, marginTop: 3 },
  title: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: INK, marginTop: 22, letterSpacing: 1 },
  of: { fontSize: 10, color: '#64748b', marginTop: 4, letterSpacing: 2 },
  presented: { fontSize: 9.5, color: '#475569', marginTop: 26 },
  name: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: BRAND_DARK, marginTop: 6, textAlign: 'center' },
  rule: { width: 260, borderBottomWidth: 1, borderBottomColor: SAFFRON, marginTop: 8, marginBottom: 18 },
  body: { fontSize: 11, color: '#334155', textAlign: 'center', lineHeight: 1.6, marginTop: 6, maxWidth: 520 },
  bold: { fontFamily: 'Helvetica-Bold', color: INK },
  row: { flexDirection: 'row', marginTop: 26, width: '100%', justifyContent: 'space-between', alignItems: 'flex-end' },
  metaBlock: { flexDirection: 'column' },
  metaLabel: { fontSize: 7, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 10, color: INK, marginTop: 2, fontFamily: 'Helvetica-Bold' },
  qrBox: { alignItems: 'center' },
  qr: { width: 74, height: 74 },
  qrCaption: { fontSize: 6.5, color: '#64748b', marginTop: 3 },
  footer: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  footerText: { fontSize: 7, color: '#94a3b8', letterSpacing: 0.8 },
});

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function CertificateDocument({ cert, qr }: { cert: Certificate; qr: string }) {
  return (
    <Document title={`${cert.title} — ${cert.holderName}`} author="Aarogya India">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.inner}>
            <Text style={styles.eyebrow}>Certificate of Achievement</Text>
            <Text style={styles.org}>AAROGYA INDIA</Text>
            <Text style={styles.subtitle}>SKILL ASSESSMENT &amp; CERTIFICATION</Text>

            <Text style={styles.title}>CERTIFICATE</Text>
            <Text style={styles.of}>OF ACHIEVEMENT</Text>

            <Text style={styles.presented}>This certificate is proudly presented to</Text>
            <Text style={styles.name}>{cert.holderName}</Text>
            <View style={styles.rule} />

            <Text style={styles.body}>
              for successfully completing the <Text style={styles.bold}>{cert.title}</Text> assessment with a score of{' '}
              <Text style={styles.bold}>{cert.scorePct}%</Text>.
            </Text>

            <View style={styles.row}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Certificate ID</Text>
                <Text style={styles.metaValue}>{cert.certificateNo}</Text>
                <Text style={[styles.metaLabel, { marginTop: 10 }]}>Issued on</Text>
                <Text style={styles.metaValue}>{fmtDate(cert.issueDate)}</Text>
                <Text style={[styles.metaLabel, { marginTop: 10 }]}>Status</Text>
                <Text style={styles.metaValue}>{cert.status.toUpperCase()}</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: BRAND_DARK, fontFamily: 'Helvetica-Bold' }}>Aarogya India</Text>
                <View style={{ width: 150, borderBottomWidth: 1, borderBottomColor: '#94a3b8', marginTop: 4 }} />
                <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 3 }}>Authorised Issuer</Text>
              </View>

              <View style={styles.qrBox}>
                <Image style={styles.qr} src={qr} />
                <Text style={styles.qrCaption}>Scan to verify</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Verify at {verificationUrl(cert.certificateNo)} · This certificate is issued for skill demonstration and
                is not a government or university qualification.
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Generates and triggers download of the certificate PDF. */
export async function downloadCertificatePdf(cert: Certificate): Promise<void> {
  const qr = await qrDataUrl(cert.certificateNo, 240);
  const blob = await pdf(<CertificateDocument cert={cert} qr={qr} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aarogya-Certificate-${cert.certificateNo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
