import type { ApiErrorCode } from '../../../shared/types/tmdb.ts'

/** A failure with a stable code the client can branch on. Messages never contain credentials. */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly statusCode: number
  readonly retryAfterSeconds: number | null

  constructor(code: ApiErrorCode, message: string, statusCode: number, retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.retryAfterSeconds = retryAfterSeconds
  }
}
