# Registro de Testes

## 2026-04-16 — DEV-222/DEV-223: Dashboard (Já Pago/Falta Pagar) + barra de totais em Lançamentos
- Ambiente: local (build de produção + servidor Node em `http://127.0.0.1:3001`).
- Verificações:
  - `npm run build` OK.
  - Dashboard (`/`): cards visíveis com os novos rótulos `Já Pago` e `Falta Pagar`.
  - Lançamentos (`/transactions`): barra de resumo visível abaixo dos chips com `Total Geral` e `Total Pago`.
  - Lançamentos (`/transactions`): troca de aba para `Pagos` mantém barra e estado atualizado da lista filtrada.
- Evidência de navegação (Playwright snapshot textual):
  - `/`: presença de `Já Pago`, `Falta Pagar` e subtítulos operacionais.
  - `/transactions`: presença de `Total Geral`, `Total Pago` e texto `Resumo da lista filtrada visível.`.
- Limitação da rodada:
  - API local indisponível por banco não conectado (`ECONNREFUSED ::1:5433`), resultando em dados zerados.
  - Com isso, esta rodada valida layout, posicionamento e renderização; recálculo com massa real permanece pendente de ambiente com DB ativo.

## 2026-03-14 — Migracao visual Layout 3.0 (DEV-162)
- Ambiente: local (Vite + Express).
- Verificacoes:
  - `npm run build` OK.
  - Rotas renderizando com novo layout: `/`, `/transactions`, `/recurrences`, `/categories`, `/payment-methods`, `/annual`, `/goals`, `/investments`.
  - Modais reestilizados: lancamento e confirmacao (exclusoes/geracao).
- Validacao visual:
  - Comparar manualmente com os prints em `output/playwright/layout-3.0-lovable/`.

## 2026-03-14 — DEV-162: Validacao CRUD visual + contrato (Playwright) — Layout 3.0
- Ambiente: local (`http://localhost:5000`).
- Sessao Playwright: `dev162`.
- Evidencias: `output/playwright/dev-162-20260313-230715/.playwright-cli/`.
- Fluxos validados (matriz prioritaria):
  - Categorias (`/categories`): criar/editar/excluir + bloqueio `409` ao excluir em uso.
  - Lancamentos (`/transactions`): criar/editar/excluir + toggle `Pago` apenas para `exit` (entrada sem checkbox).
  - Metodos de Pagamento (`/payment-methods`): criar/editar/excluir (nao-cartao e cartao com fechamento/vencimento).
  - Recorrencias (`/recurrences`): criar/editar/pausar/deletar/reativar + `Gerar Mes` (`POST /api/recurrences/generate?month=YYYY-MM`).
- Fluxos validados (matriz secundaria):
  - Metas (`/goals`): criar/editar/excluir + criar/excluir aporte.
  - Reserva/Investimentos (`/investments`): criar/editar/excluir reserva + aporte; criar/editar/excluir investimento + aporte.
  - Smoke: Dashboard (`/`) e Panorama Anual (`/annual`) carregando e chamando endpoints canônicos.
- Bugs corrigidos durante a rodada:
  - `client/src/pages/Recurrences.tsx`: corrigido `ReferenceError: categoryId is not defined` e ajustado payload/validacoes.
  - `client/src/pages/PaymentMethods.tsx`: acoes nos cards de cartao com `z-index` para evitar clique bloqueado por elementos do card.
- Observacoes (nao-bloqueantes):
  - `GET /api/reserve` retorna `404` quando nao existe reserva (UI trata com botao "Criar", mas o browser registra erro de recurso ausente).
  - `GET /favicon.ico` retorna `404` no dev server.

## 2026-01-30 — Backend local (recorrencias)
- Ambiente: local com tunel SSH e `DATABASE_URL` apontando para VM.
- Cenarios testados (assumidos para teste):
  - Financiamento: startDate 2026-01-18, dayOfMonth 18, installmentTotal 18, amountCents 53700.
  - Aluguel: startDate 2026-01-15, dayOfMonth 15, endDate 2029-12-31, amountCents 230000.
  - Compra Monitor: startDate 2026-01-18, dayOfMonth 18, installmentTotal 5, amountCents 10000.
- Resultados:
  - Criacao e listagem de recorrencias OK.
  - Geracao 2026-02 criou 3 transacoes (2 parceladas + 1 fixa).
  - Idempotencia OK: nova geracao do mesmo mes nao criou duplicatas.
  - Pausa de aluguel OK: geracao 2026-03 nao criou transacao do aluguel.

## 2026-01-31 — Backend no Replit (recorrencias)
- Ambiente: Replit com banco Postgres Neon integrado.
- Recorrencias criadas (ids 4, 5, 6):
  - Financiamento (id=4): parcelado, 18 parcelas de R$537,00, dia 18, startDate 2026-01-18, endDate 2027-06-18.
  - Aluguel (id=5): fixo, R$2.300,00, dia 15, startDate 2026-01-15, endDate 2029-12-31.
  - Monitor (id=6): parcelado, 5 parcelas de R$100,00, dia 18, startDate 2026-01-18, endDate 2026-05-18.
