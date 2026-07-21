/**
 * CLINK Webhook Endpoint
 *
 * Handles payment confirmation webhooks from CLINK receipts.
 * POST /clink/webhook
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * POST /clink/webhook
 *
 * Receives payment confirmation from CLINK receipt callbacks.
 * This is the primary payment confirmation method.
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<void>;
//# sourceMappingURL=route.d.ts.map