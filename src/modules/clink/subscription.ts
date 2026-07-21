/**
 * CLINK Subscription Service
 * 
 * Handles recurring payments via nDebit for subscriptions.
 * This service manages the subscription lifecycle and payment processing.
 */

import {
  ClinkSubscriptionData,
  CreateSubscriptionRequest,
  CancelSubscriptionRequest,
  SubscriptionPaymentResult,
  SubscriptionStatus,
  SubscriptionInterval,
  ClinkOptions,
  ClinkDebitRequest,
  ClinkDebitResponse,
  ClinkErrorCode,
  ClinkError
} from "./types"

// In-memory storage for subscriptions (in production, use database)
const subscriptionStore = new Map<string, ClinkSubscriptionData>()

// Types for CLINK SDK (flexible to match actual SDK implementation)
interface ClinkSDKInstance {
  Debit?: (request: ClinkDebitRequest) => Promise<ClinkDebitResponse>
  Noffer?: (request: any) => Promise<any>
  [key: string]: any
}

interface InjectedDependencies {
  logger: {
    info: (msg: string) => void
    warn: (msg: string) => void
    error: (msg: string) => void
  }
  [key: string]: unknown
}

/**
 * Subscription Service
 * 
 * Manages Lightning subscriptions via nDebit protocol.
 * Handles creation, payment processing, and lifecycle management.
 */
export class SubscriptionService {
  protected logger_: InjectedDependencies["logger"]
  protected options_: ClinkOptions
  private clinkSDK_: ClinkSDKInstance | null = null

  constructor(
    container: InjectedDependencies,
    options: ClinkOptions
  ) {
    this.logger_ = container.logger
    this.options_ = options
  }

  /**
   * Initialize CLINK SDK for debit operations
   */
  private async initializeSDK(): Promise<void> {
    if (this.clinkSDK_) return

    try {
      const { ClinkSDK, generateSecretKey } = await import("@shocknet/clink-sdk")
      
      const privateKey = generateSecretKey()
      
      this.clinkSDK_ = new ClinkSDK({
        privateKey,
        relays: this.options_.relays || ["wss://relay.damus.io"],
        toPubKey: this.options_.merchantPubkey || ""
      })
      
      this.log("CLINK SDK initialized for subscription service")
    } catch (error) {
      this.log(`Failed to initialize CLINK SDK: ${error}`)
      throw new Error("Failed to initialize CLINK SDK for subscriptions")
    }
  }

  /**
   * Create a new subscription
   * 
   * Stores subscription data and prepares for recurring billing.
   */
  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<ClinkSubscriptionData> {
    this.log(`Creating subscription for customer ${request.customer_id}`)

    // Validate request
    this.validateCreateRequest(request)

    // Generate subscription ID
    const id = this.generateSubscriptionId()

    // Calculate billing period
    const now = Math.floor(Date.now() / 1000)
    const periodDuration = this.getIntervalSeconds(request.interval)

    // Create subscription data
    const subscription: ClinkSubscriptionData = {
      id,
      customer_id: request.customer_id,
      debit_pointer: request.debit_pointer,
      amount_sats: request.amount_sats,
      fiat_amount: request.amount_sats, // Will be converted later
      currency_code: request.currency_code,
      interval: request.interval,
      status: "active",
      created_at: now,
      current_period_start: now,
      current_period_end: now + periodDuration,
      payment_count: 0,
      max_payments: request.max_payments,
      metadata: request.metadata
    }

    // Store subscription
    subscriptionStore.set(id, subscription)

    this.log(`Subscription created: ${id}, next payment at ${subscription.current_period_end}`)

    return subscription
  }

