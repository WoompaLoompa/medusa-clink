/**
 * CLINK Subscription Service
 *
 * Handles recurring payments via nDebit for subscriptions.
 * This service manages the subscription lifecycle and payment processing.
 */
import { ClinkSubscriptionData, CreateSubscriptionRequest, CancelSubscriptionRequest, SubscriptionPaymentResult, ClinkOptions } from "./types";
interface InjectedDependencies {
    logger: {
        info: (msg: string) => void;
        warn: (msg: string) => void;
        error: (msg: string) => void;
    };
    [key: string]: unknown;
}
/**
 * Subscription Service
 *
 * Manages Lightning subscriptions via nDebit protocol.
 * Handles creation, payment processing, and lifecycle management.
 */
export declare class SubscriptionService {
    protected logger_: InjectedDependencies["logger"];
    protected options_: ClinkOptions;
    private clinkSDK_;
    constructor(container: InjectedDependencies, options: ClinkOptions);
    /**
     * Initialize CLINK SDK for debit operations
     */
    private initializeSDK;
    /**
     * Create a new subscription
     *
     * Stores subscription data and prepares for recurring billing.
     */
    createSubscription(request: CreateSubscriptionRequest): Promise<ClinkSubscriptionData>;
    /**
     * Process a subscription payment
     *
     * Uses nDebit to charge the customer automatically.
     */
    processPayment(subscriptionId: string): Promise<SubscriptionPaymentResult>;
    /**
     * Cancel a subscription
     *
     * Cancels or schedules cancellation at period end.
     */
    cancelSubscription(request: CancelSubscriptionRequest): Promise<ClinkSubscriptionData | null>;
    /**
     * Get subscription by ID
     */
    getSubscription(id: string): Promise<ClinkSubscriptionData | null>;
    /**
     * Get all subscriptions for a customer
     */
    getCustomerSubscriptions(customerId: string): Promise<ClinkSubscriptionData[]>;
    /**
     * Get subscriptions due for payment
     */
    getSubscriptionsDueForPayment(): Promise<ClinkSubscriptionData[]>;
    /**
     * Update subscription status
     */
    private updateStatus;
    /**
     * Validate create subscription request
     */
    private validateCreateRequest;
    /**
     * Get interval duration in seconds
     */
    private getIntervalSeconds;
    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId;
    /**
     * Clear all subscriptions (for testing)
     */
    clearAllSubscriptions(): Promise<void>;
    /**
     * Debug logging helper
     */
    private log;
}
export default SubscriptionService;
//# sourceMappingURL=subscription.d.ts.map