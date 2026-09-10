import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PaymentMutation } from '../model/paymentTypes'
import { savePayment } from './paymentApi'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const mutation: PaymentMutation = {
  dueDay: 15,
  id: 'payment-1',
  locked: true,
  paidInstallments: 1,
  receipts: {
    1: {
      data: 'data:image/png;base64,AA==',
      date: '09/09/2026',
      filename: 'recibo.png',
      note: '',
      status: 'approved',
      type: 'image/png',
    },
  },
  totalInstallments: 3,
  tripId: 'trip-1',
  userCpf: '11144477735',
}

describe('paymentApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preserva campos desconhecidos do pagamento e dos comprovantes', async () => {
    let persisted: Array<Record<string, unknown>> = []
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((_input, init) => {
        if (init?.method === 'PUT') {
          if (typeof init.body !== 'string') throw new Error('Corpo ausente.')
          persisted = JSON.parse(init.body) as Array<Record<string, unknown>>
          return Promise.resolve(jsonResponse(persisted))
        }
        return Promise.resolve(
          jsonResponse([
            {
              id: 'payment-1',
              userCpf: '11144477735',
              tripId: 'trip-1',
              totalInstallments: 2,
              paidInstallments: 0,
              dueDay: 10,
              locked: false,
              auditField: 'preservado',
              receiptsJson: JSON.stringify({
                1: {
                  status: 'pending',
                  filename: 'recibo.png',
                  type: 'image/png',
                  data: 'data:image/png;base64,AA==',
                  providerChecksum: 'preservado',
                },
              }),
            },
          ]),
        )
      }),
    )

    const saved = await savePayment(mutation)

    expect(persisted[0]).toMatchObject({
      auditField: 'preservado',
      totalInstallments: 3,
      dueDay: 15,
    })
    const receipts = JSON.parse(String(persisted[0].receiptsJson)) as Record<
      string,
      Record<string, unknown>
    >
    expect(receipts['1']).toMatchObject({
      providerChecksum: 'preservado',
      status: 'approved',
    })
    expect(saved.totalInstallments).toBe(3)
  })

  it('não confirma persistência quando o backend devolve erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((_input, init) =>
        Promise.resolve(
          init?.method === 'PUT'
            ? jsonResponse({ message: 'Falha controlada' }, 500)
            : jsonResponse([]),
        ),
      ),
    )

    await expect(savePayment({ ...mutation, id: undefined })).rejects.toThrow(
      'Falha controlada',
    )
  })
})
