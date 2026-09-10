import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  saveBusStructure,
  saveHotelStructure,
  saveRoomRecord,
  saveSeatRecord,
} from './operationsApi'

interface CapturedRequest {
  body?: unknown
  method: string
  path: string
}

function pathOf(input: RequestInfo | URL) {
  const value =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.href
        : input
  return new URL(value, 'http://localhost').pathname
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function backend(data: Record<string, unknown>, putStatus = 200) {
  const requests: CapturedRequest[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const path = pathOf(input)
      const method = init?.method ?? 'GET'
      const body: unknown =
        typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
      requests.push({ body, method, path })
      if (method === 'PUT') {
        return Promise.resolve(
          putStatus >= 400
            ? jsonResponse({ message: 'Falha de persistência' }, putStatus)
            : jsonResponse(body),
        )
      }
      return Promise.resolve(jsonResponse(data[path] ?? []))
    }),
  )
  return requests
}

function putBody(requests: CapturedRequest[], path: string) {
  return requests.find(
    (request) => request.method === 'PUT' && request.path === path,
  )?.body as Array<Record<string, unknown>> | undefined
}

describe('operationsApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preserva os demais campos da viagem ao atualizar hotéis ou ônibus', async () => {
    const requests = backend({
      '/trips': [{
        id: 'trip-1',
        hotelsJson: '[]',
        busesJson: '[]',
        travelersJson: '["11144477735"]',
        serverRevision: 13,
      }],
    })
    await saveHotelStructure('trip-1', [{ id: 'hotel-1', name: 'Central', rooms: [] }])
    await saveBusStructure('trip-1', [{
      id: 'bus-legacy',
      floors: 1,
      seatsFloor1: 20,
      seatsFloor2: 0,
      seats: 20,
    }])

    const writes = requests.filter((request) => request.path === '/trips/bulk')
    expect((writes[0].body as Array<Record<string, unknown>>)[0]).toMatchObject({
      id: 'trip-1',
      serverRevision: 13,
      travelersJson: '["11144477735"]',
    })
    expect((writes[1].body as Array<Record<string, unknown>>)[0]).toMatchObject({
      id: 'trip-1',
      serverRevision: 13,
    })
  })

  it('preserva IDs e campos desconhecidos de quartos e assentos', async () => {
    const requests = backend({
      '/rooms': [{
        id: 'room-existing',
        tripId: 'trip-1',
        hotelId: 'hotel-1',
        name: '101',
        type: 'double',
        capacity: 2,
        occupants: ['11144477735'],
        providerCode: 'room-preserved',
      }],
      '/seats': [{
        id: 'seat-existing',
        tripId: 'trip-1',
        busId: 'bus-1',
        floor: 2,
        seatNumber: 8,
        userCpf: '11144477735',
        providerCode: 'seat-preserved',
      }],
    })

    await saveRoomRecord({
      id: 'room-existing',
      tripId: 'trip-1',
      hotelId: 'hotel-1',
      name: 'Suíte 101',
      type: 'custom',
      capacity: 3,
      occupants: ['11144477735'],
    })
    await saveSeatRecord({
      id: 'seat-existing',
      tripId: 'trip-1',
      busId: 'bus-1',
      floor: 2,
      seatNumber: 8,
      userCpf: '52998224725',
    })

    expect(putBody(requests, '/rooms/bulk')?.[0]).toMatchObject({
      id: 'room-existing',
      providerCode: 'room-preserved',
      occupants: ['11144477735'],
      capacity: 3,
    })
    expect(putBody(requests, '/seats/bulk')?.[0]).toMatchObject({
      id: 'seat-existing',
      providerCode: 'seat-preserved',
      floor: 2,
      seatNumber: 8,
      userCpf: '52998224725',
    })
  })

  it('propaga erro de persistência sem confirmar sucesso', async () => {
    backend({ '/trips': [{ id: 'trip-1', hotelsJson: '[]' }] }, 500)
    await expect(saveHotelStructure('trip-1', [])).rejects.toThrow(
      'Falha de persistência',
    )
  })
})
