"use strict";
/**
 * CLINK Webhook Endpoint
 *
 * Handles payment confirmation webhooks from CLINK receipts.
 * POST /clink/webhook
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
/**
 * POST /clink/webhook
 *
 * Receives payment confirmation from CLINK receipt callbacks.
 * This is the primary payment confirmation method.
 */
async function POST(req, res) {
    try {
        const payload = req.body;
        const signature = req.headers["x-clink-signature"];
        // Log the webhook receipt (debug mode)
        console.log("[ClinkWebhook] Received webhook event");
        // Validate payload structure
        if (!payload || typeof payload !== "object") {
            res.status(400).json({
                error: "Invalid payload"
            });
            return;
        }
        // Extract event data
        const { event_type, session_id, amount, preimage } = payload;
        // Validate required fields
        if (!event_type || !session_id) {
            res.status(400).json({
                error: "Missing required fields: event_type, session_id"
            });
            return;
        }
        // Process based on event type
        switch (event_type) {
            case "paid":
                // Payment confirmed - update order status
                console.log(`[ClinkWebhook] Payment confirmed for session ${session_id}`);
                // In production, this would:
                // 1. Verify the signature
                // 2. Update the payment session status
                // 3. Complete the order
                res.status(200).json({
                    received: true,
                    status: "confirmed",
                    session_id
                });
                break;
            case "expired":
                // Payment expired
                console.log(`[ClinkWebhook] Payment expired for session ${session_id}`);
                res.status(200).json({
                    received: true,
                    status: "expired",
                    session_id
                });
                break;
            default:
                // Unknown event type
                console.log(`[ClinkWebhook] Unknown event type: ${event_type}`);
                res.status(200).json({
                    received: true,
                    status: "ignored",
                    session_id
                });
                break;
        }
    }
    catch (error) {
        console.error("[ClinkWebhook] Error processing webhook:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}
//# sourceMappingURL=route.js.map