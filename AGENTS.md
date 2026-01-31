# AGENTS

## Objetivo
Definir fluxo PDCA e regras de engenharia de contexto para manter docs e codigo alinhados.

## Canonicos
- docs/CONTEXT.md
- docs/RULES.md
- docs/UX_BLUEPRINT.md
- docs/API_CONTRACT.md
- docs/MODELO_DADOS.md
- docs/RUNBOOK.md

## Papeis (prompts)
- Backend: docs/PROMPTS/backend.agent.md
- Frontend: docs/PROMPTS/frontend.agent.md
- Infra: docs/PROMPTS/infra.agent.md
- Reviewer: docs/PROMPTS/reviewer.agent.md

## PDCA (fluxo obrigatorio)
Plan:
- Ler canonicos e prompt do papel.
- Definir escopo, riscos e dependencias.
- Criar projeto e issues no Linear via MCP (registrar escopo, riscos e dependencias).
- Se houver mudanca de requisito, atualizar docs canonicos antes do codigo.

Do:
- Implementar somente o escopo do papel.
- Seguir regras de naming e limites definidos em docs/RULES.md.
- Atualizar issues no Linear via MCP (descricao, status e progresso).

Check:
- Validar aderencia com UX e contrato (Reviewer ou auto-check).
- Registrar desvios e pendencias.
- Mover issues no Linear via MCP para o estado adequado (ex: Review/Blocked).

Act:
- Atualizar docs canonicos quando necessario.
- Registrar itens pendentes (ex: gaps de infra/DB/testes).
- Encerrar issues e criar follow-ups no Linear via MCP (historico e rastreio).

## Engenharia de contexto (sincronia)
- Decisoes de produto vivem em docs/CONTEXT.md e docs/UX_BLUEPRINT.md.
- Contrato e payloads vivem em docs/API_CONTRACT.md.
- Estrutura de dados vive em docs/MODELO_DADOS.md e shared/schema.ts.
- Se codigo divergir, alinhar primeiro o documento canonico.
- Toda mudanca relevante deve ter issue/projeto no Linear via MCP, com links para os docs canonicos afetados.

## Definition of Done (DoD)
- Docs canonicos consistentes entre si.
- Frontend segue o UX_BLUEPRINT.
- Backend segue o API_CONTRACT e MODELO_DADOS.
- Reviewer confirma aderencia e aponta desvios restantes.

## Regras de comunicacao
- Chat em PT-BR.
- Nomes de entidades/variaveis/arquivos em PT-BR.
