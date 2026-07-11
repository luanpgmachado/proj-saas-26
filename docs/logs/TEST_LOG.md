# Registro de Testes

## 2026-04-16 — DEV-222/DEV-223: Dashboard (Já Pago/Falta Pagar) + barra de totais em Lançamentos
- Ambiente: local (build produção + Node em `http://127.0.0.1:3001`).
- Verificações:
  - `npm run build` OK.
  - Dashboard (`/`): cards com rótulos `Já Pago` e `Falta Pagar` visíveis.
  - Lançamentos (`/transactions`): barra resumo abaixo chips com `Total Geral` e `Total Pago`.
  - Lançamentos (`/transactions`): troca aba `Pagos` mantém barra e estado atualizado.
- Evidência Playwright:
  - `/`: `Já Pago`, `Falta Pagar`, subtítulos operacionais presentes.
  - `/transactions`: `Total Geral`, `Total Pago`, `Resumo da lista filtrada visível.` presentes.
- Limitação:
  - API local indisponível — banco não conectado (`ECONNREFUSED ::1:5433`), dados zerados.
  - Rodada valida layout, posicionamento, renderização. Recálculo com massa real pendente (DB ativo).

## 2026-03-14 — Migracao visual Layout 3.0 (DEV-162)
- Ambiente: local (Vite + Express).
- Verificacoes:
  - `npm run build` OK.
  - Rotas com novo layout: `/`, `/transactions`, `/recurrences`, `/categories`, `/payment-methods`, `/annual`, `/goals`, `/investments`.
  - Modais reestilizados: lancamento e confirmacao (exclusoes/geracao).
- Validacao visual:
  - Comparar manualmente com prints em `artifacts/playwright/layout-3.0-lovable/`.

## 2026-03-14 — DEV-162: Validacao CRUD visual + contrato (Playwright) — Layout 3.0
- Ambiente: local (`http://localhost:5000`).
- Sessao Playwright: `dev162`.
- Evidencias: `artifacts/playwright/dev-162-20260313-230715/.playwright-cli/`.
- Fluxos validados (matriz prioritaria):
  - Categorias (`/categories`): criar/editar/excluir + bloqueio `409` em uso.
  - Lancamentos (`/transactions`): criar/editar/excluir + toggle `Pago` só para `exit`.
  - Metodos Pagamento (`/payment-methods`): criar/editar/excluir (nao-cartao e cartao com fechamento/vencimento).
  - Recorrencias (`/recurrences`): criar/editar/pausar/deletar/reativar + `Gerar Mes` (`POST /api/recurrences/generate?month=YYYY-MM`).
- Fluxos validados (matriz secundaria):
  - Metas (`/goals`): criar/editar/excluir + criar/excluir aporte.
  - Reserva/Investimentos (`/investments`): criar/editar/excluir reserva + aporte; criar/editar/excluir investimento + aporte.
  - Smoke: Dashboard (`/`) e Panorama Anual (`/annual`) carregando e chamando endpoints canônicos.
- Bugs corrigidos:
  - `client/src/pages/Recurrences.tsx`: `ReferenceError: categoryId is not defined` corrigido, payload/validacoes ajustados.
  - `client/src/pages/PaymentMethods.tsx`: acoes cartao com `z-index` — evita clique bloqueado por elementos do card.
- Observacoes (nao-bloqueantes):
  - `GET /api/reserve` retorna `404` sem reserva (UI trata com botao "Criar", mas browser registra erro).
  - `GET /favicon.ico` retorna `404` no dev server.

## 2026-01-30 — Backend local (recorrencias)
- Ambiente: local com tunel SSH, `DATABASE_URL` apontando VM.
- Cenarios:
  - Financiamento: startDate 2026-01-18, dayOfMonth 18, installmentTotal 18, amountCents 53700.
  - Aluguel: startDate 2026-01-15, dayOfMonth 15, endDate 2029-12-31, amountCents 230000.
  - Compra Monitor: startDate 2026-01-18, dayOfMonth 18, installmentTotal 5, amountCents 10000.
- Resultados:
  - Criacao e listagem OK.
  - Geracao 2026-02: 3 transacoes (2 parceladas + 1 fixa).
  - Idempotencia OK: nova geracao mesmo mes sem duplicatas.
  - Pausa aluguel OK: geracao 2026-03 sem transacao de aluguel.

## 2026-01-31 — Backend no Replit (recorrencias)
- Ambiente: Replit + Postgres Neon.
- Recorrencias (ids 4, 5, 6):
  - Financiamento (id=4): parcelado, 18x R$537,00, dia 18, startDate 2026-01-18, endDate 2027-06-18.
  - Aluguel (id=5): fixo, R$2.300,00, dia 15, startDate 2026-01-15, endDate 2029-12-31.
  - Monitor (id=6): parcelado, 5x R$100,00, dia 18, startDate 2026-01-18, endDate 2026-05-18.
- Resultados:
  - Geracao 2026-02: 3 transacoes (Financiamento 2/18, Aluguel, Monitor 2/5).
  - Idempotencia OK: nova geracao retornou array vazio.
  - Pausa Aluguel (id=5): status `paused`.
  - Geracao 2026-03: 2 transacoes (Financiamento 3/18, Monitor 3/5). Aluguel pausado nao gerou.
