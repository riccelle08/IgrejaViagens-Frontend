# Igreja Viagens — React

Nova interface do Igreja Viagens, criada em paralelo ao frontend legado com
React, TypeScript e Vite.

Os arquivos HTML, CSS e JavaScript legados na raiz de `IgrejaViagens-Frontend`
permanecem como baseline e não devem ser modificados sem aprovação explícita.

## Escopo atual

A Etapa 2 implementa o login em React, incluindo validação e máscara de CPF,
estado de carregamento, tratamento de erro, sessão temporária sem senha e o
fluxo de primeiro acesso. Os únicos endpoints consumidos nesta etapa são:

- `POST /auth/login`
- `PUT /users/{cpf}` (somente para concluir o primeiro acesso)

Rotas, sidebar e dashboards continuam fora deste escopo. Até a modernização de
segurança prevista para a Etapa 10, esta sessão representa apenas o estado do
cliente; ela não substitui autenticação/autorização no backend.

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

Copie `.env.example` para `.env.local` somente se precisar alterar o endereço
do backend. Durante o desenvolvimento, o Vite encaminha os caminhos atuais da
API para `http://localhost:8080`.
