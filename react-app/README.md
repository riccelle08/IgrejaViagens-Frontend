# Igreja Viagens — React

Nova interface do Igreja Viagens, criada em paralelo ao frontend legado com
React, TypeScript e Vite.

Os arquivos HTML, CSS e JavaScript legados na raiz de `IgrejaViagens-Frontend`
permanecem como baseline e não devem ser modificados sem aprovação explícita.

## Escopo atual

As Etapas 1 a 4 estão implementadas. Além do login, a aplicação possui React
Router, layout compartilhado, sidebar responsiva, topbar, rotas protegidas por
sessão/papel, seleção e gestão de viagens, Dashboard Admin e Configurações. Os
endpoints consumidos são:

- `POST /auth/login`
- `PUT /users/{cpf}` (somente para concluir o primeiro acesso)
- `GET /trips`
- `GET /users`, `GET /payments` e `GET /seats` (Dashboard Admin)
- `GET /rooms` (compatibilidade ao excluir viagem)
- `PUT /trips/bulk`
- `PUT /payments/bulk`, `PUT /seats/bulk` e `PUT /rooms/bulk` (compatibilidade
  ao excluir viagem)

O Dashboard Viajante e os módulos de Viajantes, Pagamentos, Hotel e Transporte
ainda são placeholders. A proteção por papel é somente visual; os limites estão
documentados em [`docs/stage-3-routing-security.md`](docs/stage-3-routing-security.md)
e as pendências da API bulk em
[`docs/stage-4-backend-pending.md`](docs/stage-4-backend-pending.md).

## Rotas

| Rota | Papel | Estado |
| --- | --- | --- |
| `/` | Público | Login migrado |
| `/admin` | Admin | Dashboard migrado |
| `/admin/viajantes` | Admin | Placeholder |
| `/admin/pagamentos` | Admin | Placeholder |
| `/admin/transporte` | Admin | Placeholder |
| `/admin/hotel` | Admin | Placeholder |
| `/admin/cadastros` | Admin | Placeholder global |
| `/admin/configuracoes` | Admin | Configurações da viagem migradas |
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
