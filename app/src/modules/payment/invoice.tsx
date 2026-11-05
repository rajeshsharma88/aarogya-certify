// Invoice generation module
// HTML-based invoice generation for Phase 2
// TODO: Phase 2+ add real PDF generation with html2pdf or jsPDF

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  fullName: string;
  email: string;
  certificateTitle: string;
  amountPaise: number;
  gstAmountPaise: number;
  totalAmountPaise: number;
  gstNumber?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const amountRupees = (data.amountPaise / 100).toFixed(2);
  const gstRupees = (data.gstAmountPaise / 100).toFixed(2);
  const totalRupees = (data.totalAmountPaise / 100).toFixed(2);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: bold; color: #0891b2; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin: 5px 0 0 0; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #1e293b; }
    .row { display: flex; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .label { width: 40%; font-weight: bold; color: #64748b; }
    .value { width: 60%; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background-color: #f1f5f9; padding: 8px; text-align: left; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .amount-box { background-color: #f0f9ff; border-left: 4px solid #0891b2; padding: 15px; margin: 15px 0; }
    .amount-row { display: flex; margin-bottom: 10px; font-size: 12px; }
    .amount-label { width: 70%; }
    .amount-value { width: 30%; text-align: right; font-weight: bold; }
    .total-row { border-top: 2px solid #0891b2; padding-top: 10px; margin-top: 10px; }
    .total-value { font-size: 14px; font-weight: bold; color: #0891b2; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1 class="title">INVOICE</h1>
      <p class="subtitle">Aarogya India Certification Platform</p>
    </div>

    <div class="section">
      <div class="row">
        <span class="label">Invoice Number</span>
        <span class="value">${data.invoiceNumber}</span>
      </div>
      <div class="row">
        <span class="label">Invoice Date</span>
        <span class="value">${new Date(data.invoiceDate).toLocaleDateString('en-IN')}</span>
      </div>
    </div>

    <div class="section">
      <p class="section-title">BILL TO</p>
      <p>${data.fullName}</p>
      <p>${data.email}</p>
      ${data.gstNumber ? `<p>GST: ${data.gstNumber}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50%;">Description</th>
          <th style="width: 20%; text-align: right;">Qty</th>
          <th style="width: 30%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.certificateTitle} - Certificate Download</td>
          <td style="text-align: right;">1</td>
          <td style="text-align: right;">₹${amountRupees}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-box">
      <div class="amount-row">
        <span class="amount-label">Subtotal</span>
        <span class="amount-value">₹${amountRupees}</span>
      </div>
      <div class="amount-row">
        <span class="amount-label">GST (18%)</span>
        <span class="amount-value">₹${gstRupees}</span>
      </div>
      <div class="amount-row total-row">
        <span class="amount-label">TOTAL</span>
        <span class="amount-value total-value">₹${totalRupees}</span>
      </div>
    </div>

    <div class="section">
      <p class="section-title">PAYMENT DETAILS</p>
      <div class="row">
        <span class="label">Status</span>
        <span class="value">PAID</span>
      </div>
      <div class="row">
        <span class="label">Payment Method</span>
        <span class="value">Razorpay (Online)</span>
      </div>
    </div>

    <div class="section">
      <p class="section-title">TERMS & CONDITIONS</p>
      <ul>
        <li>This is a digital product and is non-refundable</li>
        <li>Certificate is valid as per policy terms</li>
        <li>Digital copy is sent to registered email</li>
      </ul>
    </div>

    <div class="footer">
      <p>© 2026 Aarogya India. All rights reserved.</p>
      <p>This is an electronically generated document.</p>
    </div>
  </div>
</body>
</html>
  `;
}
