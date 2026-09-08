import { httpRequest } from '../../../lib/http'
import type { Trip } from '../model/tripTypes'
import { replaceTrips } from './tripApi'

type LegacyCollection = Record<string, unknown>[]

function parseCollection(value: unknown, name: string): LegacyCollection {
  if (!Array.isArray(value)) {
    throw new Error(`Resposta de ${name} inválida.`)
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  )
}

function belongsToTrip(item: Record<string, unknown>, tripId: string) {
  return typeof item.tripId === 'string' && item.tripId === tripId
}

async function replaceCollection(path: string, items: LegacyCollection) {
  await httpRequest<unknown>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
}

/**
 * Compatibilidade temporária com a API bulk legada. A exclusão não é atômica:
 * a transação deve ser movida para o backend na Etapa 9/10.
 */
export async function deleteTripWithCompatibility(
  trips: Trip[],
  tripId: string,
) {
  const [paymentsValue, seatsValue, roomsValue] = await Promise.all([
    httpRequest<unknown>('/payments'),
    httpRequest<unknown>('/seats'),
    httpRequest<unknown>('/rooms'),
  ])

  const payments = parseCollection(paymentsValue, 'pagamentos')
  const seats = parseCollection(seatsValue, 'assentos')
  const rooms = parseCollection(roomsValue, 'quartos')

  await Promise.all([
    replaceCollection(
      '/payments/bulk',
      payments.filter((payment) => !belongsToTrip(payment, tripId)),
    ),
    replaceCollection(
      '/seats/bulk',
      seats.filter((seat) => !belongsToTrip(seat, tripId)),
    ),
    replaceCollection(
      '/rooms/bulk',
      rooms.filter((room) => !belongsToTrip(room, tripId)),
    ),
  ])

  return replaceTrips(trips.filter((trip) => trip.id !== tripId))
}
