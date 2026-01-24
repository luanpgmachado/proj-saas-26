# Runbook

## Ordem de trabalho
1. Leia `AGENTS.md` para fluxo PDCA e engenharia de contexto.
2. Leia `README.md` para entender a estrutura.
3. Leia `docs/CONTEXT.md` e `docs/RULES.md`.
4. Escolha o prompt adequado em `docs/PROMPTS/`.
5. Execute a tarefa respeitando `docs/UX_BLUEPRINT.md` e `docs/API_CONTRACT.md`.
6. Se requisitos mudarem, atualize os documentos canonicos antes do codigo.

## Uso diario
- Front-end segue `docs/UX_BLUEPRINT.md`.
- Back-end segue `docs/API_CONTRACT.md`.
- Infra garante build e deploy sem tocar regra de negocio.
- Reviewer aponta desvios sem alterar arquivos.
