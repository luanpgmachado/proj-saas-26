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
- O app usa **menu lateral** (sidebar) para reduzir a quantidade de abas no topo e agrupar funcionalidades relacionadas.
- Estrutura de tela (sempre):
  - Menu lateral a esquerda (sticky) com logo/nome do produto.
  - Area de conteudo a direita.
- Comportamento de rolagem:
  - Menu lateral permanece visivel (sticky).
  - Apenas a area de conteudo rola.
- O menu lateral:
  - Mostra **grupos com titulos** e itens abaixo.
  - Destaca o item ativo claramente (fundo leve + borda/linha de acento).
  - Destaca o **grupo ativo** (grupo que contem a rota atual) de forma discreta.
  - Mantem foco visivel e suporte a teclado.
  - Pode ser **recolhivel** (toggle manual), reduzindo para icones.
    - Persistir escolha do usuario (ex: `localStorage`).
    - Sem animacao obrigatoria; transicao suave simples e aceitavel.
  - Deve existir um link de acessibilidade "Pular para o conteudo" para navegacao por teclado (no topo da area de conteudo).

## Topo de Pagina (Padrao)
- Toda tela deve iniciar com um bloco `.barra-topo` para manter previsibilidade.
- Estrutura do `.barra-topo`:
  - Esquerda: titulo da tela (h2) e, quando aplicavel, controles de contexto (ex: seletor de mês/ano).
  - Direita: ação principal da tela (ex: `+ Novo Lançamento`, `+ Nova Recorrência`), quando existir.
- O bloco de filtros (quando existir) vem logo abaixo do `.barra-topo` (sem grudar no header global).
 - No Layout 3.0, este topo pode ser implementado como um componente `CabecalhoConteudo` com:
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
- Topo com seletor de mês/ano a direita e titulo/subtitulo a esquerda (Layout 3.0).
- Quatro cards horizontais: Entradas, Saidas, Saldo Real, Saldo Projetado.
- Blocos abaixo (duas colunas no desktop):
  - "Distribuição por Categoria" como grafico simples tipo donut + legenda.
  - "Próximos Vencimentos" como lista dos proximos lançamentos `exit` nao pagos no mês (top 5).
- Ao final, um insight simples (mensagem de reforco) pode aparecer como card pequeno.
- Ao clicar em "+ Novo Lançamento", abrir modal de cadastro de lançamento (explicitado).
  - Campos: descricao, valor (R$), data, categoria, método de pagamento, tipo.
  - Observacao: a regra `type=entry => group=entry` continua valida, mesmo que o campo `group` nao esteja exposto no modal.

## Tela de Lançamentos
- Topo com titulo/subtitulo e botao "+ Novo Lançamento".
- Barra de filtros:
  - Chips: Todos, Pagos, Pendentes, Atrasados (visual; mapeamento interno pode usar `type`/`isPaid` quando aplicavel).
  - Busca por descricao (cliente).
- Tabela principal em surface card:
  - Colunas: descricao, categoria, metodo, data, status, valor, acoes.
  - Acoes por linha discretas (aparecem no hover/focus, mas acessiveis por teclado).
- Gerenciamento de categorias nao ocorre aqui:
  - Exibir link/botao "Gerenciar categorias" que leva para `/categories`.

## Tela de Categorias
- Grid de cards (desktop-first), cada card mostra:
  - Nome da categoria
  - Tipo (Receita/Despesa)
  - Contagem de lançamentos no mês atual (opcional, calculado no cliente).
- Acoes por card discretas: editar, excluir.
- Botao "+ Nova Categoria" abre modal de criacao (explicitado).
  - Campos: Nome, Tipo (income/expense), Orcamento mensal (R$, opcional).
  - Ao salvar: recarregar lista.
- Exclusao com confirmacao (sem modal de sistema); pode usar um modal leve de confirmacao (explicitado) para manter previsibilidade.

## Tela de Métodos de Pagamento
- Exibir cartoes como cards (sem "limite/usado" se nao existir dado no backend).
- Exibir "Contas e Outros" como lista em surface card.
- Acoes discretas: editar/excluir (sem chamar atencao).
- "Pago no mês" visivel e funcional.
- Campos de fechamento e vencimento apenas para cartoes.
- Criar/editar metodo usa modal existente (explicitado).

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
