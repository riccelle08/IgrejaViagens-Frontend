import './styles/app.css'

export function App() {
  return (
    <main className="foundation-page">
      <section className="foundation-card" aria-labelledby="foundation-title">
        <img
          className="foundation-logo"
          src="/imagens/logo.png"
          alt="Igreja Viagens"
        />
        <p className="foundation-eyebrow">Nova interface</p>
        <h1 id="foundation-title">Estrutura React pronta</h1>
        <p className="foundation-description">
          React, TypeScript e Vite estao configurados. As funcionalidades serao
          migradas por etapas, preservando integralmente o frontend legado.
        </p>
        <span className="foundation-status">Etapa 1</span>
      </section>
    </main>
  )
}

