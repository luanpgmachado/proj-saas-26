# Uso Local (fora do Replit)

## Requisitos
- Node.js 20+
- npm 9+
- PostgreSQL 16+

## 1) Subir ambiente completo local
- `npm install` Instala dependencias.
- VM com tunel SSH, abra tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define conexao banco.
- `npm run db:push` Cria/atualiza tabelas.
- `npm run dev` Sobe front+back.

## 2) Subir somente o front-end local
- `npm install` Instala dependencias.
- `npm run dev:client` Sobe Vite em `http://localhost:5000`.

## 3) Subir somente o back-end local
- `npm install` Instala dependencias.
- VM com tunel SSH, abra tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define conexao banco.
- `npm run dev:server` Sobe API em `http://localhost:3001/api`.

## 4) Subir o banco de dados local
- `psql -U postgres` Entra no Postgres local.
- `CREATE DATABASE financeiro_bl;` Cria banco.

## 5) Criar environments no PowerShell (local)
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Exporta variavel na sessao.
- `[Environment]::SetEnvironmentVariable("DATABASE_URL","postgres://usuario:senha@localhost:5433/financeiro_bl","User")` Persiste no perfil usuario.

## 6) Fluxo completo para deixar o ambiente no ar (local)
- `psql -U postgres` Entra no Postgres.
- `CREATE DATABASE financeiro_bl;` Cria banco.
- VM com tunel SSH, abra tunel em outro terminal:
  - `ssh -i "C:\Users\luanp\.ssh\oracle_dev_luan_private.key" -N -L 5433:localhost:5432 ubuntu@IP_DA_VM`
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define conexao.
- `npm install` Instala dependencias.
- `npm run db:push` Aplica schema.
- `npm run dev` Sobe front+back.

## 7) Backfill de recorrencias (parcelamentos legados)
- `npm install` Instala dependencias.
- `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"` Define conexao.
- `tsx server/backfill_recorrencias.ts` Cria recorrencias de parcelamentos existentes.

## 8) Checklist de testes manuais (recorrencias)
- Criar recorrencia fixa, gerar mes corrente -> 1 transacao criada.
- Rodar geracao mesmo mes -> nao duplicar.
- Criar recorrencia parcelada (`installmentTotal`), gerar meses sequenciais -> indices crescem, param no total.
- Editar recorrencia para `group=fixed` com `endDate=null` -> auto-gerar 24 meses a partir de `startDate` (sem duplicar).
- Pausar recorrencia, gerar mes seguinte -> nenhuma transacao nova.
- Cancelar recorrencia, gerar mes seguinte -> nenhuma transacao nova.

## 9) Padronizacao de schema (PT-BR vs EN)
- Schema oficial: `shared/schema.ts` (tabelas em ingles).
- `docs/REFERENCIAS_PT_BR/financeiro_bl.postgresql.sql` e `docs/REFERENCIAS_PT_BR/financeiro_bl.dbml` sao referencia PT-BR, nao aplicar em runtime.
- Banco local com tabelas PT-BR: recriar banco e rodar `npm run db:push`.
  - Exemplo (tunel ativo para VM):
    - `ssh -N -L 5433:localhost:5432 ubuntu@IP_DA_VM` (outro terminal)
    - `$env:DATABASE_URL="postgres://usuario:senha@localhost:5433/financeiro_bl"`
    - `npm run db:push`

## 10) Validar CRUD de recorrencias (local)
- Requisitos:
  - Back-end em `http://localhost:3001/api`.
  - Tabelas criadas com `npm run db:push`.
- Exemplos PowerShell:
  - Criar recorrencia fixa:
    - `Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/recurrences -ContentType "application/json" -Body '{"description":"Internet","type":"exit","group":"fixed","amountCents":12000,"categoryId":1,"paymentMethodId":1,"startDate":"2026-02-01","endDate":null,"dayOfMonth":5,"installmentTotal":null,"status":"active"}'`
  - Criar recorrencia parcelada:
    - `Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/recurrences -ContentType "application/json" -Body '{"description":"Notebook","type":"exit","group":"installment","amountCents":250000,"categoryId":1,"paymentMethodId":1,"startDate":"2026-02-01","endDate":"2026-11-01","dayOfMonth":10,"installmentTotal":10,"status":"active"}'`
  - Listar recorrencias:
    - `Invoke-RestMethod -Uri http://localhost:3001/api/recurrences`
  - Gerar transacoes do mes:
    - `Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/recurrences/generate?month=2026-02"`
  - Verificar transacoes geradas:
    - `Invoke-RestMethod -Uri "http://localhost:3001/api/transactions?month=2026-02"`
  - Pausar recorrencia:
    - `Invoke-RestMethod -Method Patch -Uri http://localhost:3001/api/recurrences/1 -ContentType "application/json" -Body '{"status":"paused"}'`
  - Cancelar recorrencia:
    - `Invoke-RestMethod -Method Delete -Uri http://localhost:3001/api/recurrences/1`

