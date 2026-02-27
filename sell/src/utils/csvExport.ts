/**
 * CSV export utility for the sell app.
 * Exports orders and analytics data as CSV files via expo-sharing.
 */
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Order } from '../types';
import { formatDate, formatNPR } from './helpers';

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildOrdersCsv(orders: Order[]): string {
  const headers = [
    'Order ID', 'Buyer Name', 'Buyer Phone', 'Date', 'Status',
    'Items', 'Subtotal (NPR)', 'Delivery Fee (NPR)', 'Total (NPR)',
    'Payment Method', 'Is Paid',
  ];

  const rows = orders.map(o => [
    o.id.toUpperCase(),
    o.buyerName,
    o.buyerPhone,
    formatDate(o.createdAt),
    o.status.replace(/_/g, ' '),
    o.items.map(i => `${i.title} x${i.quantity}`).join('; '),
    o.subtotal,
    o.deliveryFee,
    o.total,
    o.paymentMethod.replace(/_/g, ' '),
    o.isPaid ? 'Yes' : 'No',
  ].map(escapeCsv).join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export orders as a CSV file and share it.
 */
export async function exportOrdersCsv(orders: Order[]): Promise<void> {
  const csv = buildOrdersCsv(orders);
  const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Orders CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }
}

/**
 * Export analytics summary as CSV.
 */
export async function exportAnalyticsCsv(orders: Order[]): Promise<void> {
  const delivered = orders.filter(o => o.status === 'delivered');
  const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);

  // Daily revenue breakdown
  const dailyMap: Record<string, { revenue: number; orders: number }> = {};
  for (const o of orders) {
    const day = o.createdAt.split('T')[0];
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 };
    dailyMap[day].orders += 1;
    if (o.status === 'delivered') dailyMap[day].revenue += o.total;
  }

  const headers = ['Date', 'Orders', 'Revenue (NPR)'];
  const rows = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) =>
      [date, orders, revenue].map(escapeCsv).join(',')
    );

  const summaryRows = [
    '',
    'SUMMARY',
    `Total Orders,${orders.length}`,
    `Delivered Orders,${delivered.length}`,
    `Total Revenue,${totalRevenue}`,
  ];

  const csv = [headers.join(','), ...rows, ...summaryRows].join('\n');
  const filename = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Analytics CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
