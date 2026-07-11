# Acesso Read-only ao PostgreSQL de Producao Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar acesso seguro de relatorios ao PostgreSQL de producao com permissao somente `SELECT`, validacao negativa de escrita e documentacao pronta para uso.

**Architecture:** A solucao cria artefatos versionados sem segredo: SQL parametrizado para criar/ajustar a role `report_readonly`, script PowerShell de validacao read-only, exemplos de SELECT e guia operacional. A execucao em producao fica em etapa controlada pelo coordenador, usando URL/senha fora do git e validando que DDL/DML falham. Nenhum endpoint, schema de produto ou UX sera alterado.

**Tech Stack:** PostgreSQL, `psql`, PowerShell, Drizzle schema existente em `shared/schema.ts`, docs Markdown, Linear DEV-262.

## Global Constraints

- Chat e documentacao de dominio em PT-BR.
- Contrato tecnico canonico preserva naming existente de tabelas/campos.
- Banco oficial: PostgreSQL via `REPLIT_DB_URL || DATABASE_URL`.
- Proibido em producao: `npm run db:push`, `npm run db:seed`, `tsx server/backfill_recorrencias.ts`, SQL manual de `INSERT/UPDATE/DELETE/DDL` fora do script aprovado de criacao da role.
- Nao armazenar senha, token ou URL real de producao em arquivo versionado.
- Acesso ao Postgres deve usar SSH tunnel ou rede interna segura; nao abrir porta publica.
- Role final: `report_readonly`.
- Role final deve ter `CONNECT`, `USAGE` em schema `public` e `SELECT` em tabelas do schema `public`.
- Role final deve configurar `default_transaction_read_only=on`, `statement_timeout=30s`, `idle_in_transaction_session_timeout=60s`.
- Queries de relatorio devem evitar `SELECT *`, usar colunas explicitas, filtros por periodo e `LIMIT` em exploracao.
- Issue Linear de rastreio: `DEV-262`.

---

## File Structure

- Create `scripts/reporting/setup-report-readonly.sql`: SQL idempotente parametrizado para criar/ajustar role read-only. Sem senha fixa.
- Create `scripts/reporting/Test-ReportReadonly.ps1`: validador operacional que executa SELECTs permitidos e espera falha em DDL/DML dentro de transacoes com rollback.
- Create `scripts/reporting/sample-report-queries.sql`: consultas base de relatorios, seguras para copiar e adaptar.
- Create `docs/USAGE_REPORTING.md`: guia final de uso do acesso read-only, incluindo instalacao do `psql`, tunel, variaveis locais, execucao e boas praticas.
- Modify `docs/logs/PDCA_LOG.md`: registrar Plan/Do/Check/Act do acesso read-only.
- Modify `docs/logs/TEST_LOG.md`: registrar validacoes feitas; usar status pendente quando a execucao prod ainda nao tiver ocorrido.

## Task 1: Reporting SQL Assets

**Files:**
- Create: `scripts/reporting/setup-report-readonly.sql`
- Create: `scripts/reporting/sample-report-queries.sql`

**Interfaces:**
- Consumes: PostgreSQL acessivel via `psql`; database name passado por `-v database_name=...`; role passada por `-v report_user=report_readonly`; senha passada por `-v report_password=...`.
- Produces: SQL operacional revisavel para configurar a role `report_readonly`; exemplos SELECT usados por `docs/USAGE_REPORTING.md`.

- [ ] **Step 1: Create reporting scripts directory**

Run:

```powershell
New-Item -ItemType Directory -Force 'scripts\reporting'
```

Expected: command succeeds and directory exists.

- [ ] **Step 2: Add setup SQL**

Create `scripts/reporting/setup-report-readonly.sql` with exactly:

```sql
\set ON_ERROR_STOP on

\if :{?database_name}
\else
  \echo 'Missing psql variable: -v database_name=NOME_DATABASE_PRODUCAO'
  \quit 1
\endif

\if :{?report_user}
\else
  \echo 'Missing psql variable: -v report_user=report_readonly'
  \quit 1
\endif

\if :{?report_password}
\else
  \echo 'Missing psql variable: -v report_password=SENHA_GERADA_FORA_DO_GIT'
  \quit 1
\endif

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'report_user', :'report_password')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'report_user'
)
\gexec

ALTER ROLE :"report_user" WITH LOGIN PASSWORD :'report_password';
ALTER ROLE :"report_user" SET default_transaction_read_only = on;
ALTER ROLE :"report_user" SET statement_timeout = '30s';
ALTER ROLE :"report_user" SET idle_in_transaction_session_timeout = '60s';

GRANT CONNECT ON DATABASE :"database_name" TO :"report_user";
GRANT USAGE ON SCHEMA public TO :"report_user";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"report_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"report_user";

SELECT
  :'database_name' AS database_name,
  :'report_user' AS report_user,
  'readonly role configured' AS status;
```

- [ ] **Step 3: Add sample report queries**

Create `scripts/reporting/sample-report-queries.sql` with exactly:

```sql
-- Consultas read-only para relatorios personalizados.
-- Execute com usuario report_readonly.
-- Ajuste datas antes de rodar em producao.

-- 1) Resumo mensal por tipo.
SELECT
  date_trunc('month', t.date)::date AS month,
  t.type,
  SUM(t.amount_cents) AS amount_cents
FROM transactions t
WHERE t.date >= DATE '2026-01-01'
  AND t.date < DATE '2027-01-01'
GROUP BY 1, 2
ORDER BY 1, 2;

-- 2) Gastos/entradas por categoria em um mes.
SELECT
  c.name AS category_name,
  t.type,
  SUM(t.amount_cents) AS amount_cents
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.date >= DATE '2026-07-01'
  AND t.date < DATE '2026-08-01'
GROUP BY c.name, t.type
ORDER BY amount_cents DESC
LIMIT 50;

-- 3) Projetado vs pago em um mes.
SELECT
  SUM(CASE WHEN t.type = 'entry' THEN t.amount_cents ELSE 0 END) AS entries_cents,
  SUM(CASE WHEN t.type = 'exit' THEN t.amount_cents ELSE 0 END) AS exits_cents,
  SUM(CASE WHEN t.type = 'exit' AND t.is_paid THEN t.amount_cents ELSE 0 END) AS paid_exits_cents,
  SUM(CASE WHEN t.type = 'entry' THEN t.amount_cents ELSE -t.amount_cents END) AS projected_balance_cents,
  SUM(CASE
    WHEN t.type = 'entry' THEN t.amount_cents
    WHEN t.type = 'exit' AND t.is_paid THEN -t.amount_cents
    ELSE 0
  END) AS real_balance_cents
FROM transactions t
WHERE t.date >= DATE '2026-07-01'
  AND t.date < DATE '2026-08-01';

-- 4) Lancamentos recentes para auditoria rapida.
SELECT
  t.id,
  t.date,
  t.description,
  t.type,
  t.group,
  t.amount_cents,
  c.name AS category_name,
  pm.name AS payment_method_name,
  t.is_paid,
  t.paid_at
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
WHERE t.date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY t.date DESC, t.id DESC
LIMIT 100;
```

- [ ] **Step 4: Review setup SQL for forbidden secrets**

Run:

```powershell
rg -n "postgres://|password=|SENHA_REAL|DATABASE_URL|REPORT_DATABASE_URL" scripts\reporting
```

Expected: no production URL or real password appears. The command may show the literal documentation token `report_password` only.

- [ ] **Step 5: Commit Task 1**

Run:

```powershell
git add -- scripts/reporting/setup-report-readonly.sql scripts/reporting/sample-report-queries.sql
git commit -m "chore: add readonly reporting sql assets"
```

Expected: commit succeeds.

## Task 2: Read-only Validation Script

**Files:**
- Create: `scripts/reporting/Test-ReportReadonly.ps1`

**Interfaces:**
- Consumes: read-only database URL supplied at runtime via `-DatabaseUrl` or `$env:REPORT_DATABASE_URL`.
- Produces: pass/fail validation output; non-zero exit for unsafe permission or failed SELECT.

- [ ] **Step 1: Add validation script**

Create `scripts/reporting/Test-ReportReadonly.ps1` with exactly:

```powershell
param(
  [string]$DatabaseUrl = $env:REPORT_DATABASE_URL
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "Missing DatabaseUrl. Pass -DatabaseUrl or set REPORT_DATABASE_URL in the current shell."
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  throw "psql not found in PATH. Install PostgreSQL client tools before running this validation."
}

function Invoke-ReadonlyProbe {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Sql,
    [Parameter(Mandatory = $true)][bool]$ShouldSucceed
  )

  $tempFile = New-TemporaryFile
  try {
    Set-Content -LiteralPath $tempFile.FullName -Value $Sql -Encoding UTF8
    & psql $DatabaseUrl -X -q -v ON_ERROR_STOP=1 -f $tempFile.FullName
    $exitCode = $LASTEXITCODE
  } finally {
    Remove-Item -LiteralPath $tempFile.FullName -Force -ErrorAction SilentlyContinue
  }

  if ($ShouldSucceed -and $exitCode -ne 0) {
    throw "FAIL: $Name should succeed but psql exited with code $exitCode."
  }

  if (-not $ShouldSucceed -and $exitCode -eq 0) {
    throw "FAIL: $Name should fail for read-only user but succeeded."
  }

  if ($ShouldSucceed) {
    Write-Host "PASS: $Name succeeded."
  } else {
    Write-Host "PASS: $Name was denied as expected."
  }
}

Invoke-ReadonlyProbe `
  -Name "basic connection" `
  -ShouldSucceed $true `
  -Sql "SELECT current_database(), current_user;"

Invoke-ReadonlyProbe `
  -Name "role settings" `
  -ShouldSucceed $true `
  -Sql "SHOW default_transaction_read_only; SHOW statement_timeout; SHOW idle_in_transaction_session_timeout;"

Invoke-ReadonlyProbe `
  -Name "transactions select" `
  -ShouldSucceed $true `
  -Sql "SELECT id, date, description, amount_cents FROM transactions ORDER BY id DESC LIMIT 1;"

Invoke-ReadonlyProbe `
  -Name "categories select" `
  -ShouldSucceed $true `
  -Sql "SELECT id, name, kind FROM categories ORDER BY id DESC LIMIT 1;"

Invoke-ReadonlyProbe `
  -Name "payment methods select" `
  -ShouldSucceed $true `
  -Sql "SELECT id, name, type FROM payment_methods ORDER BY id DESC LIMIT 1;"

Invoke-ReadonlyProbe `
  -Name "public ddl denied" `
  -ShouldSucceed $false `
  -Sql "BEGIN; CREATE TABLE public.report_readonly_probe (id integer); ROLLBACK;"

Invoke-ReadonlyProbe `
  -Name "insert denied" `
  -ShouldSucceed $false `
  -Sql "BEGIN; INSERT INTO categories (name, kind) VALUES ('report_readonly_probe', 'expense'); ROLLBACK;"

Invoke-ReadonlyProbe `
  -Name "update denied" `
  -ShouldSucceed $false `
  -Sql "BEGIN; UPDATE categories SET name = name WHERE id = (SELECT id FROM categories ORDER BY id LIMIT 1); ROLLBACK;"

Invoke-ReadonlyProbe `
  -Name "delete denied" `
  -ShouldSucceed $false `
  -Sql "BEGIN; DELETE FROM categories WHERE id = (SELECT id FROM categories ORDER BY id LIMIT 1); ROLLBACK;"

Write-Host "All read-only validation probes passed."
```

- [ ] **Step 2: Run static checks**

Run:

```powershell
rg -n "postgres://|SENHA_REAL|DATABASE_URL=|REPORT_DATABASE_URL=" scripts\reporting\Test-ReportReadonly.ps1
```

Expected: no output.

- [ ] **Step 3: Run script without URL to verify safe failure**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\reporting\Test-ReportReadonly.ps1
```

