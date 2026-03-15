# Registro PDCA

## 2026-03-15 — Deploy producao (Coolify Hostinger) (DEV-166)
- **Plan:** Disparar deploy em producao via Coolify respeitando o guardrail de dados (sem comandos de escrita de banco).
- **Do:** Deploy acionado no Coolify para `proj-financa-v1` (build pack Dockerfile) sem executar `db:push`/`db:seed`/backfill.
- **Check:** Smoke HTTP/HTTPS do dominio + validacao de `/api` retornando `404` imediato (sem timeout).
- **Act:** Runbook atualizado com fallback de deploy via API do Coolify; issue encerrada no Linear.

## 2026-03-14 — Migracao visual Layout 3.0 (Tailwind + novo layout global) (DEV-162)
- **Plan:** Replicar layout visual do repo de referencia (sidebar recolhivel, content header, surface cards, tabelas e modais) mantendo regras de negocio e contrato da API.
- **Do:** (em andamento)
  - Docs: `docs/UX_BLUEPRINT.md` atualizado para refletir layout 3.0, nova tela de Categorias e ajustes de Metodos de Pagamento/Lancamentos.
  - Frontend: migracao para Tailwind + tokens visuais e refatoracao de layout/telas para fidelidade aos prints.
- **Check:** Validacao visual por screenshots Playwright (Layout 3.0) + smoke dos CRUDs (sem mudancas de endpoints).
- **Act:** Registrar divergencias restantes e criar follow-ups no Linear se houver gaps de contrato/dados (ex: limites de cartao).

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
  - Ajustado `Dockerfile` para `npm ci --include=dev` e start padrao `node dist/server.js`.
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

## 2026-03-13 — Redesign de Navegacao (menu lateral)
- **Plan:** Simplificar navegacao do front-end reduzindo carga cognitiva e agrupando telas em um menu lateral (desktop-first, sem animacoes), mantendo rotas e comportamentos existentes.
- **Do:**
  - Docs: adicionado layout de navegacao global e mapa de grupos em `docs/UX_BLUEPRINT.md`.
  - Docs: alinhado design system de UI com o novo menu lateral em `.interface-design/system.md`.
  - Frontend: header simplificado (sem abas no topo) em `client/src/components/Header.tsx`.
  - Frontend: menu lateral com grupos (Visao/Operacao/Planejamento/Cadastros) em `client/src/components/MenuLateral.tsx`.
  - Frontend: layout em grid (sidebar + conteudo) e estilos do menu em `client/src/index.css` e `client/src/App.tsx`.
  - Frontend: menu lateral sticky (permanece visivel ao rolar) em `client/src/index.css`.
  - Frontend: padronizacao do topo de pagina com `.barra-topo` (ex: Recorrencias e Investimentos) em `client/src/pages/Recurrences.tsx` e `client/src/pages/Investments.tsx`.
  - Frontend: a11y com skip link ("Pular para o conteudo") no header em `client/src/components/Header.tsx` e alvo no `main` em `client/src/App.tsx`.
  - Frontend: destaque discreto do grupo ativo no menu lateral em `client/src/components/MenuLateral.tsx` e `client/src/index.css`.
  - Frontend: padronizacao de labels PT-BR (acentos) no menu e titulos em `client/src/components/MenuLateral.tsx`, `client/src/components/Header.tsx` e paginas principais.
  - Frontend: padronizacao de labels em formularios/tabelas (ex: Descrição, Saída, Método, Mês) em `client/src/components/ModalLancamento.tsx`, `client/src/pages/Transactions.tsx`, `client/src/pages/Recurrences.tsx`, `client/src/pages/PaymentMethods.tsx` e `client/src/pages/Dashboard.tsx`.
- **Check:** `npm run build` OK.
- **Act:** Projeto e issues registrados no Linear (DEV-152, DEV-153, DEV-154).
- **Check:** `npm run build` executado com sucesso; output em chunks por pagina.
- **Act:** Registro de testes atualizado em `docs/TEST_LOG.md`.

