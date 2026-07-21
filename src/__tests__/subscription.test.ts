/**
 * CLINK Subscription Tests
 * 
 * Tests for the subscription service and API routes.
 */

import { SubscriptionService } from "../modules/clink/subscription"
import { POST, GET, PATCH, DELETE } from "../api/clink/subscriptions/route"

// Mock @shocknet/clink-sdk
jest.mock("@shocknet/clink-sdk", () => ({
  generateSecretKey: jest.fn().mockReturnValue(new Uint8Array(32).fill(1)),
  ClinkSDK: jest.fn().mockImplementation(() => ({
    Debit: jest.fn().mockResolvedValue({
      res: "ok",
      preimage: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }),
    Noffer: jest.fn().mockResolvedValue({
      bolt11: "lnbc1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    })
  }))
}))

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Mock container
const mockContainer = {
  logger: mockLogger
}

// Test options
const testOptions = {
  noffer: "noffer1qvqsyqjqxuurvwpcxc6rvvrxxsurqep5vfjk2wf4v33nsenrxumnyvesxfnrswfkvycrwdp3x93xydf5xg6rzce4vv6xgdfh8quxgct9x5erxvspremhxue69uhhgetnwskhyetvv9ujumrfva58gmnfdenjuur4vgqzpccxc30wpf78wf2q78wg3vq008fd8ygtl4qy06gstpye3h5unc47xmee6z",
  currencySource: "coingecko" as const,
  debug: true
}

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

describe("SubscriptionService", () => {
  let service: SubscriptionService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SubscriptionService(mockContainer, testOptions)
    // Clear the in-memory store before each test
    service.clearAllSubscriptions()
  })

  describe("createSubscription", () => {
    it("should create a subscription with valid input", async () => {
      const result = await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      expect(result).toBeDefined()
      expect(result.id).toMatch(/^sub_/)
      expect(result.customer_id).toBe("cust_123")
      expect(result.amount_sats).toBe(1000)
      expect(result.status).toBe("active")
      expect(result.payment_count).toBe(0)
    })

    it("should reject invalid debit pointer", async () => {
      await expect(
        service.createSubscription({
          customer_id: "cust_123",
          amount_sats: 1000,
          currency_code: "USD",
          interval: "monthly",
          debit_pointer: "invalid_pointer"
        })
      ).rejects.toThrow("Invalid debit pointer format")
    })

    it("should reject zero amount", async () => {
      await expect(
        service.createSubscription({
          customer_id: "cust_123",
          amount_sats: 0,
          currency_code: "USD",
          interval: "monthly",
          debit_pointer: "ndebit1test123"
        })
      ).rejects.toThrow("Amount must be greater than 0")
    })

    it("should reject missing customer_id", async () => {
      await expect(
        service.createSubscription({
          customer_id: "",
          amount_sats: 1000,
          currency_code: "USD",
          interval: "monthly",
          debit_pointer: "ndebit1test123"
        })
      ).rejects.toThrow("Customer ID is required")
    })
  })

  describe("processPayment", () => {
    it("should process payment for active subscription", async () => {
      // Create subscription first
      const subscription = await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      const result = await service.processPayment(subscription.id)

      expect(result.success).toBe(true)
      expect(result.preimage).toBeDefined()
      expect(result.attempted_at).toBeDefined()
    })

    it("should fail for non-existent subscription", async () => {
      const result = await service.processPayment("sub_nonexistent")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Subscription not found")
    })

    it("should fail for cancelled subscription", async () => {
      // Create and cancel subscription
      const subscription = await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      await service.cancelSubscription({
        subscription_id: subscription.id,
        at_period_end: false
      })

      const result = await service.processPayment(subscription.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain("cancelled")
    })
  })

  describe("cancelSubscription", () => {
    it("should cancel subscription immediately", async () => {
      const subscription = await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      const result = await service.cancelSubscription({
        subscription_id: subscription.id,
        at_period_end: false
      })

      expect(result).toBeDefined()
      expect(result!.status).toBe("cancelled")
    })

    it("should schedule cancellation at period end", async () => {
      const subscription = await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      const result = await service.cancelSubscription({
        subscription_id: subscription.id,
        at_period_end: true
      })

      expect(result).toBeDefined()
      expect(result!.cancel_at_period_end).toBe(true)
      expect(result!.status).toBe("active") // Still active until period end
    })

    it("should return null for non-existent subscription", async () => {
      const result = await service.cancelSubscription({
        subscription_id: "sub_nonexistent"
      })

      expect(result).toBeNull()
    })
  })

  describe("getSubscription", () => {
    it("should get subscription by ID", async () => {
      const created = await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      const result = await service.getSubscription(created.id)

      expect(result).toBeDefined()
      expect(result!.id).toBe(created.id)
    })

    it("should return null for non-existent subscription", async () => {
      const result = await service.getSubscription("sub_nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("getCustomerSubscriptions", () => {
    it("should get all subscriptions for a customer", async () => {
      // Create multiple subscriptions
      await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })

      await service.createSubscription({
        customer_id: "cust_123",
        amount_sats: 2000,
        currency_code: "USD",
        interval: "yearly",
        debit_pointer: "ndebit1test456"
      })

      const result = await service.getCustomerSubscriptions("cust_123")

      expect(result).toHaveLength(2)
      expect(result.every(sub => sub.customer_id === "cust_123")).toBe(true)
    })

    it("should return empty array for customer with no subscriptions", async () => {
      const result = await service.getCustomerSubscriptions("cust_nobody")

      expect(result).toHaveLength(0)
    })
  })
})

describe("Subscription API Routes", () => {
  describe("POST /clink/subscriptions", () => {
    it("should create a subscription", async () => {
      const req = createMockRequest({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty("subscription")
      expect(res.body.subscription).toHaveProperty("id")
      expect(res.body.subscription.status).toBe("active")
    })

    it("should reject invalid interval", async () => {
      const req = createMockRequest({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "invalid",
        debit_pointer: "ndebit1test123"
      })
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toContain("interval")
    })

    it("should reject invalid debit pointer", async () => {
      const req = createMockRequest({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "invalid"
      })
      const res = createMockResponse()

      await POST(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toContain("debit_pointer")
    })
  })

  describe("GET /clink/subscriptions/:id", () => {
    it("should get subscription by ID", async () => {
      // First create a subscription
      const createReq = createMockRequest({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })
      const createRes = createMockResponse()
      await POST(createReq, createRes)

      const subscriptionId = createRes.body.subscription.id

      // Now fetch it
      const getReq = createMockRequest({}, { id: subscriptionId })
      const getRes = createMockResponse()
      await GET(getReq, getRes)

      expect(getRes.statusCode).toBe(200)
      expect(getRes.body.subscription.id).toBe(subscriptionId)
    })

    it("should return 404 for non-existent subscription", async () => {
      const req = createMockRequest({}, { id: "sub_nonexistent" })
      const res = createMockResponse()

      await GET(req, res)

      expect(res.statusCode).toBe(404)
    })
  })

  describe("PATCH /clink/subscriptions/:id/cancel", () => {
    it("should cancel subscription", async () => {
      // First create a subscription
      const createReq = createMockRequest({
        customer_id: "cust_123",
        amount_sats: 1000,
        currency_code: "USD",
        interval: "monthly",
        debit_pointer: "ndebit1test123"
      })
      const createRes = createMockResponse()
      await POST(createReq, createRes)

      const subscriptionId = createRes.body.subscription.id

      // Now cancel it
      const cancelReq = createMockRequest(
        { at_period_end: false },
        { id: subscriptionId }
      )
      const cancelRes = createMockResponse()
      await PATCH(cancelReq, cancelRes)

      expect(cancelRes.statusCode).toBe(200)
      expect(cancelRes.body.subscription.status).toBe("cancelled")
    })
  })
})
