# Uso de Relatorios Read-only em Producao

## Objetivo
Consultar o PostgreSQL de producao com usuario dedicado somente leitura para criar relatorios personalizados via `SELECT`, sem alterar dados, schema ou ambiente da aplicacao.

## Banco usado pelo projeto
O projeto usa PostgreSQL.

Referencias:
- `server/db.ts`: conexao por `REPLIT_DB_URL || DATABASE_URL`.
- `drizzle.config.ts`: `dialect: "postgresql"`.
- `shared/schema.ts`: schema Drizzle para tabelas PostgreSQL.
- `docs/canonicos/RUNBOOK.md`: guardrails de producao.

## Guardrails obrigatorios
- Nao executar `npm run db:push` em producao.
- Nao executar `npm run db:seed` em producao.
- Nao executar `tsx server/backfill_recorrencias.ts` em producao.
- Nao executar `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER` ou `DROP` com usuario de relatorio.
- Nao salvar `DATABASE_URL`, `REPORT_DATABASE_URL`, senha ou token em arquivo versionado.
- Nao abrir PostgreSQL para internet publica.
- Preferir SSH tunnel ou rede interna segura.

## Pre-requisitos locais
- PostgreSQL client tools com `psql` no `PATH`.
- Acesso SSH autorizado a VPS/Coolify.
- URL read-only definida apenas na sessao atual do terminal.

Verificar `psql`:

```powershell
psql --version
```

## Criar usuario read-only
Executar somente com credencial administrativa do PostgreSQL e somente uma vez por ambiente.

Variaveis locais de exemplo:

```powershell
$env:PROD_DATABASE_ADMIN_URL="postgres://ADMIN_USER:SENHA_ADMIN@localhost:5434/NOME_DATABASE_PRODUCAO"
$env:REPORT_DB_NAME="NOME_DATABASE_PRODUCAO"
$env:REPORT_DB_USER="report_readonly"
$env:REPORT_DB_PASSWORD="SENHA_GERADA_FORA_DO_GIT"
```

Aplicar setup:

```powershell
psql "$env:PROD_DATABASE_ADMIN_URL" `
  -v database_name="$env:REPORT_DB_NAME" `
  -v report_user="$env:REPORT_DB_USER" `
  -v report_password="$env:REPORT_DB_PASSWORD" `
  -f scripts/reporting/setup-report-readonly.sql
```

## Conectar para relatorios
Abrir tunel SSH em um terminal separado:

```powershell
ssh -N -L 5434:localhost:5432 root@31.97.240.105
```

Definir URL read-only na sessao atual:

```powershell
$env:REPORT_DATABASE_URL="postgres://report_readonly:SENHA_GERADA_FORA_DO_GIT@localhost:5434/NOME_DATABASE_PRODUCAO"
```

Conectar:

```powershell
psql "$env:REPORT_DATABASE_URL"
```

## Validar permissoes
Rodar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/reporting/Test-ReportReadonly.ps1
```

Resultado esperado:
- SELECTs passam.
- DDL e DML falham.
- Script termina com `All read-only validation probes passed.`

## Consultas base
Arquivo com exemplos:

```powershell
psql "$env:REPORT_DATABASE_URL" -f scripts/reporting/sample-report-queries.sql
```

## Boas praticas de SELECT
- Evite `SELECT *`.
- Liste colunas explicitamente.
- Filtre por periodo.
- Use `LIMIT` em consultas exploratorias.
- Evite transacoes manuais longas.
- Nao deixe sessao parada dentro de `BEGIN`.
- Prefira intervalos pequenos para agregacoes.
- Ajuste datas antes de rodar exemplos.

## Tabelas principais
- `transactions`
- `categories`
- `payment_methods`
- `recurrences`
- `goals`
- `goal_contributions`
- `reserves`
- `reserve_contributions`
- `investments`
- `investment_contributions`

## Troubleshooting
- `psql not found`: instalar PostgreSQL client tools e reabrir terminal.
- `connection refused`: verificar tunel SSH e porta local `5434`.
- `password authentication failed`: conferir senha da role `report_readonly`.
- `permission denied`: esperado para escrita/DDL; se ocorrer em SELECT, revisar grants.
- consulta cancelada por timeout: reduzir periodo, selecionar menos colunas ou criar relatorio em partes.