## 2026-03-13 — DEV-154: Erro de API em dev (mensagem vazia)
- **Plan:** Corrigir erro recorrente em dev onde a API retornava `500` com mensagem genérica (sem indicar a causa), bloqueando validação via Playwright.
- **Do:**
  - Backend: aprimorado `server/index.ts` para extrair mensagem útil em erros sem `message` (ex: `AggregateError` de conexão) e logar detalhes em stderr.
  - Operação local: criado Postgres descartável via Docker em `localhost:5433` e aplicado schema com `npm run db:push` para viabilizar testes.
- **Check:**
  - `GET /api/categories` quando DB indisponível agora retorna erro explícito (ex: `connect ECONNREFUSED ::1:5433`), evitando “Internal Server Error” sem causa.
  - CRUDs prioritários validados via Playwright (evidências em `output/playwright/dev-154-20260313/`).
- **Act:**
  - Registro de testes atualizado em `docs/TEST_LOG.md`.
  - Comentário adicionado no Linear (DEV-154) com o diagnóstico e evidências.

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

## 2026-02-16 — Sincronizacao GitHub x Producao (Coolify)
- **Plan:** Publicar alteracao pendente no repositorio e garantir que o ambiente de producao em Coolify fique alinhado ao mesmo commit do `main`.
- **Do:**
  - Commit e push executados no `main` com a alteracao de documentacao em `docs/UX_BLUEPRINT.md`.
  - Redeploy da aplicacao no Coolify acionado para o recurso `proj-financa-v1` (ambiente `production`).
  - Validacao do container em producao com `SOURCE_COMMIT` igual ao commit do `origin/main`.
- **Check:**
  - `HEAD` local e `origin/main` alinhados em `f14c6fc6bbde2c2a7a9c6f36b18f12cea7f107f7`.
  - Aplicacao em producao executando imagem/tag do mesmo commit.
  - Health check externo de `https://meucontrole.cloud` retornando `HTTP 200`.
- **Act:**
  - Registro de rastreabilidade atualizado no `docs/PDCA_LOG.md`.

## 2026-02-18 — Recorrencias: endDate obrigatorio para parcelado
- **Plan:** Ajustar regra de negocio de recorrencias para exigir `endDate` quando `group = installment`, com alinhamento de docs canonicos antes do codigo.
- **Do:**
  - Docs: atualizados `docs/UX_BLUEPRINT.md`, `docs/API_CONTRACT.md` e `docs/MODELO_DADOS.md`.
  - Backend: validacao adicionada em `server/storage.ts` (`assertRecurrenceRules`) para exigir `endDate` em parcelamento.
  - Frontend: validacao no formulario de recorrencias e ajuste do rotulo de "Data fim" em `client/src/pages/Recurrences.tsx` (remove "(opcional)" quando `group=installment`).
  - How-to: exemplo de recorrencia parcelada ajustado em `docs/USAGE.md` com `endDate` preenchida.
- **Check:** `npm run build` executado com sucesso.
- **Act:** issue `DEV-92` criada no Linear para rastreio da feature.

## 2026-02-18 — Deploy da regra de parcelado com data fim obrigatoria
- **Plan:** Publicar alteracoes da feature em `main` e validar disponibilidade do ambiente em producao.
- **Do:**
  - Commit: `feat(recurrencias): exigir data fim em parcelado`.
  - Push: `origin/main` atualizado para `6d1cecd97564b7e4875537e6a58274002ef11011`.
  - MCP do Coolify indisponivel nesta sessao; aplicado fallback operacional via push no `main` + validacao externa por HTTP.
- **Check:**
  - `https://meucontrole.cloud/` -> `200 OK`.
  - `https://meucontrole.cloud/api/recurrences` -> `200 OK`.
  - URL provisoria `sslip.io` retornando `404` (sem impacto no dominio oficial).
- **Act:**
  - Registro de deploy e validacao consolidado em `docs/TEST_LOG.md`.

## 2026-02-19 — Guardrail de deploy para banco de producao
- **Plan:** Evitar repeticao de incidente de sobrescrita de dados, criando regra canonica de bloqueio de alteracao no banco de producao.
- **Do:**
  - Atualizado `docs/RULES.md` com regra obrigatoria de seguranca de dados em deploy.
  - Atualizado `docs/RUNBOOK.md` com guardrail pre-deploy e lista de comandos proibidos em producao.
  - Atualizado `docs/USAGE.md` removendo qualquer orientacao de escrita em banco de producao e adicionando lista de comandos proibidos.
