# API Contract

## Convencoes
- Base path: `/api`.
- JSON em todas respostas e requisicoes.
- Datas em ISO 8601 (`YYYY-MM-DD`).
- Mes em formato `YYYY-MM`.
- Valores monetarios em centavos (inteiro), sufixo `Cents`.

## Entidades

### Category
- id
- name
- kind: `income` | `expense`
- monthlyBudgetCents (opcional)

### PaymentMethod
- id
- name
- type: `cash` | `transfer` | `debit` | `credit_card` | `other`
- isCard (bool)
- paidInMonth (bool)
- closingDay (1-31, somente cartao)
- dueDay (1-31, somente cartao)

### Transaction
- id
- date
- description
- type: `entry` | `exit`
- amountCents
- categoryId
- paymentMethodId
- group: `fixed` | `variable` | `installment` | `entry`
- installmentGroupId (opcional)
- installmentIndex (opcional)
- installmentTotal (opcional)
- recurrenceId (opcional)
- isPaid (bool, default `false`, somente `exit`)
- paidAt (date ISO `YYYY-MM-DD`, nullable)

### Recurrence
- id
- description
- type: `entry` | `exit`
- group: `fixed` | `installment` | `entry`
- amountCents
- categoryId
- paymentMethodId
- startDate
- endDate (opcional; obrigatorio quando `group = installment`)
- dayOfMonth
- installmentTotal (opcional; obrigatorio quando `group = installment`)
- status: `active` | `paused`

### MonthSummary
- month
- entriesCents
- exitsCents
- paidExitsCents
- balanceCents
- realBalanceCents

Notas:
- `balanceCents` = Entradas - Saidas (**Saldo Projetado**).
- `realBalanceCents` = Entradas - Valor Pago (**Saldo Real**).

### CategorySpend
- categoryId
- categoryName
- budgetCents
- spentCents
- diffCents

### AnnualSummaryRow
- month
- entriesCents
- exitsCents
- balanceCents

### Goal
- id
- name
- targetCents
- currentCents
- progressPercent

### GoalContribution
- id
- goalId
- date
- amountCents

### Reserve
- id
- name
- currentCents

### ReserveContribution
- id
- date
- amountCents

### InvestmentAccount
- id
- name
- currentCents

### InvestmentContribution
- id
- investmentId
- date
- amountCents

## Endpoints

### Resumo mensal
- GET `/api/months/{month}/summary` -> MonthSummary
- GET `/api/months/{month}/categories` -> CategorySpend[]
- GET `/api/months/{month}/transactions?group={group}` -> Transaction[]

### Lancamentos
- GET `/api/transactions?month={YYYY-MM}&categoryId=&methodId=&type=` -> Transaction[]
- POST `/api/transactions` -> Transaction
- PATCH `/api/transactions/{id}` -> Transaction

Campos editaveis no PATCH: date, description, amountCents, categoryId,
paymentMethodId, type, group, installmentIndex, installmentTotal, isPaid, paidAt.

Regras:
- Somente `type = exit` aceita `isPaid = true`.
- Se `type = entry`, backend mantem `isPaid = false` e `paidAt = null`.

Erros:
- `400` ao marcar `isPaid = true` em lancamento `type = entry`.

### Recorrencias
- GET `/api/recurrences` -> Recurrence[]
- POST `/api/recurrences` -> Recurrence
- PATCH `/api/recurrences/{id}` -> Recurrence
- DELETE `/api/recurrences/{id}` -> `{ success: true, deletedUnpaidTransactions: number, detachedPaidTransactions: number }`
- POST `/api/recurrences/generate?month={YYYY-MM}` -> Transaction[]

Regras:
- `group = installment` exige `endDate` e `installmentTotal`.
- `POST /api/recurrences` e `PATCH /api/recurrences/{id}` disparam geracao automatica de transacoes.
- `group = fixed` com `endDate = null`: geracao cobre 24 meses a partir de `startDate`.
- Ao deletar recorrencia:
  - recorrencia removida;
  - transacoes vinculadas com `isPaid = false` excluidas;
  - transacoes vinculadas com `isPaid = true` **nao** excluidas, **desvinculadas** (`recurrenceId = null`) para preservar historico.
  - `404` quando `id` nao existir.

## Relatorios e recorrencias
- Relatorios mensais/anuais usam somente `transactions` como fonte de verdade.
- Recorrencias nao geradas nao impactam totais nem categorias.
- Geracao ocorre automaticamente no CRUD de recorrencias; tambem acionavel via endpoint mensal.
- Meses futuros gerados refletem nos totais do panorama anual.

## Padrao recomendado para recorrencias fixas
- Despesas fixas longas (aluguel, internet): `group = fixed`, `endDate = null`, `dayOfMonth` no vencimento.
- Reajuste de valor: criar nova recorrencia com novo `amountCents` e `startDate`; pausar recorrencia anterior.

### Metodos de pagamento
- GET `/api/payment-methods` -> PaymentMethod[]
- POST `/api/payment-methods` -> PaymentMethod
- PATCH `/api/payment-methods/{id}` -> PaymentMethod

### Categorias
- GET `/api/categories` -> Category[]
- POST `/api/categories` -> Category
- PATCH `/api/categories/{id}` -> Category
- DELETE `/api/categories/{id}` -> `{ success: true }`

Payloads:
- POST `/api/categories`
  - body: `{ name, kind, monthlyBudgetCents? }`
- PATCH `/api/categories/{id}`
  - Campos editaveis: `name`, `kind`, `monthlyBudgetCents`

Erros:
- `400` payload invalido (ex: `name` vazio, `kind` fora de `income|expense`, `monthlyBudgetCents` negativo).
- `404` quando `id` nao existir.
- `409` ao excluir categoria em uso por `transactions` ou `recurrences`.

### Panorama anual
- GET `/api/years/{year}/summary` -> AnnualSummaryRow[]

### Metas financeiras
- GET `/api/goals` -> Goal[]
- GET `/api/goals/{id}/contributions` -> GoalContribution[]
- POST `/api/goals/{id}/contributions` -> GoalContribution

### Reserva de emergencia
- GET `/api/reserve` -> Reserve
- GET `/api/reserve/contributions` -> ReserveContribution[]
- POST `/api/reserve/contributions` -> ReserveContribution

### Investimentos
- GET `/api/investments` -> InvestmentAccount[]
- GET `/api/investments/{id}/contributions` -> InvestmentContribution[]
- POST `/api/investments/{id}/contributions` -> InvestmentContribution