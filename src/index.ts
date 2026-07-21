/**
 * bitcoin-lightning-payment-module-for-medusajs-via-clink
 * 
 * Bitcoin Lightning payment provider for Medusa eCommerce via the CLINK protocol.
 * 
 * @packageDocumentation
 */

// Export the payment provider service
export { ClinkPaymentProviderService } from "./modules/clink"

// Export types and utilities
export * from "./modules/clink/types"
export { CurrencyService } from "./modules/clink/utils"

// Plugin metadata
export const plugin = {
  name: "bitcoin-lightning-payment-module-for-medusajs-via-clink",
  description: "Bitcoin Lightning payment provider for Medusa via CLINK protocol",
  version: "1.0.0",
  license: "GPL-3.0"
}