- **Check:** Revisao documental cruzada entre `RULES`, `RUNBOOK` e `USAGE` para consistencia de regra.
- **Act:** Issue `DEV-93` criada no Linear para rastreio e historico.

## 2026-02-19 — Bugfix recorrencias: auto-geracao no update (DEV-94)
- **Plan:** Corrigir falha de regra no CRUD de recorrencias onde a auto-geracao ocorria no create, mas nao no update.
- **Do:**
  - Docs canonicos atualizados para refletir geracao automatica no CRUD:
    - `docs/API_CONTRACT.md`
    - `docs/MODELO_DADOS.md`
    - `docs/UX_BLUEPRINT.md`
  - Backend ajustado em `server/storage.ts`:
    - criado helper `runAutoGenerationForRecurrence`.
    - `createRecurrence` reutiliza o helper.
    - `updateRecurrence` agora tambem dispara auto-geracao conforme regras.
- **Check:**
  - `npm run build` OK.
  - Cenario validado na API local: recorrencia editada de `installment` para `fixed` passou de 2 para 24 transacoes no range esperado.
- **Act:** Issue `DEV-94` atualizada no Linear com evidencias do bugfix.

## 2026-03-13 — Skill de teste visual CRUD + contrato com Playwright (DEV-150)
- **Plan:** Criar um skill reutilizavel para validar os CRUDs do `proj-financa-v1` via navegador real, comparando UI e rede com `docs/UX_BLUEPRINT.md` e `docs/API_CONTRACT.md`.
- **Do:**
  - Criado skill global `playwright-crud-visual-contrato` em `C:\Users\luanp\.codex\skills\playwright-crud-visual-contrato`.
  - Estruturado `SKILL.md` com fluxo obrigatorio, guardrails e uso da skill base `$playwright`.
  - Criado `references/proj-financa-v1.md` com rotas, matriz de CRUD, checkpoints de UX/contrato e observacoes de divergencia conhecidas.
  - Issue `DEV-150` criada e mantida em andamento no Linear para rastreio.
- **Check:** Estrutura do skill pronta para validacao automatica com `quick_validate.py`.
- **Act:** Proximo uso do skill deve gerar achados reproduziveis sobre UI/contrato sem precisar reconstruir a matriz manualmente.

## 2026-03-13 — Skill local de design frontend (Claude Code `frontend-design`) (DEV-151)
- **Plan:** Criar uma skill local no repo inspirada no plugin `plugins/frontend-design` do Claude Code, para padronizar pedidos de UI com melhor qualidade de design.
- **Do:**
  - Referencia consumida via Context7 e via leitura direta do GitHub (README + SKILL do plugin).
  - Criada skill local em `.codex/skills/design-frontend-claude-code/` com `SKILL.md`, `agents/openai.yaml` e `references/origem-frontend-design.md`.
  - Criado runbook local em `.codex/napkin.md` para registrar o padrao de skills locais.
- **Check:** Validacao do skill executada com `quick_validate.py`.
- **Act:** Issue `DEV-151` atualizada no Linear com caminho dos artefatos e estado.

## 2026-03-14 — Filtro global de competencia mensal na sidebar (DEV-163, DEV-164)
- **Plan:** Corrigir inconsistência de contexto entre telas ao unificar a competência mensal (YYYY-MM) em uma fonte única e expor um seletor global na sidebar, sem impactar o Panorama Anual.
- **Do:**
  - Docs: atualizado `docs/UX_BLUEPRINT.md` para refletir seletor global de competência na sidebar e remoção de seletores locais do topo (Dashboard e Recorrências).
  - Linear: criado projeto "Filtro global de competência mensal" e issues `DEV-163` (bugfix) e `DEV-164` (feature).
  - Frontend:
    - Criado provider global `CompetenciaMensalProvider` com persistência em `localStorage`.
    - Criado componente de UI `SeletorCompetenciaMensal` na sidebar.
    - Migradas telas Dashboard, Lançamentos e Recorrências para consumir a competência global.
- **Check:** `npm run build` executado com sucesso.
- **Act:** Registrar evidências e checklist manual em `docs/TEST_LOG.md`.
