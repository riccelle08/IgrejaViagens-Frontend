import { httpRequest } from '../../../lib/http'
import { stripCpf } from '../../../shared/validation/cpf'
import type { BusConfig } from '../../trips/model/tripTypes'
import { listUsers } from '../../users/api/usersApi'
import type {
  HotelConfig,
  HotelSource,
  RoomRecord,
  SeatRecord,
  TransportSource,
} from '../model/operationTypes'

type ApiRecord = Record<string, unknown>

function records(value: unknown, label: string): ApiRecord[] {
  if (!Array.isArray(value)) throw new Error(`Resposta de ${label} inválida.`)
  return value.filter(
    (item): item is ApiRecord =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  )
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback
}

function readNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseOccupants(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(
        value
          .filter((item): item is string => typeof item === 'string')
          .map(stripCpf)
          .filter(Boolean),
      )]
    : []
}

export function toRoom(value: unknown, index = 0): RoomRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const source = value as ApiRecord
  const tripId = readString(source.tripId)
  if (!tripId) return null
  const id = readString(source.id, `room_missing_id_${index + 1}`)
  return {
    capacity: Math.max(0, Math.trunc(readNumber(source.capacity))),
    hotelId: readString(source.hotelId),
    id,
    name: readString(source.name, id),
    occupants: parseOccupants(source.occupants),
    tripId,
    type: readString(source.type, 'custom'),
  }
}

export function toSeat(value: unknown, index = 0): SeatRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const source = value as ApiRecord
  const tripId = readString(source.tripId)
  const busId = readString(source.busId)
  if (!tripId || !busId) return null
  return {
    busId,
    floor: Math.trunc(readNumber(source.floor)),
    id: readString(source.id, `seat_missing_id_${index + 1}`),
    seatNumber: Math.trunc(readNumber(source.seatNumber)),
    tripId,
    userCpf: stripCpf(readString(source.userCpf, readString(source.cpf))),
  }
}

async function putCollection(path: string, items: ApiRecord[], label: string) {
  const response = await httpRequest<unknown>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
  return records(response, label)
}

async function updateTripArray(
  tripId: string,
  field: 'busesJson' | 'hotelsJson',
  value: BusConfig[] | HotelConfig[],
) {
  const current = records(await httpRequest<unknown>('/trips'), 'viagens')
  const targetIndex = current.findIndex((trip) => trip.id === tripId)
  if (targetIndex < 0) throw new Error('Viagem não encontrada.')
  const next = [...current]
  next[targetIndex] = {
    ...current[targetIndex],
    [field]: JSON.stringify(value),
  }
  const persisted = await putCollection('/trips/bulk', next, 'viagens persistidas')
  const saved = persisted.find((trip) => trip.id === tripId)
  if (!saved || typeof saved[field] !== 'string') {
    throw new Error('O backend não confirmou a atualização da viagem.')
  }
  try {
    const parsed: unknown = JSON.parse(saved[field])
    if (!Array.isArray(parsed)) throw new Error()
    if (JSON.stringify(parsed) !== JSON.stringify(value)) {
      throw new Error()
    }
  } catch {
    throw new Error('O backend não confirmou a configuração solicitada.')
  }
}

export function saveHotelStructure(tripId: string, hotels: HotelConfig[]) {
  return updateTripArray(tripId, 'hotelsJson', hotels)
}

export function saveBusStructure(tripId: string, buses: BusConfig[]) {
  return updateTripArray(tripId, 'busesJson', buses)
}

export async function loadHotelSource(tripId: string): Promise<HotelSource> {
  const [roomsValue, users] = await Promise.all([
    httpRequest<unknown>('/rooms'),
    listUsers(),
  ])
  const rooms = records(roomsValue, 'quartos')
    .map(toRoom)
    .filter((room): room is RoomRecord => room !== null && room.tripId === tripId)
  return { rooms, users }
}

export async function saveRoomRecord(room: RoomRecord) {
  const current = records(await httpRequest<unknown>('/rooms'), 'quartos')
  const targetIndex = current.findIndex((item) => readString(item.id) === room.id)
  if (
    targetIndex >= 0 &&
    readString(current[targetIndex].tripId) !== room.tripId
  ) {
    throw new Error('Este ID de quarto já pertence a outra viagem.')
  }
  const next = [...current]
  const normalized = {
    capacity: Math.max(1, Math.trunc(room.capacity) || 1),
    hotelId: room.hotelId,
    id: room.id,
    name: room.name,
    occupants: [...new Set(room.occupants.map(stripCpf).filter(Boolean))],
    tripId: room.tripId,
    type: room.type,
  }
  if (targetIndex >= 0) {
    next[targetIndex] = { ...current[targetIndex], ...normalized }
  } else {
    next.push(normalized)
  }
  const persisted = await putCollection('/rooms/bulk', next, 'quartos persistidos')
  const saved = persisted.map(toRoom).find((item) => item?.id === room.id)
  if (
    !saved ||
    saved.tripId !== normalized.tripId ||
    saved.hotelId !== normalized.hotelId ||
    saved.name !== normalized.name ||
    saved.type !== normalized.type ||
    saved.capacity !== normalized.capacity ||
    JSON.stringify([...saved.occupants].sort()) !==
      JSON.stringify([...normalized.occupants].sort())
  ) {
    throw new Error('O backend não confirmou o quarto persistido.')
  }
  return saved
}

