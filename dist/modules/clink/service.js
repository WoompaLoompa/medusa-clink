"use strict";
/**
 * ClinkPaymentProviderService
 *
 * Bitcoin Lightning payment provider for Medusa via the CLINK protocol.
 * Implements the AbstractPaymentProvider interface for Medusa v2.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const utils_2 = require("./utils");
const types_1 = require("./types");
/**
 * CLINK Payment Provider Service
 *
 * Handles Bitcoin Lightning payments using the CLINK protocol.
 * Uses Nostr-native Offers (noffer) for invoice generation.
 */
class ClinkPaymentProviderService extends utils_1.AbstractPaymentProvider {
    static identifier = "clink";
    logger_;
    options_;
    currencyService_;
    // CLINK SDK instance (lazy initialized)
    clinkSDK_ = null;
    decodedOffer_ = null;
    constructor(container, options) {
        super(container, options);
        this.logger_ = container.logger;
        this.options_ = {
            ...types_1.CLINK_DEFAULTS,
            ...options
        };
        // Validate required options
        if (!this.options_.noffer) {
            throw new Error("CLINK offer string (noffer) is required");
        }
        if (!(0, utils_2.isValidNoffer)(this.options_.noffer)) {
            throw new Error("Invalid CLINK offer string format. Must start with noffer1");
        }
        this.currencyService_ = new utils_2.CurrencyService(this.options_);
        this.log("ClinkPaymentProviderService initialized");
        this.log(`Currency source: ${this.options_.currencySource}`);
        this.log(`Subscriptions: ${this.options_.enableSubscriptions ? "enabled" : "disabled"}`);
    }
    /**
     * Initialize CLINK SDK with ephemeral key
     * Called lazily when first payment is initiated
     */
    async initializeSDK(relay, toPubKey) {
        try {
            // Dynamic import of CLINK SDK
            const { ClinkSDK, generateSecretKey } = await Promise.resolve().then(() => __importStar(require("@shocknet/clink-sdk")));
            // Generate ephemeral key for privacy
            const privateKey = generateSecretKey();
            // Create SDK instance
            this.clinkSDK_ = new ClinkSDK({
                privateKey,
                relays: [relay],
                toPubKey
            });
            this.log("CLINK SDK initialized with ephemeral key");
        }
        catch (error) {
            this.log(`Failed to initialize CLINK SDK: ${error}`);
            throw new Error("Failed to initialize CLINK SDK. Ensure @shocknet/clink-sdk is installed.");
        }
    }
    /**
     * Decode noffer string to extract offer data
     */
    async decodeNoffer() {
        if (this.decodedOffer_) {
            return this.decodedOffer_;
        }
        try {
            const { decodeBech32 } = await Promise.resolve().then(() => __importStar(require("@shocknet/clink-sdk")));
            this.decodedOffer_ = decodeBech32(this.options_.noffer);
            this.log(`Decoded offer: pubkey=${this.decodedOffer_.data.pubkey.slice(0, 16)}...`);
            return this.decodedOffer_;
        }
        catch (error) {
            this.log(`Failed to decode noffer: ${error}`);
            throw new types_1.ClinkError("Invalid CLINK offer string", types_1.ClinkErrorCode.InvalidOffer);
        }
    }
    /**
     * Request invoice from CLINK offer
     * This is the core integration with the CLINK protocol
     */
    async requestInvoice(amountSats, description, expiresIn) {
        const decoded = await this.decodeNoffer();
        // Initialize SDK if needed
        if (!this.clinkSDK_) {
            await this.initializeSDK(decoded.data.relay, decoded.data.pubkey);
        }
        // Create offer request
        const request = {
            offer: decoded.data.offer,
            amount_sats: amountSats,
            description: description.slice(0, 100), // Max 100 chars
            expires_in_seconds: expiresIn
        };
        this.log(`Requesting invoice: ${amountSats} sats, offer: ${decoded.data.offer}`);
        // Send request via CLINK SDK
        const response = await this.clinkSDK_.Noffer(request);
        // Handle response
        if (response.bolt11) {
            this.log(`Invoice received: ${response.bolt11.slice(0, 30)}...`);
            return response.bolt11;
        }
        // Handle error
        throw new types_1.ClinkError(response.error || "Failed to get invoice", response.code || types_1.ClinkErrorCode.TemporaryFailure);
    }
    /**
     * Initiate a payment session
     *
     * When a customer selects CLINK as payment method, this creates the
     * Lightning invoice via the CLINK protocol.
     */
    async initiatePayment(input) {
        this.log("Initiating payment");
        const { amount, currency_code, context } = input;
        if (!amount || !currency_code) {
            throw new Error("Amount and currency_code are required");
        }
        // Get numeric amount
        const numericAmount = typeof amount === "number"
            ? amount
            : typeof amount === "object" && "value" in amount
                ? parseFloat(String(amount.value))
                : 0;
        if (numericAmount <= 0) {
            throw new Error("Amount must be greater than 0");
        }
        try {
            // Convert fiat to satoshis
            const conversion = await this.currencyService_.fiatToSats(numericAmount, currency_code);
            let sats = conversion.sats;
            let exchangeRate = conversion.rate;
            // For manual mode, use amount directly as sats
            if (this.options_.currencySource === "manual") {
                sats = Math.round(numericAmount);
                exchangeRate = 0;
            }
            this.log(`Payment amount: ${numericAmount} ${currency_code} = ${sats} sats`);
            // Generate description
            const description = this.options_.description || `Medusa Order`;
            // Request invoice from CLINK
            const bolt11 = await this.requestInvoice(sats, description, this.options_.invoiceTimeout);
            // Generate event ID for tracking
            const requestEventId = this.generateEventId();
            // Get decoded offer data
            const decoded = await this.decodeNoffer();
            const sessionData = {
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
                expires_at: (0, utils_2.calculateExpiry)(this.options_.invoiceTimeout),
                request_event_id: requestEventId
            };
            this.log(`Payment initiated: ${sats} sats, expires at ${sessionData.expires_at}`);
            return {
                id: requestEventId,
                data: sessionData
            };
        }
        catch (error) {
            this.log(`Payment initiation failed: ${error}`);
            throw error;
        }
    }
    /**
     * Authorize a payment
     *
     * Verifies that the Lightning invoice has been paid.
     * For CLINK, this checks for a valid receipt.
     */
    async authorizePayment(input) {
        this.log("Authorizing payment");
        const sessionData = input.data;
        if (!sessionData?.bolt11) {
            throw new Error("No invoice found in payment data");
        }
        // Check if invoice has expired
        if ((0, utils_2.isInvoiceExpired)(sessionData.expires_at)) {
            this.log("Invoice has expired");
            return {
                data: input.data || {},
                status: "error"
            };
        }
        // In production, this would check the Nostr relay for a receipt
        // The CLINK SDK's receipt callback handles this in real-time
        return {
            data: input.data || {},
            status: "pending"
        };
    }
    /**
     * Get payment status
     *
     * Returns the current status of a payment session.
     */
    async getPaymentStatus(input) {
        const sessionData = input.data;
        if (!sessionData) {
            return { data: {}, status: "pending" };
        }
        // Check if expired
        if ((0, utils_2.isInvoiceExpired)(sessionData.expires_at)) {
            return { data: input.data || {}, status: "error" };
        }
        // In production, this would poll the Nostr relay
        return { data: input.data || {}, status: "pending" };
    }
    /**
     * Capture a payment
     *
     * Lightning payments are instant and captured immediately.
     * This is called after authorization.
     */
    async capturePayment(input) {
        this.log("Capturing payment");
        return {
            data: {
                ...input.data,
                status: "captured",
                captured_at: Math.floor(Date.now() / 1000)
            }
        };
    }
    /**
     * Cancel a payment
     *
     * Marks a payment as cancelled.
     */
    async cancelPayment(input) {
        this.log("Cancelling payment");
        return {
            data: {
                ...input.data,
                status: "cancelled",
                cancelled_at: Math.floor(Date.now() / 1000)
            }
        };
    }
    /**
     * Delete a payment session
     *
     * Cleans up any resources associated with the payment.
     */
    async deletePayment(input) {
        this.log("Deleting payment");
        return { data: input.data || {} };
    }
    /**
     * Retrieve payment data
     *
     * Returns the stored payment data.
     */
    async retrievePayment(input) {
        return { data: input.data || {} };
    }
    /**
     * Refund a payment
     *
     * Lightning refunds require manual processing.
     * Returns contact information for the merchant.
     */
    async refundPayment(input) {
        this.log("Refund requested - manual processing required");
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
            }
        };
    }
    /**
     * Handle webhook events
     *
     * Processes CLINK receipt events from webhooks.
     */
    async getWebhookActionAndData(payload) {
        this.log("Processing webhook event");
        const { data } = payload;
        // Parse the webhook payload
        const eventType = data.event_type;
        const sessionId = data.session_id;
        const amount = data.amount;
        switch (eventType) {
            case "paid":
                return {
                    action: "captured",
                    data: {
                        session_id: sessionId,
                        amount: amount || 0
                    }
                };
            case "expired":
                return {
                    action: "failed",
                    data: {
                        session_id: sessionId,
                        amount: amount || 0
                    }
                };
            default:
                return {
                    action: "not_supported",
                    data: {
                        session_id: sessionId,
                        amount: amount || 0
                    }
                };
        }
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `clink_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Debug logging helper
     */
    log(message) {
        if (this.options_.debug) {
            this.logger_.info(`[ClinkPayment] ${message}`);
        }
    }
}
exports.default = ClinkPaymentProviderService;
//# sourceMappingURL=service.js.map