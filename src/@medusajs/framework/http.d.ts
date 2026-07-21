declare module "@medusajs/framework/http" {
  export interface MedusaRequest {
    body: any
    params: Record<string, string>
    headers: Record<string, string | string[] | undefined>
    scope: {
      resolve: (name: string) => any
    }
  }

  export interface MedusaResponse {
    status: (code: number) => MedusaResponse
    json: (data: any) => void
  }
}
