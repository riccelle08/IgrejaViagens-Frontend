import { httpRequest } from '../../../lib/http'
import { stripCpf } from '../../../shared/validation/cpf'
import type { AuthUser, LoginCredentials, UserRole } from '../model/authTypes'

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Resposta de login inválida.')
  }

  return value as Record<string, unknown>
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function readRole(value: unknown): UserRole {
  return typeof value === 'string' && value.toLowerCase() === 'admin'
    ? 'admin'
    : 'traveler'
}

function readKids(value: unknown) {
  return Array.isArray(value)
    ? value.filter((kid): kid is string => typeof kid === 'string')
    : []
}

function toAuthUser(payload: unknown, requestedCpf: string): AuthUser {
  const user = asRecord(payload)
  const responseCpf = stripCpf(readString(user.cpf))

  return {
    cpf: responseCpf || requestedCpf,
    name: readString(user.name, 'Usuário'),
    role: readRole(user.role),
    birthdate: readString(user.birthdate),
    firstLogin: user.firstLogin === true,
    married: user.married === true,
    spouseName: readString(user.spouseName),
    hasKids: user.hasKids === true,
    kids: readKids(user.kids),
  }
}

export async function login(credentials: LoginCredentials) {
  const cpf = stripCpf(credentials.cpf)
  const response = await httpRequest<unknown>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf, password: credentials.password }),
  })

  // O backend legado devolve a senha. A lista permitida acima a descarta.
  return toAuthUser(response, cpf)
}

export async function completeFirstAccess(
  user: AuthUser,
  newPassword: string,
) {
  const cpf = stripCpf(user.cpf)

  await httpRequest<unknown>(`/users/${encodeURIComponent(cpf)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cpf,
      name: user.name,
      password: newPassword,
      role: user.role,
      birthdate: user.birthdate,
      firstLogin: false,
      married: user.married,
      spouseName: user.spouseName,
      hasKids: user.hasKids,
      kids: user.kids,
    }),
  })

  return { ...user, cpf, firstLogin: false }
}
