import { AuthIcon } from './features/auth/components/AuthIcon'
import { useAuth } from './features/auth/hooks/useAuth'
import { LoginPage } from './features/auth/pages/LoginPage'
import './styles/app.css'

export function App() {
  const { user, signIn, signOut } = useAuth()

  if (!user) return <LoginPage onAuthenticated={signIn} />

  return (
    <main className="authenticated-state">
      <section
        aria-labelledby="authenticated-title"
        className="authenticated-card"
      >
        <span className="authenticated-check">
          <AuthIcon name="check" />
        </span>
        <p className="authenticated-eyebrow">Acesso confirmado</p>
        <h1 id="authenticated-title">Olá, {user.name.split(' ')[0]}!</h1>
        <p>
          Seu login foi concluído. As rotas e os painéis serão conectados na
          próxima etapa da migração.
        </p>
        <dl>
          <div>
            <dt>CPF</dt>
            <dd>{user.cpf}</dd>
          </div>
          <div>
            <dt>Perfil</dt>
            <dd>{user.role === 'admin' ? 'Administrador' : 'Viajante'}</dd>
          </div>
        </dl>
        <button onClick={signOut} type="button">
          <AuthIcon name="logout" />
          Sair
        </button>
      </section>
    </main>
  )
}
