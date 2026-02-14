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
- `CREATE DATABASE financeiro_bl;` Cria o banco local.

## 5) Criar environments no PowerShell (local)
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Exporta a variavel na sessao atual.
- `[Environment]::SetEnvironmentVariable("DATABASE_URL","postgres://usuario:senha@localhost:5433/financeiro_bl","User")` Persiste a variavel no perfil do usuario.

## 6) Fluxo completo para deixar o ambiente no ar (local)
- `psql -U postgres` Entra no Postgres local.
- `CREATE DATABASE financeiro_bl;` Cria o banco.
- Se usar VM com tunel SSH, abra o tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define a conexao local.
- `npm install` Instala dependencias.
- `npm run db:push` Aplica o schema no banco.
- `npm run dev` Sobe front-end e back-end.

## 7) Backfill de recorrencias (parcelamentos legados)
- `npm install` Instala dependencias.
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define a conexao local.
- `tsx server/backfill_recorrencias.ts` Cria recorrencias a partir de parcelamentos existentes.

## 8) Checklist de testes manuais (recorrencias)
- Criar recorrencia fixa e gerar mes corrente -> 1 transacao criada.
- Rodar geracao do mesmo mes novamente -> nao deve duplicar.
- Criar recorrencia parcelada (installmentTotal) e gerar meses sequenciais -> indices crescem e param no total.
- Pausar recorrencia e gerar mes seguinte -> nenhuma transacao nova.
- Cancelar recorrencia e gerar mes seguinte -> nenhuma transacao nova.

## 9) Padronizacao de schema (PT-BR vs EN)
- O schema oficial do app e o definido em `shared/schema.ts` (tabelas em ingles).
- Arquivos `docs/REFERENCIAS_PT_BR/financeiro_bl.postgresql.sql` e `docs/REFERENCIAS_PT_BR/financeiro_bl.dbml` sao referencia PT-BR e nao devem ser aplicados no banco em runtime.
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

## Observacoes
- Historico de testes: `docs/TEST_LOG.md`.

## 11) Deploy em producao (Coolify + Hostinger)
- Ambiente alvo:
  - VPS Ubuntu 24.04 LTS em `31.97.240.105`
  - Coolify em `http://31.97.240.105:8000/`
- Fluxo:
  - Garantir codigo no GitHub (`git push origin main`).
  - No Coolify (via MCP), criar/atualizar app com `build_pack=dockerfile` e porta `3001`.
  - Configurar envs da app:
    - `PORT=3001`
    - `NODE_ENV=production`
    - `DATABASE_URL=<url do postgres>`
  - Disparar deploy e monitorar logs ate `finished`.
- DNS manual (Hostinger):
  - Criar registro `A` para dominio/subdominio apontando para `31.97.240.105`.
  - Depois configurar o dominio no campo **Domains** do app no Coolify.
  - Executar redeploy para emitir SSL.
