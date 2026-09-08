# Igreja Viagens — React

Nova interface do Igreja Viagens, criada em paralelo ao frontend legado com
React, TypeScript e Vite.

Os arquivos HTML, CSS e JavaScript legados na raiz de `IgrejaViagens-Frontend`
permanecem como baseline e não devem ser modificados sem aprovação explícita.

## Escopo atual

As Etapas 1 a 3 estão implementadas. Além do login, a aplicação possui React
Router, layout compartilhado, sidebar responsiva, topbar, rotas protegidas por
sessão/papel, placeholders e seleção de viagem. Os endpoints consumidos são:

- `POST /auth/login`
- `PUT /users/{cpf}` (somente para concluir o primeiro acesso)
- `GET /trips` (seleção e contexto de viagem)

Os dashboards e demais módulos ainda são placeholders. A proteção por papel é
somente visual; os limites estão documentados em
[`docs/stage-3-routing-security.md`](docs/stage-3-routing-security.md).

## Rotas

| Rota | Papel | Estado |
| --- | --- | --- |
| `/` | Público | Login migrado |
| `/admin` | Admin | Placeholder do dashboard |
| `/admin/viajantes` | Admin | Placeholder |
| `/admin/pagamentos` | Admin | Placeholder |
| `/admin/transporte` | Admin | Placeholder |
| `/admin/hotel` | Admin | Placeholder |
| `/admin/cadastros` | Admin | Placeholder global |
| `/admin/configuracoes` | Admin | Placeholder global |
| `/viajante` | Viajante | Placeholder do dashboard |
| `/viajante/pagamento` | Viajante | Placeholder |
| `*` | Público | Página 404 |

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
