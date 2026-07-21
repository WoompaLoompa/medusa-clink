/**
 * CLINK Subscription API Routes
 * 
 * Handles subscription creation, management, and payment processing.
 * Delegates to SubscriptionService for business logic.
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SubscriptionService } from "../../../modules/clink/subscription"
import type { ClinkOptions, SubscriptionInterval } from "../../../modules/clink/types"

/**
 * Default CLINK options (in production, resolved from Medusa config)
 */
const DEFAULT_OPTIONS: ClinkOptions = {
  noffer: "",
  currencySource: "coingecko",
  invoiceTimeout: 600,
  enableSubscriptions: true,
  debug: false
}

const VALID_INTERVALS: SubscriptionInterval[] = ["daily", "weekly", "monthly", "yearly"]

/**
 * Get or create a SubscriptionService instance
 * In production, this would be resolved from Medusa's container
 */
function getSubscriptionService(): SubscriptionService {
  return new SubscriptionService(
    { logger: console },
    DEFAULT_OPTIONS
  )
}

/**
 * POST /clink/subscriptions
 * 
 * Create a new subscription
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const service = getSubscriptionService()

    const {
      customer_id,
      amount_sats,
      currency_code,
      interval,
      debit_pointer,
      max_payments,
      metadata
    } = req.body

    // Validate required fields
    if (!customer_id) {
      res.status(400).json({ error: "customer_id is required" })
      return
    }

    if (!amount_sats || amount_sats <= 0) {
      res.status(400).json({ error: "amount_sats must be greater than 0" })
      return
    }

    if (!currency_code) {
      res.status(400).json({ error: "currency_code is required" })
      return
    }

    if (!interval) {
      res.status(400).json({ 
        error: "interval must be one of: daily, weekly, monthly, yearly" 
      })
      return
    }

    if (!VALID_INTERVALS.includes(interval)) {
      res.status(400).json({ 
        error: `interval must be one of: ${VALID_INTERVALS.join(", ")}` 
      })
      return
    }

    if (!debit_pointer) {
      res.status(400).json({ error: "debit_pointer is required" })
      return
    }

    if (!debit_pointer.startsWith("ndebit1")) {
      res.status(400).json({ 
        error: "Invalid debit_pointer format. Must start with ndebit1" 
      })
      return
    }

    // Delegate to service
    const subscription = await service.createSubscription({
      customer_id,
      amount_sats,
      currency_code,
      interval,
      debit_pointer,
      max_payments,
      metadata
    })

    console.log(`[ClinkSubscriptions] Subscription created: ${subscription.id}`)

    res.status(201).json({ subscription })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create subscription"
    console.error(`[ClinkSubscriptions] Error creating subscription: ${message}`)
    res.status(400).json({ error: message })
  }
}

/**
 * GET /clink/subscriptions/:id
 * 
 * Get subscription by ID
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ error: "Subscription ID is required" })
      return
    }

    const service = getSubscriptionService()
    const subscription = await service.getSubscription(id)

    if (!subscription) {
      res.status(404).json({ error: "Subscription not found" })
      return
    }

    res.status(200).json({ subscription })
  } catch (error) {
    console.error("[ClinkSubscriptions] Error fetching subscription:", error)
    res.status(500).json({ error: "Failed to fetch subscription" })
  }
}

/**
 * PATCH /clink/subscriptions/:id/cancel
 * 
 * Cancel a subscription
 */
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const { at_period_end = true } = req.body as { at_period_end?: boolean }

    if (!id) {
      res.status(400).json({ error: "Subscription ID is required" })
      return
    }

    const service = getSubscriptionService()
    const subscription = await service.cancelSubscription({
      subscription_id: id,
      at_period_end
    })

    if (!subscription) {
      res.status(404).json({ error: "Subscription not found" })
      return
    }

    if (subscription.status === "cancelled") {
      console.log(`[ClinkSubscriptions] Subscription ${id} cancelled immediately`)
    } else {
      console.log(`[ClinkSubscriptions] Subscription ${id} scheduled for cancellation at period end`)
    }

    res.status(200).json({ subscription })
  } catch (error) {
    console.error("[ClinkSubscriptions] Error cancelling subscription:", error)
    res.status(500).json({ error: "Failed to cancel subscription" })
  }
}

/**
 * DELETE /clink/subscriptions/:id
 * 
 * Delete a subscription (admin only)
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ error: "Subscription ID is required" })
      return
    }

    const service = getSubscriptionService()
    const subscription = await service.getSubscription(id)

    if (!subscription) {
      res.status(404).json({ error: "Subscription not found" })
      return
    }

    // Cancel immediately before deleting
    await service.cancelSubscription({
      subscription_id: id,
      at_period_end: false
    })

    console.log(`[ClinkSubscriptions] Subscription ${id} deleted`)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("[ClinkSubscriptions] Error deleting subscription:", error)
    res.status(500).json({ error: "Failed to delete subscription" })
  }
}
