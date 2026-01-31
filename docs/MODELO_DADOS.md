# Modelo de Dados

## Diagrama ER
```mermaid
erDiagram
  categories o|--o{ transactions : category
  payment_methods o|--o{ transactions : payment_method
  recurrences o|--o{ transactions : recurrence
  goals ||--o{ goal_contributions : goal
  reserves ||--o{ reserve_contributions : reserve
  investments ||--o{ investment_contributions : investment

  categories {
    int id PK
    varchar name
    varchar kind
    int monthlyBudgetCents "nullable"
  }

  payment_methods {
    int id PK
    varchar name
    varchar type
    boolean isCard
    boolean paidInMonth
    int closingDay "nullable"
    int dueDay "nullable"
  }

  transactions {
    int id PK
    date date
    text description
    varchar type
    int amountCents
    int categoryId "nullable"
    int paymentMethodId "nullable"
    varchar group
    varchar installmentGroupId "nullable"
    int installmentIndex "nullable"
    int installmentTotal "nullable"
    int recurrenceId "nullable"
  }

  recurrences {
    int id PK
    text description
    varchar type
    varchar group
    int amountCents
    int categoryId "nullable"
    int paymentMethodId "nullable"
    date startDate
    date endDate "nullable"
    int dayOfMonth
    int installmentTotal "nullable"
    varchar status
  }

  goals {
    int id PK
    varchar name
    int targetCents
  }

  goal_contributions {
    int id PK
    int goalId FK
    date date
    int amountCents
  }

  reserves {
    int id PK
    varchar name
  }

  reserve_contributions {
    int id PK
    int reserveId FK
    date date
    int amountCents
  }

  investments {
    int id PK
    varchar name
  }

  investment_contributions {
    int id PK
    int investmentId FK
    date date
    int amountCents
  }
```

## Conceitual
- Categoria classifica lancamentos e define tipo (income/expense) e orcamento mensal.
- Metodo de pagamento define o meio de pagamento e dados de cartao quando aplicavel.
- Lancamento registra entradas e saidas por data, valor e grupo (fixo/variavel/parcelado/entrada).
- Recorrencia define um lancamento mensal recorrente (fixo ou parcelado) e gera transacoes.
- Meta financeira recebe aportes que somam o valor atual.
- Reserva e um container unico de emergencia com seus aportes.
- Investimento representa contas de investimento com seus aportes.

## Logico (tabelas e campos)
- categories: id, name, kind, monthlyBudgetCents.
- payment_methods: id, name, type, isCard, paidInMonth, closingDay, dueDay.
- transactions: id, date, description, type, amountCents, categoryId, paymentMethodId, group, installmentGroupId, installmentIndex, installmentTotal, recurrenceId.
- recurrences: id, description, type, group, amountCents, categoryId, paymentMethodId, startDate, endDate, dayOfMonth, installmentTotal, status.
- goals: id, name, targetCents.
- goal_contributions: id, goalId, date, amountCents.
- reserves: id, name.
- reserve_contributions: id, reserveId, date, amountCents.
- investments: id, name.
- investment_contributions: id, investmentId, date, amountCents.

## Relacoes e cardinalidade
- categories 1 -> 0..N transactions (categoryId opcional no lancamento).
- payment_methods 1 -> 0..N transactions (paymentMethodId opcional no lancamento).
- recurrences 1 -> 0..N transactions (recurrenceId opcional no lancamento).
- goals 1 -> 0..N goal_contributions (obrigatorio).
- reserves 1 -> 0..N reserve_contributions (obrigatorio).
- investments 1 -> 0..N investment_contributions (obrigatorio).

## Enumeracoes principais
- transactions.type: entry | exit.
- transactions.group: fixed | variable | installment | entry.
- payment_methods.type: cash | transfer | debit | credit_card | other.
- categories.kind: income | expense.
- recurrences.type: entry | exit.
- recurrences.group: fixed | installment | entry.
- recurrences.status: active | paused | canceled.

## Regras de recorrencia (dados)
- Recorrencia e um template; transacoes sao a fonte de verdade para relatorios.
- Geracao de transacoes e sempre explicita; nao ha criacao automatica implicita.
- Edicoes na recorrencia afetam apenas ocorrencias futuras.
- Cancelamento pausa novas ocorrencias e nao remove transacoes existentes.
- Para parcelamento: group = installment e installmentTotal obrigatorio.
- Para receita: type = entry e group = entry.
- dayOfMonth maior que o ultimo dia do mes usa o ultimo dia do mes.
- Recorrencia fixa de longo prazo usa endDate = null (ex: aluguel, internet).
- Reajuste de valor: preferir criar nova recorrencia com novo amountCents e startDate, e pausar/cancelar a anterior para preservar historico.

## Migracao incremental (dados)
- Manter installmentGroupId, installmentIndex e installmentTotal como legado.
- Adicionar recurrenceId opcional em transactions para novos recorrentes.
- Gerar recurrences a partir de installmentGroupId apenas quando dados forem consistentes.
- Preencher recurrenceId nas transacoes migradas sem alterar valores existentes.
