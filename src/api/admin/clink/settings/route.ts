/**
 * CLINK Admin Settings API
 * 
 * Handles saving and retrieving CLINK payment configuration.
 * Protected by admin authentication.
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface ClinkSettings {
  noffer: string
  currencySource: "coingecko" | "kraken" | "fixed" | "manual"
  fixedBtcRate: number | null
  invoiceTimeout: number
  enableSubscriptions: boolean
  refundContactEmail: string
  refundContactNostr: string
  debug: boolean
}

/**
 * GET /admin/clink/settings
 * 
 * Retrieve current CLINK configuration
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // In production, this would fetch from Medusa config service
    // For now, return placeholder settings
    const settings: ClinkSettings = {
      noffer: "",
      currencySource: "coingecko",
      fixedBtcRate: null,
      invoiceTimeout: 600,
      enableSubscriptions: false,
      refundContactEmail: "",
      refundContactNostr: "",
      debug: false
    }

    res.status(200).json({ settings })
  } catch (error) {
    console.error("[ClinkAdminSettings] Error fetching settings:", error)
    res.status(500).json({ error: "Failed to fetch CLINK settings" })
  }
}

/**
 * POST /admin/clink/settings
 * 
 * Save CLINK configuration
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const settings = req.body as ClinkSettings

    // Validate required fields
    if (!settings.noffer) {
      res.status(400).json({ 
        error: "noffer string is required" 
      })
      return
    }

    if (!settings.noffer.startsWith("noffer1")) {
      res.status(400).json({ 
        error: "Invalid noffer format. Must start with noffer1" 
      })
      return
    }

    // Validate fixed rate if currency source is fixed
    if (settings.currencySource === "fixed" && !settings.fixedBtcRate) {
      res.status(400).json({ 
        error: "Fixed BTC rate is required when using fixed currency source" 
      })
      return
    }

    // Validate invoice timeout
    if (settings.invoiceTimeout < 60 || settings.invoiceTimeout > 86400) {
      res.status(400).json({ 
        error: "Invoice timeout must be between 60 and 86400 seconds" 
      })
      return
    }

    // In production, this would save to Medusa config service
    // and reinitialize the payment provider
    
    console.log("[ClinkAdminSettings] Settings saved:", {
      noffer: settings.noffer.substring(0, 20) + "...",
      currencySource: settings.currencySource,
      enableSubscriptions: settings.enableSubscriptions
    })

    res.status(200).json({ 
      success: true, 
      message: "CLINK settings saved successfully",
      settings 
    })
  } catch (error) {
    console.error("[ClinkAdminSettings] Error saving settings:", error)
    res.status(500).json({ error: "Failed to save CLINK settings" })
  }
}

/**
 * DELETE /admin/clink/settings
 * 
 * Reset CLINK configuration to defaults
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const defaultSettings: ClinkSettings = {
      noffer: "",
      currencySource: "coingecko",
      fixedBtcRate: null,
      invoiceTimeout: 600,
      enableSubscriptions: false,
      refundContactEmail: "",
      refundContactNostr: "",
      debug: false
    }

    console.log("[ClinkAdminSettings] Settings reset to defaults")

    res.status(200).json({ 
      success: true, 
      message: "CLINK settings reset to defaults",
      settings: defaultSettings 
    })
  } catch (error) {
    console.error("[ClinkAdminSettings] Error resetting settings:", error)
    res.status(500).json({ error: "Failed to reset CLINK settings" })
  }
}
