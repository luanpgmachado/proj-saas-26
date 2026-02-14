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

## 2026-02-14 — Migracao de deploy para Coolify (Hostinger VPS)
- **Plan:** Migrar o fluxo de deploy manual em VM Oracle para deploy automatico no Coolify em nova VPS (`31.97.240.105`) e ajustar documentacao operacional.
- **Do:**
  - Configurado app no Coolify via MCP (`build_pack=dockerfile`, app `proj-financa-v1`).
  - Criado PostgreSQL no Coolify para o projeto (`db-proj-financa-v1`) e obtido `internal_db_url`.
  - Adicionado `Dockerfile` e `.dockerignore` no repositorio para build do Coolify.
  - Ajustado `Dockerfile` para `npm ci --include=dev` e start com `npm run db:push && node dist/server.js`.
  - Atualizados `docs/RUNBOOK.md`, `docs/USAGE.md` e `replit.md` para o novo fluxo (Coolify + DNS Hostinger manual).
- **Check:** Deploy via MCP executado; build inicial falhou por ausencia de `Dockerfile` no commit remoto anterior (diagnostico registrado nos logs do deployment no Coolify).
- **Act:** Publicar novo commit no GitHub e redeployar app no Coolify com `DATABASE_URL` apontando para o Postgres criado.

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

## 2026-02-13 — Controle de Pagamento (Lancamentos Mensais)
- **Plan:** Adicionar controle de pagamento em lancamentos (`transactions`) do tipo `exit`, com toggle otimista na UI e ajustes de saldo (Real vs Projetado), sem tocar recorrencias.
- **Do:**
  - Docs: atualizados `docs/MODELO_DADOS.md`, `docs/API_CONTRACT.md`, `docs/UX_BLUEPRINT.md`.
  - Modelo: adicionados `transactions.isPaid` e `transactions.paidAt` em `shared/schema.ts`.
  - Backend: regras de pagamento em `server/storage.ts` (somente `exit` pode ser pago; auto-limpa ao virar `entry`) e `getMonthSummary` ampliado com `paidExitsCents` e `realBalanceCents`.
  - Frontend: nova coluna "Pago" na tela `client/src/pages/Transactions.tsx` com checkbox apenas para `exit`, update otimista e feedback visual discreto.
  - Frontend: Dashboard (`client/src/pages/Dashboard.tsx`) com card "Valor Pago" e Saldo Real como principal, Saldo Projetado como secundario.
  - Estrutura: criado `client/src/model/transacao.ts` (model) e `client/src/service/transacoes.service.ts` (service).
- **Check:**
  - Build: `npm run build` OK (local e na VM).
  - DB: `npm run db:push` OK na VM Oracle (adicionadas colunas em `transactions`).
  - API: cenarios de toggle e regras validados (exit paga/despaga, entry bloqueado, auto-limpeza ao virar entry) e `MonthSummary` com `paidExitsCents` + `realBalanceCents`.
  - Externo: `http://137.131.233.220/` e `http://137.131.233.220/api/months/2026-02/summary` retornando `200`.
- **Act:**
  - Registro de testes atualizado em `docs/TEST_LOG.md` com evidencias da validacao.
  - Deploy aplicado na VM Oracle (`proj-financa-v1`) com `npm run build` e restart do `proj-financa.service`.
