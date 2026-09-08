import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renderiza o marco da etapa 1', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Estrutura React pronta' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Etapa 1')).toBeInTheDocument()
  })
})

