/**
 * Currency Service Unit Tests
 */

import { CurrencyService, isValidNoffer, formatSats, calculateExpiry, isInvoiceExpired } from "../modules/clink/utils"
import { ClinkOptions, CurrencySource } from "../modules/clink/types"

describe("CurrencyService", () => {
  describe("constructor", () => {
    it("should initialize with coingecko source", () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "coingecko"
      })
      expect(service).toBeDefined()
    })

    it("should initialize with fixed source", () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "fixed",
        fixedBtcRate: 60000
      })
      expect(service).toBeDefined()
    })

    it("should initialize with manual source", () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "manual"
      })
      expect(service).toBeDefined()
    })
  })

  describe("fiatToSats", () => {
    it("should return 0 for manual source", async () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "manual"
      })

      const result = await service.fiatToSats(100, "USD")
      expect(result.sats).toBe(0)
      expect(result.source).toBe("manual")
    })

    it("should use fixed rate when configured", async () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "fixed",
        fixedBtcRate: 60000
      })

      // Mock fetch to avoid actual API calls
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      })

      const result = await service.fiatToSats(60, "USD")
      // 60 USD / 60000 USD/BTC = 0.001 BTC = 100000 sats
      expect(result.sats).toBe(100000)
      expect(result.rate).toBe(60000)
    })
  })

  describe("getRate", () => {
    it("should throw error for fixed source without rate", async () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "fixed"
      })

      await expect(service.getRate("USD")).rejects.toThrow("fixedBtcRate is required")
    })

    it("should return fixed rate when configured", async () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "fixed",
        fixedBtcRate: 65000
      })

      const rate = await service.getRate("USD")
      expect(rate).toBe(65000)
    })
  })

  describe("cache", () => {
    it("should cache rates", async () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "fixed",
        fixedBtcRate: 60000
      })

      // First call
      await service.getRate("USD")
      // Second call should use cache
      await service.getRate("USD")

      const cacheStatus = service.getCacheStatus()
      expect(cacheStatus["USD"]).toBeDefined()
    })

    it("should clear cache", async () => {
      const service = new CurrencyService({
        noffer: "noffer1test",
        currencySource: "fixed",
        fixedBtcRate: 60000
      })

      await service.getRate("USD")
      service.clearCache()

      const cacheStatus = service.getCacheStatus()
      expect(Object.keys(cacheStatus)).toHaveLength(0)
    })
  })
})

describe("isValidNoffer", () => {
  it("should return true for valid noffer string", () => {
    const validNoffer = "noffer1qvqsyqjqxuurvwpcxc6rvvrxxsurqep5vfjk2wf4v33nsenrxumnyvesxfnrswfkvycrwdp3x93xydf5xg6rzce4vv6xgdfh8quxgct9x5erxvspremhxue69uhhgetnwskhyetvv9ujumrfva58gmnfdenjuur4vgqzpccxc30wpf78wf2q78wg3vq008fd8ygtl4qy06gstpye3h5unc47xmee6z"
    expect(isValidNoffer(validNoffer)).toBe(true)
  })

  it("should return true for short valid noffer", () => {
    expect(isValidNoffer("noffer1qvqsyqjqxu")).toBe(true)
  })

  it("should return false for empty string", () => {
    expect(isValidNoffer("")).toBe(false)
  })

  it("should return false for null/undefined", () => {
    expect(isValidNoffer(null as any)).toBe(false)
    expect(isValidNoffer(undefined as any)).toBe(false)
  })

  it("should return false for wrong prefix", () => {
    expect(isValidNoffer("lnbc1...")).toBe(false)
    expect(isValidNoffer("npub1...")).toBe(false)
  })

  it("should return false for too short string", () => {
    expect(isValidNoffer("noffer1")).toBe(false)
  })

  it("should return false for uppercase characters", () => {
    expect(isValidNoffer("noffer1ABC")).toBe(false)
  })
})

describe("formatSats", () => {
  it("should format as sats by default", () => {
    expect(formatSats(100000)).toBe("100,000 sats")
  })

  it("should format as BTC", () => {
    expect(formatSats(100000, "btc")).toBe("0.00100000")
  })

  it("should format as BTC with symbol", () => {
    expect(formatSats(100000, "btc-symbol")).toBe("\u20BF 0.00100000")
  })

  it("should handle zero", () => {
    expect(formatSats(0)).toBe("0 sats")
  })
})

describe("calculateExpiry", () => {
  it("should calculate future timestamp", () => {
    const now = Math.floor(Date.now() / 1000)
    const expiry = calculateExpiry(3600)
    expect(expiry).toBeGreaterThan(now)
    expect(expiry).toBeLessThanOrEqual(now + 3601)
  })
})

describe("isInvoiceExpired", () => {
  it("should return true for past timestamp", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600
    expect(isInvoiceExpired(pastTimestamp)).toBe(true)
  })

  it("should return false for future timestamp", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600
    expect(isInvoiceExpired(futureTimestamp)).toBe(false)
  })
})
