# UX Blueprint

## Diretrizes gerais
- Desktop-first.
- Grid fixo.
- Hierarquia visual orientada a leitura de numeros.
- Sem animacoes e sem modais, exceto se explicitado.

## Navegacao Global (Layout)
- O app usa **menu lateral** (sidebar) para reduzir a quantidade de abas no topo e agrupar funcionalidades relacionadas.
- Estrutura de tela (sempre):
  - Topo fixo (header) com nome do produto.
  - Menu lateral a esquerda com grupos e itens.
  - Area de conteudo a direita.
- Comportamento de rolagem:
  - Header e menu lateral permanecem visiveis (sticky).
  - Apenas a area de conteudo rola.
- O menu lateral:
  - Mostra **grupos com titulos** e itens abaixo (sem colapsar, sem animacao).
  - Destaca o item ativo claramente (fundo leve + borda/linha de acento).
  - Destaca o **grupo ativo** (grupo que contem a rota atual) de forma discreta.
  - Mantem foco visivel e suporte a teclado.
  - Deve existir um link de acessibilidade "Pular para o conteudo" no header para navegacao por teclado.

## Topo de Pagina (Padrao)
- Toda tela deve iniciar com um bloco `.barra-topo` para manter previsibilidade.
- Estrutura do `.barra-topo`:
  - Esquerda: titulo da tela (h2) e, quando aplicavel, controles de contexto (ex: seletor de mês/ano).
  - Direita: ação principal da tela (ex: `+ Novo Lançamento`, `+ Nova Recorrência`), quando existir.
- O bloco de filtros (quando existir) vem logo abaixo do `.barra-topo` (sem grudar no header global).

### Mapa de navegacao (grupos)
- **Visão**
  - Visão do Mês (`/`)
  - Panorama Anual (`/annual`)
- **Operação**
  - Lançamentos (`/transactions`)
  - Recorrências (`/recurrences`)
- **Planejamento**
  - Metas (`/goals`)
  - Investimentos / Reserva (`/investments`)
- **Cadastros**
  - Métodos de Pagamento (`/payment-methods`)

## Tela Principal - Visão do Mês
- Topo fixo com seletor de mês/ano a esquerda e botao "+ Novo Lançamento" a direita.
- Quatro cards horizontais: Entradas, Saidas, Valor Pago, Saldo Real (saldo com maior destaque).
- Saldo Projetado (Entradas - Saidas) aparece como informacao secundaria na area de saldo, sem virar card principal.
- Bloco "Gastos por Categoria" em tabela simples.
- A coluna Diferenca so ganha destaque quando estourar orcamento.
- Abas horizontais: Fixos, Variaveis, Parcelados, Entradas.
- Apenas uma aba visivel por vez, troca instantanea e sem efeito.
- Ao clicar em "+ Novo Lançamento", abrir modal de cadastro de lançamento.
  - Campos: descricao, valor (R$), tipo, grupo, data, categoria, método de pagamento.
  - Se tipo for "entry", grupo fica fixo como "entry".

## Tela de Lançamentos
- Filtros em linha no topo: categoria, metodo, tipo.
- Botao "Limpar filtros".
- Ao lado do filtro de categoria:
  - Botao "+ Nova categoria" (abre formulario inline abaixo dos filtros).
  - Quando houver uma categoria selecionada no filtro (diferente de "Todas"):
    - Botao "Editar categoria" (abre formulario inline com dados preenchidos).
    - Botao "Excluir categoria" com confirmacao inline (sem modal): primeiro clique entra em modo de confirmacao com botoes "Confirmar exclusao" e "Cancelar".
- Tabela com cabecalho fixo e scroll apenas no corpo.
- Edicao inline: clique edita, Enter salva, Esc cancela.
- Ações por linha discretas e sem chamar atencao.
- Coluna "Pago" apos coluna "Valor".
  - Checkbox apenas para `type = exit`.
  - Para `type = entry`, nao exibir checkbox.
  - Atualizacao instantanea ao marcar/desmarcar (otimista).
  - Nenhum modal e nenhuma animacao.
  - Feedback visual discreto na linha quando estiver paga.

### Formulario inline de categoria (Tela de Lançamentos)
- Campos:
  - Nome (obrigatorio)
  - Tipo: `income` | `expense` (obrigatorio)
  - Orçamento mensal (R$, opcional)
- Ao salvar:
  - Recarregar lista de categorias.
  - Se estiver criando, selecionar automaticamente a categoria criada no filtro.

## Tela de Métodos de Pagamento
- Tabela unica.
- Metodos nao-cartao primeiro, cartoes agrupados abaixo.
- Checkbox "pago no mês" visivel e funcional.
- Campos de fechamento e vencimento apenas para cartoes.

## Tela de Panorama Anual
- Tabela anual como elemento principal (12 linhas).
- Valores alinhados a direita.
- Grafico simples abaixo da tabela apenas para reforco visual, sem interacao.

## Tela de Metas Financeiras
- Lista vertical de metas.
- Cada meta em um bloco simples.
- Barra de progresso discreta e percentual numerico.
- Botao de aporte dentro do bloco.
- Historico de aportes em tabela logo abaixo.

## Tela de Investimentos / Reserva
- Dois blocos verticais bem separados.
- Reserva de emergencia no topo, investimentos abaixo.
- Apenas lista de aportes, sem simulacoes ou projecoes.

## Tela de Recorrências
- Topo com seletor de mês/ano a esquerda e botoes "Gerar Mês" e "+ Nova Recorrência" a direita.
- Ao clicar "Gerar Mês", chamar endpoint de geracao e exibir mensagem com quantidade de transacoes criadas.
- Abaixo, tabela com todas as recorrencias cadastradas.
- Colunas: descricao, tipo, grupo, valor, categoria, metodo, dia, status, inicio, fim, acoes.
- Ações por linha discretas: editar, pausar, cancelar, reativar (conforme status atual).
- Botao "Editar" abre formulario inline no topo da tabela com os dados preenchidos.
- Botao "+ Nova Recorrência" abre formulario inline no topo da tabela (sem modal).
- Formulario de nova recorrencia/edicao:
  - Campos: descricao, tipo (entry/exit), grupo (fixed/installment/entry), valor (R$), categoria, método de pagamento, data inicio, data fim, dia do mês (1-31), total de parcelas (obrigatorio se grupo=installment).
  - Se tipo for "entry", grupo fica fixo como "entry".
  - Se tipo for "exit", grupo deve ser "fixed" ou "installment".
  - Status inicial: active.
  - Ao salvar criacao/edicao, o backend deve disparar geracao automatica de transacoes conforme as regras de recorrencia.
- Validacoes:
  - group permitido: fixed | installment | entry.
  - status permitido: active | paused | canceled.
  - type=entry => group=entry.
  - type=exit => group != entry.
  - group=installment => endDate e installmentTotal obrigatorios.
  - dayOfMonth entre 1 e 31.