## Observacoes
- Historico testes: `docs/logs/TEST_LOG.md`.

## 11) Deploy em producao (Coolify + Hostinger)
- Ambiente:
  - VPS Ubuntu 24.04 LTS em `31.97.240.105`
  - Coolify em `http://31.97.240.105:8000/`
- Fluxo:
  - Seguir `docs/canonicos/RUNBOOK.md` (secoes "Deploy em VPS Hostinger com Coolify" e "Guardrail obrigatorio").
  - Codigo no GitHub (`git push origin main`) antes do deploy.
  - Validar variaveis banco (`DATABASE_URL`/`REPLIT_DB_URL`) antes de qualquer comando.
- DNS manual (Hostinger):
  - Registro `A` apontando para `31.97.240.105`.
  - Configurar dominio em **Domains** no Coolify.
  - Redeploy para emitir SSL.

### Comandos proibidos em producao
- Lista canonica em `docs/canonicos/RUNBOOK.md` (Guardrail obrigatorio).

## 12) Criar conta de acesso (local ou producao)
- Requisitos: `DATABASE_URL` apontando pro banco correto (local ou producao, via variavel de ambiente).
- `npx tsx server/scripts/create-user.ts email@exemplo.com "senha-forte" "Nome da Pessoa"` Cria conta. Sem autocadastro publico — toda conta passa por este script.
- Rodar de novo com o mesmo email retorna erro sem duplicar.

## 13) Variavel SESSION_SECRET
- Obrigatoria em producao (`NODE_ENV=production`); o servidor recusa subir sem ela.
- `$env:SESSION_SECRET="valor-aleatorio-longo"` Define localmente (opcional em dev).
- Em producao: configurar no Coolify como variavel de ambiente do app, com um valor aleatorio gerado uma vez e mantido estavel (trocar o valor invalida todas as sessoes ativas).

## 14) Preparar producao para login (passo humano, fora do fluxo de agente)
- Guardrail do `docs/canonicos/RUNBOOK.md` proibe agente rodar `npm run db:push` (ou qualquer comando de escrita de schema) contra producao. Os passos abaixo sao manuais, executados por uma pessoa, nao pelo agente.
- Ordem obrigatoria:
  1. **Criar tabelas `users`/`session` em producao**: em shell local, apontar `DATABASE_URL` para a string de conexao de producao e rodar `npm run db:push` manualmente. E aditivo — cria as tabelas novas, nenhuma tabela existente e alterada.
  2. **Definir `SESSION_SECRET`**: configurar no Coolify como variavel de ambiente do app, valor aleatorio longo, gerado uma vez e mantido estavel (trocar depois invalida todas as sessoes ativas).
  3. **Criar a(s) conta(s) real(is)**: com `DATABASE_URL` ainda apontando para producao, rodar `npx tsx server/scripts/create-user.ts <email> <senha> <nome>` (ver secao 12).
  4. **So entao** fazer deploy/redeploy do app.
- Checklist de smoke test (antes/depois do primeiro deploy de producao):
  - Confirmar que `POST /api/auth/login` retorna header `Set-Cookie` em producao (DevTools do navegador ou `curl -i` contra o dominio real). Sem isso o login fica inerte mesmo retornando 200.
  - Confirmar que o app se recusa a subir se `SESSION_SECRET` nao estiver definida em ambiente configurado como producao (`NODE_ENV=production`).
- Nota operacional — exclusao de conta: ao apagar a conta de uma pessoa, tambem rodar `DELETE FROM session;` no mesmo banco, forcando todo mundo a logar de novo. `requireAuth` so confere `req.session.userId`, nao revalida no banco a cada request — sessoes de uma conta apagada continuam validas ate expirar (ate 30 dias). Sem isso a sessao da pessoa removida continua ativa. Para um app de 2-5 pessoas essa e a abordagem mais simples e segura (nao da pra invalidar so a sessao de uma pessoa sem parsear o payload JSON do session store, e derrubar todo mundo ocasionalmente e um trade-off aceitavel nessa escala).