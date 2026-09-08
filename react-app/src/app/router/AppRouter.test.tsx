import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../App'
import { AppProviders } from '../providers'
import type { AuthUser } from '../../features/auth/model/authTypes'
import {
  readAuthSession,
  writeAuthSession,
} from '../../features/auth/storage/authSession'
import {
  readActiveTripId,
  writeActiveTripId,
} from '../../features/trips/storage/activeTripStorage'

const admin: AuthUser = {
  cpf: '52998224725',
  name: 'Ana Administradora',
  role: 'admin',
  birthdate: '',
  firstLogin: false,
  married: false,
  spouseName: '',
  hasKids: false,
  kids: [],
}

const traveler: AuthUser = {
  ...admin,
  cpf: '11144477735',
  name: 'Tiago Viajante',
  role: 'traveler',
}

const trip = {
  id: 'trip-1',
  name: 'Retiro 2027',
  destination: 'Goiânia',
  date: '2027-01-20',
  travelersJson: JSON.stringify([traveler.cpf]),
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderRoute(path: string, authenticatedUser?: AuthUser) {
  if (authenticatedUser) writeAuthSession(authenticatedUser)

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('rotas e layout protegido', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    sessionStorage.clear()
    fetchMock.mockReset()
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse([])))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('redireciona usuário sem sessão de rota protegida para o login', async () => {
    renderRoute('/admin')

    expect(
      await screen.findByRole('heading', { name: 'Bem-vindo(a)' }),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('permite que admin acesse rota administrativa', async () => {
    writeActiveTripId(trip.id)
    fetchMock.mockResolvedValueOnce(jsonResponse([trip]))
    renderRoute('/admin/viajantes', admin)

    expect(
      await screen.findByText('A gestão de viajantes será migrada na Etapa 6.'),
    ).toBeInTheDocument()
  })

  it('impede viajante de acessar rota administrativa', async () => {
    writeActiveTripId(trip.id)
    fetchMock.mockResolvedValueOnce(jsonResponse([trip]))
    renderRoute('/admin', traveler)

    expect(
      await screen.findByText('O dashboard do viajante será migrado na Etapa 5.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('O conteúdo do dashboard será migrado na Etapa 4.'),
    ).not.toBeInTheDocument()
  })

  it('exibe menus diferentes para admin e viajante', () => {
    const adminView = renderRoute('/admin/cadastros', admin)
    const adminSidebar = screen.getByRole('complementary', {
      name: 'Navegação principal',
    })

    expect(within(adminSidebar).getByText('Viajantes')).toBeInTheDocument()
    expect(within(adminSidebar).getByText('Cadastro Global')).toBeInTheDocument()
    expect(within(adminSidebar).queryByText('Início')).not.toBeInTheDocument()

    adminView.unmount()
    sessionStorage.clear()
    renderRoute('/viajante', traveler)
    const travelerSidebar = screen.getByRole('complementary', {
      name: 'Navegação principal',
    })

    expect(within(travelerSidebar).getByText('Início')).toBeInTheDocument()
    expect(within(travelerSidebar).getByText('Pagamento')).toBeInTheDocument()
    expect(
      within(travelerSidebar).queryByText('Cadastro Global'),
    ).not.toBeInTheDocument()
  })

  it('encerra a sessão e limpa a viagem ativa no logout', async () => {
    writeActiveTripId(trip.id)
    renderRoute('/admin/cadastros', admin)

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(
      await screen.findByRole('heading', { name: 'Bem-vindo(a)' }),
    ).toBeInTheDocument()
    expect(readAuthSession()).toBeNull()
    expect(readActiveTripId()).toBeNull()
  })

  it('seleciona uma viagem e atualiza o contexto do layout', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([trip]))
    renderRoute('/admin', admin)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: `Selecionar viagem ${trip.name}` }),
    )

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(
      await screen.findByRole('heading', { name: trip.name }),
    ).toBeInTheDocument()
    expect(readActiveTripId()).toBe(trip.id)
  })

  it('exige viagem em Configurações e permanece na rota após selecionar', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([trip]))
    renderRoute('/admin/configuracoes', admin)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: `Selecionar viagem ${trip.name}` }),
    )

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: 'Salvar configurações' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: trip.name }),
    ).toBeInTheDocument()
    expect(readActiveTripId()).toBe(trip.id)
  })

  it('restaura a viagem ativa persistida', async () => {
    writeActiveTripId(trip.id)
    fetchMock.mockResolvedValueOnce(jsonResponse([trip]))
    renderRoute('/admin', admin)

    expect(
      await screen.findByRole('heading', { name: trip.name }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('filtra viagens do viajante usando travelersJson', async () => {
    const otherTrip = {
      ...trip,
      id: 'trip-2',
      name: 'Viagem de outro grupo',
      travelersJson: JSON.stringify([admin.cpf]),
    }
    fetchMock.mockResolvedValueOnce(jsonResponse([trip, otherTrip]))
    renderRoute('/viajante', traveler)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: `Selecionar viagem ${trip.name}` }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: `Selecionar viagem ${otherTrip.name}`,
      }),
    ).not.toBeInTheDocument()
  })

  it('renderiza página 404 para rota inexistente', () => {
    renderRoute('/endereco-inexistente')

    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('abre e fecha a sidebar pelo controle mobile', () => {
    renderRoute('/admin/cadastros', admin)
    const sidebar = screen.getByRole('complementary', {
      name: 'Navegação principal',
    })
    const menuButton = screen.getByLabelText('Abrir menu')

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(sidebar).not.toHaveClass('is-open')

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(sidebar).toHaveClass('is-open')

    fireEvent.click(screen.getByLabelText('Fechar menu'))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(sidebar).not.toHaveClass('is-open')
  })
})
