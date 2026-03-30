// Coupon Code Configuration for E5 Wheels

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'freeshipping';
  discount: number; // Percentage (25 = 25%) or Fixed amount ($100)
  expires: string; // Date string 'YYYY-MM-DD'
  minPurchase?: number; // Minimum cart value to apply
  maxDiscount?: number; // Maximum discount amount for percentage coupons
  active: boolean;
}

/**
 * Available coupon codes
 * To add a new coupon, just add an entry here
 */
export const COUPONS: Record<string, Coupon> = {
  'DANTETEST': {
    code: 'DANTETEST',
    type: 'percentage',
    discount: 99.5,
    expires: '2027-12-31',
    active: true,
  },
};

/**
 * Validates a coupon code
 */
export function validateCoupon(code: string, cartSubtotal: number): { valid: boolean; error?: string; coupon?: Coupon } {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = COUPONS[normalizedCode];

  // Check if coupon exists
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  // Check if coupon is active
  if (!coupon.active) {
    return { valid: false, error: 'This coupon is no longer active' };
  }

  // Check expiration date
  const now = new Date();
  const expiryDate = new Date(coupon.expires);
  if (now > expiryDate) {
    return { valid: false, error: 'This coupon has expired' };
  }

  // Check minimum purchase requirement
  if (coupon.minPurchase && cartSubtotal < coupon.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of $${coupon.minPurchase.toLocaleString()} required`
    };
  }

  return { valid: true, coupon };
}

/**
 * Calculates discount amount based on coupon
 */
export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === 'percentage') {
    const discount = subtotal * (coupon.discount / 100);
    // Apply max discount cap if specified
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      return coupon.maxDiscount;
    }
    return discount;
  } else if (coupon.type === 'fixed') {
    // Don't exceed subtotal
    return Math.min(coupon.discount, subtotal);
  }
  return 0;
}
