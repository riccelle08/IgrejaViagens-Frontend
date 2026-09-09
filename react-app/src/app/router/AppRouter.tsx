import { Route, Routes } from 'react-router'
import { AdminDashboardPage } from '../../features/admin/dashboard/pages/AdminDashboardPage'
import { TripSettingsPage } from '../../features/admin/settings/pages/TripSettingsPage'
import { TravelerDashboardPage } from '../../features/traveler/dashboard/pages/TravelerDashboardPage'
import { navigationByRole } from '../../features/navigation/config/navigation'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { PlaceholderPage } from '../../pages/PlaceholderPage'
import { LoginRoute } from './LoginRoute'
import { ProtectedRoleLayout } from './ProtectedRoleLayout'
import { RequireRole } from './guards/RequireRole'

function placeholderFor(path: string, role: 'admin' | 'traveler') {
  const item = navigationByRole[role]
    .flatMap((section) => section.items)
    .find((navigationItem) => navigationItem.path === path)

  if (!item) throw new Error(`Rota sem metadados: ${path}`)

  return (
    <PlaceholderPage
      description={item.description}
      icon={item.icon}
      title={item.pageTitle}
    />
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />

      <Route element={<RequireRole role="admin" />}>
        <Route element={<ProtectedRoleLayout role="admin" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route
            path="/admin/viajantes"
            element={placeholderFor('/admin/viajantes', 'admin')}
          />
          <Route
            path="/admin/pagamentos"
            element={placeholderFor('/admin/pagamentos', 'admin')}
          />
          <Route
            path="/admin/transporte"
            element={placeholderFor('/admin/transporte', 'admin')}
          />
          <Route
            path="/admin/hotel"
            element={placeholderFor('/admin/hotel', 'admin')}
          />
          <Route
            path="/admin/cadastros"
            element={placeholderFor('/admin/cadastros', 'admin')}
          />
          <Route
            path="/admin/configuracoes"
            element={<TripSettingsPage />}
          />
        </Route>
      </Route>

      <Route element={<RequireRole role="traveler" />}>
        <Route element={<ProtectedRoleLayout role="traveler" />}>
          <Route
            path="/viajante"
            element={<TravelerDashboardPage />}
          />
          <Route
            path="/viajante/pagamento"
            element={placeholderFor('/viajante/pagamento', 'traveler')}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
