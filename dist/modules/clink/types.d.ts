/**
 * CLINK Payment Module Types
 * Bitcoin Lightning payments for Medusa via the CLINK protocol
 */
/** Currency conversion source */
export type CurrencySource = "coingecko" | "kraken" | "fixed" | "manual";
/** Main plugin configuration options */
export interface ClinkOptions {
    /** CLINK offer string (noffer1...) - Required */
    noffer: string;
    /** Nostr relays (overridden by noffer if not set) */
    relays?: string[];
    /** Merchant's Nostr pubkey hex (extracted from noffer if not set) */
    merchantPubkey?: string;
    /** Webhook verification secret */
    webhookSecret?: string;
    /** Currency conversion source */
    currencySource: CurrencySource;
    /** Fixed BTC/fiat rate (only used when currencySource = "fixed") */
    fixedBtcRate?: number;
    /** Invoice timeout in seconds (default: 600) */
    invoiceTimeout?: number;
    /** Polling interval in milliseconds (default: 5000) */
    pollInterval?: number;
    /** Maximum polling attempts (default: 120) */
    maxPollAttempts?: number;
    /** Default invoice description prefix */
    description?: string;
    /** Enable subscription support via nDebit */
    enableSubscriptions?: boolean;
    /** Merchant email for refund contact */
    refundContactEmail?: string;
    /** Merchant Nostr pubkey for refund contact */
    refundContactNostr?: string;
    /** Debug mode */
    debug?: boolean;
}
/** Defaults for ClinkOptions */
export declare const CLINK_DEFAULTS: Partial<ClinkOptions>;
/** CLINK Offer pricing type */
export declare enum OfferPriceType {
    Fixed = 0,
    Variable = 1,
    Spontaneous = 2
}
/** Decoded noffer data */
export interface NofferData {
    pubkey: string;
    relay: string;
    offer: string;
    priceType?: OfferPriceType;
    price?: number;
    currency?: string;
}
/** CLINK Offer payment request */
export interface ClinkOfferRequest {
    offer: string;
    amount_sats?: number;
    description?: string;
    expires_in_seconds?: number;
    payer_data?: Record<string, unknown>;
    zap?: string;
}
/** CLINK Offer payment response (success) */
export interface ClinkOfferResponseSuccess {
    bolt11: string;
}
/** CLINK Offer payment response (error) */
export interface ClinkOfferResponseError {
    error: string;
    code: number;
    range?: {
        min: number;
        max: number;
    };
}
/** CLINK Offer payment response */
export type ClinkOfferResponse = ClinkOfferResponseSuccess | ClinkOfferResponseError;
/** Check if response is an error */
export declare function isClinkError(response: ClinkOfferResponse): response is ClinkOfferResponseError;
/** CLINK Receipt (payment confirmation) */
export interface ClinkReceipt {
    res: "ok" | "GFY";
    preimage?: string;
    error?: string;
}
/** CLINK Debit request */
export interface ClinkDebitRequest {
    pointer?: string;
    amount_sats?: number;
    bolt11?: string;
}
/** CLINK Debit response */
export interface ClinkDebitResponse {
    res: "ok" | "GFY";
    preimage?: string;
    error?: string;
    code?: number;
}
/** Data stored in PaymentSession during initiation */
export interface ClinkPaymentSessionData {
    /** The CLINK offer used */
    noffer: string;
    /** Decoded offer data */
    offerData: NofferData;
    /** BOLT11 invoice string */
    bolt11: string;
    /** Amount in satoshis */
    amount_sats: number;
    /** Original fiat amount */
    fiat_amount: number;
    /** Fiat currency code */
    currency_code: string;
    /** Exchange rate used */
    exchange_rate: number;
    /** Invoice expiry timestamp (Unix seconds) */
    expires_at: number;
    /** Ephemeral Nostr public key used for request */
    ephemeral_pubkey?: string;
    /** Nostr event ID of the request */
    request_event_id?: string;
}
/** Data stored in Payment after authorization */
export interface ClinkPaymentData {
    /** The CLINK offer used */
    noffer: string;
    /** BOLT11 invoice string */
    bolt11: string;
    /** Amount in satoshis */
    amount_sats: number;
    /** Lightning payment preimage (proof of payment) */
    preimage?: string;
    /** Nostr receipt event ID */
    receipt_event_id?: string;
    /** Payment completed at timestamp */
    completed_at?: number;
}
/** Cached exchange rate */
export interface CachedRate {
    rate: number;
    timestamp: number;
}
/** Currency conversion result */
export interface ConversionResult {
    /** Amount in satoshis */
    sats: number;
    /** Exchange rate used (BTC per fiat unit) */
    rate: number;
    /** Source of the rate */
    source: CurrencySource;
    /** Rate cache timestamp */
    cachedAt: number;
}
/** Webhook payload from CLINK receipt */
export interface ClinkWebhookPayload {
    /** Event type */
    event_type: string;
    /** Payment session ID */
    session_id: string;
    /** Amount in sats */
    amount?: number;
    /** Payment preimage */
    preimage?: string;
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/** Webhook verification result */
export interface WebhookVerificationResult {
    valid: boolean;
    payload?: ClinkWebhookPayload;
    error?: string;
}
/** Admin widget configuration */
export interface ClinkAdminConfig {
    noffer: string;
    currencySource: CurrencySource;
    fixedBtcRate?: number;
    invoiceTimeout: number;
    enableSubscriptions: boolean;
    refundContactEmail?: string;
    refundContactNostr?: string;
}
/** Subscription status */
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired" | "past_due";
/** Subscription interval */
export type SubscriptionInterval = "daily" | "weekly" | "monthly" | "yearly";
/** Subscription data stored for auto-renewal */
export interface ClinkSubscriptionData {
    /** Unique subscription ID */
    id: string;
    /** Customer ID in Medusa */
    customer_id: string;
    /** nDebit pointer (ndebit1...) for recurring payments */
    debit_pointer: string;
    /** Amount per billing cycle in satoshis */
    amount_sats: number;
    /** Fiat amount per billing cycle */
    fiat_amount: number;
    /** Fiat currency code */
    currency_code: string;
    /** Billing interval */
    interval: SubscriptionInterval;
    /** Current status */
    status: SubscriptionStatus;
    /** When the subscription was created */
    created_at: number;
    /** When the current billing period started */
    current_period_start: number;
    /** When the current billing period ends */
    current_period_end: number;
    /** When the last payment was made */
    last_payment_at?: number;
    /** Number of successful payments */
    payment_count: number;
    /** Maximum number of payments (null = unlimited) */
    max_payments?: number;
    /** Cancel at period end? */
    cancel_at_period_end?: boolean;
    /** Metadata for the subscription */
    metadata?: Record<string, unknown>;
}
/** Create subscription request */
export interface CreateSubscriptionRequest {
    /** Customer ID */
    customer_id: string;
    /** Amount in satoshis */
    amount_sats: number;
    /** Fiat currency code */
    currency_code: string;
    /** Billing interval */
    interval: SubscriptionInterval;
    /** nDebit pointer from customer's wallet */
    debit_pointer: string;
    /** Optional: maximum number of payments */
    max_payments?: number;
    /** Optional: metadata */
    metadata?: Record<string, unknown>;
}
/** Cancel subscription request */
export interface CancelSubscriptionRequest {
    /** Subscription ID */
    subscription_id: string;
    /** Cancel at period end? (default: true) */
    at_period_end?: boolean;
}
/** Subscription payment result */
export interface SubscriptionPaymentResult {
    /** Whether payment was successful */
    success: boolean;
    /** Payment preimage if successful */
    preimage?: string;
    /** Error message if failed */
    error?: string;
    /** When payment was attempted */
    attempted_at: number;
}
/** CLINK error codes per specification */
export declare enum ClinkErrorCode {
    InvalidOffer = 1,
    TemporaryFailure = 2,
    ExpiredOrMoved = 3,
    UnsupportedFeature = 4,
    InvalidAmount = 5
}
/** CLINK error with code and message */
export declare class ClinkError extends Error {
    code: ClinkErrorCode;
    range?: {
        min: number;
        max: number;
    };
    constructor(message: string, code: ClinkErrorCode, range?: {
        min: number;
        max: number;
    });
}
//# sourceMappingURL=types.d.ts.map