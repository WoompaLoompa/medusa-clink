/**
 * Mock for @medusajs/framework/utils
 * Used for testing without full Medusa dependency
 */

export class AbstractPaymentProvider {
  protected container_: Record<string, unknown>
  protected config_: Record<string, unknown>

  constructor(container: Record<string, unknown>, config?: Record<string, unknown>) {
    this.container_ = container
    this.config_ = config || {}
  }

  static get identifier(): string {
    return "abstract"
  }
}

export class BigNumber {
  private value_: number

  constructor(value: number | string) {
    this.value_ = typeof value === "string" ? parseFloat(value) : value
  }

  get value(): number {
    return this.value_
  }

  toString(): string {
    return this.value_.toString()
  }

  toJSON(): { value: number } {
    return { value: this.value_ }
  }
}

export const MedusaError = {
  Types: {
    INVALID_DATA: "invalid_data",
    NOT_FOUND: "not_found",
    UNAUTHORIZED: "unauthorized",
    INVALID_ARGUMENT: "invalid_argument"
  }
}
