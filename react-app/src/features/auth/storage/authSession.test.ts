import { beforeEach, describe, expect, it } from 'vitest'
import type { AuthUser } from '../model/authTypes'
import { readAuthSession, writeAuthSession } from './authSession'

const user: AuthUser = {
  cpf: '52998224725',
  name: 'Maria Teste',
  role: 'traveler',
  birthdate: '1990-05-12',
  firstLogin: false,
  married: false,
  spouseName: '',
  hasKids: false,
  kids: [],
}

describe('sessao de autenticacao', () => {
  beforeEach(() => sessionStorage.clear())

  it('persiste somente os campos permitidos e nunca a senha', () => {
    writeAuthSession({ ...user, password: 'nao-deve-ser-salva' } as AuthUser)

    const rawSession = sessionStorage.getItem('igreja-viagens:auth-session')
    expect(rawSession).not.toContain('nao-deve-ser-salva')
    expect(readAuthSession()).toEqual(user)
  })
})
