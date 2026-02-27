import { Zone } from '../types';
export const ZONES: Zone[] = [
  { id:'ktm_core', name:'Kathmandu Core', codAvailable:true, codFee:0, shippingBase:60, deliveryOptions:['same_day','next_day','standard'] },
  { id:'ktm_outer', name:'Kathmandu Outer', codAvailable:true, codFee:20, shippingBase:80, deliveryOptions:['next_day','standard'] },
  { id:'major_city', name:'Major City', codAvailable:true, codFee:40, shippingBase:120, deliveryOptions:['standard'] },
  { id:'rest_nepal', name:'Rest of Nepal', codAvailable:false, codFee:0, shippingBase:200, deliveryOptions:['standard'] },
];
export const getZone = (id: string): Zone => ZONES.find(z => z.id === id) ?? ZONES[0];
export const DELIVERY_ETA_MAP: Record<string, Record<string, string>> = {
  ktm_core:  { same_day:'Same Day', next_day:'Next Day', standard:'2–3 Days' },
  ktm_outer: { next_day:'Next Day', standard:'2–4 Days' },
  major_city:{ standard:'3–5 Days' },
  rest_nepal:{ standard:'5–8 Days' },
};
export const DELIVERY_FEE_MAP: Record<string, Record<string, number>> = {
  ktm_core:  { same_day:150, next_day:80, standard:60 },
  ktm_outer: { next_day:100, standard:80 },
  major_city:{ standard:120 },
  rest_nepal:{ standard:200 },
};
