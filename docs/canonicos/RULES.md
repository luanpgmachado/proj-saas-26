# Rules

## Regras gerais
- Leia `docs/INDEX.md`, `docs/canonicos/CONTEXT.md`, `docs/canonicos/RULES.md` e `replit.md` antes de qualquer alteracao.
- Nao introduza funcionalidades ou comportamentos fora de `docs/canonicos/UX_BLUEPRINT.md` e `docs/canonicos/API_CONTRACT.md`.
- Nao misture visao, regra e execucao em mesmo arquivo.
- Produto desktop-first, interacao direta.
- Sem animacoes, modais ou efeitos nao descritos no blueprint UX.
- Mudanca de requisito = atualizar canonicos em `docs/`.
- Chat sempre PT-BR.
- UX e dominio de negocio: nomes novos em PT-BR.
- Contrato tecnico canonico (API/schema/campos): preservar naming tecnico para compatibilidade.

## Limites de responsabilidade
- Front-end: UI e comportamento do blueprint, sem alterar contrato API.
- Back-end: contrato API e modelo de dados, sem decidir UX.
- Infra: build, deploy, ambiente; sem alterar regra de negocio nem UX.
- Reviewer: aponta desvios entre implementacao e documentos; nao corrige.

## Regra de seguranca de dados (deploy)
- Regra canonica e checklist: `docs/canonicos/RUNBOOK.md` (Guardrail obrigatorio e Banco de dados).
- Proibido alterar banco producao neste fluxo.
- Nunca executar em producao: `npm run db:push`, `npm run db:seed`, scripts de backfill, SQL manual de `INSERT/UPDATE/DELETE/DDL`.
- Antes de deploy: validar destino do banco (`DATABASE_URL`/`REPLIT_DB_URL`).