import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { AppProviders } from './app/providers'

describe('App', () => {
  beforeEach(() => sessionStorage.clear())

  it('renderiza o login enquanto nao existe sessao', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    )

    expect(
      screen.getByRole('heading', { name: 'Bem-vindo(a)' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})
