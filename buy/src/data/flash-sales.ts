import { FlashSale } from '../types';

// Flash sales end times are relative to "now + N hours" for demo purposes
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const FLASH_SALES: FlashSale[] = [
  {
    id: 'fs1',
    title: '⚡ Flash Sale — Electronics',
    subtitle: 'Up to 25% off on smartphones & audio',
    endsAt: hoursFromNow(4),
    productIds: ['p1', 'p2', 'p5', 'p13', 'p14'],
    discountPercent: 25,
    badgeColor: '#E53935',
  },
  {
    id: 'fs2',
    title: '🌿 Organic Deals',
    subtitle: 'Fresh from the Himalayas — 20% off',
    endsAt: hoursFromNow(8),
    productIds: ['p6', 'p10', 'p20', 'p21'],
    discountPercent: 20,
    badgeColor: '#2E7D32',
  },
  {
    id: 'fs3',
    title: '👗 Fashion Friday',
    subtitle: 'Traditional wear at special prices',
    endsAt: hoursFromNow(12),
    productIds: ['p3', 'p8', 'p17'],
    discountPercent: 30,
    badgeColor: '#6A1B9A',
  },
];

export function getActiveFlashSales(): FlashSale[] {
  const now = Date.now();
  return FLASH_SALES.filter(fs => new Date(fs.endsAt).getTime() > now);
}

export function getFlashSaleForProduct(productId: string): FlashSale | undefined {
  const now = Date.now();
  return FLASH_SALES.find(
    fs => fs.productIds.includes(productId) && new Date(fs.endsAt).getTime() > now
  );
}
