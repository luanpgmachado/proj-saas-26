# AGENTS

## Objetivo
Define fluxo PDCA e regras engenharia contexto — manter docs e codigo alinhados.

## Canonicos
- docs/canonicos/CONTEXT.md
- docs/canonicos/RULES.md
- docs/canonicos/UX_BLUEPRINT.md
- docs/canonicos/API_CONTRACT.md
- docs/canonicos/MODELO_DADOS.md
- docs/canonicos/RUNBOOK.md

## Registros
- docs/logs/PDCA_LOG.md
- docs/logs/TEST_LOG.md

## Papeis (prompts)
- Backend: docs/PROMPTS/backend.agent.md
- Frontend: docs/PROMPTS/frontend.agent.md
- Infra: docs/PROMPTS/infra.agent.md
- Reviewer: docs/PROMPTS/reviewer.agent.md

## PDCA (fluxo obrigatorio)
Plan:
- Ler canonicos e prompt do papel.
- Definir escopo, riscos e dependencias.
- Criar projeto e issues no Linear via MCP (registrar escopo, riscos, dependencias).
- Mudanca de requisito: atualizar docs canonicos antes do codigo.

Do:
- Implementar somente escopo do papel.
- Seguir naming e limites em docs/canonicos/RULES.md.
- Atualizar issues no Linear via MCP (descricao, status, progresso).

Check:
- Validar aderencia com UX e contrato (Reviewer ou auto-check).
- Registrar desvios e pendencias.
- Mover issues no Linear via MCP para estado adequado (ex: Review/Blocked).

Act:
- Atualizar docs canonicos quando necessario.
- Registrar pendencias (ex: gaps infra/DB/testes).
- Encerrar issues e criar follow-ups no Linear via MCP (historico e rastreio).

## Engenharia de contexto (sincronia)
- Decisoes produto: docs/canonicos/CONTEXT.md e docs/canonicos/UX_BLUEPRINT.md.
- Contrato e payloads: docs/canonicos/API_CONTRACT.md.
- Estrutura dados: docs/canonicos/MODELO_DADOS.md e shared/schema.ts.
- Codigo divergiu: alinhar doc canonico primeiro.
- Mudanca relevante: issue/projeto no Linear via MCP com links docs canonicos afetados.

## Definition of Done (DoD)
- Docs canonicos consistentes entre si.
- Frontend segue UX_BLUEPRINT.
- Backend segue API_CONTRACT e MODELO_DADOS.
- Reviewer confirma aderencia e aponta desvios restantes.

## Regras de comunicacao
- Chat em PT-BR.
- UX e dominio negocio: nomes novos em PT-BR.
- Contrato tecnico canonico (API/schema/campos): preservar naming tecnico existente para compatibilidade.

## Git / Versionamento (operacional)

Repo usa Git via SSH.

Regras obrigatorias antes de qualquer commit/push:

- Verificar remote:
  ```bash
  git remote -v
  ```

- Remote esperado:
  ```bash
  git@github-luanpgmachado:luanpgmachado/proj-saas-26.git
  ```

- Verificar identidade local:
  ```bash
  git config user.name
  git config user.email
  ```

- Testar autenticacao SSH:
  ```bash
  ssh -T git@github-luanpgmachado
  ```

Regras:
- Nao alterar remote sem autorizacao.
- Nao usar HTTPS.
- Nao usar outra conta GitHub.
- Nao alterar configs globais Git.

Obs: alias SSH (`github-luanpgmachado`) definido em `~/.ssh/config`. Repo nao armazena chaves nem configs sensiveis.