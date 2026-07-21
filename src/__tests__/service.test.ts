/**
 * ClinkPaymentProviderService Unit Tests
 */

import ClinkPaymentProviderService from "../modules/clink/service"
import { CurrencyService } from "../modules/clink/utils"
import {
  ClinkOptions,
  CurrencySource,
  CLINK_DEFAULTS,
  ClinkErrorCode,
  ClinkError
} from "../modules/clink/types"

// Mock @shocknet/clink-sdk
jest.mock("@shocknet/clink-sdk", () => ({
  generateSecretKey: jest.fn().mockReturnValue(new Uint8Array(32).fill(1)),
  decodeBech32: jest.fn().mockReturnValue({
    type: "noffer",
    data: {
      pubkey: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      relay: "wss://relay.example.com",
      offer: "test_offer_string"
    }
  }),
  ClinkSDK: jest.fn().mockImplementation(() => ({
    Noffer: jest.fn().mockResolvedValue({
      bolt11: "lnbc1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    })
  }))
}))

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}

// Mock container
const mockContainer = {
  logger: mockLogger
}

// Valid test options
const validOptions: ClinkOptions = {
  noffer: "noffer1qvqsyqjqxuurvwpcxc6rvvrxxsurqep5vfjk2wf4v33nsenrxumnyvesxfnrswfkvycrwdp3x93xydf5xg6rzce4vv6xgdfh8quxgct9x5erxvspremhxue69uhhgetnwskhyetvv9ujumrfva58gmnfdenjuur4vgqzpccxc30wpf78wf2q78wg3vq008fd8ygtl4qy06gstpye3h5unc47xmee6z",
  currencySource: "coingecko",
  debug: true
}

describe("ClinkPaymentProviderService", () => {
  let service: ClinkPaymentProviderService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ClinkPaymentProviderService(mockContainer, validOptions)
  })

  describe("constructor", () => {
    it("should initialize with valid options", () => {
      expect(service).toBeDefined()
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it("should throw error if noffer is missing", () => {
      expect(() => {
        new ClinkPaymentProviderService(mockContainer, {
          ...validOptions,
          noffer: ""
        })
      }).toThrow("CLINK offer string (noffer) is required")
    })

    it("should throw error if noffer is invalid format", () => {
      expect(() => {
        new ClinkPaymentProviderService(mockContainer, {
          ...validOptions,
          noffer: "invalid_noffer_string"
        })
      }).toThrow("Invalid CLINK offer string format")
    })

    it("should apply default options", () => {
      const service = new ClinkPaymentProviderService(mockContainer, validOptions)
      expect(service).toBeDefined()
    })
  })

  describe("identifier", () => {
    it("should return 'clink'", () => {
      expect(ClinkPaymentProviderService.identifier).toBe("clink")
    })
  })

  describe("initiatePayment", () => {
    it("should require amount and currency_code", async () => {
      await expect(
        service.initiatePayment({})
      ).rejects.toThrow("Amount and currency_code are required")
    })

    it("should require positive amount", async () => {
      await expect(
        service.initiatePayment({
          amount: 0,
          currency_code: "USD"
        })
      ).rejects.toThrow("Amount and currency_code are required")
    })

    it("should initiate payment with valid input", async () => {
      const result = await service.initiatePayment({
        amount: 10,
        currency_code: "USD"
      })

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(result.data.bolt11).toBeDefined()
      expect(result.data.amount_sats).toBeDefined()
      expect(result.data.currency_code).toBe("USD")
      expect(result.data.fiat_amount).toBe(10)
    })

    it("should handle manual currency source", async () => {
      const manualService = new ClinkPaymentProviderService(mockContainer, {
        ...validOptions,
        currencySource: "manual"
      })

      const result = await manualService.initiatePayment({
        amount: 5000,
        currency_code: "SATS"
      })

      expect(result.data.amount_sats).toBe(5000)
    })
  })

  describe("authorizePayment", () => {
    it("should return pending status for unpaid invoice", async () => {
      const result = await service.authorizePayment({
        data: {
          bolt11: "lnbc10...",
          expires_at: Math.floor(Date.now() / 1000) + 3600
        }
      })

      expect(result.status).toBe("pending")
    })

    it("should return error for expired invoice", async () => {
      const result = await service.authorizePayment({
        data: {
          bolt11: "lnbc10...",
          expires_at: Math.floor(Date.now() / 1000) - 3600
        }
      })

      expect(result.status).toBe("error")
    })
  })

  describe("getPaymentStatus", () => {
    it("should return pending for active payment", async () => {
      const result = await service.getPaymentStatus({
        data: {
          bolt11: "lnbc10...",
          expires_at: Math.floor(Date.now() / 1000) + 3600
        }
      })

      expect(result.status).toBe("pending")
    })

    it("should return error for expired payment", async () => {
      const result = await service.getPaymentStatus({
        data: {
          bolt11: "lnbc10...",
          expires_at: Math.floor(Date.now() / 1000) - 3600
        }
      })

      expect(result.status).toBe("error")
    })

    it("should return pending for missing data", async () => {
      const result = await service.getPaymentStatus({})
      expect(result.status).toBe("pending")
    })
  })

  describe("capturePayment", () => {
    it("should capture payment successfully", async () => {
      const result = await service.capturePayment({
        data: {
          bolt11: "lnbc10...",
          amount_sats: 1000
        }
      })

      expect(result.data).toBeDefined()
      expect(result.data.status).toBe("captured")
    })
  })

  describe("cancelPayment", () => {
    it("should cancel payment successfully", async () => {
      const result = await service.cancelPayment({
        data: {
          bolt11: "lnbc10..."
        }
      })

      expect(result.data).toBeDefined()
      expect(result.data.status).toBe("cancelled")
    })
  })

  describe("deletePayment", () => {
    it("should delete payment successfully", async () => {
      const result = await service.deletePayment({
        data: { bolt11: "lnbc10..." }
      })

      expect(result.data).toBeDefined()
    })
  })

  describe("retrievePayment", () => {
    it("should retrieve payment data", async () => {
      const paymentData = { bolt11: "lnbc10...", amount_sats: 1000 }
      const result = await service.retrievePayment({
        data: paymentData
      })

      expect(result.data).toEqual(paymentData)
    })
  })

  describe("refundPayment", () => {
    it("should return manual refund instructions", async () => {
      const result = await service.refundPayment({
        data: { bolt11: "lnbc10...", amount_sats: 1000 }
      })

      expect(result.data).toBeDefined()
      expect((result.data as any).refund_status).toBe("manual_required")
      expect((result.data as any).refund_instructions).toBeDefined()
    })
  })

  describe("getWebhookActionAndData", () => {
    it("should handle paid event", async () => {
      const result = await service.getWebhookActionAndData({
        data: {
          event_type: "paid",
          session_id: "test_123",
          amount: 1000
        },
        rawData: "{}",
        headers: {}
      })

      expect(result.action).toBe("captured")
      expect(result.data.session_id).toBe("test_123")
      expect(result.data.amount).toBe(1000)
    })

    it("should handle expired event", async () => {
      const result = await service.getWebhookActionAndData({
        data: {
          event_type: "expired",
          session_id: "test_123",
          amount: 1000
        },
        rawData: "{}",
        headers: {}
      })

      expect(result.action).toBe("failed")
    })

    it("should handle unknown event type", async () => {
      const result = await service.getWebhookActionAndData({
        data: {
          event_type: "unknown",
          session_id: "test_123"
        },
        rawData: "{}",
        headers: {}
      })

      expect(result.action).toBe("not_supported")
    })
  })
})
