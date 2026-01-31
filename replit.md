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
- Os arquivos `financeiro_bl.postgresql.sql` e `financeiro_bl.dbml` sao referencia PT-BR e nao devem ser aplicados no banco em runtime.

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

## Registro PDCA

### 2026-01-27: CRUD Reserva de Emergência
- **Plan:** Escopo definido para adicionar operações de editar/excluir na Reserva de Emergência, seguindo padrão já existente em Goals e Investments
- **Do:** 
  - Backend: métodos updateReserve/deleteReserve em storage.ts
  - Backend: rotas PATCH/DELETE /reserve/:id em routes.ts
  - API Client: métodos updateReserve/deleteReserve em api.ts
  - Frontend: modal de edição, botões de editar/excluir, confirmação de exclusão em Investments.tsx
- **Check:** Revisão aprovada pelo Architect - implementação segue padrões existentes
- **Act:** Documentação atualizada, aplicação publicada (commit 3c0ec9f2)
- **Pendências:** Validar regra de limite de 1 reserva na UI (observação do Architect)

### 2026-01-30: Recorrencias mensais (parcelamentos e fixos)
- **Plan:** Definir modelo de recorrencia e estrategia incremental sem quebra.
- **Do:**
  - Modelo: `recurrences` + `transactions.recurrenceId` (DBML/SQL/Drizzle).
  - Backend: CRUD de recorrencias e endpoint de geracao mensal.
  - Rotina idempotente de geracao com ajuste de dia do mes.
  - Validacoes de negocio para `group/type/status` e `installmentTotal`.
  - Backfill manual para parcelamentos legados.
- **Check:** Testes manuais de criacao, geracao, idempotencia e pausa.
- **Act:** Documentacao atualizada em `docs/MODELO_DADOS.md`, `docs/API_CONTRACT.md` e `docs/USAGE.md`.
