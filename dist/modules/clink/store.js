"use strict";
/**
 * CLINK In-Memory Store
 *
 * Shared storage for payment sessions and subscriptions.
 * In production, replace with Medusa's database service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.storePaymentSession = storePaymentSession;
exports.getPaymentSession = getPaymentSession;
exports.updatePaymentStatus = updatePaymentStatus;
exports.isPaymentExpired = isPaymentExpired;
exports.clearPaymentSessions = clearPaymentSessions;
// Payment sessions store
const paymentSessions = new Map();
/**
 * Store a payment session
 */
function storePaymentSession(session) {
    paymentSessions.set(session.payment_id, session);
}
/**
 * Get a payment session by ID
 */
function getPaymentSession(paymentId) {
    return paymentSessions.get(paymentId);
}
/**
 * Update payment session status
 */
function updatePaymentStatus(paymentId, status, preimage) {
    const session = paymentSessions.get(paymentId);
    if (!session)
        return undefined;
    session.status = status;
    if (preimage)
        session.preimage = preimage;
    paymentSessions.set(paymentId, session);
    return session;
}
/**
 * Check if a payment session has expired
 */
function isPaymentExpired(paymentId) {
    const session = paymentSessions.get(paymentId);
    if (!session)
        return true;
    return session.expires_at < Math.floor(Date.now() / 1000);
}
/**
 * Clear all payment sessions (for testing)
 */
function clearPaymentSessions() {
    paymentSessions.clear();
}
//# sourceMappingURL=store.js.map