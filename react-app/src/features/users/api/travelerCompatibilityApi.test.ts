import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UserMutation } from '../model/userTypes'
import {
  addExistingUserToTrip,
  createTravelerForTrip,
  deleteUserGlobally,
  removeTravelerFromTrip,
} from './travelerCompatibilityApi'

interface CapturedRequest {
  body?: unknown
  method: string
  path: string
}

const userMutation: UserMutation = {
  birthdate: '',
  firstLogin: true,
  hasKids: false,
  kids: [],
  married: false,
  name: 'Tiago',
  role: 'traveler',
  spouseName: '',
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

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function backend(data: Record<string, unknown>) {
  const requests: CapturedRequest[] = []
  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    const path = pathOf(input)
    const method = init?.method ?? 'GET'
    const body: unknown =
      typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    requests.push({ body, method, path })

    if (method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    if (method === 'PUT') return Promise.resolve(jsonResponse(body))
    if (method === 'POST') return Promise.resolve(jsonResponse(body))
    return Promise.resolve(jsonResponse(data[path] ?? []))
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, requests }
}

function bodyFor(requests: CapturedRequest[], path: string) {
  return requests.find((request) => request.path === path && request.method === 'PUT')
    ?.body as Array<Record<string, unknown>> | undefined
}

describe('compatibilidade de associações de viajantes', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('adiciona usuário existente e cria o pagamento inicial', async () => {
    const { requests } = backend({
      '/trips': [
        {
          id: 'trip-1',
          maxPeople: 2,
          travelersJson: '[]',
          serverTripField: 'preservado',
        },
      ],
      '/payments': [],
    })

    await addExistingUserToTrip('111.444.777-35', 'trip-1')

    expect(bodyFor(requests, '/trips/bulk')?.[0]).toMatchObject({
      serverTripField: 'preservado',
      travelersJson: '["11144477735"]',
    })
    expect(bodyFor(requests, '/payments/bulk')?.[0]).toMatchObject({
      userCpf: '11144477735',
      tripId: 'trip-1',
      totalInstallments: 1,
      paidInstallments: 0,
      dueDay: 10,
      receiptsJson: '{}',
    })
  })

  it('bloqueia maxPeople antes de qualquer escrita', async () => {
    const { requests } = backend({
      '/trips': [
        {
          id: 'trip-1',
          maxPeople: 1,
          travelersJson: '["52998224725"]',
        },
      ],
      '/payments': [],
    })

    await expect(
      addExistingUserToTrip('11144477735', 'trip-1'),
    ).rejects.toThrow('limite de 1 pessoa')
    expect(requests.some((request) => request.method === 'PUT')).toBe(false)
  })

  it('cria novo usuário sem levar senha ao estado e o associa à viagem', async () => {
    const { requests } = backend({
      '/trips': [
        { id: 'trip-1', maxPeople: 2, travelersJson: '[]' },
      ],
      '/payments': [],
    })

    const created = await createTravelerForTrip(
      '11144477735',
      userMutation,
      'trip-1',
    )

    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/users', method: 'POST' }),
        expect.objectContaining({ path: '/trips/bulk', method: 'PUT' }),
        expect.objectContaining({ path: '/payments/bulk', method: 'PUT' }),
      ]),
    )
    expect(created).not.toHaveProperty('password')
  })

  it('remove somente da viagem sem excluir o usuário global', async () => {
    const { requests } = backend({
      '/trips': [
        {
          id: 'trip-1',
          travelersJson: '["11144477735","52998224725"]',
        },
      ],
      '/payments': [
        { id: 'mine', userCpf: '11144477735', tripId: 'trip-1' },
        { id: 'other', userCpf: '11144477735', tripId: 'trip-2' },
      ],
      '/seats': [
        { id: 'mine', userCpf: '11144477735', tripId: 'trip-1' },
      ],
      '/rooms': [
        {
          id: 'room-1',
          tripId: 'trip-1',
          occupants: ['11144477735', '52998224725'],
        },
      ],
    })

    await removeTravelerFromTrip('11144477735', 'trip-1')

    expect(requests.some((request) => request.method === 'DELETE')).toBe(false)
    expect(bodyFor(requests, '/trips/bulk')?.[0].travelersJson).toBe(
      '["52998224725"]',
    )
    expect(bodyFor(requests, '/payments/bulk')).toEqual([
      { id: 'other', userCpf: '11144477735', tripId: 'trip-2' },
    ])
    expect(bodyFor(requests, '/seats/bulk')).toEqual([])
    expect(bodyFor(requests, '/rooms/bulk')?.[0].occupants).toEqual([
      '52998224725',
    ])
  })

  it('na exclusão global limpa associações e usa DELETE granular do usuário', async () => {
    const { requests } = backend({
      '/trips': [
        { id: 'trip-1', travelersJson: '["11144477735"]' },
      ],
      '/payments': [
        { id: 'payment-1', userCpf: '11144477735', tripId: 'trip-1' },
      ],
      '/seats': [
        { id: 'seat-1', userCpf: '11144477735', tripId: 'trip-1' },
      ],
      '/rooms': [
        { id: 'room-1', tripId: 'trip-1', occupants: ['11144477735'] },
      ],
    })

    await deleteUserGlobally('11144477735')

    expect(bodyFor(requests, '/payments/bulk')).toEqual([])
    expect(bodyFor(requests, '/seats/bulk')).toEqual([])
    expect(bodyFor(requests, '/rooms/bulk')?.[0].occupants).toEqual([])
    expect(requests).toContainEqual({
      body: undefined,
      method: 'DELETE',
      path: '/users/11144477735',
    })
  })
})
