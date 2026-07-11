# UX Blueprint

## Diretrizes gerais
- Desktop-first.
- Grid fixo.
- Hierarquia visual orientada a leitura de numeros.
- Sem animacoes e sem modais, exceto se explicitado.

## Diretrizes visuais (Layout 3.0)
- Tipografia: `Inter` como fonte principal.
- Numeros: `tabular-nums` (alinhamento consistente em tabelas e cards).
- Cartoes e secoes: usar "surface cards" (fundo claro, radius ~12px, borda sutil e sombra leve).
- Interacoes: apenas `hover`/`focus` discretos; sem animacoes chamativas.

## Navegacao Global (Layout)
- App usa **menu lateral** (sidebar) — reduz abas no topo, agrupa funcionalidades.
- Estrutura de tela (sempre):
  - Menu lateral a esquerda (sticky) com logo/nome do produto.
  - Area de conteudo a direita.
- Comportamento de rolagem:
  - Menu lateral permanece visivel (sticky).
  - Apenas area de conteudo rola.
- Menu lateral:
  - Mostra **grupos com titulos** e itens abaixo.
  - Destaca item ativo claramente (fundo leve + borda/linha de acento).
  - Destaca **grupo ativo** (grupo que contem rota atual) de forma discreta.
  - Mantem foco visivel e suporte a teclado.
  - Pode ser **recolhivel** (toggle manual), reduzindo para icones.
    - Persistir escolha do usuario (ex: `localStorage`).
    - Sem animacao obrigatoria; transicao suave simples aceitavel.
  - Link acessibilidade "Pular para o conteudo" obrigatorio (topo da area de conteudo).
- Menu lateral inclui **seletor global de competência mensal (YYYY-MM)**:
  - Visivel na sidebar — usuario sempre sabe mês ativo.
  - Controla: **Visão do Mês (Dashboard)**, **Lançamentos**, **Recorrências**.
  - **Nao** controla **Panorama Anual** — independente, usa filtro proprio de ano.

## Topo de Pagina (Padrao)
- Toda tela inicia com `.barra-topo` (previsibilidade).
- Estrutura do `.barra-topo`:
  - Esquerda: titulo da tela (h2) e, quando aplicavel, controles de contexto (ex: seletor de mês/ano).
  - Direita: acao principal da tela (ex: `+ Novo Lançamento`, `+ Nova Recorrência`), quando existir.
- Bloco de filtros (se existir) vem abaixo do `.barra-topo` (sem grudar no header global).
- Layout 3.0: implementar como `CabecalhoConteudo` com:
  - `titulo` + `subtitulo` (opcional)
  - `acoes` (direita)
  - seletor de mês/ano quando aplicavel

### Mapa de navegacao (grupos)
- **Principal**
  - Dashboard / Visão do Mês (`/`)
  - Lançamentos (`/transactions`)
  - Recorrências (`/recurrences`)
  - Panorama Anual (`/annual`)
  - Metas (`/goals`)
  - Investimentos / Reserva (`/investments`)
- **Configurações**
  - Categorias (`/categories`)
  - Métodos de Pagamento (`/payment-methods`)

## Tela Principal - Visão do Mês
- Topo com titulo/subtitulo a esquerda e acao principal a direita (Layout 3.0).
- Competencia mensal controlada pelo seletor global da sidebar.
- Quatro cards horizontais: Entradas, Saidas, Ja Pago, Falta Pagar.
  - `Ja Pago` = soma de lancamentos `exit` pagos no mes (`paidExitsCents`).
  - `Falta Pagar` = `exitsCents - paidExitsCents`.
- Blocos abaixo (duas colunas no desktop):
  - "Distribuição por Categoria" como grafico simples tipo donut + legenda.
  - "Próximos Vencimentos" como lista dos proximos lançamentos `exit` nao pagos no mês (top 5).
- Ao final, insight simples (mensagem de reforco) pode aparecer como card pequeno.
- Clicar "+ Novo Lançamento" abre modal de cadastro (explicitado).
  - Campos: descricao, valor (R$), data, categoria, método de pagamento, tipo.
  - Regra `type=entry => group=entry` valida mesmo sem campo `group` exposto no modal.

