/**
 * CLINK Admin Settings API
 *
 * Handles saving and retrieving CLINK payment configuration.
 * Protected by admin authentication.
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * GET /admin/clink/settings
 *
 * Retrieve current CLINK configuration
 */
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<void>;
/**
 * POST /admin/clink/settings
 *
 * Save CLINK configuration
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<void>;
/**
 * DELETE /admin/clink/settings
 *
 * Reset CLINK configuration to defaults
 */
export declare function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void>;
//# sourceMappingURL=route.d.ts.map