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

function Invoke-PsqlText {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Sql
  )

  $tempFile = New-TemporaryFile
  try {
    Set-Content -LiteralPath $tempFile.FullName -Value $Sql -Encoding UTF8
    $output = & psql $DatabaseUrl -X -q -t -A -F "|" -v ON_ERROR_STOP=1 -f $tempFile.FullName
    $exitCode = $LASTEXITCODE
  } finally {
    Remove-Item -LiteralPath $tempFile.FullName -Force -ErrorAction SilentlyContinue
  }

  if ($exitCode -ne 0) {
    throw "FAIL: $Name should succeed but psql exited with code $exitCode."
  }

  return ($output -join "`n").Trim()
}

Invoke-ReadonlyProbe `
  -Name "basic connection" `
  -ShouldSucceed $true `
  -Sql "SELECT current_database(), current_user;"

$settings = Invoke-PsqlText `
  -Name "role settings" `
  -Sql "SELECT current_setting('default_transaction_read_only'), current_setting('statement_timeout'), current_setting('idle_in_transaction_session_timeout');"

if ($settings -ne "on|30s|1min") {
  throw "FAIL: role settings expected on|30s|1min but got $settings."
}

Write-Host "PASS: role settings match on|30s|1min."

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
