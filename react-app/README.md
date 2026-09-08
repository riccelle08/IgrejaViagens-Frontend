# Igreja Viagens — React

Nova interface do Igreja Viagens, criada em paralelo ao frontend legado com
React, TypeScript e Vite.

Os arquivos HTML, CSS e JavaScript legados na raiz de `IgrejaViagens-Frontend`
permanecem como baseline e nao devem ser modificados sem aprovacao explicita.

## Requisitos

- Node.js 20.19 ou superior
- npm 11 ou superior

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run lint
```

Copie `.env.example` para `.env.local` somente se precisar alterar o endereco
do backend. Durante o desenvolvimento, o Vite encaminha os caminhos atuais da
API para `http://localhost:8080`.

