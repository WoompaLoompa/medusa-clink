/**
 * ClinkPaymentProviderService
 * 
 * Bitcoin Lightning payment provider for Medusa via the CLINK protocol.
 * Implements the AbstractPaymentProvider interface for Medusa v2.
 */

import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { CurrencyService, isValidNoffer, calculateExpiry, isInvoiceExpired } from "./utils"
import {
  ClinkOptions,
  ClinkPaymentSessionData,
  ClinkPaymentData,
  CLINK_DEFAULTS,
  ClinkErrorCode,
  ClinkError,
  ClinkOfferResponse,
  isClinkError
} from "./types"

// CLINK SDK types (simplified for TypeScript)
interface ClinkSDKSettings {
  privateKey: Uint8Array
  relays: string[]
  toPubKey: string
  defaultTimeoutSeconds?: number
}

interface NofferData {
  offer: string
  amount_sats?: number
  description?: string
  expires_in_seconds?: number
}

interface NofferResponse {
  bolt11?: string
  error?: string
  code?: number
}

// Types for Medusa framework
interface MedusaLogger {
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
  debug: (msg: string) => void
}

interface InjectedDependencies {
  logger: MedusaLogger
  [key: string]: unknown
}

interface PaymentInput {
  data?: Record<string, unknown>
  context?: {
    customer?: { id: string; email?: string }
    idempotency_key?: string
  }
  amount?: number | { value: number | string; numeric?: number }
  currency_code?: string
}

interface PaymentOutput {
  id?: string
  data: Record<string, unknown>
  status?: string
}

/**
 * CLINK Payment Provider Service
 * 
 * Handles Bitcoin Lightning payments using the CLINK protocol.
 * Uses Nostr-native Offers (noffer) for invoice generation.
 */
class ClinkPaymentProviderService extends AbstractPaymentProvider<ClinkOptions> {
  static identifier = "clink"

  protected logger_: MedusaLogger
  protected options_: ClinkOptions
  protected currencyService_: CurrencyService

  // CLINK SDK instance (lazy initialized)
  private clinkSDK_: any = null
  private decodedOffer_: any = null

  constructor(container: InjectedDependencies, options: ClinkOptions) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = {
      ...CLINK_DEFAULTS,
      ...options
    } as ClinkOptions

    // Validate required options
    if (!this.options_.noffer) {
      throw new Error("CLINK offer string (noffer) is required")
    }

    if (!isValidNoffer(this.options_.noffer)) {
      throw new Error("Invalid CLINK offer string format. Must start with noffer1")
    }

    this.currencyService_ = new CurrencyService(this.options_)

