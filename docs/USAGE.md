# Uso Local (fora do Replit)

## Requisitos
- Node.js 20+
- npm 9+
- PostgreSQL 16+

## 1) Subir ambiente completo local
- `npm install` Instala dependencias do projeto.
- Se usar VM com tunel SSH, abra o tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define a conexao local do banco.
- `npm run db:push` Cria/atualiza as tabelas no banco local.
- `npm run dev` Sobe front-end e back-end juntos.

## 2) Subir somente o front-end local
- `npm install` Instala dependencias do projeto.
- `npm run dev:client` Sobe o Vite em `http://localhost:5000`.

## 3) Subir somente o back-end local
- `npm install` Instala dependencias do projeto.
- Se usar VM com tunel SSH, abra o tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define a conexao local do banco.
- `npm run dev:server` Sobe a API em `http://localhost:3001/api`.

## 4) Subir o banco de dados local
- `psql -U postgres` Entra no Postgres local.
- `CREATE DATABASE financas;` Cria o banco local.

## 5) Criar environments no PowerShell (local)
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5432/financas"` Exporta a variavel na sessao atual.
- `[Environment]::SetEnvironmentVariable("DATABASE_URL","postgres://usuario:senha@localhost:5432/financas","User")` Persiste a variavel no perfil do usuario.

## 6) Fluxo completo para deixar o ambiente no ar (local)
- `psql -U postgres` Entra no Postgres local.
- `CREATE DATABASE financas;` Cria o banco.
- Se usar VM com tunel SSH, abra o tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define a conexao local.
- `npm install` Instala dependencias.
- `npm run db:push` Aplica o schema no banco.
- `npm run dev` Sobe front-end e back-end.

## 7) Backfill de recorrencias (parcelamentos legados)
- `npm install` Instala dependencias.
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5432/financas"` Define a conexao local.
- `tsx server/backfill_recorrencias.ts` Cria recorrencias a partir de parcelamentos existentes.

## 8) Checklist de testes manuais (recorrencias)
- Criar recorrencia fixa e gerar mes corrente -> 1 transacao criada.
- Rodar geracao do mesmo mes novamente -> nao deve duplicar.
- Criar recorrencia parcelada (installmentTotal) e gerar meses sequenciais -> indices crescem e param no total.
- Pausar recorrencia e gerar mes seguinte -> nenhuma transacao nova.
- Cancelar recorrencia e gerar mes seguinte -> nenhuma transacao nova.

## 9) Padronizacao de schema (PT-BR vs EN)
- O schema oficial do app e o definido em `shared/schema.ts` (tabelas em ingles).
- Arquivos `financeiro_bl.postgresql.sql` e `financeiro_bl.dbml` sao referencia PT-BR e nao devem ser aplicados no banco em runtime.
- Se o banco local tiver tabelas em PT-BR, recrie o banco e rode `npm run db:push`.
  - Exemplo (com tunel ativo para VM):
    - `ssh -N -L 5433:localhost:5432 ubuntu@IP_DA_VM` (em outro terminal)
    - `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"`
    - `npm run db:push`

## 10) Validar CRUD de recorrencias (local)
- Requisitos:
  - Back-end rodando em `http://localhost:3001/api`.
  - Tabelas criadas com `npm run db:push`.
- Exemplos em PowerShell:
  - Criar recorrencia fixa:
    - `Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/recurrences -ContentType "application/json" -Body '{"description":"Internet","type":"exit","group":"fixed","amountCents":12000,"categoryId":1,"paymentMethodId":1,"startDate":"2026-02-01","endDate":null,"dayOfMonth":5,"installmentTotal":null,"status":"active"}'`
  - Criar recorrencia parcelada:
    - `Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/recurrences -ContentType "application/json" -Body '{"description":"Notebook","type":"exit","group":"installment","amountCents":250000,"categoryId":1,"paymentMethodId":1,"startDate":"2026-02-01","endDate":null,"dayOfMonth":10,"installmentTotal":10,"status":"active"}'`
  - Listar recorrencias:
    - `Invoke-RestMethod -Uri http://localhost:3001/api/recurrences`
  - Gerar transacoes do mes:
    - `Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/recurrences/generate?month=2026-02"`
  - Verificar transacoes geradas:
    - `Invoke-RestMethod -Uri "http://localhost:3001/api/transactions?month=2026-02"`
  - Pausar recorrencia:
    - `Invoke-RestMethod -Method Patch -Uri http://localhost:3001/api/recurrences/1 -ContentType "application/json" -Body '{"status":"paused"}'`
  - Cancelar recorrencia:
    - `Invoke-RestMethod -Method Patch -Uri http://localhost:3001/api/recurrences/1 -ContentType "application/json" -Body '{"status":"canceled"}'`