- Validacoes:
  - `recurrenceId` presente em todas transacoes.
  - `installmentIndex` incrementando corretamente (2, 3, ...).
  - `installmentTotal` consistente (18 e 5).
- Conclusao: backend conforme `docs/canonicos/API_CONTRACT.md` e `docs/canonicos/MODELO_DADOS.md`.

## 2026-02-06 — Categorias (CRUD via Tela de Lancamentos)
- Ambiente: local (Vite + Express).
- Cenarios:
  - Criar categoria (nome + tipo + orcamento opcional).
  - Editar selecionada no filtro.
  - Excluir sem referencias (sucesso).
  - Excluir em uso (bloqueio `409` com mensagem).
- Verificacoes:
  - Lista recarrega apos salvar/excluir.
  - Categoria criada fica selecionada no filtro.
  - Erros API aparecem na tela.

## 2026-02-06 — UI (refino visual)
- Ambiente: local.
- Verificacoes:
  - `npm run build` OK.
  - Sem animacoes CSS (removido `transition` da barra progresso).

## 2026-02-06 — Performance (front)
- Ambiente: local.
- Verificacoes:
  - `npm run build` OK.
  - Chunks por pagina gerados (code-splitting por rota).

## 2026-02-13 — Controle de Pagamento (Lancamentos)
- Ambiente: local.
- Build: `npm run build` OK.
- Banco:
  - Local: `npm run db:push` falhou (`ECONNREFUSED 127.0.0.1:5433`).
  - VM Oracle: `npm run db:push` OK — colunas `is_paid` e `paid_at` em `transactions` aplicadas.
- API (VM Oracle):
  - PATCH exit marcar pago: `{ "isPaid": true, "paidAt": "YYYY-MM-DD" }` OK.
  - PATCH exit desmarcar: `{ "isPaid": false, "paidAt": null }` OK.
  - PATCH entry marcar pago: retorna `400` OK.
  - PATCH type exit pago -> entry: auto-limpa `isPaid=false`, `paidAt=null` OK.
  - GET `/api/months/2026-02/summary`: retorna `paidExitsCents` e `realBalanceCents` OK.
- UI:
  - Build contem textos esperados (Dashboard: "Valor Pago", "Saldo Real"; Lancamentos: coluna "Pago").

## 2026-02-14 — Deploy Coolify (Hostinger VPS)
- Ambiente: Coolify em `31.97.240.105`, app `proj-financa-v1`.
- Validacoes:
  - Deploy via MCP: `status=finished`.
  - `GET /` -> `200 OK` em `http://mwooggo4kcoow0wco4wsg80k.31.97.240.105.sslip.io/`.
  - `GET /api/` -> `404` imediato (sem timeout).
  - Banco PostgreSQL criado (`db-proj-financa-v1`), `DATABASE_URL` configurada.
- Pendencia:
  - `GET /api/categories` -> `500` `relation "categories" does not exist` (schema nao aplicado).

## 2026-03-13 — Navegacao (menu lateral)
- Ambiente: local.
- Verificacoes:
  - `npm run build` OK.
  - Menu lateral sticky (header + menu visiveis).
  - Padrao `.barra-topo` aplicado em Recorrencias e Investimentos.
  - A11y: skip link no header (teclado).
  - Grupo ativo destacado no menu.
  - Labels/titulos PT-BR com acentuação (menu + telas principais).
  - Labels formulários/tabelas PT-BR (ex: Descrição, Saída, Método, Mês).

## 2026-03-13 — DEV-154: Validacao CRUD visual + contrato (Playwright)
- Ambiente: local (Vite `http://localhost:5000` + Express `http://localhost:3001/api`).
- Banco: Postgres Docker em `localhost:5433` (`npm run db:push` aplicado).
- Motivacao: antes do fix, API retornava `500` genérico com DB indisponível. Após fix em `server/index.ts`, resposta inclui causa (ex: `ECONNREFUSED`).
- Fluxos validados (matriz prioritaria):
  - Categorias (criar `CODX Categoria 20260313`; criar `CODX Receita 20260313`).
  - Métodos Pagamento (criar `CODX PIX 20260313`).
  - Lançamentos (criar saída `CODX Lanche`; marcar pago; criar entrada `CODX Salário` — confirmar ausência checkbox).
  - Recorrências (criar `CODX Internet`; acionar `Gerar Mês`).
- Evidências Playwright:
  - `artifacts/playwright/dev-154-20260313/01-dashboard.png`
  - `artifacts/playwright/dev-154-20260313/02-transactions.png`
  - `artifacts/playwright/dev-154-20260313/07-metodo-criado.png`
  - `artifacts/playwright/dev-154-20260313/10-transacao-criada.png`
  - `artifacts/playwright/dev-154-20260313/11-transacao-paga.png`
  - `artifacts/playwright/dev-154-20260313/15-transacao-entry-criada.png`
  - `artifacts/playwright/dev-154-20260313/18-recurrence-criada-2.png`
  - `artifacts/playwright/dev-154-20260313/19-gerar-mes.png`
