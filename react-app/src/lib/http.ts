import { environment } from './env'

export interface ApiErrorPayload {
  message?: string
  status?: number
  [key: string]: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: ApiErrorPayload | string | null

  constructor(
    message: string,
    status: number,
    payload: ApiErrorPayload | string | null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
  skipUnauthorizedNotification?: boolean
}

type UnauthorizedListener = () => void

const unauthorizedListeners = new Set<UnauthorizedListener>()

export function subscribeToUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener())
}

function resolveUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${environment.apiBaseUrl}${normalizedPath}`
}

async function parseResponse(response: Response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as unknown
  }

  const text = await response.text()
  return text || null
}

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    timeoutMs = 10_000,
    headers,
    skipUnauthorizedNotification = false,
    ...requestOptions
  } = options
  const abortController = new AbortController()
  const timeout = window.setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetch(resolveUrl(path), {
      ...requestOptions,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: abortController.signal,
    })
    const payload = await parseResponse(response)

    if (!response.ok) {
      if (response.status === 401 && !skipUnauthorizedNotification) {
        notifyUnauthorized()
      }

      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as ApiErrorPayload | null)?.message ??
            'Não foi possível concluir a requisição.')

      throw new ApiError(
        message,
        response.status,
        payload as ApiErrorPayload | string | null,
      )
    }

    return payload as T
  } finally {
    window.clearTimeout(timeout)
  }
}
