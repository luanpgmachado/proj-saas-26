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
