import { httpRequest } from '../../../lib/http'
import { stripCpf } from '../../../shared/validation/cpf'
import type { UserRole } from '../../auth/model/authTypes'
import type { SystemUser, UserMutation } from '../model/userTypes'

function records(value: unknown, label: string) {
  if (!Array.isArray(value)) throw new Error(`Resposta de ${label} inválida.`)
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  )
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
    ? value
        .filter((kid): kid is string => typeof kid === 'string')
        .map((kid) => kid.trim())
        .filter(Boolean)
    : []
}

export function toSystemUser(value: unknown): SystemUser | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  const source = value as Record<string, unknown>
  const cpf = stripCpf(readString(source.cpf))
  if (!cpf) return null

  // A lista explícita impede que password e outros campos sensíveis do
  // contrato legado entrem no estado React.
  return {
    birthdate: readString(source.birthdate),
    cpf,
    firstLogin: source.firstLogin === true,
    hasKids: source.hasKids === true,
    kids: readKids(source.kids),
    married: source.married === true,
    name: readString(source.name, 'Usuário sem nome'),
    role: readRole(source.role),
    spouseName: readString(source.spouseName),
  }
}

function mutationToApi(cpf: string, mutation: UserMutation) {
  return {
    cpf,
    name: mutation.name.trim(),
    role: mutation.role,
    birthdate: mutation.birthdate,
    firstLogin: mutation.firstLogin,
    married: mutation.married,
    spouseName: mutation.married ? mutation.spouseName.trim() : '',
    hasKids: mutation.hasKids,
    kids: mutation.hasKids
      ? mutation.kids.map((kid) => kid.trim()).filter(Boolean)
      : [],
  }
}

export async function listUsers() {
  const response = await httpRequest<unknown>('/users')
  return records(response, 'usuários')
    .map(toSystemUser)
    .filter((user): user is SystemUser => user !== null)
}

export async function createUser(cpfValue: string, mutation: UserMutation) {
  const cpf = stripCpf(cpfValue)
  const response = await httpRequest<unknown>('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...mutationToApi(cpf, mutation),
      // Compatibilidade obrigatória com o login legado. A senha inicial não
      // atravessa componentes, estado, storage, mensagens ou logs.
      password: 'acess@123',
    }),
  })
  const user = toSystemUser(response)
  if (!user) throw new Error('Resposta de usuário inválida.')
  return user
}

export async function updateUser(cpfValue: string, mutation: UserMutation) {
  const cpf = stripCpf(cpfValue)
  const currentUsers = records(
    await httpRequest<unknown>('/users'),
    'usuários',
  )
  const current = currentUsers.find(
    (user) => stripCpf(readString(user.cpf)) === cpf,
  )
  if (!current) throw new Error('Usuário não encontrado.')

  const response = await httpRequest<unknown>(
    `/users/${encodeURIComponent(cpf)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      // O merge ocorre somente nesta função e preserva campos que o formulário
      // desconhece, inclusive credenciais que o backend exige no PUT integral.
      body: JSON.stringify({ ...current, ...mutationToApi(cpf, mutation) }),
    },
  )
  const user = toSystemUser(response)
  if (!user) throw new Error('Resposta de usuário inválida.')
  return user
}

export async function deleteUser(cpfValue: string) {
  const cpf = stripCpf(cpfValue)
  await httpRequest<unknown>(`/users/${encodeURIComponent(cpf)}`, {
    method: 'DELETE',
  })
}
