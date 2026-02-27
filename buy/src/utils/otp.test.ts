import { generateOTP, verifyOTP, getOTPForDisplay } from './otp';

// The OTP module uses an in-memory Map. Reset it between tests by
// generating fresh OTPs so one test's state doesn't leak into another.

const PHONE = '9841234567';
const OTHER_PHONE = '9741234567';

describe('generateOTP', () => {
  it('returns a 6-digit numeric string', () => {
    const otp = generateOTP(PHONE);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates a new OTP on every call (not deterministic)', () => {
    // Run 20 times — the chance of two consecutive identical 6-digit OTPs
    // is 1 in 900,000, making this effectively deterministic for CI.
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) seen.add(generateOTP(PHONE));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('stores the OTP so getOTPForDisplay can retrieve it', () => {
    const otp = generateOTP(PHONE);
    expect(getOTPForDisplay(PHONE)).toBe(otp);
  });

  it('overwrites a previous OTP for the same phone', () => {
    generateOTP(PHONE);
    const second = generateOTP(PHONE);
    expect(getOTPForDisplay(PHONE)).toBe(second);
  });

  it('stores OTPs independently per phone number', () => {
    const otp1 = generateOTP(PHONE);
    const otp2 = generateOTP(OTHER_PHONE);
    expect(getOTPForDisplay(PHONE)).toBe(otp1);
    expect(getOTPForDisplay(OTHER_PHONE)).toBe(otp2);
  });
});

describe('verifyOTP', () => {
  it('returns true for the correct OTP', () => {
    const otp = generateOTP(PHONE);
    expect(verifyOTP(PHONE, otp)).toBe(true);
  });

  it('returns false for an incorrect OTP', () => {
    generateOTP(PHONE);
    expect(verifyOTP(PHONE, '000000')).toBe(false);
  });

  it('returns false for an unknown phone number', () => {
    expect(verifyOTP('9999999999', '123456')).toBe(false);
  });

  it('deletes the OTP after a successful verification (single-use)', () => {
    const otp = generateOTP(PHONE);
    verifyOTP(PHONE, otp);
    // A second verification attempt with the same OTP must fail
    expect(verifyOTP(PHONE, otp)).toBe(false);
    expect(getOTPForDisplay(PHONE)).toBeNull();
  });

  it('does not delete the OTP after a failed verification', () => {
    const otp = generateOTP(PHONE);
    verifyOTP(PHONE, '000000'); // wrong attempt
    expect(getOTPForDisplay(PHONE)).toBe(otp); // still stored
  });

  it('returns false and deletes the OTP when it has expired', () => {
    jest.useFakeTimers();

    const otp = generateOTP(PHONE);
    // Advance time by 6 minutes (OTP TTL is 5 minutes)
    jest.advanceTimersByTime(6 * 60 * 1000);

    expect(verifyOTP(PHONE, otp)).toBe(false);
    expect(getOTPForDisplay(PHONE)).toBeNull();

    jest.useRealTimers();
  });

  it('returns true for an OTP that is just within its 5-minute TTL', () => {
    jest.useFakeTimers();

    const otp = generateOTP(PHONE);
    // Advance 4 minutes 59 seconds — still valid
    jest.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);

    expect(verifyOTP(PHONE, otp)).toBe(true);

    jest.useRealTimers();
  });
});

describe('getOTPForDisplay', () => {
  it('returns null when no OTP has been generated for a phone', () => {
    expect(getOTPForDisplay('0000000000')).toBeNull();
  });

  it('returns the current OTP for a phone that has one', () => {
    const otp = generateOTP(PHONE);
    expect(getOTPForDisplay(PHONE)).toBe(otp);
  });
});
