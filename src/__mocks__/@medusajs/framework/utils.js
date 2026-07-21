/**
 * Mock for @medusajs/framework/utils
 */

class AbstractPaymentProvider {
  constructor(container, config) {
    this.container_ = container
    this.config_ = config || {}
  }

  static get identifier() {
    return "abstract"
  }
}

class BigNumber {
  constructor(value) {
    this.value_ = typeof value === "string" ? parseFloat(value) : value
  }

  get value() {
    return this.value_
  }

  toString() {
    return this.value_.toString()
  }

  toJSON() {
    return { value: this.value_ }
  }
}

const MedusaError = {
  Types: {
    INVALID_DATA: "invalid_data",
    NOT_FOUND: "not_found",
    UNAUTHORIZED: "unauthorized",
    INVALID_ARGUMENT: "invalid_argument"
  }
}

module.exports = {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError
}
