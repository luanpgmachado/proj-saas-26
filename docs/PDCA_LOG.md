# Registro PDCA

## 2026-01-27 — CRUD Reserva de Emergencia
- **Plan:** Escopo definido para adicionar operacoes de editar/excluir na Reserva de Emergencia, seguindo padrao ja existente em Goals e Investments.
- **Do:**
  - Backend: metodos updateReserve/deleteReserve em `server/storage.ts`.
  - Backend: rotas PATCH/DELETE `/reserve/:id` em `server/routes.ts`.
  - API Client: metodos updateReserve/deleteReserve em `client/src/lib/api.ts`.
  - Frontend: modal de edicao, botoes de editar/excluir, confirmacao de exclusao em `client/src/pages/Investments.tsx`.
- **Check:** Revisao aprovada pelo Architect; implementacao segue padroes existentes.
- **Act:** Documentacao atualizada, aplicacao publicada (commit 3c0ec9f2).
- **Pendencias:** Validar regra de limite de 1 reserva na UI (observacao do Architect).

## 2026-01-30 — Recorrencias mensais (parcelamentos e fixos)
- **Plan:** Definir modelo de recorrencia e estrategia incremental sem quebra.
- **Do:**
  - Modelo: `recurrences` + `transactions.recurrenceId` (DBML/SQL/Drizzle).
  - Backend: CRUD de recorrencias e endpoint de geracao mensal.
  - Rotina idempotente de geracao com ajuste de dia do mes.
  - Validacoes de negocio para `group/type/status` e `installmentTotal`.
  - Backfill manual para parcelamentos legados.
- **Check:** Testes manuais de criacao, geracao, idempotencia e pausa.
- **Act:** Documentacao atualizada em `docs/MODELO_DADOS.md`, `docs/API_CONTRACT.md` e `docs/USAGE.md`.

## 2026-01-31 — Reorganizacao de documentacao (Diataxis)
- **Plan:** Separar uso, referencia e historico para reduzir contexto dos agentes.
- **Do:**
  - Criado `docs/INDEX.md` com mapa de documentacao e leituras minimas.
  - Criado `docs/TEST_LOG.md` para historico de testes.
  - Criado `docs/PDCA_LOG.md` para historico PDCA.
  - Movidos arquivos PT-BR de referencia para `docs/REFERENCIAS_PT_BR/`.
- **Check:** Alinhamento entre `docs/`, `AGENTS.md` e `replit.md`.
- **Act:** `replit.md` e `docs/USAGE.md` atualizados com ponteiros para os logs.