Expected when `REPORT_DATABASE_URL` is unset: throws `Missing DatabaseUrl`. If the variable is set, run with a fake URL instead:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\reporting\Test-ReportReadonly.ps1 -DatabaseUrl "postgres://invalid:invalid@127.0.0.1:1/invalid"
```

Expected: connection failure, no file changes, no secret printed.

- [ ] **Step 4: Commit Task 2**

Run:

```powershell
git add -- scripts/reporting/Test-ReportReadonly.ps1
git commit -m "chore: add readonly reporting validation"
```

Expected: commit succeeds.

## Task 3: Usage Documentation

**Files:**
- Create: `docs/USAGE_REPORTING.md`
- Modify: `README.md`
- Modify: `docs/INDEX.md`

**Interfaces:**
- Consumes: scripts from Tasks 1-2.
- Produces: operator-facing guide for safe SELECT usage.

- [ ] **Step 1: Add reporting usage guide**

Create `docs/USAGE_REPORTING.md` with exactly:

```markdown
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
```

- [ ] **Step 2: Link guide in README**

Modify `README.md` section `## Estrutura` by adding this bullet after `docs/USAGE.md`:

```markdown
- `docs/USAGE_REPORTING.md`: uso seguro de PostgreSQL read-only para relatorios.
```

- [ ] **Step 3: Link guide in docs index**

Modify `docs/INDEX.md` section `## How-to (fazer algo)` by adding this bullet after `docs/USAGE.md`:

```markdown
- `docs/USAGE_REPORTING.md` - consultar PostgreSQL de producao com usuario read-only para relatorios.
```

- [ ] **Step 4: Validate docs contain no secrets**

Run:

```powershell
rg -n "postgres://[^\\s]*(luan|gmail|token|eyJ|ghp_|github_pat_|SENHA_ADMIN_REAL|SENHA_REAL)" docs README.md scripts
```

Expected: no output.

- [ ] **Step 5: Commit Task 3**

Run:

```powershell
git add -- docs/USAGE_REPORTING.md README.md docs/INDEX.md
git commit -m "docs: add readonly reporting usage guide"
```

Expected: commit succeeds.

## Task 4: Production Setup and Validation

**Files:**
- Modify: `docs/logs/PDCA_LOG.md`
- Modify: `docs/logs/TEST_LOG.md`

**Interfaces:**
- Consumes: `scripts/reporting/setup-report-readonly.sql`, `scripts/reporting/Test-ReportReadonly.ps1`, secure admin database access held outside git.
- Produces: production role configured, validation evidence recorded without secrets.

- [ ] **Step 1: Confirm no dirty unrelated files will be staged**

Run:

```powershell
git status --short
```

Expected: only files from this task are uncommitted. If unrelated files appear, leave them unstaged.

- [ ] **Step 2: Confirm psql availability**

Run:

```powershell
psql --version
```

Expected: prints PostgreSQL client version. If missing, install PostgreSQL client tools before continuing.

- [ ] **Step 3: Open secure tunnel**

Run in a separate terminal when direct local admin URL is not available:

```powershell
ssh -N -L 5434:localhost:5432 root@31.97.240.105
```

Expected: command stays running. Do not print secrets.

- [ ] **Step 4: Set local-only admin variables**

Run in the active terminal, replacing values only in shell memory:

```powershell
$env:PROD_DATABASE_ADMIN_URL="postgres://ADMIN_USER:SENHA_ADMIN_FORA_DO_GIT@localhost:5434/NOME_DATABASE_PRODUCAO"
$env:REPORT_DB_NAME="NOME_DATABASE_PRODUCAO"
$env:REPORT_DB_USER="report_readonly"
$env:REPORT_DB_PASSWORD="SENHA_GERADA_FORA_DO_GIT"
```

Expected: variables exist only in current shell. Do not write them to `.env`, docs, logs, terminal transcript files or git.

- [ ] **Step 5: Apply read-only role setup**

Run:

```powershell
psql "$env:PROD_DATABASE_ADMIN_URL" `
  -v database_name="$env:REPORT_DB_NAME" `
  -v report_user="$env:REPORT_DB_USER" `
  -v report_password="$env:REPORT_DB_PASSWORD" `
  -f scripts/reporting/setup-report-readonly.sql
```

Expected: output includes `readonly role configured`.

- [ ] **Step 6: Validate with read-only URL**

Run:

```powershell
$env:REPORT_DATABASE_URL="postgres://report_readonly:$env:REPORT_DB_PASSWORD@localhost:5434/$env:REPORT_DB_NAME"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/reporting/Test-ReportReadonly.ps1
```

Expected:
- `PASS: basic connection succeeded.`
- `PASS: transactions select succeeded.`
- DDL/DML probes say `was denied as expected`.
- Final line: `All read-only validation probes passed.`

