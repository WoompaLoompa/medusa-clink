/**
 * CLINK Payment Status Endpoint
 *
 * Returns the current status of a CLINK payment.
 * Used for polling when webhook confirmation fails.
 * GET /clink/status/:id
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * GET /clink/status/:id
 *
 * Returns the payment status for a given payment session ID.
 * This is the backup confirmation method (polling).
 *
 * Status flow: pending → paid (webhook/polling confirms) or pending → expired (timeout)
 */
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<void>;
//# sourceMappingURL=route.d.ts.map