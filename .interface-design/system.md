# Sistema de UI (Financa Familiar)

## Direcao
Produto desktop-first, operado como planilha mensal viva. Prioridade maxima: legibilidade, previsibilidade e leitura de numeros (comparacao rapida).

Proibicoes (reforco do produto):
- Sem animacoes e sem efeitos.
- Sem decoracao gratuita.
- Sem densidade baixa que vire "dashboard de cartao".

## Mundo e linguagem visual
Metafora: papel + tinta + regua de tabela + caneta azul para acoes.

## Paleta (tokens)
Tokens vivem em `client/src/index.css` (CSS variables).

Principios:
- Superficies: papel (`--cor_papel` / `--cor_papel_2`) e painel (`--cor_painel`).
- Texto: tinta em 3 niveis (`--cor_tinta`, `--cor_tinta_2`, `--cor_tinta_3`).
- Divisorias: linhas sutis (`--cor_linha`, `--cor_linha_forte`).
- Acao: caneta azul (`--cor_acao`, `--cor_acao_2`).
- Semanticas: sucesso/perigo/aviso (usadas com parcimonia).

## Tipografia
- UI: `--fonte_ui` (neutra, alta legibilidade).
- Numeros: `--fonte_numero` (monospace). Sempre que o usuario comparar valores.
- `font-variant-numeric: tabular-nums` no `body`.

## Depth strategy
Somente bordas e camadas sutis (sem sombras).
- Cartoes/paineis: `border: 1px solid var(--cor_linha)` e fundo `--cor_painel`.
- Divisorias de tabela: `--cor_linha`.

## Espacamento
Base: 4px (`--espaco_1`) e multiplos ate `--espaco_6`.

## Componentes (padroes)
- Header:
  - Wrapper: `.header` + `.header-inner`.
  - Navegacao: `.nav`, item ativo com underline de `--cor_acao`.
- Topo de pagina:
  - `.barra-topo` para alinhar titulo + acao principal.
  - Seletor de mes/ano: `.seletor-mes` + label `.seletor-mes-label` (fonte numero).
- Cartoes:
  - `.card` como unidade principal.
  - Assinatura: `.card--saldo` para destaque do Saldo (regua do saldo).
- Abas:
  - `.tabs` como segmented control (sem bordas pesadas).
- Tabelas:
  - Cabecalho com fundo `--cor_papel_2`.
  - Numeros alinhados a direita com `.text-right`/`.valor-direita` (monospace).
- Botoes:
  - Primario: `.btn-primary` (ou `button.primary` por compat).
  - Perigo: `.btn-danger`.
  - Pequeno: `.btn-sm` (acoes discretas de linha).
- Formularios:
  - `.form-group` e `.filters` para consistencia.
  - Estados de foco via `:focus-visible` (outline azul).

## Assinatura (o que nao pode sumir)
1. Numeros com textura de planilha: tabular + monospace onde importa.
2. Linhas e divisorias sutis (regua).
3. Saldo com maior peso visual (card destacado) sem "efeito", so hierarquia.