- Resultados:
  - Geracao 2026-02: criou 3 transacoes (Financiamento parcela 2/18, Aluguel, Monitor parcela 2/5).
  - Idempotencia OK: nova geracao do mesmo mes retornou array vazio (sem duplicatas).
  - Pausa de Aluguel (id=5): status alterado para "paused".
  - Geracao 2026-03: criou 2 transacoes (Financiamento parcela 3/18, Monitor parcela 3/5). Aluguel pausado NAO gerou transacao.
- Validacoes:
  - recurrenceId presente em todas as transacoes geradas.
  - installmentIndex incrementando corretamente (2, 3, ...).
  - installmentTotal consistente com a recorrencia (18 e 5).
- Conclusao: Backend funcionando conforme `docs/API_CONTRACT.md` e `docs/MODELO_DADOS.md`.

## 2026-02-06 — Categorias (CRUD via Tela de Lancamentos)
- Ambiente: local (frontend Vite + backend Express).
- Cenarios testados:
  - Criar categoria pela tela de Lancamentos (nome + tipo + orcamento opcional).
  - Editar categoria selecionada no filtro (alterar nome/tipo/orcamento).
  - Excluir categoria sem referencias (sucesso).
  - Excluir categoria em uso por lancamentos/recorrencias (bloqueio `409` com mensagem).
- Verificacoes:
  - Lista de categorias recarrega apos salvar/excluir.
  - Ao criar, a categoria criada fica selecionada no filtro.
  - Erros de API aparecem na tela (mensagem do backend).

## 2026-02-06 — UI (refino visual)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
  - Sem animacoes CSS introduzidas (removido `transition` da barra de progresso).

## 2026-02-06 — Performance (front)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
  - Output: chunks por pagina gerados (code-splitting por rota).

## 2026-02-13 — Controle de Pagamento (Lancamentos)
- Ambiente: local.
- Build: `npm run build` OK.
- Banco:
  - Local: `npm run db:push` falhou com `ECONNREFUSED` ao conectar em `127.0.0.1:5433` (tunel/DB local indisponivel).
  - VM Oracle: `npm run db:push` OK (aplicadas colunas `is_paid` e `paid_at` em `transactions`).
- API (validado na VM Oracle):
  - PATCH exit -> marcar pago: `{ "isPaid": true, "paidAt": "YYYY-MM-DD" }` OK.
  - PATCH exit -> desmarcar: `{ "isPaid": false, "paidAt": null }` OK.
  - PATCH entry -> tentar marcar pago: retorna `400` OK.
  - PATCH type de exit pago para entry: auto-limpa `isPaid=false` e `paidAt=null` OK.
  - GET `/api/months/2026-02/summary`: retorna `paidExitsCents` e `realBalanceCents` OK.
- UI (validacao tecnica):
  - Build contem textos/colunas esperadas (Dashboard: "Valor Pago" e "Saldo Real"; Lancamentos: coluna "Pago").

## 2026-02-14 — Deploy Coolify (Hostinger VPS)
- Ambiente: Coolify em `31.97.240.105` com app `proj-financa-v1`.
- Validacoes:
  - Deploy via MCP concluido (`status=finished`).
  - URL provisoria responde:
    - `GET /` -> `200 OK` em `http://mwooggo4kcoow0wco4wsg80k.31.97.240.105.sslip.io/`.
    - `GET /api/` -> `404` imediato (sem timeout).
  - Banco PostgreSQL criado no Coolify (`db-proj-financa-v1`) e `DATABASE_URL` configurada na app.
- Pendencia:
  - `GET /api/categories` retorna `500` com `relation "categories" does not exist` (schema ainda nao aplicado no banco novo).

## 2026-03-13 — Navegacao (menu lateral)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
  - UI: menu lateral sticky (header + menu permanecem visiveis).
  - UI: padrao de topo `.barra-topo` aplicado nas telas restantes (Recorrencias e Investimentos).
  - A11y: skip link no header para pular ao conteudo (teclado).
  - UI: grupo ativo destacado no menu lateral.
  - UI: labels e titulos com acentuação PT-BR (menu + telas principais).
  - UI: labels de formulários e tabelas com acentuação PT-BR (ex: Descrição, Saída, Método, Mês).

## 2026-03-13 — DEV-154: Validacao CRUD visual + contrato (Playwright)
- Ambiente: local (Vite `http://localhost:5000` + Express `http://localhost:3001/api`).
- Banco: Postgres via Docker em `localhost:5433` (schema aplicado com `npm run db:push`).
- Motivacao: antes do ajuste, a API retornava `500` com mensagem genérica quando o DB estava indisponível (ex: túnel não ativo). Após o fix em `server/index.ts`, a resposta inclui a causa (ex: `ECONNREFUSED`).
- Fluxos validados (matriz prioritaria):
  - Categorias (criar `CODX Categoria 20260313`; criar `CODX Receita 20260313`).
  - Métodos de Pagamento (criar `CODX PIX 20260313`).
  - Lançamentos (criar saída `CODX Lanche`; marcar como pago; criar entrada `CODX Salário` e confirmar ausência de checkbox de pago).
  - Recorrências (criar `CODX Internet`; acionar `Gerar Mês`).