export async function deleteRoomRecords(tripId: string, roomIds: string[]) {
  const targets = new Set(roomIds)
  const current = records(await httpRequest<unknown>('/rooms'), 'quartos')
  const next = current.filter(
    (room) =>
      !(
        readString(room.tripId) === tripId &&
        targets.has(readString(room.id))
      ),
  )
  const persisted = await putCollection('/rooms/bulk', next, 'quartos persistidos')
  if (
    persisted.some(
      (room) =>
        readString(room.tripId) === tripId &&
        targets.has(readString(room.id)),
    )
  ) {
    throw new Error('O backend não confirmou a exclusão dos quartos.')
  }
}

export async function loadTransportSource(
  tripId: string,
): Promise<TransportSource> {
  const [seatsValue, users] = await Promise.all([
    httpRequest<unknown>('/seats'),
    listUsers(),
  ])
  const seats = records(seatsValue, 'assentos')
    .map(toSeat)
    .filter((seat): seat is SeatRecord => seat !== null && seat.tripId === tripId)
  return { seats, users }
}

export async function saveSeatRecord(seat: SeatRecord) {
  const current = records(await httpRequest<unknown>('/seats'), 'assentos')
  const coordinateMatches = current.filter(
    (item) =>
      readString(item.tripId) === seat.tripId &&
      readString(item.busId) === seat.busId &&
      Math.trunc(readNumber(item.floor)) === seat.floor &&
      Math.trunc(readNumber(item.seatNumber)) === seat.seatNumber,
  )
  if (coordinateMatches.length > 1) {
    throw new Error('Há ocupações duplicadas neste assento. Libere-o antes de atribuir.')
  }
  const targetIndex = current.findIndex(
    (item) => readString(item.id) === seat.id,
  )
  if (
    coordinateMatches.length === 1 &&
    readString(coordinateMatches[0].id) !== seat.id
  ) {
    throw new Error('Este assento foi ocupado antes da persistência. Recarregue a página.')
  }
  if (targetIndex >= 0) {
    const currentSeat = toSeat(current[targetIndex])
    if (
      currentSeat &&
      (currentSeat.tripId !== seat.tripId ||
        currentSeat.busId !== seat.busId ||
        currentSeat.floor !== seat.floor ||
        currentSeat.seatNumber !== seat.seatNumber)
    ) {
      throw new Error('Este ID de assento já está associado a outra posição.')
    }
  }
  const normalized = {
    busId: seat.busId,
    floor: seat.floor,
    id: seat.id,
    seatNumber: seat.seatNumber,
    tripId: seat.tripId,
    userCpf: stripCpf(seat.userCpf),
  }
  const next = [...current]
  if (targetIndex >= 0) next[targetIndex] = { ...current[targetIndex], ...normalized }
  else next.push(normalized)
  const persisted = await putCollection('/seats/bulk', next, 'assentos persistidos')
  const saved = persisted.map(toSeat).find((item) => item?.id === seat.id)
  if (
    !saved ||
    saved.tripId !== normalized.tripId ||
    saved.busId !== normalized.busId ||
    saved.floor !== normalized.floor ||
    saved.seatNumber !== normalized.seatNumber ||
    saved.userCpf !== normalized.userCpf
  ) {
    throw new Error('O backend não confirmou o assento persistido.')
  }
  return saved
}

export async function deleteSeats(
  tripId: string,
  predicate: (seat: SeatRecord) => boolean,
) {
  const current = records(await httpRequest<unknown>('/seats'), 'assentos')
  const next = current.flatMap((item, index) => {
    const parsed = toSeat(item, index)
    return parsed?.tripId === tripId && predicate(parsed) ? [] : [item]
  })
  const persisted = await putCollection('/seats/bulk', next, 'assentos persistidos')
  if (
    persisted.some((item, index) => {
      const parsed = toSeat(item, index)
      return parsed?.tripId === tripId && predicate(parsed)
    })
  ) {
    throw new Error('O backend não confirmou a liberação dos assentos.')
  }
}
