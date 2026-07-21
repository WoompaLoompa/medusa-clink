"use strict";
/**
 * CLINK Storefront API
 *
 * Provides payment session data for the storefront checkout.
 * Public API - no authentication required.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("../../../../modules/clink/utils");
const store_1 = require("../../../../modules/clink/store");
/**
 * Default CLINK options (in production, resolved from Medusa config)
 */
const DEFAULT_OPTIONS = {
    noffer: "",
    currencySource: "coingecko",
    invoiceTimeout: 600,
    enableSubscriptions: false,
    debug: false
};
/**
 * POST /clink/store/payment-session
 *
 * Create a new payment session for checkout.
 * Converts fiat amount to satoshis using the configured currency source.
 */
async function POST(req, res) {
    try {
        const { cart_id, amount, currency_code } = req.body;
        // Validate required fields
        if (!amount || !currency_code) {
            res.status(400).json({
                error: "Amount and currency_code are required"
            });
            return;
        }
        if (amount <= 0) {
            res.status(400).json({
                error: "Amount must be greater than 0"
            });
            return;
        }
        // In production, resolve options from Medusa container:
        // const options = req.scope.resolve("clinkOptions") as ClinkOptions
        const options = DEFAULT_OPTIONS;
        // Initialize currency service and convert
        const currencyService = new utils_1.CurrencyService(options);
        const conversion = await currencyService.fiatToSats(amount, currency_code);
        const amountSats = conversion.sats;
        const exchangeRate = conversion.rate;
        const timeoutSeconds = options.invoiceTimeout || 600;
        const expiresAt = Math.floor(Date.now() / 1000) + timeoutSeconds;
        const paymentId = `clink_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        // In production, this would call ClinkPaymentProviderService.initiatePayment()
        // which uses the CLINK SDK to request a real BOLT11 invoice from the merchant's node.
        // For now, generate a placeholder invoice that represents what the SDK would return.
        const bolt11 = `lnbc${amountSats}0n1qpvjn3kxppsp5${paymentId.slice(-8)}snp4xskueat9v9y92g990zqqtzqdtz0pr3nqz9g9yq9z0dtz9gxqyp0s-spv4392rujqcnpa4k82xxz70nqz9x8c4u0g2s3r5q9q8l6z4m2v0n0s`;
        // Store the payment session for status checking
        const session = {
            payment_id: paymentId,
            bolt11,
            amount_sats: amountSats,
            fiat_amount: amount,
            currency_code,
            exchange_rate: exchangeRate,
            expires_at: expiresAt,
            status: "pending",
            created_at: Math.floor(Date.now() / 1000),
            cart_id
        };
        (0, store_1.storePaymentSession)(session);
        const response = {
            bolt11,
            amount_sats: amountSats,
            fiat_amount: amount,
            currency_code,
            exchange_rate: exchangeRate,
            expires_at: expiresAt,
            payment_id: paymentId
        };
        console.log(`[ClinkStore] Payment session created: ${amountSats} sats (rate: ${exchangeRate})`);
        res.status(200).json(response);
    }
    catch (error) {
        console.error("[ClinkStore] Error creating payment session:", error);
        res.status(500).json({ error: "Failed to create payment session" });
    }
}
//# sourceMappingURL=route.js.map