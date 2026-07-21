/**
 * CLINK Subscription API Routes
 *
 * Handles subscription creation, management, and payment processing.
 * Delegates to SubscriptionService for business logic.
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * POST /clink/subscriptions
 *
 * Create a new subscription
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<void>;
/**
 * GET /clink/subscriptions/:id
 *
 * Get subscription by ID
 */
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<void>;
/**
 * PATCH /clink/subscriptions/:id/cancel
 *
 * Cancel a subscription
 */
export declare function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void>;
/**
 * DELETE /clink/subscriptions/:id
 *
 * Delete a subscription (admin only)
 */
export declare function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void>;
//# sourceMappingURL=route.d.ts.map