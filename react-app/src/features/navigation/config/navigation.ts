import type { UserRole } from '../../auth/model/authTypes'
import type { AppIconName } from '../../../shared/components/AppIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: AppIconName
  pageTitle: string
  description: string
  requiresTrip: boolean
}

export interface NavigationSection {
  label: string
  items: NavigationItem[]
}

export const navigationByRole: Record<UserRole, NavigationSection[]> = {
  admin: [
    {
      label: 'Principal',
      items: [
        {
          label: 'Dashboard',
          path: '/admin',
          icon: 'dashboard',
          pageTitle: 'Dashboard administrativo',
          description: 'Indicadores e acompanhamento da viagem ativa.',
          requiresTrip: true,
        },
        {
          label: 'Viajantes',
          path: '/admin/viajantes',
          icon: 'users',
          pageTitle: 'Viajantes',
          description: 'A gestão de viajantes será migrada na Etapa 6.',
          requiresTrip: true,
        },
      ],
    },
    {
      label: 'Gestão',
      items: [
        {
          label: 'Pagamentos',
          path: '/admin/pagamentos',
          icon: 'creditCard',
          pageTitle: 'Pagamentos',
          description: 'A gestão de pagamentos será migrada na Etapa 7.',
          requiresTrip: true,
        },
        {
          label: 'Transporte',
          path: '/admin/transporte',
          icon: 'bus',
          pageTitle: 'Transporte',
          description: 'A gestão de transporte será migrada na Etapa 8.',
          requiresTrip: true,
        },
        {
          label: 'Hotel',
          path: '/admin/hotel',
          icon: 'building',
          pageTitle: 'Hotel',
          description: 'A gestão de hotel será migrada na Etapa 8.',
          requiresTrip: true,
        },
      ],
    },
    {
      label: 'Sistema',
      items: [
        {
          label: 'Cadastro Global',
          path: '/admin/cadastros',
          icon: 'folder',
          pageTitle: 'Cadastro global',
          description: 'O cadastro global será migrado em uma etapa futura.',
          requiresTrip: false,
        },
        {
          label: 'Configurações',
          path: '/admin/configuracoes',
          icon: 'settings',
          pageTitle: 'Configurações',
          description: 'Dados gerais e meta da viagem ativa.',
          requiresTrip: true,
        },
      ],
    },
  ],
  traveler: [
    {
      label: 'Minha viagem',
      items: [
        {
          label: 'Início',
          path: '/viajante',
          icon: 'home',
          pageTitle: 'Área do viajante',
          description: 'O dashboard do viajante será migrado na Etapa 5.',
          requiresTrip: true,
        },
        {
          label: 'Pagamento',
          path: '/viajante/pagamento',
          icon: 'creditCard',
          pageTitle: 'Meu pagamento',
          description: 'O conteúdo de pagamentos será migrado na Etapa 7.',
          requiresTrip: true,
        },
      ],
    },
  ],
}

export function getNavigationItems(role: UserRole) {
  return navigationByRole[role].flatMap((section) => section.items)
}

export function getNavigationItem(role: UserRole, pathname: string) {
  return getNavigationItems(role).find((item) => item.path === pathname)
}

export function getRoleHomePath(role: UserRole) {
  return role === 'admin' ? '/admin' : '/viajante'
}
