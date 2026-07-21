/**
 * CLINK In-Memory Store
 *
 * Shared storage for payment sessions and subscriptions.
 * In production, replace with Medusa's database service.
 */
export interface PaymentSession {
    payment_id: string;
    bolt11: string;
    amount_sats: number;
    fiat_amount: number;
    currency_code: string;
    exchange_rate?: number;
    expires_at: number;
    status: "pending" | "paid" | "expired" | "cancelled";
    created_at: number;
    preimage?: string;
    cart_id?: string;
}
/**
 * Store a payment session
 */
export declare function storePaymentSession(session: PaymentSession): void;
/**
 * Get a payment session by ID
 */
export declare function getPaymentSession(paymentId: string): PaymentSession | undefined;
/**
 * Update payment session status
 */
export declare function updatePaymentStatus(paymentId: string, status: PaymentSession["status"], preimage?: string): PaymentSession | undefined;
/**
 * Check if a payment session has expired
 */
export declare function isPaymentExpired(paymentId: string): boolean;
/**
 * Clear all payment sessions (for testing)
 */
export declare function clearPaymentSessions(): void;
//# sourceMappingURL=store.d.ts.map