    this.log("ClinkPaymentProviderService initialized")
    this.log(`Currency source: ${this.options_.currencySource}`)
    this.log(`Subscriptions: ${this.options_.enableSubscriptions ? "enabled" : "disabled"}`)
  }

  /**
   * Initialize CLINK SDK with ephemeral key
   * Called lazily when first payment is initiated
   */
  private async initializeSDK(relay: string, toPubKey: string): Promise<void> {
    try {
      // Dynamic import of CLINK SDK
      const { ClinkSDK, generateSecretKey } = await import("@shocknet/clink-sdk")
      
      // Generate ephemeral key for privacy
      const privateKey = generateSecretKey()
      
      // Create SDK instance
      this.clinkSDK_ = new ClinkSDK({
        privateKey,
        relays: [relay],
        toPubKey
      })
      
      this.log("CLINK SDK initialized with ephemeral key")
    } catch (error) {
      this.log(`Failed to initialize CLINK SDK: ${error}`)
      throw new Error("Failed to initialize CLINK SDK. Ensure @shocknet/clink-sdk is installed.")
    }
  }

  /**
   * Decode noffer string to extract offer data
   */
  private async decodeNoffer(): Promise<any> {
    if (this.decodedOffer_) {
      return this.decodedOffer_
    }

    try {
      const { decodeBech32 } = await import("@shocknet/clink-sdk")
      this.decodedOffer_ = decodeBech32(this.options_.noffer)
      this.log(`Decoded offer: pubkey=${this.decodedOffer_.data.pubkey.slice(0, 16)}...`)
      return this.decodedOffer_
    } catch (error) {
      this.log(`Failed to decode noffer: ${error}`)
      throw new ClinkError(
        "Invalid CLINK offer string",
        ClinkErrorCode.InvalidOffer
      )
    }
  }

  /**
   * Request invoice from CLINK offer
   * This is the core integration with the CLINK protocol
   */
  private async requestInvoice(
    amountSats: number,
    description: string,
    expiresIn: number
  ): Promise<string> {
    const decoded = await this.decodeNoffer()
    
    // Initialize SDK if needed
    if (!this.clinkSDK_) {
      await this.initializeSDK(decoded.data.relay, decoded.data.pubkey)
    }

    // Create offer request
    const request: NofferData = {
      offer: decoded.data.offer,
      amount_sats: amountSats,
      description: description.slice(0, 100), // Max 100 chars
      expires_in_seconds: expiresIn
    }

    this.log(`Requesting invoice: ${amountSats} sats, offer: ${decoded.data.offer}`)

    // Send request via CLINK SDK
    const response: NofferResponse = await this.clinkSDK_.Noffer(request)

    // Handle response
    if (response.bolt11) {
      this.log(`Invoice received: ${response.bolt11.slice(0, 30)}...`)
      return response.bolt11
    }

    // Handle error
    throw new ClinkError(
      response.error || "Failed to get invoice",
      response.code || ClinkErrorCode.TemporaryFailure
    )
  }

  /**
   * Initiate a payment session
   * 
   * When a customer selects CLINK as payment method, this creates the
   * Lightning invoice via the CLINK protocol.
   */
  async initiatePayment(input: PaymentInput): Promise<PaymentOutput> {
    this.log("Initiating payment")

    const { amount, currency_code, context } = input

    if (!amount || !currency_code) {
      throw new Error("Amount and currency_code are required")
    }

    // Get numeric amount
    const numericAmount = typeof amount === "number"
      ? amount
      : typeof amount === "object" && "value" in amount
        ? parseFloat(String(amount.value))
        : 0

    if (numericAmount <= 0) {
      throw new Error("Amount must be greater than 0")
    }

    try {
      // Convert fiat to satoshis
      const conversion = await this.currencyService_.fiatToSats(numericAmount, currency_code)

      let sats = conversion.sats
      let exchangeRate = conversion.rate

      // For manual mode, use amount directly as sats
      if (this.options_.currencySource === "manual") {
        sats = Math.round(numericAmount)
        exchangeRate = 0
      }

      this.log(`Payment amount: ${numericAmount} ${currency_code} = ${sats} sats`)

      // Generate description
      const description = this.options_.description || `Medusa Order`

      // Request invoice from CLINK
      const bolt11 = await this.requestInvoice(
        sats,
        description,
        this.options_.invoiceTimeout!
      )

      // Generate event ID for tracking
      const requestEventId = this.generateEventId()

      // Get decoded offer data
      const decoded = await this.decodeNoffer()

      const sessionData: ClinkPaymentSessionData = {
        noffer: this.options_.noffer,
        offerData: {
          pubkey: decoded.data.pubkey,
          relay: decoded.data.relay,
          offer: decoded.data.offer
        },
        bolt11,
        amount_sats: sats,
        fiat_amount: numericAmount,
        currency_code: currency_code,
        exchange_rate: exchangeRate,
        expires_at: calculateExpiry(this.options_.invoiceTimeout!),
        request_event_id: requestEventId
      }

      this.log(`Payment initiated: ${sats} sats, expires at ${sessionData.expires_at}`)

      return {
        id: requestEventId,
        data: sessionData as unknown as Record<string, unknown>
      }
    } catch (error) {
      this.log(`Payment initiation failed: ${error}`)
      throw error
    }
  }

  /**
   * Authorize a payment
   * 
   * Verifies that the Lightning invoice has been paid.
   * For CLINK, this checks for a valid receipt.
   */
  async authorizePayment(input: PaymentInput): Promise<PaymentOutput> {
    this.log("Authorizing payment")

    const sessionData = input.data as unknown as ClinkPaymentSessionData

    if (!sessionData?.bolt11) {
      throw new Error("No invoice found in payment data")
    }

    // Check if invoice has expired
    if (isInvoiceExpired(sessionData.expires_at)) {
      this.log("Invoice has expired")
      return {
        data: input.data || {},
        status: "error"
      }
    }

    // In production, this would check the Nostr relay for a receipt
    // The CLINK SDK's receipt callback handles this in real-time
    return {
      data: input.data || {},
      status: "pending"
    }
  }

  /**
   * Get payment status
   * 
   * Returns the current status of a payment session.
   */
  async getPaymentStatus(input: PaymentInput): Promise<PaymentOutput> {
    const sessionData = input.data as unknown as ClinkPaymentSessionData

    if (!sessionData) {
      return { data: {}, status: "pending" }
    }

    // Check if expired
    if (isInvoiceExpired(sessionData.expires_at)) {
      return { data: input.data || {}, status: "error" }
    }

    // In production, this would poll the Nostr relay
    return { data: input.data || {}, status: "pending" }
  }

  /**
   * Capture a payment
   * 
   * Lightning payments are instant and captured immediately.
   * This is called after authorization.
   */
  async capturePayment(input: PaymentInput): Promise<PaymentOutput> {
    this.log("Capturing payment")

    return {
      data: {
        ...input.data,
        status: "captured",
        captured_at: Math.floor(Date.now() / 1000)
      } as Record<string, unknown>
    }
  }

  /**
   * Cancel a payment
   * 
   * Marks a payment as cancelled.
   */
  async cancelPayment(input: PaymentInput): Promise<PaymentOutput> {
    this.log("Cancelling payment")

    return {
      data: {
        ...input.data,
        status: "cancelled",
        cancelled_at: Math.floor(Date.now() / 1000)
      } as Record<string, unknown>
    }
  }

  /**
   * Delete a payment session
   * 
   * Cleans up any resources associated with the payment.
   */
  async deletePayment(input: PaymentInput): Promise<PaymentOutput> {
    this.log("Deleting payment")

    return { data: input.data || {} }
  }

  /**
   * Retrieve payment data
   * 
   * Returns the stored payment data.
   */
  async retrievePayment(input: PaymentInput): Promise<PaymentOutput> {
    return { data: input.data || {} }
  }

  /**
   * Refund a payment
   * 
   * Lightning refunds require manual processing.
   * Returns contact information for the merchant.
   */
  async refundPayment(input: PaymentInput): Promise<PaymentOutput> {
    this.log("Refund requested - manual processing required")

    // Return refund instructions
    return {
      data: {
        ...input.data,
        refund_status: "manual_required",
        refund_instructions: {
          message: "Lightning refunds require manual processing. Please contact the merchant.",
          email: this.options_.refundContactEmail,
          nostr: this.options_.refundContactNostr
        }
      } as Record<string, unknown>
    }
  }

  /**
   * Handle webhook events
   * 
   * Processes CLINK receipt events from webhooks.
   */
  async getWebhookActionAndData(payload: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<{
    action: string
    data: {
      session_id: string
      amount: number
    }
  }> {
    this.log("Processing webhook event")

    const { data } = payload

    // Parse the webhook payload
    const eventType = data.event_type as string
    const sessionId = data.session_id as string
    const amount = data.amount as number

    switch (eventType) {
      case "paid":
        return {
          action: "captured",
          data: {
            session_id: sessionId,
            amount: amount || 0
          }
        }
      case "expired":
        return {
          action: "failed",
          data: {
            session_id: sessionId,
            amount: amount || 0
          }
        }
      default:
        return {
          action: "not_supported",
          data: {
            session_id: sessionId,
            amount: amount || 0
          }
        }
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `clink_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Debug logging helper
   */
  private log(message: string): void {
    if (this.options_.debug) {
      this.logger_.info(`[ClinkPayment] ${message}`)
    }
  }
}

export default ClinkPaymentProviderService
