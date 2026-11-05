// Payment security utilities and rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isLimited(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }

    if (entry.count >= this.maxRequests) {
      return true;
    }

    entry.count++;
    return false;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

// Rate limiters for different operations
export const paymentCreationLimiter = new RateLimiter(5, 60000); // 5 per minute
export const paymentVerificationLimiter = new RateLimiter(10, 60000); // 10 per minute
export const linkedinShareLimiter = new RateLimiter(3, 60000); // 3 per minute

/**
 * Validate Razorpay webhook signature
 * In production: verify against Razorpay key
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  // Production implementation would use:
  // const crypto = require('crypto');
  // const generated_signature = crypto
  //   .createHmac('sha256', secret)
  //   .update(orderId + '|' + paymentId)
  //   .digest('hex');
  // return generated_signature === signature;

  // Demo: always verify (Phase 4+: implement real verification)
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  return true;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
    .slice(0, 1000); // Max 1000 chars
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amountPaise: number): boolean {
  const MIN_AMOUNT = 5000; // ₹50 minimum
  const MAX_AMOUNT = 1000000; // ₹10,000 maximum
  return amountPaise >= MIN_AMOUNT && amountPaise <= MAX_AMOUNT;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate certificate ID format
 */
export function validateCertificateId(id: string): boolean {
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Hash sensitive data (for logging, never store actual values)
 */
export function hashSensitiveData(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Log payment event with security masking
 */
export interface PaymentLog {
  timestamp: string;
  userId: string;
  action: string;
  orderId: string;
  amount: number;
  status: string;
  ipAddress?: string;
  userAgent?: string;
}

export function createPaymentLog(log: PaymentLog): void {
  const maskedLog = {
    ...log,
    userId: hashSensitiveData(log.userId),
    orderId: log.orderId.slice(0, 8) + '****',
  };

  // In production: send to logging service (Sentry, DataDog, etc.)
  if (import.meta.env.VITE_LOG_PAYMENTS === 'true') {
    console.log('[PAYMENT_LOG]', JSON.stringify(maskedLog));
  }
}

/**
 * Detect suspicious payment patterns
 */
export interface SuspiciousActivityAlert {
  userId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export function detectSuspiciousActivity(
  userId: string,
  recentPayments: number,
  totalInLast24h: number
): SuspiciousActivityAlert | null {
  // Multiple payments in short time
  if (recentPayments > 5) {
    return {
      userId,
      reason: 'Multiple payment attempts in short period',
      severity: 'high',
      timestamp: new Date().toISOString(),
    };
  }

  // High total amount in 24h
  if (totalInLast24h > 100000) { // ₹1000
    return {
      userId,
      reason: 'High transaction volume in 24 hours',
      severity: 'medium',
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Export data securely for analytics
 */
export function sanitizeForAnalytics(data: any): any {
  if (!data) return null;

  const sanitized = { ...data };
  const sensitiveFields = ['userId', 'email', 'paymentId', 'signature', 'accessToken'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = hashSensitiveData(String(sanitized[field]));
    }
  }

  return sanitized;
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  paymentCreationLimiter.cleanup();
  paymentVerificationLimiter.cleanup();
  linkedinShareLimiter.cleanup();
}, 300000);
