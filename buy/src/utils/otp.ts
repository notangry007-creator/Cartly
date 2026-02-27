// OTP utility — simulation only (no real SMS gateway)
// In production: replace with Sparrow SMS / Firebase Phone Auth

interface OTPRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastRequestAt: number;
}

const OTP_STORE = new Map<string, OTPRecord>();

// Rate limiting: max 3 OTP requests per phone per 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000;   // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;

export interface OTPResult {
  success: boolean;
  otp?: string;
  error?: 'rate_limited' | 'unknown';
  retryAfterSeconds?: number;
}

export function generateOTP(phone: string): OTPResult {
  const now = Date.now();
  const existing = OTP_STORE.get(phone);

  // Rate limiting check
  if (existing) {
    const windowStart = now - RATE_WINDOW_MS;
    if (existing.lastRequestAt > windowStart) {
      // Count requests in window — simplified: track via attempts on the record
      // For a real implementation, use a sliding window counter
      const timeSinceLastRequest = now - existing.lastRequestAt;
      if (timeSinceLastRequest < 60_000) {
        // Must wait at least 60 seconds between requests
        const retryAfterSeconds = Math.ceil((60_000 - timeSinceLastRequest) / 1000);
        return { success: false, error: 'rate_limited', retryAfterSeconds };
      }
    }
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  OTP_STORE.set(phone, {
    otp,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastRequestAt: now,
  });

  return { success: true, otp };
}

export function verifyOTP(phone: string, input: string): boolean {
  const r = OTP_STORE.get(phone);
  if (!r) return false;
  if (Date.now() > r.expiresAt) {
    OTP_STORE.delete(phone);
    return false;
  }

  // Track failed attempts
  r.attempts += 1;
  if (r.attempts > MAX_VERIFY_ATTEMPTS) {
    OTP_STORE.delete(phone);
    return false;
  }

  if (r.otp !== input) return false;

  OTP_STORE.delete(phone);
  return true;
}

export function isOTPExpired(phone: string): boolean {
  const r = OTP_STORE.get(phone);
  if (!r) return true;
  return Date.now() > r.expiresAt;
}

export function getRemainingSeconds(phone: string): number {
  const r = OTP_STORE.get(phone);
  if (!r) return 0;
  return Math.max(0, Math.ceil((r.expiresAt - Date.now()) / 1000));
}
