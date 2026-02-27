import { OrderStatus, ProductStatus } from '../types';
import { Colors } from '../theme';

export function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function orderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return map[status];
}

export function orderStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: Colors.statusPending,
    confirmed: Colors.statusConfirmed,
    processing: Colors.statusProcessing,
    shipped: Colors.statusShipped,
    delivered: Colors.statusDelivered,
    cancelled: Colors.statusCancelled,
    refunded: Colors.statusRefunded,
  };
  return map[status];
}

export function productStatusLabel(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    out_of_stock: 'Out of Stock',
    draft: 'Draft',
  };
  return map[status];
}

export function productStatusColor(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    active: Colors.success,
    inactive: Colors.grey500,
    out_of_stock: Colors.danger,
    draft: Colors.warning,
  };
  return map[status];
}

export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
