---
name: design-frontend-claude-code
description: "Criar e polir interfaces web (componentes/paginas/apps) com qualidade de design alta e codigo pronto para producao, inspirado no plugin `plugins/frontend-design` do Claude Code. Use quando o usuario pedir UI mais bonita/mais profissional, landing pages, dashboards, layout/tema/cores/tipografia, animacoes/micro-interacoes, ou quando a entrega precisa evitar estetica generica de IA."
---

# Design Frontend (inspirado no `frontend-design`)

## Objetivo
Criar implementacoes de front-end com **direcao estetica clara** (minimalista refinado, editorial, brutalista, retro-futurista, etc.), evitando o visual generico ("AI slop"), com atencao a tipografia, paleta, espacamento, motion e detalhes.

## Fluxo recomendado
1. Entender contexto (proposito, publico, restricoes, stack).
2. Definir direcao estetica (uma frase) + 2-3 decisoes guias (tipografia, paleta, motion).
3. Definir tokens (CSS variables) e grade/espacamentos antes de codar.
4. Implementar codigo funcional (HTML/CSS/JS, React, etc.) coerente com a direcao.
5. Revisar com checklist (a11y, consistencia, performance).

## Direcao estetica (obrigatorio)
- **Proposito**: qual acao o usuario faz? o que precisa ficar evidente?
- **Tom**: escolha um estilo forte e intencional (nao "um pouco de tudo").
- **Diferenciacao**: defina 1 "assinatura visual" memoravel (ex: fundo com textura/noise + tipografia editorial; ou layout assimetrico com acentos fortes).

Evitar "default generico":
- Fontes genericas (Arial, Inter, Roboto, system fonts) como escolha principal.
- Gradiente roxo em fundo branco como "tema padrao".
- Cards e grids previsiveis sem intencao.

## Guidelines de estetica (prioridade alta)
### Tipografia
- Prefira combinacoes com personalidade: 1 fonte de destaque + 1 fonte de leitura.
- Defina hierarquia (tamanhos, pesos, tracking, altura de linha) e reaproveite.

### Cor & tema
- Comprometa-se com uma paleta (dominante + acento), evitando "tudo igual".
- Use CSS variables (ex: `--bg`, `--fg`, `--muted`, `--accent`, `--border`) para consistencia.

### Motion
- Use animacao como "momento de impacto" (carregamento/entrada) + micro-interacoes (hover/focus).
- Preferir CSS em interfaces simples; em React, usar libs de motion apenas se fizer sentido.
- Respeitar `prefers-reduced-motion`.

### Composicao espacial
- Fuja do "layout previsivel": assimetria, sobreposicao, diagonais, grid-breaking com intencao.
- Ou seja minimalista (poucos elementos) ou denso (muita informacao), mas sempre consistente.

### Backgrounds & detalhes
- Crie profundidade: gradientes, padroes geometricos, sombras dramáticas, bordas, grain/noise.
- Evite fundo solido "default" quando a direcao pede atmosfera.

## Saida esperada
- Codigo funcional e pronto para producao.
- Nota curta com a direcao estetica escolhida e os tokens principais (CSS variables).
- Se incluir fontes externas, documentar como importar (ex: Google Fonts) e fallback.

## Guardrails (proj-financa-v1)
- Nao alterar regra de negocio, contrato da API, nem inventar UX fora de `docs/UX_BLUEPRINT.md`.
- Evitar modais/animacoes nao descritos no blueprint; manter desktop-first e foco em leitura de numeros.

## Checklist final (antes de considerar pronto)
- Acessibilidade: contraste, focus visivel, navegacao por teclado, `prefers-reduced-motion`.
- Consistencia: tokens reutilizados, espacamentos coerentes, alinhamentos.
- Performance: evitar efeitos/pesos desnecessarios, imagens otimizadas, sem libs pesadas sem motivo.

## Referencias
Veja `references/origem-frontend-design.md` para a origem e resumo do plugin.
