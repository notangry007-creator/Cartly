const OTP_STORE = new Map<string, {otp:string; expiresAt:number}>();
export function generateOTP(phone: string): string {
  const otp = String(Math.floor(100000 + Math.random()*900000));
  OTP_STORE.set(phone, { otp, expiresAt: Date.now() + 5*60*1000 });
  return otp;
}
export function verifyOTP(phone: string, input: string): boolean {
  const r = OTP_STORE.get(phone);
  if (!r) return false;
  if (Date.now() > r.expiresAt) { OTP_STORE.delete(phone); return false; }
  if (r.otp !== input) return false;
  OTP_STORE.delete(phone); return true;
}
export function getOTPForDisplay(phone: string): string|null { return OTP_STORE.get(phone)?.otp ?? null; }
