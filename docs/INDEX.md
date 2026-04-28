# Index de Documentacao (Diataxis)

Este mapa organiza a documentacao por tipo, para reduzir contexto e manter o fluxo PDCA enxuto.

## Tutorial (aprendizado)
- Nao mantemos tutoriais longos no momento. Se precisar, crie em `docs/TUTORIALS/`.

## How-to (fazer algo)
- `docs/USAGE.md` — como subir ambiente e executar tarefas locais.
- `docs/canonicos/RUNBOOK.md` — ordem operacional e fluxo de trabalho.

## Referencia (contratos e especificacao)
- `docs/canonicos/API_CONTRACT.md` — contratos e endpoints.
- `docs/canonicos/MODELO_DADOS.md` — modelo e regras de dados.
- `docs/canonicos/UX_BLUEPRINT.md` — regras de UI/UX.
- `docs/canonicos/RULES.md` — regras gerais e limites.

## Explicacao (decisoes e contexto)
- `docs/canonicos/CONTEXT.md` — visao de produto e principios.

## Logs e historico
- `docs/logs/PDCA_LOG.md` — historico de PDCA.
- `docs/logs/TEST_LOG.md` — historico de testes.

## Referencias PT-BR (nao usar em runtime)
- `docs/REFERENCIAS_PT_BR/financeiro_bl.dbml`
- `docs/REFERENCIAS_PT_BR/financeiro_bl.postgresql.sql`
- `docs/REFERENCIAS_PT_BR/financeiro_bl.mermaid.md`

## Leitura minima por papel
- Backend: `docs/canonicos/CONTEXT.md`, `docs/canonicos/RULES.md`, `docs/canonicos/API_CONTRACT.md`, `docs/canonicos/MODELO_DADOS.md`.
- Frontend: `docs/canonicos/CONTEXT.md`, `docs/canonicos/RULES.md`, `docs/canonicos/UX_BLUEPRINT.md`, `docs/canonicos/API_CONTRACT.md`.
- Infra: `docs/canonicos/CONTEXT.md`, `docs/canonicos/RULES.md`, `docs/canonicos/RUNBOOK.md`.
- Reviewer: `docs/canonicos/CONTEXT.md`, `docs/canonicos/RULES.md`, `docs/canonicos/UX_BLUEPRINT.md`, `docs/canonicos/API_CONTRACT.md`, `docs/canonicos/MODELO_DADOS.md`.

## Arquivos raiz importantes
- `AGENTS.md` — fluxo PDCA e engenharia de contexto.
- `replit.md` — visão geral e ponteiros para logs.
