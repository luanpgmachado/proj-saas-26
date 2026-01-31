# API Contract

## Convencoes
- Base path: `/api`.
- JSON em todas as respostas e requisicoes.
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

### Recurrence
- id
- description
- type: `entry` | `exit`
- group: `fixed` | `installment` | `entry`
- amountCents
- categoryId
- paymentMethodId
- startDate
- endDate (opcional)
- dayOfMonth
- installmentTotal (opcional)
- status: `active` | `paused` | `canceled`

### MonthSummary
- month
- entriesCents
- exitsCents
- balanceCents

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
paymentMethodId, type, group, installmentIndex, installmentTotal.

### Recorrencias
- GET `/api/recurrences` -> Recurrence[]
- POST `/api/recurrences` -> Recurrence
- PATCH `/api/recurrences/{id}` -> Recurrence
- POST `/api/recurrences/generate?month={YYYY-MM}` -> Transaction[]

## Relatorios e recorrencias
- Relatorios mensais e anuais usam apenas `transactions` como fonte de verdade.
- Recorrencias nao geradas nao impactam totais nem categorias.
- Geracao e explicita via endpoint e pode incluir meses futuros.
- Gerar meses futuros reflete nos totais de panorama anual quando houver transacoes criadas.

## Padrao recomendado para recorrencias fixas
- Para despesas fixas de longo prazo (aluguel, internet), usar:
  - `group = fixed`, `endDate = null`, `dayOfMonth` no dia de vencimento.
- Reajuste de valor:
  - Criar nova recorrencia com novo `amountCents` e `startDate`.
  - Pausar/cancelar a recorrencia anterior para preservar historico.

### Metodos de pagamento
- GET `/api/payment-methods` -> PaymentMethod[]
- POST `/api/payment-methods` -> PaymentMethod
- PATCH `/api/payment-methods/{id}` -> PaymentMethod

### Categorias
- GET `/api/categories` -> Category[]

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