  /**
   * Process a subscription payment
   * 
   * Uses nDebit to charge the customer automatically.
   */
  async processPayment(
    subscriptionId: string
  ): Promise<SubscriptionPaymentResult> {
    const subscription = subscriptionStore.get(subscriptionId)
    
    if (!subscription) {
      return {
        success: false,
        error: "Subscription not found",
        attempted_at: Math.floor(Date.now() / 1000)
      }
    }

    if (subscription.status !== "active") {
      return {
        success: false,
        error: `Subscription is ${subscription.status}`,
        attempted_at: Math.floor(Date.now() / 1000)
      }
    }

    // Check if we've exceeded max payments
    if (subscription.max_payments && subscription.payment_count >= subscription.max_payments) {
      await this.updateStatus(subscriptionId, "expired")
      return {
        success: false,
        error: "Maximum payments reached",
        attempted_at: Math.floor(Date.now() / 1000)
      }
    }

    try {
      // Initialize SDK if needed
      await this.initializeSDK()

      // Create debit request
      const debitRequest: ClinkDebitRequest = {
        pointer: subscription.debit_pointer,
        amount_sats: subscription.amount_sats
      }

      this.log(`Processing payment for subscription ${subscriptionId}: ${subscription.amount_sats} sats`)

      // Process payment via CLINK SDK
      const response: ClinkDebitResponse = await this.clinkSDK_!.Debit!(debitRequest)

      // Handle response
      if (response.res === "ok" && response.preimage) {
        // Payment successful
        subscription.payment_count++
        subscription.last_payment_at = Math.floor(Date.now() / 1000)
        subscription.current_period_start = subscription.current_period_end
        subscription.current_period_end = subscription.current_period_start + 
          this.getIntervalSeconds(subscription.interval)

        // Update store
        subscriptionStore.set(subscriptionId, subscription)

        this.log(`Payment successful for subscription ${subscriptionId}, next payment at ${subscription.current_period_end}`)

        return {
          success: true,
          preimage: response.preimage,
          attempted_at: Math.floor(Date.now() / 1000)
        }
      } else {
        // Payment failed
        this.log(`Payment failed for subscription ${subscriptionId}: ${response.error}`)

        // If too many failures, pause subscription
        // (In production, implement more sophisticated retry logic)

        return {
          success: false,
          error: response.error || "Payment failed",
          attempted_at: Math.floor(Date.now() / 1000)
        }
      }
    } catch (error) {
      this.log(`Error processing payment for subscription ${subscriptionId}: ${error}`)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        attempted_at: Math.floor(Date.now() / 1000)
      }
    }
  }

  /**
   * Cancel a subscription
   * 
   * Cancels or schedules cancellation at period end.
   */
  async cancelSubscription(
    request: CancelSubscriptionRequest
  ): Promise<ClinkSubscriptionData | null> {
    const subscription = subscriptionStore.get(request.subscription_id)
    
    if (!subscription) {
      return null
    }

    if (request.at_period_end) {
      // Schedule cancellation at period end
      subscription.cancel_at_period_end = true
      this.log(`Subscription ${request.subscription_id} scheduled for cancellation at period end`)
    } else {
      // Cancel immediately
      subscription.status = "cancelled"
      this.log(`Subscription ${request.subscription_id} cancelled immediately`)
    }

    subscriptionStore.set(request.subscription_id, subscription)
    return subscription
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(id: string): Promise<ClinkSubscriptionData | null> {
    return subscriptionStore.get(id) || null
  }

  /**
   * Get all subscriptions for a customer
   */
  async getCustomerSubscriptions(
    customerId: string
  ): Promise<ClinkSubscriptionData[]> {
    return Array.from(subscriptionStore.values()).filter(
      sub => sub.customer_id === customerId
    )
  }

  /**
   * Get subscriptions due for payment
   */
  async getSubscriptionsDueForPayment(): Promise<ClinkSubscriptionData[]> {
    const now = Math.floor(Date.now() / 1000)
    
    return Array.from(subscriptionStore.values()).filter(
      sub => sub.status === "active" && sub.current_period_end <= now
    )
  }

  /**
   * Update subscription status
   */
  private async updateStatus(
    id: string,
    status: SubscriptionStatus
  ): Promise<void> {
    const subscription = subscriptionStore.get(id)
    if (subscription) {
      subscription.status = status
      subscriptionStore.set(id, subscription)
      this.log(`Subscription ${id} status updated to ${status}`)
    }
  }

  /**
   * Validate create subscription request
   */
  private validateCreateRequest(request: CreateSubscriptionRequest): void {
    if (!request.customer_id) {
      throw new Error("Customer ID is required")
    }

    if (!request.amount_sats || request.amount_sats <= 0) {
      throw new Error("Amount must be greater than 0")
    }

    if (!request.currency_code) {
      throw new Error("Currency code is required")
    }

    if (!request.debit_pointer) {
      throw new Error("Debit pointer is required")
    }

    if (!request.debit_pointer.startsWith("ndebit1")) {
      throw new Error("Invalid debit pointer format. Must start with ndebit1")
    }

    if (!request.interval) {
      throw new Error("Billing interval is required")
    }
  }

  /**
   * Get interval duration in seconds
   */
  private getIntervalSeconds(interval: SubscriptionInterval): number {
    switch (interval) {
      case "daily":
        return 24 * 60 * 60
      case "weekly":
        return 7 * 24 * 60 * 60
      case "monthly":
        return 30 * 24 * 60 * 60
      case "yearly":
        return 365 * 24 * 60 * 60
      default:
        return 30 * 24 * 60 * 60 // Default to monthly
    }
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Clear all subscriptions (for testing)
   */
  async clearAllSubscriptions(): Promise<void> {
    subscriptionStore.clear()
    this.log("All subscriptions cleared")
  }

  /**
   * Debug logging helper
   */
  private log(message: string): void {
    if (this.options_.debug) {
      this.logger_.info(`[ClinkSubscription] ${message}`)
    }
  }
}

export default SubscriptionService
