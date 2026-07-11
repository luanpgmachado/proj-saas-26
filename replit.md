# Finança Familiar

## Overview
Family finance SaaS app (desktop-first) for monthly income/expense management. React frontend, Express/PostgreSQL backend.

## Project Structure
- `AGENTS.md` - PDCA flow and context engineering rules.
- `client/` - React frontend (Vite)
- `server/` - Express backend API
- `shared/` - Shared types and database schema (Drizzle ORM)
- `docs/` - Design documentation and specifications
  - `docs/canonicos/MODELO_DADOS.md` - Data model and relationships

## Tech Stack
- **Frontend**: React 18, Wouter (routing), Vite
- **Backend**: Express.js, Node.js 20
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: TypeScript, Vite

## Development
Run `npm run dev` to start both frontend and backend concurrently:
- Frontend: http://localhost:5000
- Backend API: http://localhost:3001/api

## Database
PostgreSQL via Drizzle ORM. Run `npm run db:push` to sync schema.

### Dual Database Configuration
Two DB connections with automatic fallback:
- **REPLIT_DB_URL** (priority): Internal Replit PostgreSQL
- **DATABASE_URL** (fallback): External PostgreSQL (ex: Coolify/VPS)

Connection priority: `REPLIT_DB_URL || DATABASE_URL`

Environment guidance:
- **Development (Replit)**: Set `REPLIT_DB_URL` for internal Replit DB
- **Production (Coolify/VPS)**: Set only `DATABASE_URL` pointing to production DB

Current setup:
- `REPLIT_DB_URL` configured in dev for Replit's internal DB
- `DATABASE_URL` remains as secret for external production DB

### Padronizacao de schema
- Schema oficial: `shared/schema.ts` (tabelas em ingles).
- Arquivos em `docs/REFERENCIAS_PT_BR/` sao referencia PT-BR, nao aplicar no banco em runtime.

### Documentacao e logs
- Mapa de docs: `docs/INDEX.md`
- Registro PDCA: `docs/logs/PDCA_LOG.md`
- Registro de testes: `docs/logs/TEST_LOG.md`

## API Endpoints
See `docs/canonicos/API_CONTRACT.md` for full API docs.

Main endpoints:
- `GET /api/months/{month}/summary` - Monthly summary
- `GET /api/transactions` - List transactions with filters
- `POST /api/transactions` - Create transaction
- `GET /api/categories` - List categories
- `GET /api/payment-methods` - List payment methods
- `GET /api/years/{year}/summary` - Annual summary

## Recent Changes
- 2026-01-19: Initial project setup from docs-only repo
  - Full-stack structure created
  - React frontend with all main views
  - Express API following API contract
  - PostgreSQL + Drizzle ORM setup
  - Error handling and date filtering
- 2026-01-20: New transaction modal on dashboard
  - Launch modal form with category/payment method loading
  - Dashboard button wired, submission flow, data refresh after save
  - Modal behavior documented in UX blueprint
- 2026-01-26: CRUD completo para Reserva de Emergência
  - Métodos updateReserve e deleteReserve adicionados no storage e API
  - Rotas PATCH e DELETE /reserve/:id implementadas
  - UI editar/excluir reserva com modais e confirmação
- 2026-01-30: Recorrencias mensais (parcelamentos e fixos)
  - Modelo de dados atualizado: entidade `recurrences` e `transactions.recurrenceId`
  - Endpoints `/api/recurrences` e `/api/recurrences/generate` adicionados
  - Rotina de geracao mensal idempotente com validacoes de negocio
  - Script backfill para parcelamentos legados (`server/backfill_recorrencias.ts`)
  - Docs: regras de recorrencia e padrao fixos/reajuste em `docs/`
  - Schema padronizado: uso exclusivo de `shared/schema.ts` em runtime
- 2026-01-31: Reorganizacao de documentacao
  - Mapa de docs em `docs/INDEX.md`
  - Historicos separados em `docs/logs/PDCA_LOG.md` e `docs/logs/TEST_LOG.md`


### 2026-01-31: Testes de API no Replit
- **Plan:** Validar endpoints principais conforme API_CONTRACT.md. REPLIT_DB_URL ativo.
- **Do:** Testes via curl:
  - `GET /api/categories` - OK (15 categorias)
  - `GET /api/payment-methods` - OK (2 metodos: PIX, ITAU)
  - `GET /api/transactions?month=2026-01` - OK (1 transacao com recurrenceId)
  - `GET /api/recurrences` - OK (lista vazia)
  - `POST /api/recurrences/generate?month=2026-02` - OK (lista vazia, sem recorrencias)
- **Check:** Todos endpoints conforme API_CONTRACT.md. `npm run db:push` necessario — tabela recurrences nao existia.
- **Act:** Schema sincronizado. PDCA atualizado.
- **Pendencias:** Nenhuma. MCP Linear nao configurado — resultados registrados no replit.md.

### 2026-01-31: Validacao de Recorrencias no Replit (com Linear)
- **Plan:** Validar recorrencias com dados reais no Replit. Linear via MCP.
- **Do:**
  - 3 recorrencias criadas:
    - Financiamento (id=4): parcelado, 18x R$537,00, dia 18.
    - Aluguel (id=5): fixo, R$2.300,00, dia 15, ate 2029.
    - Monitor (id=6): parcelado, 5x R$100,00, dia 18.
  - Geracao 2026-02: 3 transacoes (Financiamento 2/18, Aluguel, Monitor 2/5).
  - Idempotencia: segunda geracao mesmo mes retornou array vazio (OK).
  - Pausa Aluguel (id=5): status → "paused".
  - Geracao 2026-03: 2 transacoes (Financiamento 3/18, Monitor 3/5). Aluguel pausado NAO gerou.
- **Check:**
  - recurrenceId presente em todas transacoes geradas.
  - installmentIndex incrementando corretamente (2, 3).
  - installmentTotal consistente (18 e 5).
  - Pausa funcionando: recorrencia pausada nao gera transacoes.
- **Act:** Docs atualizados em `docs/USAGE.md` (secao 11.1). PDCA registrado.
- **Pendencias:** Nenhuma. Backend conforme API_CONTRACT.md e MODELO_DADOS.md.

### 2026-01-31: Front-end de Recorrencias
- **Plan:** Tela de gerenciamento de recorrencias no front-end.
- **Do:**
  - Pagina `client/src/pages/Recurrences.tsx`: listagem, criacao, edicao, acoes de status.
  - Formulario inline (sem modal) para nova recorrencia e edicao.
  - Validacoes: descricao obrigatoria, valor > 0, data inicio obrigatoria, installmentTotal obrigatorio se parcelado.
  - Acoes por linha: editar, pausar, cancelar, reativar.
  - Botao "Gerar Mes" com feedback de quantidade de transacoes criadas.
  - Rota /recurrences adicionada em App.tsx.
  - Link "Recorrencias" adicionado em Header.tsx.
  - `docs/canonicos/UX_BLUEPRINT.md` atualizado com spec da tela.
- **Check:** Tela funcionando, validacoes aplicadas, acoes de status corretas.
- **Act:** UX_BLUEPRINT.md atualizado. PDCA registrado.