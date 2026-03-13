# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-03-13] Seguir PDCA + canonicos antes de mudar codigo**
   Do instead: ler `docs/INDEX.md`, `docs/CONTEXT.md`, `docs/RULES.md`, prompt do papel e abrir issue no Linear antes de implementar.
2. **[2026-03-13] Evitar mudar UX/contrato fora dos docs**
   Do instead: se precisar ajustar UX/contrato/modelo, atualizar `docs/UX_BLUEPRINT.md` / `docs/API_CONTRACT.md` / `docs/MODELO_DADOS.md` antes de tocar no codigo.

## Repo Conventions
1. **[2026-03-13] Infra nao mexe em regra de negocio**
   Do instead: limitar mudancas a build/deploy/automacao/ferramentas e registrar no `docs/PDCA_LOG.md`.

## Skills Locais do Repo
1. **[2026-03-13] Skills locais vivem em `.codex/skills/`**
   Do instead: criar/atualizar skills no repo com `SKILL.md` + `agents/openai.yaml` e validar com `quick_validate.py` da skill-creator.

