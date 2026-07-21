"use strict";
/**
 * CLINK Payment Status Endpoint
 *
 * Returns the current status of a CLINK payment.
 * Used for polling when webhook confirmation fails.
 * GET /clink/status/:id
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const store_1 = require("../../../../modules/clink/store");
/**
 * GET /clink/status/:id
 *
 * Returns the payment status for a given payment session ID.
 * This is the backup confirmation method (polling).
 *
 * Status flow: pending → paid (webhook/polling confirms) or pending → expired (timeout)
 */
async function GET(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                error: "Payment ID is required"
            });
            return;
        }
        console.log(`[ClinkStatus] Checking status for payment ${id}`);
        // Look up the payment session in the shared store
        const session = (0, store_1.getPaymentSession)(id);
        if (!session) {
            res.status(404).json({
                payment_id: id,
                status: "unknown",
                message: "Payment session not found"
            });
            return;
        }
        // Check if the invoice has expired
        if (session.status === "pending" && (0, store_1.isPaymentExpired)(id)) {
            (0, store_1.updatePaymentStatus)(id, "expired");
            session.status = "expired";
        }
        // In production, this would also query the Nostr relay for receipt events:
        // 1. Connect to relay
        // 2. Query kind:21000 events with the payment's event ID
        // 3. Verify signature and check for payment confirmation
        // 4. Return the verified status
        res.status(200).json({
            payment_id: id,
            status: session.status,
            message: getStatusMessage(session.status),
            ...(session.preimage && { preimage: session.preimage }),
            ...(session.status === "pending" && {
                expires_at: session.expires_at,
                seconds_remaining: Math.max(0, session.expires_at - Math.floor(Date.now() / 1000))
            })
        });
    }
    catch (error) {
        console.error("[ClinkStatus] Error checking status:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}
/**
 * Get a human-readable status message
 */
function getStatusMessage(status) {
    switch (status) {
        case "paid":
            return "Payment confirmed";
        case "expired":
            return "Invoice has expired";
        case "cancelled":
            return "Payment was cancelled";
        case "pending":
            return "Payment awaiting confirmation";
        default:
            return "Unknown status";
    }
}
//# sourceMappingURL=route.js.map