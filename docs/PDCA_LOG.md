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

## 2026-02-05 — Deploy VM Oracle Free (acesso externo + nginx)
- **Plan:** Diagnosticar porque a aplicacao Node/Express nao ficava acessivel fora do localhost e padronizar deploy (nginx + systemd + firewall).
- **Do:**
  - Diagnostico: Node em `0.0.0.0:3001`, Nginx em `:80`, mas `iptables` rejeitava conexoes novas exceto `22`.
  - Infra: liberado `80/443` no `iptables` antes do `REJECT` e persistido com `netfilter-persistent` (normalizado com `iptables-restore` a partir de `/etc/iptables/rules.v4`).
  - Backend: corrigido catch-all em `server/index.ts` para nao pendurar `/api` (chama `next()` quando path inicia com `/api`).
  - Deploy: rebuild `npm run build` e restart do servico `proj-financa` na VM.
- **Check:** Externo: `http://137.131.233.220/` retorna `200` e `http://137.131.233.220/api/` retorna `404` imediato (sem timeout).
- **Act:** Runbook atualizado em `docs/RUNBOOK.md` com checklist de deploy (nginx/systemd/firewall/ingress OCI). 

## 2026-02-06 — CRUD de Categorias (Lancamentos)
- **Plan:** Habilitar criar/editar/excluir categorias diretamente na tela de Lancamentos, alinhando contrato e UX antes do codigo.
- **Do:**
  - Docs: atualizado `docs/API_CONTRACT.md` com POST/PATCH/DELETE `/api/categories` e erros `400/404/409`.
  - Docs: atualizado `docs/UX_BLUEPRINT.md` com formulario inline de categoria e confirmacao inline de exclusao (sem modal).
  - Backend: validacoes para categorias (name/kind/monthlyBudgetCents) e bloqueio de exclusao com `409` quando categoria estiver em uso por `transactions` ou `recurrences` (`server/storage.ts` + `server/index.ts`).
  - Frontend: UI na tela `client/src/pages/Transactions.tsx` com botao "+ Nova categoria", edicao e exclusao inline; recarrega lista e seleciona categoria criada no filtro.
- **Check:** Fluxo completo testado manualmente (criar/editar/excluir + erro de exclusao por uso).
- **Act:** Registro de testes atualizado em `docs/TEST_LOG.md`.

## 2026-02-06 — Refinamento de UI (planilha mensal viva)
- **Plan:** Melhorar legibilidade e consistencia visual do front, sem alterar comportamentos fora do `docs/UX_BLUEPRINT.md` (desktop-first, sem animacoes).
- **Do:**
  - Frontend: definido sistema de tokens (papel/tinta/caneta azul) e padrao de componentes (cartao, botoes, formularios, tabelas) em `client/src/index.css`.
  - Frontend: unificado cabecalhos de pagina e seletor de mes/ano (`barra-topo`, `seletor-mes`) e destaque do Saldo como elemento principal na visao do mes (`client/src/pages/Dashboard.tsx`).
  - Frontend: corrigidos estilos ausentes usados em telas (ex: `btn-primary`, `btn-danger`, `form-group`) e padronizado layout do Header (`client/src/components/Header.tsx`).
- **Check:** `npm run build` executado com sucesso.
- **Act:** Registro de testes atualizado em `docs/TEST_LOG.md`.

## 2026-02-06 — Performance do Front (code-splitting + tabelas)
- **Plan:** Reduzir bundle inicial e melhorar performance percebida em navegacao (sem mudar regras/fluxos de UX).
- **Do:**
  - Frontend: code-splitting por rota com `React.lazy` + `Suspense` (`client/src/App.tsx`).
  - Frontend: header sticky e cabecalho de tabelas fixo em areas com scroll (`client/src/index.css`, `client/src/pages/Transactions.tsx`, `client/src/pages/Recurrences.tsx`).
  - Frontend: otimizacao de render em tabela de Lancamentos (mapas `id->nome` via `useMemo`) (`client/src/pages/Transactions.tsx`).
- **Check:** `npm run build` executado com sucesso; output em chunks por pagina.
- **Act:** Registro de testes atualizado em `docs/TEST_LOG.md`.