- Evidências (artefatos Playwright):
  - `output/playwright/dev-154-20260313/01-dashboard.png`
  - `output/playwright/dev-154-20260313/02-transactions.png`
  - `output/playwright/dev-154-20260313/07-metodo-criado.png`
  - `output/playwright/dev-154-20260313/10-transacao-criada.png`
  - `output/playwright/dev-154-20260313/11-transacao-paga.png`
  - `output/playwright/dev-154-20260313/15-transacao-entry-criada.png`
  - `output/playwright/dev-154-20260313/18-recurrence-criada-2.png`
  - `output/playwright/dev-154-20260313/19-gerar-mes.png`
- Observacoes de divergencia (para follow-up, fora do escopo do DEV-154):
  - Tela de Métodos de Pagamento expõe `type` em PT-BR (PIX/Dinheiro/...) enquanto `docs/API_CONTRACT.md` define `cash|transfer|debit|credit_card|other`.
  - Rede capturada via `playwright-cli network` registra verbos/URLs/status, mas não inclui payload completo (para auditoria de payload, usar captura adicional no backend ou interceptação dedicada).

## 2026-02-18 — Recorrencias (endDate obrigatorio para parcelado)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
  - Validacao de regra (codigo):
    - Backend agora exige `endDate` quando `group = installment` em `POST/PATCH /api/recurrences`.
    - Front exige `dataFim` quando grupo parcelado e altera o rotulo para "Data fim" (sem "(opcional)").
- Observacao:
  - Nao foram executados cenarios manuais completos de CRUD/geracao neste registro; pendente validacao funcional na UI/API.

## 2026-02-18 — Validacao de ambiente em producao (deploy)
- Ambiente: producao (Coolify + dominio oficial).
- Evidencias:
  - Commit publicado no `main`: `6d1cecd97564b7e4875537e6a58274002ef11011`.
  - `curl -4 -I https://meucontrole.cloud` -> `200 OK`.
  - `curl -4 -I https://meucontrole.cloud/api/recurrences` -> `200 OK`.
  - `curl -4 -I http://mwooggo4kcoow0wco4wsg80k.31.97.240.105.sslip.io` -> `404` (endpoint provisoria fora do dominio oficial).
- Resultado:
  - Ambiente oficial acessivel e API respondendo.

## 2026-02-19 — Validacao de regra operacional (nao alterar banco de producao)
- Ambiente: documentacao canonica.
- Verificacoes:
  - `docs/RULES.md` contem proibicao explicita de alteracao de banco em producao.
  - `docs/RUNBOOK.md` contem checklist pre-deploy e comandos proibidos.
  - `docs/USAGE.md` nao instrui mais escrita em banco de producao e lista comandos proibidos.
- Resultado:
  - Regra operacional consolidada para prevenir nova sobrescrita de dados em producao.

## 2026-02-19 — Bugfix DEV-94 (auto-geracao no update de recorrencias)
- Ambiente: local (`http://localhost:3001/api`).
- Build:
  - `npm run build` OK.
- Cenario executado:
  - Criada recorrencia `installment` com `startDate=2026-03-10`, `endDate=2026-04-10`, `installmentTotal=2`.
  - Confirmado antes do update: `2` transacoes geradas.
  - Editada recorrencia para `group=fixed` com `endDate=null`.
  - Confirmado apos update: `24` transacoes para o mesmo `recurrenceId` no range de 24 meses.
- Resultado:
  - Auto-geracao no `PATCH /api/recurrences/{id}` funcionando conforme regra de 2 anos para fixo sem data fim.

## 2026-03-13 — Validacao estrutural do skill de teste visual
- Ambiente: local, sem execucao ainda contra a aplicacao publicada.
- Artefatos preparados:
  - skill `playwright-crud-visual-contrato`
  - referencia `proj-financa-v1.md` com matriz prioritaria e secundaria
- Verificacoes planejadas:
  - validacao automatica da estrutura via `quick_validate.py`
  - uso futuro do skill contra a URL alvo para gerar evidencias de UI/rede
- Observacao:
  - Neste registro, ainda nao houve rodada funcional no navegador; apenas a preparacao e validacao estrutural do skill.

## 2026-03-14 — DEV-163/DEV-164: Filtro global de competencia mensal (sidebar)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
- Checklist manual (UI):
  - Alterar a competência no seletor global da sidebar (input de mês + setas).
  - Confirmar que Dashboard recarrega os cards e blocos conforme o mês ativo.
  - Navegar para Lançamentos e confirmar que a lista respeita o mesmo mês.
  - Navegar para Recorrências e confirmar que "Gerar Mês" usa a competência ativa.
  - Navegar para Panorama Anual e confirmar que continua usando apenas o seletor de ano.
