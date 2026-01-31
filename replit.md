# Finança Familiar

## Overview
A family finance SaaS application (desktop-first) for managing monthly income and expenses. Built with React frontend and Express/PostgreSQL backend.

## Project Structure
- `AGENTS.md` - PDCA flow and context engineering rules.
- `client/` - React frontend (Vite)
- `server/` - Express backend API
- `shared/` - Shared types and database schema (Drizzle ORM)
- `docs/` - Design documentation and specifications
  - `docs/MODELO_DADOS.md` - Data model and relationships

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
PostgreSQL database managed via Drizzle ORM. Run `npm run db:push` to sync schema changes.

### Dual Database Configuration
The application supports two database connections with automatic fallback:
- **REPLIT_DB_URL** (priority): Internal Replit PostgreSQL database
- **DATABASE_URL** (fallback): External VM PostgreSQL database

The connection priority is: `REPLIT_DB_URL || DATABASE_URL`

Environment guidance:
- **Development (Replit)**: Set `REPLIT_DB_URL` to use the internal Replit database
- **Production (VM)**: Set only `DATABASE_URL` pointing to the VM database

Current setup:
- `REPLIT_DB_URL` configured in development environment for Replit's internal database
- `DATABASE_URL` remains as secret for external VM database connection

### Padronizacao de schema
- O schema oficial do app e o definido em `shared/schema.ts` (tabelas em ingles).
- Os arquivos em `docs/REFERENCIAS_PT_BR/` sao referencia PT-BR e nao devem ser aplicados no banco em runtime.

### Documentacao e logs
- Mapa de docs: `docs/INDEX.md`
- Registro PDCA: `docs/PDCA_LOG.md`
- Registro de testes: `docs/TEST_LOG.md`

## API Endpoints
See `docs/API_CONTRACT.md` for full API documentation.

Main endpoints:
- `GET /api/months/{month}/summary` - Monthly summary
- `GET /api/transactions` - List transactions with filters
- `POST /api/transactions` - Create transaction
- `GET /api/categories` - List categories
- `GET /api/payment-methods` - List payment methods
- `GET /api/years/{year}/summary` - Annual summary

## Recent Changes
- 2026-01-19: Initial project setup from documentation-only repository
  - Created full-stack application structure
  - Implemented React frontend with all main views
  - Built Express API following API contract
  - Set up PostgreSQL database with Drizzle ORM
  - Added error handling and proper date filtering
- 2026-01-20: Added new transaction modal on the dashboard
  - Created the launch modal form with category and payment method loading
  - Wired dashboard button, submission flow, and data refresh after save
  - Documented the modal behavior in the UX blueprint
- 2026-01-26: CRUD completo para Reserva de Emergência
  - Adicionados métodos updateReserve e deleteReserve no storage e API
  - Rotas PATCH e DELETE /reserve/:id implementadas
  - UI de editar/excluir reserva com modais e confirmação
- 2026-01-30: Recorrencias mensais (parcelamentos e fixos)
  - Modelo de dados atualizado com entidade `recurrences` e `transactions.recurrenceId`
  - Endpoints `/api/recurrences` e `/api/recurrences/generate` adicionados
  - Rotina de geracao mensal idempotente e validacoes de negocio
  - Script de backfill para parcelamentos legados (`server/backfill_recorrencias.ts`)
  - Documentacao: regras de recorrencia e padrao para fixos/reajuste em `docs/`
  - Padronizacao de schema: uso exclusivo de `shared/schema.ts` em runtime
- 2026-01-31: Reorganizacao de documentacao
  - Mapa de docs em `docs/INDEX.md`
  - Historicos separados em `docs/PDCA_LOG.md` e `docs/TEST_LOG.md`


### 2026-01-31: Testes de API no Replit
- **Plan:** Validar endpoints principais conforme API_CONTRACT.md. REPLIT_DB_URL ativo.
- **Do:** Testes via curl nos endpoints:
  - `GET /api/categories` - OK (15 categorias retornadas)
  - `GET /api/payment-methods` - OK (2 metodos retornados: PIX, ITAU)
  - `GET /api/transactions?month=2026-01` - OK (1 transacao retornada com recurrenceId)
  - `GET /api/recurrences` - OK (lista vazia, nenhuma recorrencia criada)
  - `POST /api/recurrences/generate?month=2026-02` - OK (lista vazia, sem recorrencias para gerar)
- **Check:** Todos os endpoints respondem conforme API_CONTRACT.md. Foi necessario executar `npm run db:push` para sincronizar schema (tabela recurrences nao existia).
- **Act:** Schema sincronizado. Documentacao PDCA atualizada.
- **Pendencias:** Nenhuma. MCP Linear nao configurado - resultados registrados no replit.md.

### 2026-01-31: Validacao de Recorrencias no Replit (com Linear)
- **Plan:** Validar recorrencias com dados reais no Replit. Linear configurado via MCP.
- **Do:**
  - Criadas 3 recorrencias de teste:
    - Financiamento (id=4): parcelado, 18x R$537,00, dia 18.
    - Aluguel (id=5): fixo, R$2.300,00, dia 15, ate 2029.
    - Monitor (id=6): parcelado, 5x R$100,00, dia 18.
  - Geracao 2026-02: 3 transacoes criadas (Financiamento 2/18, Aluguel, Monitor 2/5).
  - Idempotencia: segunda geracao do mesmo mes retornou array vazio (OK).
  - Pausa de Aluguel (id=5): status alterado para "paused".
  - Geracao 2026-03: 2 transacoes criadas (Financiamento 3/18, Monitor 3/5). Aluguel pausado NAO gerou.
- **Check:**
  - recurrenceId presente em todas transacoes geradas.
  - installmentIndex incrementando corretamente (2, 3).
  - installmentTotal consistente (18 e 5).
  - Pausa funcionando: recorrencia pausada nao gera novas transacoes.
- **Act:** Documentacao atualizada em `docs/USAGE.md` (secao 11.1). PDCA registrado.
- **Pendencias:** Nenhuma. Backend funcionando conforme API_CONTRACT.md e MODELO_DADOS.md.

### 2026-01-31: Front-end de Recorrencias
- **Plan:** Implementar tela de gerenciamento de recorrencias no front-end.
- **Do:**
  - Criada pagina `client/src/pages/Recurrences.tsx` com listagem, criacao, edicao e acoes de status.
  - Formulario inline (sem modal) para nova recorrencia e edicao.
  - Validacoes no front: descricao obrigatoria, valor > 0, data inicio obrigatoria, installmentTotal obrigatorio se parcelado.
  - Acoes por linha: editar, pausar, cancelar, reativar.
  - Botao "Gerar Mes" com feedback de quantidade de transacoes criadas.
  - Adicionada rota /recurrences no App.tsx.
  - Adicionado link "Recorrencias" no Header.tsx.
  - Atualizado docs/UX_BLUEPRINT.md com especificacao da tela.
- **Check:** Tela funcionando, validacoes aplicadas, acoes de status corretas.
- **Act:** Documentacao UX_BLUEPRINT.md atualizada. PDCA registrado.
