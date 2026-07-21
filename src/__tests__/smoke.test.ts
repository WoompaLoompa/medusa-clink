/**
 * Smoke test — verifies the plugin exports and basic functionality
 */

import ClinkPaymentProviderService from "../modules/clink/service"
import { CurrencyService, isValidNoffer, formatSats } from "../modules/clink/utils"
import { SubscriptionService } from "../modules/clink/subscription"

describe("Plugin smoke tests", () => {
  it("should export service with correct identifier", () => {
    expect(ClinkPaymentProviderService.identifier).toBe("clink")
  })

  it("should instantiate CurrencyService", () => {
    const service = new CurrencyService({
      noffer: "noffer1test",
      currencySource: "coingecko",
      invoiceTimeout: 600,
      enableSubscriptions: false,
      debug: false
    })
    expect(service).toBeDefined()
  })

  it("should validate noffers", () => {
    expect(isValidNoffer("noffer1qvqsyqyqyqyqyqgsqgp2xpu9xp8yqn2zehj62kjln2988tack9hxgsq4g62hx")).toBe(true)
    expect(isValidNoffer("invalid")).toBe(false)
    expect(isValidNoffer("")).toBe(false)
  })

  it("should format sats", () => {
    expect(formatSats(100000, "sats")).toBe("100,000 sats")
    expect(formatSats(100000000, "btc")).toBe("1.00000000")
    expect(formatSats(100000000, "btc-symbol")).toBe("₿ 1.00000000")
  })

  it("should instantiate SubscriptionService", () => {
    const service = new SubscriptionService(
      { logger: console },
      {
        noffer: "noffer1test",
        currencySource: "coingecko",
        invoiceTimeout: 600,
        enableSubscriptions: true,
        debug: false
      }
    )
    expect(service).toBeDefined()
  })

  it("should import all API route handlers", async () => {
    const storeModule = await import("../api/clink/store/payment-session/route")
    const webhookModule = await import("../api/clink/webhook/route")
    const statusModule = await import("../api/clink/status/[id]/route")
    const subModule = await import("../api/clink/subscriptions/route")

    expect(storeModule.POST).toBeDefined()
    expect(webhookModule.POST).toBeDefined()
    expect(statusModule.GET).toBeDefined()
    expect(subModule.POST).toBeDefined()
    expect(subModule.GET).toBeDefined()
    expect(subModule.PATCH).toBeDefined()
    expect(subModule.DELETE).toBeDefined()
  })

  it("should convert fiat to sats via live CoinGecko API", async () => {
    const service = new CurrencyService({
      noffer: "noffer1test",
      currencySource: "coingecko",
      invoiceTimeout: 600,
      enableSubscriptions: false,
      debug: false
    })

    const result = await service.fiatToSats(10, "USD")
    expect(result.sats).toBeGreaterThan(0)
    expect(result.rate).toBeGreaterThan(0)
    console.log(`  Live: 10 USD = ${result.sats} sats (rate: ${result.rate})`)
  }, 15000)
})
