import { format, formatDistanceToNow, parseISO, addDays as dfAddDays } from 'date-fns';
import { ZoneId, DeliveryOption, Product } from '../types';
import { DELIVERY_ETA_MAP, DELIVERY_FEE_MAP } from '../data/zones';
export function formatNPR(n: number) { return 'NPR ' + n.toLocaleString('en-NP'); }
export function formatDate(iso: string) { try { return format(parseISO(iso),'dd MMM yyyy'); } catch { return iso; } }
export function formatDateTime(iso: string) { try { return format(parseISO(iso),'dd MMM yyyy, h:mm a'); } catch { return iso; } }
export function timeAgo(iso: string) { try { return formatDistanceToNow(parseISO(iso),{addSuffix:true}); } catch { return iso; } }
export function addDaysToDate(date: Date, days: number) { return dfAddDays(date, days); }
export function getDiscountPercent(price: number, mrp: number) { if (mrp<=price) return 0; return Math.round((mrp-price)/mrp*100); }
export function getETA(zoneId: ZoneId, option: DeliveryOption) { return DELIVERY_ETA_MAP[zoneId]?.[option] ?? 'Check availability'; }
export function getDeliveryFee(zoneId: ZoneId, option: DeliveryOption) { return DELIVERY_FEE_MAP[zoneId]?.[option] ?? 200; }
export function getAvailableDeliveryOptions(product: Product, zoneId: ZoneId): DeliveryOption[] {
  const opts = Object.keys(DELIVERY_ETA_MAP[zoneId]??{}) as DeliveryOption[];
  return product.isFastDelivery ? opts : opts.filter(o=>o==='standard');
}
export function getBestETA(product: Product, zoneId: ZoneId) {
  const opts = getAvailableDeliveryOptions(product,zoneId);
  if (!opts.length) return 'Not available';
  const priority: DeliveryOption[] = ['same_day','next_day','standard'];
  const best = priority.find(p=>opts.includes(p)) ?? opts[0];
  return getETA(zoneId, best);
}
export function validateNepalPhone(phone: string) { return /^(97|98)d{8}$/.test(phone.replace(/[s-+]/g,'')); }
export function normalizePhone(phone: string) { return phone.replace(/[s-+]/g,''); }
export function generateOrderId() { return 'BUY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase(); }
