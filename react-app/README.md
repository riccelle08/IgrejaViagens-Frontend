# Igreja Viagens — React

Nova interface do Igreja Viagens, criada em paralelo ao frontend legado com
React, TypeScript e Vite.

Os arquivos HTML, CSS e JavaScript legados na raiz de `IgrejaViagens-Frontend`
permanecem como baseline e não devem ser modificados sem aprovação explícita.

## Escopo atual

As Etapas 1 a 8 estão implementadas. Além do login, a aplicação possui React
Router, layout compartilhado, sidebar responsiva, topbar, rotas protegidas por
sessão/papel, seleção e gestão de viagens, dashboards, Configurações, Viajantes,
Cadastro Global, Pagamentos, Hotel e Transporte. Os endpoints consumidos são:

- `POST /auth/login`
- `PUT /users/{cpf}` (somente para concluir o primeiro acesso)
- `GET /trips`
- `GET /users`, `GET /payments` e `GET /seats` (Dashboard Admin)
- `GET /payments`, `GET /seats` e `GET /rooms` (Dashboard Viajante)
- `POST /users`, `PUT /users/{cpf}` e `DELETE /users/{cpf}` (Cadastro Global)
- `GET /users`, `GET /payments`, `GET /seats` e `GET /rooms` (Viajantes)
- `GET /payments` e `GET /users` (Pagamentos)
- `GET /rooms`, `GET /seats` e `GET /users` (Hotel e Transporte)
- `PUT /trips/bulk` (viagens, hotéis e ônibus)
- `PUT /payments/bulk`, `PUT /seats/bulk` e `PUT /rooms/bulk` (operações de
  compatibilidade enquanto não existem contratos granulares suficientes)

A proteção por papel é somente visual; os limites estão
documentados em [`docs/stage-3-routing-security.md`](docs/stage-3-routing-security.md)
e as pendências da API bulk em
[`docs/stage-4-backend-pending.md`](docs/stage-4-backend-pending.md). Os limites
dos contratos e o tratamento defensivo do Dashboard Viajante estão em
[`docs/stage-5-traveler-data-integrity.md`](docs/stage-5-traveler-data-integrity.md).
As operações de usuários e os bulk temporários da Etapa 6 estão descritos em
[`docs/stage-6-users-compatibility.md`](docs/stage-6-users-compatibility.md).
Os cálculos e limites dos pagamentos estão em
[`docs/stage-7-payments-compatibility.md`](docs/stage-7-payments-compatibility.md).
Os contratos duplicados de hotel/transporte e seus riscos estão em
[`docs/stage-8-operations-compatibility.md`](docs/stage-8-operations-compatibility.md).

## Rotas

| Rota | Papel | Estado |
| --- | --- | --- |
| `/` | Público | Login migrado |
| `/admin` | Admin | Dashboard migrado |
| `/admin/viajantes` | Admin | Viajantes da viagem migrados |
| `/admin/pagamentos` | Admin | Gestão financeira migrada |
| `/admin/transporte` | Admin | Ônibus e assentos migrados |
| `/admin/hotel` | Admin | Hotéis e quartos migrados |
| `/admin/cadastros` | Admin | Cadastro Global migrado |
| `/admin/configuracoes` | Admin | Configurações da viagem migradas |
| `/viajante` | Viajante | Dashboard e passagem digital migrados |
| `/viajante/pagamento` | Viajante | Parcelamento e comprovantes migrados |
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