## 11) Registro de teste backend (recorrencias)
- Data: 2026-01-30
- Ambiente: local com tunel SSH e `DATABASE_URL` apontando para VM.
- Cenarios testados (assumidos para teste):
  - Financiamento: startDate 2026-01-18, dayOfMonth 18, installmentTotal 18, amountCents 53700.
  - Aluguel: startDate 2026-01-15, dayOfMonth 15, endDate 2029-12-31, amountCents 230000.
  - Compra Monitor: startDate 2026-01-18, dayOfMonth 18, installmentTotal 5, amountCents 10000.
- Resultados:
  - Criacao e listagem de recorrencias OK.
  - Geracao 2026-02 criou 3 transacoes (2 parceladas + 1 fixa).
  - Idempotencia OK: nova geracao do mesmo mes nao criou duplicatas.
  - Pausa de aluguel OK: geracao 2026-03 nao criou transacao do aluguel.

## 11.1) Registro de teste backend no Replit
- Data: 2026-01-31
- Ambiente: Replit com banco Postgres Neon integrado.
- Recorrencias criadas (ids 4, 5, 6):
  - Financiamento (id=4): parcelado, 18 parcelas de R$537,00, dia 18, startDate 2026-01-18, endDate 2027-06-18.
  - Aluguel (id=5): fixo, R$2.300,00, dia 15, startDate 2026-01-15, endDate 2029-12-31.
  - Monitor (id=6): parcelado, 5 parcelas de R$100,00, dia 18, startDate 2026-01-18, endDate 2026-05-18.
- Resultados:
  - Geracao 2026-02: criou 3 transacoes (Financiamento parcela 2/18, Aluguel, Monitor parcela 2/5).
  - Idempotencia OK: nova geracao do mesmo mes retornou array vazio (sem duplicatas).
  - Pausa de Aluguel (id=5): status alterado para "paused".
  - Geracao 2026-03: criou 2 transacoes (Financiamento parcela 3/18, Monitor parcela 3/5). Aluguel pausado NAO gerou transacao.
- Validacoes:
  - recurrenceId presente em todas as transacoes geradas.
  - installmentIndex incrementando corretamente (2, 3, ...).
  - installmentTotal consistente com a recorrencia (18 e 5).
- Conclusao: Backend funcionando conforme API_CONTRACT.md e MODELO_DADOS.md.

## 12) Padrao recomendado para recorrencias fixas
- Objetivo: manter previsibilidade e historico (aluguel, internet, condominio).
- Regra base:
  - `group = "fixed"`
  - `endDate = null` quando nao ha data final definida
  - `dayOfMonth` igual ao dia de vencimento
- Reajuste:
  - Crie nova recorrencia com novo valor e novo `startDate`
  - Pause/cancele a recorrencia anterior
- Exemplo (aluguel sem data final):
  - `Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/recurrences -ContentType "application/json" -Body '{"description":"Aluguel","type":"exit","group":"fixed","amountCents":230000,"categoryId":1,"paymentMethodId":1,"startDate":"2026-01-15","endDate":null,"dayOfMonth":15,"installmentTotal":null,"status":"active"}'`
- Exemplo (reajuste de valor):
  - Nova recorrencia com novo valor:
    - `Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/recurrences -ContentType "application/json" -Body '{"description":"Aluguel","type":"exit","group":"fixed","amountCents":250000,"categoryId":1,"paymentMethodId":1,"startDate":"2026-07-15","endDate":null,"dayOfMonth":15,"installmentTotal":null,"status":"active"}'`
  - Pausar recorrencia anterior:
    - `Invoke-RestMethod -Method Patch -Uri http://localhost:3001/api/recurrences/2 -ContentType "application/json" -Body '{"status":"paused"}'`