## Tela de Lançamentos
- Topo com titulo/subtitulo e botao "+ Novo Lançamento".
- Lista reflete competencia mensal ativa no seletor global da sidebar.
- Barra de filtros:
  - Chips: Todos, Pagos, Pendentes, Atrasados (visual; mapeamento interno pode usar `type`/`isPaid` quando aplicavel).
  - Busca por descricao (cliente).
- Barra de resumo rapido (abaixo chips, acima filtros avancados):
  - `Total Geral` (liquido da lista filtrada visivel) = somatorio de entradas menos somatorio de saidas.
  - `Total Pago` = somatorio de lancamentos `exit` com `isPaid = true` na lista filtrada visivel.
- Tabela principal em surface card:
  - Colunas: descricao, categoria, metodo, data, status, valor, acoes.
  - Acoes por linha discretas (aparecem no hover/focus, acessiveis por teclado).
- Gerenciamento de categorias nao ocorre aqui — exibir link/botao "Gerenciar categorias" → `/categories`.

## Tela de Categorias
- Grid de cards (desktop-first), cada card mostra:
  - Nome da categoria
  - Tipo (Receita/Despesa)
  - Contagem de lançamentos no mês atual (opcional, calculado no cliente).
- Acoes por card discretas: editar, excluir.
- Botao "+ Nova Categoria" abre modal de criacao (explicitado).
  - Campos: Nome, Tipo (income/expense), Orcamento mensal (R$, opcional).
  - Ao salvar: recarregar lista.
- Exclusao com confirmacao (sem modal de sistema); modal leve aceitavel (explicitado).

## Tela de Métodos de Pagamento
- Cartoes como cards (sem "limite/usado" se dado ausente no backend).
- "Contas e Outros" como lista em surface card.
- Acoes discretas: editar/excluir (sem chamar atencao).
- "Pago no mês" visivel e funcional.
- Campos de fechamento e vencimento apenas para cartoes.
- Criar/editar metodo usa modal existente (explicitado).

## Tela de Panorama Anual
- Tabela anual como elemento principal (12 linhas).
- Valores alinhados a direita.
- Grafico simples abaixo da tabela — reforco visual, sem interacao.

## Tela de Metas Financeiras
- Lista vertical de metas.
- Cada meta em bloco simples.
- Barra de progresso discreta e percentual numerico.
- Botao de aporte dentro do bloco.
- Historico de aportes em tabela logo abaixo.

## Tela de Investimentos / Reserva
- Dois blocos verticais bem separados.
- Reserva de emergencia no topo, investimentos abaixo.
- Apenas lista de aportes, sem simulacoes/projecoes.

## Tela de Recorrências
- Topo com botoes "Gerar Mês" e "+ Nova Recorrência" a direita.
- Competencia mensal controlada pelo seletor global da sidebar.
- Clicar "Gerar Mês": usa competencia mensal ativa, chama endpoint de geracao, exibe mensagem com qtd de transacoes criadas.
- Abaixo, tabela com todas recorrencias cadastradas.
- Colunas: descricao, tipo, grupo, valor, categoria, metodo, dia, status, inicio, fim, acoes.
- Acoes por linha discretas: editar, pausar, deletar, reativar (conforme status atual).
  - Clicar deletar: pedir confirmacao — transacoes vinculadas nao pagas serao removidas.
- "Editar" abre formulario inline no topo da tabela com dados preenchidos.
- "+ Nova Recorrência" abre formulario inline no topo da tabela (sem modal).
- Formulario de nova recorrencia/edicao:
  - Campos: descricao, tipo (entry/exit), grupo (fixed/installment/entry), valor (R$), categoria, método de pagamento, data inicio, data fim, dia do mês (1-31), total de parcelas (obrigatorio se grupo=installment).
  - Se tipo "entry", grupo fixo = "entry".
  - Se tipo "exit", grupo = "fixed" ou "installment".
  - Status inicial: active.
  - Ao salvar, backend dispara geracao automatica de transacoes conforme regras de recorrencia.
- Validacoes:
  - group permitido: fixed | installment | entry.
  - status permitido: active | paused.
  - type=entry => group=entry.
  - type=exit => group != entry.
  - group=installment => endDate e installmentTotal obrigatorios.
  - dayOfMonth entre 1 e 31.