import { httpRequest } from '../../../lib/http'
import { stripCpf } from '../../../shared/validation/cpf'
import type { TripSummary } from '../model/tripTypes'

function parseTravelerCpfs(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((cpf): cpf is string => typeof cpf === 'string')
      .map(stripCpf)
      .filter(Boolean)
  } catch {
    return []
  }
}

function toTripSummary(value: unknown): TripSummary | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  const trip = value as Record<string, unknown>
  if (typeof trip.id !== 'string' || !trip.id.trim()) return null

  return {
    id: trip.id,
    name:
      typeof trip.name === 'string' && trip.name.trim()
        ? trip.name
        : 'Viagem sem nome',
    destination:
      typeof trip.destination === 'string' ? trip.destination : '',
    date: typeof trip.date === 'string' ? trip.date : '',
    travelerCpfs: parseTravelerCpfs(trip.travelersJson),
  }
}

export async function listTrips() {
  const response = await httpRequest<unknown>('/trips')
  if (!Array.isArray(response)) {
    throw new Error('Resposta de viagens inválida.')
  }

  return response
    .map(toTripSummary)
    .filter((trip): trip is TripSummary => trip !== null)
}
