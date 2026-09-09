# Igreja Viagens — React

Nova interface do Igreja Viagens, criada em paralelo ao frontend legado com
React, TypeScript e Vite.

Os arquivos HTML, CSS e JavaScript legados na raiz de `IgrejaViagens-Frontend`
permanecem como baseline e não devem ser modificados sem aprovação explícita.

## Escopo atual

As Etapas 1 a 6 estão implementadas. Além do login, a aplicação possui React
Router, layout compartilhado, sidebar responsiva, topbar, rotas protegidas por
sessão/papel, seleção e gestão de viagens, dashboards, Configurações, Viajantes
e Cadastro Global. Os endpoints consumidos são:

- `POST /auth/login`
- `PUT /users/{cpf}` (somente para concluir o primeiro acesso)
- `GET /trips`
- `GET /users`, `GET /payments` e `GET /seats` (Dashboard Admin)
- `GET /payments`, `GET /seats` e `GET /rooms` (Dashboard Viajante)
- `POST /users`, `PUT /users/{cpf}` e `DELETE /users/{cpf}` (Cadastro Global)
- `GET /users`, `GET /payments`, `GET /seats` e `GET /rooms` (Viajantes)
- `GET /rooms` (compatibilidade ao excluir viagem)
- `PUT /trips/bulk`
- `PUT /payments/bulk`, `PUT /seats/bulk` e `PUT /rooms/bulk` (compatibilidade
  ao excluir viagem)

Os módulos de Pagamentos, Hotel e Transporte ainda são placeholders. A proteção
por papel é somente visual; os limites estão
documentados em [`docs/stage-3-routing-security.md`](docs/stage-3-routing-security.md)
e as pendências da API bulk em
[`docs/stage-4-backend-pending.md`](docs/stage-4-backend-pending.md). Os limites
dos contratos e o tratamento defensivo do Dashboard Viajante estão em
[`docs/stage-5-traveler-data-integrity.md`](docs/stage-5-traveler-data-integrity.md).
As operações de usuários e os bulk temporários da Etapa 6 estão descritos em
[`docs/stage-6-users-compatibility.md`](docs/stage-6-users-compatibility.md).

## Rotas

| Rota | Papel | Estado |
| --- | --- | --- |
| `/` | Público | Login migrado |
| `/admin` | Admin | Dashboard migrado |
| `/admin/viajantes` | Admin | Viajantes da viagem migrados |
| `/admin/pagamentos` | Admin | Placeholder |
| `/admin/transporte` | Admin | Placeholder |
| `/admin/hotel` | Admin | Placeholder |
| `/admin/cadastros` | Admin | Cadastro Global migrado |
| `/admin/configuracoes` | Admin | Configurações da viagem migradas |
| `/viajante` | Viajante | Dashboard e passagem digital migrados |
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