- Divergencias (follow-up, fora DEV-154):
  - Métodos Pagamento expõe `type` PT-BR (PIX/Dinheiro/...) enquanto `docs/canonicos/API_CONTRACT.md` define `cash|transfer|debit|credit_card|other`.
  - `playwright-cli network` registra verbos/URLs/status, sem payload completo (auditoria payload requer captura backend ou interceptação dedicada).

## 2026-02-18 — Recorrencias (endDate obrigatorio para parcelado)
- Ambiente: local.
- Verificacoes:
  - `npm run build` OK.
  - Backend exige `endDate` quando `group = installment` em `POST/PATCH /api/recurrences`.
  - Front exige `dataFim` em grupo parcelado; rótulo muda para "Data fim" (sem "(opcional)").
- Observacao:
  - Cenarios manuais CRUD/geracao nao executados; validacao funcional UI/API pendente.

## 2026-02-18 — Validacao de ambiente em producao (deploy)
- Ambiente: producao (Coolify + dominio oficial).
- Evidencias:
  - Commit publicado em `main`: `6d1cecd97564b7e4875537e6a58274002ef11011`.
  - `curl -4 -I https://meucontrole.cloud` -> `200 OK`.
  - `curl -4 -I https://meucontrole.cloud/api/recurrences` -> `200 OK`.
  - `curl -4 -I http://mwooggo4kcoow0wco4wsg80k.31.97.240.105.sslip.io` -> `404` (endpoint provisório fora dominio oficial).
- Resultado: ambiente oficial acessivel, API respondendo.

## 2026-02-19 — Validacao de regra operacional (nao alterar banco de producao)
- Ambiente: documentacao canonica.
- Verificacoes:
  - `docs/canonicos/RULES.md`: proibicao explicita de alteracao banco em producao.
  - `docs/canonicos/RUNBOOK.md`: checklist pre-deploy e comandos proibidos.
  - `docs/USAGE.md`: sem instrucao de escrita em banco producao; lista comandos proibidos.
- Resultado: regra operacional consolidada — previne sobrescrita dados em producao.

## 2026-02-19 — Bugfix DEV-94 (auto-geracao no update de recorrencias)
- Ambiente: local (`http://localhost:3001/api`).
- Build: `npm run build` OK.
- Cenario:
  - Criada recorrencia `installment`: `startDate=2026-03-10`, `endDate=2026-04-10`, `installmentTotal=2`.
  - Antes update: `2` transacoes geradas confirmadas.
  - Editada para `group=fixed`, `endDate=null`.
  - Apos update: `24` transacoes para mesmo `recurrenceId` (range 24 meses).
- Resultado: auto-geracao em `PATCH /api/recurrences/{id}` funciona conforme regra 2 anos para fixo sem data fim.

## 2026-03-13 — Validacao estrutural do skill de teste visual
- Ambiente: local, sem execucao contra app publicada.
- Artefatos preparados:
  - skill `playwright-crud-visual-contrato`
  - referencia `proj-financa-v1.md` com matrizes prioritaria e secundaria
- Verificacoes planejadas:
  - validacao automatica via `quick_validate.py`
  - uso futuro do skill contra URL alvo para gerar evidencias UI/rede
- Observacao: nenhuma rodada funcional no navegador; apenas preparacao e validacao estrutural do skill.

## 2026-03-14 — DEV-163/DEV-164: Filtro global de competencia mensal (sidebar)
- Ambiente: local.
- Verificacoes:
  - `npm run build` OK.
- Checklist manual (UI):
  - Alterar competência no seletor global sidebar (input mês + setas).
  - Dashboard recarrega cards/blocos conforme mês ativo.
  - Lançamentos respeita mesmo mês.
  - Recorrências: "Gerar Mês" usa competência ativa.
  - Panorama Anual: continua usando só seletor de ano.

## 2026-07-11 - DEV-262 - Validacao acesso read-only relatorios
- Ambiente: PostgreSQL producao `db-proj-financa-v1` no Coolify, container `q80kcs0gsck0co4sgc4sgcgk`, database `financeiro_bl`.
- Segredo: senha da role nao registrada em git; variaveis de usuario Windows atualizadas (`REPORT_DB_NAME`, `REPORT_DB_USER`, `REPORT_DB_PASSWORD`, `REPORT_DATABASE_URL`).
- Comando operacional: validacao executada via SSH e `docker exec` com `psql` do container PostgreSQL.
- Resultado:
  - `SELECT current_database(), current_user;` passou.
  - SELECTs em `transactions`, `categories`, `payment_methods` passaram.
  - `CREATE TABLE public.report_readonly_probe` falhou como esperado.
  - `INSERT`, `UPDATE`, `DELETE` em `categories` falharam como esperado.
  - Saida final: `All read-only validation probes passed.`
- Observacao: `psql` nao estava no PATH local. Tentativa de instalacao via `winget install PostgreSQL.PostgreSQL.16` foi interrompida apos o instalador ficar preso; uso imediato documentado via SSH/container.
