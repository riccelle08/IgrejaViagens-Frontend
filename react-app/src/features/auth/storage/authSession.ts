import type { AuthUser } from '../model/authTypes'

const SESSION_KEY = 'igreja-viagens:auth-session'

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const user = value as Record<string, unknown>
  return (
    typeof user.cpf === 'string' &&
    typeof user.name === 'string' &&
    (user.role === 'admin' || user.role === 'traveler') &&
    typeof user.birthdate === 'string' &&
    typeof user.firstLogin === 'boolean' &&
    typeof user.married === 'boolean' &&
    typeof user.spouseName === 'string' &&
    typeof user.hasKids === 'boolean' &&
    Array.isArray(user.kids) &&
    user.kids.every((kid) => typeof kid === 'string')
  )
}

function serializeUser(user: AuthUser) {
  return {
    cpf: user.cpf,
    name: user.name,
    role: user.role,
    birthdate: user.birthdate,
    firstLogin: user.firstLogin,
    married: user.married,
    spouseName: user.spouseName,
    hasKids: user.hasKids,
    kids: [...user.kids],
  }
}

export function readAuthSession(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const parsed: unknown = JSON.parse(stored)
    if (!isAuthUser(parsed) || parsed.firstLogin) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }

    return serializeUser(parsed)
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function writeAuthSession(user: AuthUser) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(serializeUser(user)))
}

export function clearAuthSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
