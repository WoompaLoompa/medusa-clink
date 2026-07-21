declare module "@medusajs/framework/utils" {
  export class AbstractPaymentProvider<TConfig = Record<string, unknown>> {
    protected container_: Record<string, unknown>
    protected config_: TConfig
    constructor(container: Record<string, unknown>, config?: TConfig)
    static get identifier(): string
  }

  export class BigNumber {
    private value_: number
    constructor(value: number | string)
    get value(): number
    toString(): string
    toJSON(): { value: number }
  }

  export const MedusaError: {
    Types: {
      INVALID_DATA: string
      NOT_FOUND: string
      UNAUTHORIZED: string
      INVALID_ARGUMENT: string
    }
  }
}
