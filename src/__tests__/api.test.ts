/**
 * CLINK API Routes Tests
 * 
 * Tests for the admin settings and storefront payment session APIs.
 */

import { GET, POST, DELETE } from "../api/admin/clink/settings/route"
import { POST as storePost } from "../api/clink/store/payment-session/route"

// Mock MedusaRequest and MedusaResponse
const createMockRequest = (body: any = {}, params: any = {}): any => ({
  body,
  params,
  headers: {}
})

const createMockResponse = (): any => {
  const res: any = {
    statusCode: 200,
    body: null
  }
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (data: any) => {
    res.body = data
    return res
  }
  return res
}

describe("Admin Clink Settings API", () => {
  describe("GET /admin/clink/settings", () => {
    it("should return default settings", async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      await GET(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("settings")
      expect(res.body.settings).toHaveProperty("noffer", "")
      expect(res.body.settings).toHaveProperty("currencySource", "coingecko")
    })
  })

  describe("POST /admin/clink/settings", () => {
    it("should save valid settings", async () => {
      const settings = {
        noffer: "noffer1qvqsyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyq",
        currencySource: "coingecko",
        fixedBtcRate: null,
        invoiceTimeout: 600,
        enableSubscriptions: false,
        refundContactEmail: "",
        refundContactNostr: "",
        debug: false
      }

      const req = createMockRequest(settings)
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("success", true)
      expect(res.body).toHaveProperty("settings")
    })

    it("should reject settings without noffer", async () => {
      const settings = {
        currencySource: "coingecko",
        fixedBtcRate: null,
        invoiceTimeout: 600,
        enableSubscriptions: false,
        refundContactEmail: "",
        refundContactNostr: "",
        debug: false
      }

      const req = createMockRequest(settings)
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("noffer")
    })

    it("should reject invalid noffer format", async () => {
      const settings = {
        noffer: "invalid_noffer",
        currencySource: "coingecko",
        fixedBtcRate: null,
        invoiceTimeout: 600,
        enableSubscriptions: false,
        refundContactEmail: "",
        refundContactNostr: "",
        debug: false
      }

      const req = createMockRequest(settings)
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("noffer1")
    })

    it("should reject fixed rate when currency source is fixed", async () => {
      const settings = {
        noffer: "noffer1qvqsyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyq",
        currencySource: "fixed",
        fixedBtcRate: null,
        invoiceTimeout: 600,
        enableSubscriptions: false,
        refundContactEmail: "",
        refundContactNostr: "",
        debug: false
      }

      const req = createMockRequest(settings)
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Fixed BTC rate")
    })

    it("should reject invalid invoice timeout", async () => {
      const settings = {
        noffer: "noffer1qvqsyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyqyq",
        currencySource: "coingecko",
        fixedBtcRate: null,
        invoiceTimeout: 30, // Too low
        enableSubscriptions: false,
        refundContactEmail: "",
        refundContactNostr: "",
        debug: false
      }

      const req = createMockRequest(settings)
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Invoice timeout")
    })
  })

  describe("DELETE /admin/clink/settings", () => {
    it("should reset settings to defaults", async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      await DELETE(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("success", true)
      expect(res.body.settings).toHaveProperty("noffer", "")
      expect(res.body.settings).toHaveProperty("currencySource", "coingecko")
    })
  })
})

describe("Storefront Payment Session API", () => {
  describe("POST /clink/store/payment-session", () => {
    it("should create a payment session", async () => {
      const req = createMockRequest({
        amount: 10,
        currency_code: "USD"
      })
      const res = createMockResponse()

      await storePost(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("bolt11")
      expect(res.body).toHaveProperty("amount_sats")
      expect(res.body).toHaveProperty("fiat_amount", 10)
      expect(res.body).toHaveProperty("currency_code", "USD")
      expect(res.body).toHaveProperty("expires_at")
      expect(res.body).toHaveProperty("payment_id")
    })

    it("should reject invalid amount", async () => {
      const req = createMockRequest({
        amount: -10,
        currency_code: "USD"
      })
      const res = createMockResponse()

      await storePost(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("greater than 0")
    })

    it("should reject missing currency code", async () => {
      const req = createMockRequest({
        amount: 10
      })
      const res = createMockResponse()

      await storePost(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("currency_code")
    })

    it("should reject missing amount", async () => {
      const req = createMockRequest({
        currency_code: "USD"
      })
      const res = createMockResponse()

      await storePost(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Amount")
    })
  })
})
