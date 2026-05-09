interface ApiErrorResponse {
  status: number
  data?: unknown
}

interface ApiError {
  response?: ApiErrorResponse
  message?: string
  code?: number
  errors?: Array<{ reason?: string; message?: string }>
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null
}

export function getErrorResponse(error: unknown): ApiErrorResponse | undefined {
  if (!isApiError(error)) return undefined
  if ('response' in error) {
    const resp = (error as Record<string, unknown>).response
    if (typeof resp === 'object' && resp !== null) {
      return resp as ApiErrorResponse
    }
  }
  return undefined
}

export function getErrorCode(error: unknown): number | undefined {
  if (!isApiError(error)) return undefined
  return error.code
}

export function getErrorErrors(error: unknown): Array<{ reason?: string; message?: string }> | undefined {
  if (!isApiError(error)) return undefined
  return error.errors
}
