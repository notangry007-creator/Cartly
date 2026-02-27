import { DeliveryTimeSlot, ZoneId } from '../types';

export const DELIVERY_TIME_SLOTS: DeliveryTimeSlot[] = [
  { id: 'slot_9_12', label: '9 AM – 12 PM', startHour: 9, endHour: 12 },
  { id: 'slot_12_3', label: '12 PM – 3 PM', startHour: 12, endHour: 15 },
  { id: 'slot_3_6', label: '3 PM – 6 PM', startHour: 15, endHour: 18 },
  { id: 'slot_6_9', label: '6 PM – 9 PM', startHour: 18, endHour: 21 },
];

// Zones that support scheduled delivery
export const SCHEDULED_DELIVERY_ZONES: ZoneId[] = ['ktm_core', 'ktm_outer'];

export function getAvailableDates(daysAhead: number = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Skip Sundays (0) for scheduled delivery
    if (d.getDay() !== 0) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

export function formatDeliveryDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

  return date.toLocaleDateString('en-NP', { weekday: 'short', month: 'short', day: 'numeric' });
}
