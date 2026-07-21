/**
 * CLINK In-Memory Store
 * 
 * Shared storage for payment sessions and subscriptions.
 * In production, replace with Medusa's database service.
 */

export interface PaymentSession {
  payment_id: string
  bolt11: string
  amount_sats: number
  fiat_amount: number
  currency_code: string
  exchange_rate?: number
  expires_at: number
  status: "pending" | "paid" | "expired" | "cancelled"
  created_at: number
  preimage?: string
  cart_id?: string
}

// Payment sessions store
const paymentSessions = new Map<string, PaymentSession>()

/**
 * Store a payment session
 */
export function storePaymentSession(session: PaymentSession): void {
  paymentSessions.set(session.payment_id, session)
}

/**
 * Get a payment session by ID
 */
export function getPaymentSession(paymentId: string): PaymentSession | undefined {
  return paymentSessions.get(paymentId)
}

/**
 * Update payment session status
 */
export function updatePaymentStatus(
  paymentId: string,
  status: PaymentSession["status"],
  preimage?: string
): PaymentSession | undefined {
  const session = paymentSessions.get(paymentId)
  if (!session) return undefined

  session.status = status
  if (preimage) session.preimage = preimage
  paymentSessions.set(paymentId, session)
  return session
}

/**
 * Check if a payment session has expired
 */
export function isPaymentExpired(paymentId: string): boolean {
  const session = paymentSessions.get(paymentId)
  if (!session) return true
  return session.expires_at < Math.floor(Date.now() / 1000)
}

/**
 * Clear all payment sessions (for testing)
 */
export function clearPaymentSessions(): void {
  paymentSessions.clear()
}
