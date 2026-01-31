# Index de Documentacao (Diataxis)

Este mapa organiza a documentacao por tipo, para reduzir contexto e manter o fluxo PDCA enxuto.

## Tutorial (aprendizado)
- Nao mantemos tutoriais longos no momento. Se precisar, crie em `docs/TUTORIALS/`.

## How-to (fazer algo)
- `docs/USAGE.md` — como subir ambiente e executar tarefas locais.
- `docs/RUNBOOK.md` — ordem operacional e fluxo de trabalho.

## Referencia (contratos e especificacao)
- `docs/API_CONTRACT.md` — contratos e endpoints.
- `docs/MODELO_DADOS.md` — modelo e regras de dados.
- `docs/UX_BLUEPRINT.md` — regras de UI/UX.
- `docs/RULES.md` — regras gerais e limites.

## Explicacao (decisoes e contexto)
- `docs/CONTEXT.md` — visao de produto e principios.

## Logs e historico
- `docs/PDCA_LOG.md` — historico de PDCA.
- `docs/TEST_LOG.md` — historico de testes.

## Referencias PT-BR (nao usar em runtime)
- `docs/REFERENCIAS_PT_BR/financeiro_bl.dbml`
- `docs/REFERENCIAS_PT_BR/financeiro_bl.postgresql.sql`
- `docs/REFERENCIAS_PT_BR/financeiro_bl.mermaid.md`

## Leitura minima por papel
- Backend: `docs/CONTEXT.md`, `docs/RULES.md`, `docs/API_CONTRACT.md`, `docs/MODELO_DADOS.md`.
- Frontend: `docs/CONTEXT.md`, `docs/RULES.md`, `docs/UX_BLUEPRINT.md`, `docs/API_CONTRACT.md`.
- Infra: `docs/CONTEXT.md`, `docs/RULES.md`, `docs/RUNBOOK.md`.
- Reviewer: `docs/CONTEXT.md`, `docs/RULES.md`, `docs/UX_BLUEPRINT.md`, `docs/API_CONTRACT.md`, `docs/MODELO_DADOS.md`.

## Arquivos raiz importantes
- `AGENTS.md` — fluxo PDCA e engenharia de contexto.
- `replit.md` — visão geral e ponteiros para logs.
