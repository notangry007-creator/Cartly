/**
 * Invoice PDF generator using expo-print + expo-sharing.
 * Generates an HTML invoice and prints/shares it as a PDF.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order } from '../types';
import { formatNPR, formatDate, formatDateTime } from './helpers';

function buildInvoiceHtml(order: Order): string {
  const shortId = order.id.slice(-10).toUpperCase();
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${item.title}<br><small style="color:#888;">${item.variantLabel}</small></td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatNPR(item.price)}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatNPR(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const addr = order.addressSnapshot;
  const addrStr = `${addr.label}: ${addr.landmark}, Ward ${addr.ward}, ${addr.municipality}, ${addr.district}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${shortId}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 900; color: #E53935; }
    .brand-sub { font-size: 12px; color: #888; margin-top: 2px; }
    .invoice-title { font-size: 20px; font-weight: 700; color: #333; }
    .invoice-id { font-size: 14px; color: #888; }
    .divider { border: none; border-top: 2px solid #f0f0f0; margin: 16px 0; }
    .section-title { font-size: 13px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-box { background: #fafafa; border-radius: 8px; padding: 12px; }
    .info-label { font-size: 11px; color: #888; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; color: #222; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f5f5f5; padding: 10px 8px; text-align: left; font-size: 12px; color: #666; }
    th:last-child, th:nth-child(3), th:nth-child(2) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .total-final { font-weight: 700; font-size: 16px; color: #E53935; border-top: 2px solid #f0f0f0; padding-top: 8px; margin-top: 4px; }
    .footer { margin-top: 32px; text-align: center; color: #aaa; font-size: 11px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #E8F5E9; color: #2E7D32; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Buy</div>
      <div class="brand-sub">Nepal's Best Shopping App</div>
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-id">#${shortId}</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">${formatDateTime(order.createdAt)}</div>
    </div>
  </div>

  <hr class="divider">

  <div class="info-grid">
    <div class="info-box">
      <div class="section-title">Delivery Address</div>
      <div class="info-value">${addrStr}</div>
    </div>
    <div class="info-box">
      <div class="section-title">Order Details</div>
      <div class="info-label">Status</div>
      <div><span class="status-badge">${order.status.replace(/_/g, ' ').toUpperCase()}</span></div>
      <div class="info-label" style="margin-top:8px;">Payment</div>
      <div class="info-value">${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Buy Wallet'}</div>
      <div class="info-label" style="margin-top:8px;">Expected Delivery</div>
      <div class="info-value">${formatDate(order.expectedDelivery)}</div>
    </div>
  </div>

  <div class="section-title">Items</div>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatNPR(order.subtotal)}</span></div>
    <div class="total-row"><span>Shipping</span><span>${formatNPR(order.shippingFee)}</span></div>
    ${order.codFee > 0 ? `<div class="total-row"><span>COD Fee</span><span>${formatNPR(order.codFee)}</span></div>` : ''}
    ${order.discount > 0 ? `<div class="total-row" style="color:#2E7D32;"><span>Discount${order.couponCode ? ` (${order.couponCode})` : ''}</span><span>- ${formatNPR(order.discount)}</span></div>` : ''}
    <div class="total-row total-final"><span>TOTAL</span><span>${formatNPR(order.total)}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Buy! For support, contact support@buy.app</p>
    <p>This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate and share a PDF invoice for an order.
 */
export async function shareOrderInvoicePdf(order: Order): Promise<void> {
  const html = buildInvoiceHtml(order);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Invoice #${order.id.slice(-10).toUpperCase()}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
