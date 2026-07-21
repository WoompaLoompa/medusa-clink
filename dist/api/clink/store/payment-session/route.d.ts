/**
 * CLINK Storefront API
 *
 * Provides payment session data for the storefront checkout.
 * Public API - no authentication required.
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * POST /clink/store/payment-session
 *
 * Create a new payment session for checkout.
 * Converts fiat amount to satoshis using the configured currency source.
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<void>;
//# sourceMappingURL=route.d.ts.map