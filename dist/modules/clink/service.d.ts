/**
 * ClinkPaymentProviderService
 *
 * Bitcoin Lightning payment provider for Medusa via the CLINK protocol.
 * Implements the AbstractPaymentProvider interface for Medusa v2.
 */
import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { CurrencyService } from "./utils";
import { ClinkOptions } from "./types";
interface MedusaLogger {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    debug: (msg: string) => void;
}
interface InjectedDependencies {
    logger: MedusaLogger;
    [key: string]: unknown;
}
interface PaymentInput {
    data?: Record<string, unknown>;
    context?: {
        customer?: {
            id: string;
            email?: string;
        };
        idempotency_key?: string;
    };
    amount?: number | {
        value: number | string;
        numeric?: number;
    };
    currency_code?: string;
}
interface PaymentOutput {
    id?: string;
    data: Record<string, unknown>;
    status?: string;
}
/**
 * CLINK Payment Provider Service
 *
 * Handles Bitcoin Lightning payments using the CLINK protocol.
 * Uses Nostr-native Offers (noffer) for invoice generation.
 */
declare class ClinkPaymentProviderService extends AbstractPaymentProvider<ClinkOptions> {
    static identifier: string;
    protected logger_: MedusaLogger;
    protected options_: ClinkOptions;
    protected currencyService_: CurrencyService;
    private clinkSDK_;
    private decodedOffer_;
    constructor(container: InjectedDependencies, options: ClinkOptions);
    /**
     * Initialize CLINK SDK with ephemeral key
     * Called lazily when first payment is initiated
     */
    private initializeSDK;
    /**
     * Decode noffer string to extract offer data
     */
    private decodeNoffer;
    /**
     * Request invoice from CLINK offer
     * This is the core integration with the CLINK protocol
     */
    private requestInvoice;
    /**
     * Initiate a payment session
     *
     * When a customer selects CLINK as payment method, this creates the
     * Lightning invoice via the CLINK protocol.
     */
    initiatePayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Authorize a payment
     *
     * Verifies that the Lightning invoice has been paid.
     * For CLINK, this checks for a valid receipt.
     */
    authorizePayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Get payment status
     *
     * Returns the current status of a payment session.
     */
    getPaymentStatus(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Capture a payment
     *
     * Lightning payments are instant and captured immediately.
     * This is called after authorization.
     */
    capturePayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Cancel a payment
     *
     * Marks a payment as cancelled.
     */
    cancelPayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Delete a payment session
     *
     * Cleans up any resources associated with the payment.
     */
    deletePayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Retrieve payment data
     *
     * Returns the stored payment data.
     */
    retrievePayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Refund a payment
     *
     * Lightning refunds require manual processing.
     * Returns contact information for the merchant.
     */
    refundPayment(input: PaymentInput): Promise<PaymentOutput>;
    /**
     * Handle webhook events
     *
     * Processes CLINK receipt events from webhooks.
     */
    getWebhookActionAndData(payload: {
        data: Record<string, unknown>;
        rawData: string | Buffer;
        headers: Record<string, unknown>;
    }): Promise<{
        action: string;
        data: {
            session_id: string;
            amount: number;
        };
    }>;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Debug logging helper
     */
    private log;
}
export default ClinkPaymentProviderService;
//# sourceMappingURL=service.d.ts.map