- [ ] **Step 7: Append PDCA log**

Append this entry to `docs/logs/PDCA_LOG.md`, adjusting only the execution timestamp and status if production setup could not be completed:

```markdown

## 2026-07-11 - DEV-262 - Acesso read-only para relatorios
- **Plan:** Definida abordagem com role PostgreSQL `report_readonly`, acesso por tunel/rede interna, sem segredo em git. Spec: `docs/superpowers/specs/2026-07-11-acesso-readonly-producao-design.md`. Plano: `docs/superpowers/plans/2026-07-11-acesso-readonly-producao.md`.
- **Do:** Criados artefatos `scripts/reporting/setup-report-readonly.sql`, `scripts/reporting/Test-ReportReadonly.ps1`, `scripts/reporting/sample-report-queries.sql` e `docs/USAGE_REPORTING.md`. Setup aplicado sem registrar URL/senha.
- **Check:** Validacao read-only executada: SELECT permitido; DDL/DML negados; timeouts da role conferidos.
- **Act:** Manter acesso por tunel/rede interna. Se relatorios ficarem pesados/frequentes, abrir follow-up para replica read-only.
```

- [ ] **Step 8: Append TEST log**

Append this entry to `docs/logs/TEST_LOG.md`, adjusting only result lines if production setup could not be completed:

```markdown

## 2026-07-11 - DEV-262 - Validacao acesso read-only relatorios
- Ambiente: PostgreSQL producao via acesso seguro; segredo nao registrado.
- Comando: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/reporting/Test-ReportReadonly.ps1`
- Resultado esperado:
  - `SELECT current_database(), current_user;` passa.
  - SELECTs em `transactions`, `categories`, `payment_methods` passam.
  - `CREATE TABLE public.report_readonly_probe` falha.
  - `INSERT`, `UPDATE`, `DELETE` em `categories` falham.
- Status: aprovado quando todos os probes terminam com `All read-only validation probes passed.`
```

- [ ] **Step 9: Commit Task 4**

Run:

```powershell
git add -- docs/logs/PDCA_LOG.md docs/logs/TEST_LOG.md
git commit -m "docs: record readonly reporting validation"
```

Expected: commit succeeds if logs changed.

## Task 5: Final Review and Linear Closure

**Files:**
- No required file changes.

**Interfaces:**
- Consumes: commits from Tasks 1-4, Linear issue `DEV-262`.
- Produces: final verification summary and Linear status update.

- [ ] **Step 1: Check final git state**

Run:

```powershell
git status --short
```

Expected: no uncommitted changes from this work. Unrelated user changes may remain and must not be staged.

- [ ] **Step 2: Scan for secret leaks**

Run:

```powershell
rg -n "postgres://[^\\s]*(ADMIN_USER|SENHA_ADMIN_FORA_DO_GIT|SENHA_GERADA_FORA_DO_GIT)" docs scripts
```

Expected: only documented fake tokens appear. No real URL, token or password.

Run:

```powershell
rg -n "ghp_|github_pat_|eyJ[a-zA-Z0-9_-]+\\.|COOLIFY_ACCESS_TOKEN|DATABASE_URL=.*postgres|REPORT_DATABASE_URL=.*postgres" .
```

Expected: no real secrets in versioned files. If output points to generated local artifacts, remove those artifacts from git scope.

- [ ] **Step 3: Update Linear**

Update `DEV-262` with:

```markdown
Implementacao concluida.

Entregas:
- Role read-only `report_readonly` planejada/configurada.
- Scripts versionados sem segredo.
- Guia `docs/USAGE_REPORTING.md`.
- Validacao de SELECT permitido e escrita/DDL negados.
- Logs PDCA/testes atualizados.

Observacao:
- Credenciais reais nao foram registradas em git.
- Acesso mantido por tunel/rede interna.
```

Expected: issue moves to `Revisao` or `Concluido` according to validation result.

- [ ] **Step 4: Final report**

Final response must include:
- Database confirmed as PostgreSQL.
- Role name `report_readonly`.
- Files created/modified.
- Validation status.
- Any blocker, especially missing `psql`, missing admin URL or inaccessible VPS.
- Reminder that no secret was stored.
