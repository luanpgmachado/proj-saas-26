# UX Blueprint

## Diretrizes gerais
- Desktop-first.
- Grid fixo.
- Hierarquia visual orientada a leitura de numeros.
- Sem animacoes e sem modais, exceto se explicitado.

## Tela Principal - Visao do Mes
- Topo fixo com seletor de mes/ano a esquerda e botao "+ Novo Lancamento" a direita.
- Tres cards horizontais: Entradas, Saidas, Saldo (saldo com maior destaque).
- Bloco "Gastos por Categoria" em tabela simples.
- A coluna Diferenca so ganha destaque quando estourar orcamento.
- Abas horizontais: Fixos, Variaveis, Parcelados, Entradas.
- Apenas uma aba visivel por vez, troca instantanea e sem efeito.
- Ao clicar em "+ Novo Lancamento", abrir modal de cadastro de lancamento.
  - Campos: descricao, valor (R$), tipo, grupo, data, categoria, metodo de pagamento.
  - Se tipo for "entry", grupo fica fixo como "entry".

## Tela de Lancamentos
- Filtros em linha no topo: categoria, metodo, tipo.
- Botao "Limpar filtros".
- Tabela com cabecalho fixo e scroll apenas no corpo.
- Edicao inline: clique edita, Enter salva, Esc cancela.
- Acoes por linha discretas e sem chamar atencao.

## Tela de Metodos de Pagamento
- Tabela unica.
- Metodos nao-cartao primeiro, cartoes agrupados abaixo.
- Checkbox "pago no mes" visivel e funcional.
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

## Tela de Recorrencias
- Topo com seletor de mes/ano a esquerda e botao "Gerar Mes" a direita.
- Ao clicar "Gerar Mes", chamar endpoint de geracao e exibir mensagem com quantidade de transacoes criadas.
- Abaixo, tabela com todas as recorrencias cadastradas.
- Colunas: descricao, tipo, grupo, valor, categoria, dia do mes, status, data inicio, data fim.
- Acoes por linha discretas: editar, pausar, cancelar, reativar (conforme status atual).
- Edicao inline: clique edita, Enter salva, Esc cancela.
- Botao "+ Nova Recorrencia" abre formulario inline no topo da tabela (sem modal).
- Formulario de nova recorrencia:
  - Campos: descricao, tipo (entry/exit), grupo (fixed/installment/entry), valor (R$), categoria, metodo de pagamento, data inicio, data fim (opcional), dia do mes (1-31), total de parcelas (obrigatorio se grupo=installment).
  - Se tipo for "entry", grupo fica fixo como "entry".
  - Se tipo for "exit", grupo deve ser "fixed" ou "installment".
  - Status inicial: active.
- Validacoes:
  - group permitido: fixed | installment | entry.
  - status permitido: active | paused | canceled.
  - type=entry => group=entry.
  - type=exit => group != entry.
  - group=installment => installmentTotal obrigatorio.
  - dayOfMonth entre 1 e 31.
