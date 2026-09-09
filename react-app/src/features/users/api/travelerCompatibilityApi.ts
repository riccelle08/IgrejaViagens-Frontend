import { httpRequest } from '../../../lib/http'
import { stripCpf } from '../../../shared/validation/cpf'
import type { UserMutation } from '../model/userTypes'
import { createUser, deleteUser } from './usersApi'

type ApiRecord = Record<string, unknown>

function records(value: unknown, label: string): ApiRecord[] {
  if (!Array.isArray(value)) throw new Error(`Resposta de ${label} inválida.`)
  return value.filter(
    (item): item is ApiRecord =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  )
}

function readCpf(record: ApiRecord) {
  return stripCpf(
    typeof record.userCpf === 'string'
      ? record.userCpf
      : typeof record.cpf === 'string'
        ? record.cpf
        : '',
  )
}

function readId(value: unknown) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : ''
}

function travelerCpfs(trip: ApiRecord) {
  if (typeof trip.travelersJson !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(trip.travelersJson)
    return Array.isArray(parsed)
      ? parsed
          .filter((cpf): cpf is string => typeof cpf === 'string')
          .map(stripCpf)
          .filter(Boolean)
      : []
  } catch {
    return []
  }
}

function occupants(room: ApiRecord) {
  return Array.isArray(room.occupants)
    ? room.occupants
        .filter((cpf): cpf is string => typeof cpf === 'string')
        .map(stripCpf)
        .filter(Boolean)
    : []
}

function sameTrip(record: ApiRecord, tripId: string) {
  return readId(record.tripId) === tripId
}

async function replace(path: string, items: ApiRecord[]) {
  await httpRequest<unknown>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
}

function findTrip(trips: ApiRecord[], tripId: string) {
  const trip = trips.find((item) => readId(item.id) === tripId)
  if (!trip) throw new Error('Viagem não encontrada.')
  return trip
}

function paymentFor(cpf: string, tripId: string) {
  return {
    id: `${cpf}_${tripId}`,
    userCpf: cpf,
    tripId,
    totalInstallments: 1,
    paidInstallments: 0,
    dueDay: 10,
    locked: false,
    receiptsJson: '{}',
  }
}

/**
 * Compatibilidade com os únicos contratos atuais capazes de alterar membros de
 * uma viagem. As escritas bulk são integrais e não transacionais; devem virar
 * comandos atômicos e autorizados no backend nas Etapas 9/10.
 */
export async function addExistingUserToTrip(cpfValue: string, tripId: string) {
  const cpf = stripCpf(cpfValue)
  const [tripsValue, paymentsValue] = await Promise.all([
    httpRequest<unknown>('/trips'),
    httpRequest<unknown>('/payments'),
  ])
  const trips = records(tripsValue, 'viagens')
  const payments = records(paymentsValue, 'pagamentos')
  const trip = findTrip(trips, tripId)
  const currentCpfs = [...new Set(travelerCpfs(trip))]
  const isAlreadyMember = currentCpfs.includes(cpf)
  const maxPeople = Math.max(1, Number(trip.maxPeople) || 44)

  if (!isAlreadyMember && currentCpfs.length >= maxPeople) {
    throw new Error(
      `A viagem atingiu o limite de ${maxPeople} ${maxPeople === 1 ? 'pessoa' : 'pessoas'}.`,
    )
  }

  if (!isAlreadyMember) {
    const nextTrips = trips.map((item) =>
      item === trip
        ? { ...item, travelersJson: JSON.stringify([...currentCpfs, cpf]) }
        : item,
    )
    await replace('/trips/bulk', nextTrips)
  }

  const hasPayment = payments.some(
    (payment) => sameTrip(payment, tripId) && readCpf(payment) === cpf,
  )
  if (!hasPayment) {
    await replace('/payments/bulk', [...payments, paymentFor(cpf, tripId)])
  }
}

export async function createTravelerForTrip(
  cpf: string,
  mutation: UserMutation,
  tripId: string,
) {
  const createdUser = await createUser(cpf, {
    ...mutation,
    role: 'traveler',
    firstLogin: true,
  })

  try {
    await addExistingUserToTrip(createdUser.cpf, tripId)
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : ''
    throw new Error(
      `O usuário foi criado no cadastro global, mas não foi associado à viagem.${reason}`,
      { cause: error },
    )
  }

  return createdUser
}

async function loadAssociationCollections() {
  const [trips, payments, seats, rooms] = await Promise.all([
    httpRequest<unknown>('/trips'),
    httpRequest<unknown>('/payments'),
    httpRequest<unknown>('/seats'),
    httpRequest<unknown>('/rooms'),
  ])
  return {
    trips: records(trips, 'viagens'),
    payments: records(payments, 'pagamentos'),
    seats: records(seats, 'assentos'),
    rooms: records(rooms, 'quartos'),
  }
}

function withoutTravelerFromTrips(trips: ApiRecord[], cpf: string, tripId?: string) {
  return trips.map((trip) => {
    if (tripId && readId(trip.id) !== tripId) return trip
    return {
      ...trip,
      travelersJson: JSON.stringify(
        travelerCpfs(trip).filter((travelerCpf) => travelerCpf !== cpf),
      ),
    }
  })
}

function withoutTravelerFromRooms(rooms: ApiRecord[], cpf: string, tripId?: string) {
  return rooms.map((room) => {
    if (tripId && !sameTrip(room, tripId)) return room
    return {
      ...room,
      occupants: occupants(room).filter((occupantCpf) => occupantCpf !== cpf),
    }
  })
}

export async function removeTravelerFromTrip(cpfValue: string, tripId: string) {
  const cpf = stripCpf(cpfValue)
  const collections = await loadAssociationCollections()

  await replace(
    '/trips/bulk',
    withoutTravelerFromTrips(collections.trips, cpf, tripId),
  )
  await Promise.all([
    replace(
      '/payments/bulk',
      collections.payments.filter(
        (payment) => !(sameTrip(payment, tripId) && readCpf(payment) === cpf),
      ),
    ),
    replace(
      '/seats/bulk',
      collections.seats.filter(
        (seat) => !(sameTrip(seat, tripId) && readCpf(seat) === cpf),
      ),
    ),
    replace(
      '/rooms/bulk',
      withoutTravelerFromRooms(collections.rooms, cpf, tripId),
    ),
  ])
}

export async function deleteUserGlobally(cpfValue: string) {
  const cpf = stripCpf(cpfValue)
  const collections = await loadAssociationCollections()

  await Promise.all([
    replace('/trips/bulk', withoutTravelerFromTrips(collections.trips, cpf)),
    replace(
      '/payments/bulk',
      collections.payments.filter((payment) => readCpf(payment) !== cpf),
    ),
    replace(
      '/seats/bulk',
      collections.seats.filter((seat) => readCpf(seat) !== cpf),
    ),
    replace(
      '/rooms/bulk',
      withoutTravelerFromRooms(collections.rooms, cpf),
    ),
  ])
  await deleteUser(cpf)
}
