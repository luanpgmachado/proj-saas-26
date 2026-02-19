# Rules

## Regras gerais
- Leia `docs/INDEX.md`, `docs/CONTEXT.md`, `docs/RULES.md` e `replit.md` antes de qualquer alteracao.
- Nao introduza funcionalidades ou comportamentos fora de `docs/UX_BLUEPRINT.md` e `docs/API_CONTRACT.md`.
- Nao misture visao, regra e execucao em um mesmo arquivo.
- Mantenha o produto desktop-first e com interacao direta.
- Nao use animacoes, modais ou efeitos nao descritos no blueprint UX.
- Qualquer mudanca de requisito deve atualizar os documentos canonicos em `docs/`.
- Comunicacao no chat sempre em PT-BR; nomes de funcoes, variaveis, arquivos e entidades devem seguir PT-BR.

## Limites de responsabilidade
- Front-end: implementa UI e comportamento descritos no blueprint, sem alterar o contrato da API.
- Back-end: implementa o contrato da API e o modelo de dados, sem decidir UX.
- Infra: build, deploy e ambiente; nao altera regra de negocio nem UX.
- Reviewer: aponta desvios entre implementacao e documentos; nao corrige.

## Regra de seguranca de dados (deploy)
- E proibido alterar banco de dados de producao a partir deste fluxo de trabalho.
- Nunca executar em producao: `npm run db:push`, `npm run db:seed`, scripts de backfill, SQL manual de `INSERT/UPDATE/DELETE/DDL`.
- Antes de qualquer deploy, validar explicitamente o destino do banco (`DATABASE_URL`/`REPLIT_DB_URL`) e confirmar que comandos de escrita de banco nao serao executados.
- Se houver necessidade de mudanca de schema/dados em producao, tratar como incidente excecional fora deste fluxo, com aprovacao manual explicita e plano de rollback.
