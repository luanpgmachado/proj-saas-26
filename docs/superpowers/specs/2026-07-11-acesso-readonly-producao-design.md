# Design: Acesso read-only ao PostgreSQL de producao para relatorios

## Status
- Data: 2026-07-11
- Linear: DEV-262
- Decisao aprovada: Abordagem A, usuario PostgreSQL read-only + acesso seguro via tunel/rede interna.

## Objetivo
Disponibilizar conexao ao banco de dados de producao para consultas `SELECT` de relatorios personalizados, sem permissao de escrita, sem alterar schema/dados e com documentacao clara de uso.

## Contexto do projeto
O projeto usa PostgreSQL como banco oficial.

Evidencias locais:
- `server/db.ts` cria pool `pg` com `process.env.REPLIT_DB_URL || process.env.DATABASE_URL`.
- `drizzle.config.ts` define `dialect: "postgresql"`.
- `shared/schema.ts` define tabelas PostgreSQL via Drizzle.
- `docs/canonicos/RUNBOOK.md` recomenda PostgreSQL no Coolify e proibe comandos de escrita em producao durante fluxos operacionais.

Ambiente observado em 2026-07-11:
- `.env` ausente no workspace.
- `DATABASE_URL` presente na sessao local.
- `DATABASE_URL` local parseado como `postgres://localhost:5433/financeiro_bl`, provavelmente via tunel/local.
- `REPLIT_DB_URL` ausente na sessao local.
- `psql` nao encontrado no `PATH` local.

## Escopo
Incluido:
- Confirmar origem operacional da conexao de producao no Coolify/VPS.
- Criar ou validar role dedicada para relatorios, com login e somente leitura.
- Conectar por SSH tunnel ou rede interna segura.
- Criar guia de uso para consultas manuais com `psql`.
- Incluir exemplos de SELECT para relatorios financeiros.
- Validar tecnicamente que escrita e DDL falham para o usuario read-only.
- Registrar passos e pendencias no PDCA.

Fora de escopo:
- Criar dashboard analitico novo.
- Alterar API, UX, schema ou regras de negocio.
- Executar `db:push`, `seed`, backfill ou migracoes em producao.
- Abrir porta PostgreSQL publicamente.
- Armazenar senha, token ou URL real de producao em arquivo versionado.

## Abordagens consideradas

### A. Role read-only no PostgreSQL de producao
Criar uma credencial dedicada com permissao de `SELECT` nas tabelas do schema `public`, usando conexao restrita por tunel ou rede interna.

Vantagens:
- Simples.
- Entrega rapida.
- Menor mudanca na infra atual.
- Atende necessidade de SELECT personalizado.

Riscos:
- Consulta pesada ainda roda no banco primario.
- Exige disciplina de filtros, limites e timeout.

Mitigacoes:
- `statement_timeout`.
- `idle_in_transaction_session_timeout`.
- `default_transaction_read_only`.
- Guia com boas praticas de SELECT.
- Preferir filtros por periodo e colunas explicitas.

### B. Replica read-only
Criar replica PostgreSQL hot standby para relatorios.

Vantagens:
- Melhor isolamento do banco primario.
- Mais segura para relatorios recorrentes ou pesados.

Riscos:
- Maior complexidade operacional.
- Replicacao, monitoramento e lag precisam manutencao.
- Pode consumir disco/WAL se mal configurada.

Uso recomendado:
- Fase futura, se relatorios ficarem frequentes, demorados ou com alto volume.

### C. Export analitico local/agendado
Exportar dados periodicamente para base local ou arquivo analitico.

Vantagens:
- Sem impacto direto em producao durante analise.
- Bom para consultas exploratorias pesadas.

Riscos:
- Dados atrasados.
- Pipeline adicional.
- Mais superficie para vazamento se export contiver dados sensiveis.

Uso recomendado:
- Fase futura para relatorios offline ou snapshots.

## Decisao
Seguir com Abordagem A.

Racional:
- O projeto e pequeno o suficiente para comecar com acesso read-only direto.
- O RUNBOOK ja centraliza guardrails de producao.
- A necessidade atual e consulta manual/personalizada, nao BI continuo.
- A solucao permite migrar para replica sem mudar o modelo de consultas.

## Arquitetura proposta

```mermaid
flowchart LR
  Operador["Operador local"] --> Tunnel["SSH tunnel ou rede interna"]
  Tunnel --> PG["PostgreSQL producao"]
  PG --> Role["role report_readonly"]
  Role --> Tables["public.* somente SELECT"]
```

Componentes:
- PostgreSQL de producao: banco atual usado pela app.
- Role `report_readonly`: usuario dedicado para relatorios.
- Tunel SSH: caminho preferencial de acesso local.
- `psql`: cliente recomendado para executar SELECTs.
- `docs/USAGE_REPORTING.md`: guia final de operacao.

## Permissoes esperadas
Role final:
- Pode conectar no database de producao.
- Pode usar schema `public`.
- Pode executar `SELECT` em tabelas atuais do schema `public`.
- Recebe `SELECT` automaticamente em futuras tabelas do schema `public`.
- Nao pode executar `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`.

Configuracoes recomendadas na role:

```sql
ALTER ROLE report_readonly SET default_transaction_read_only = on;
ALTER ROLE report_readonly SET statement_timeout = '30s';
ALTER ROLE report_readonly SET idle_in_transaction_session_timeout = '60s';
```

DDL base planejado:

```sql
CREATE ROLE report_readonly LOGIN PASSWORD 'SENHA_GERADA_FORA_DO_GIT';

GRANT CONNECT ON DATABASE financeiro_bl TO report_readonly;
GRANT USAGE ON SCHEMA public TO report_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO report_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO report_readonly;
```

Observacao: o nome real do database deve ser confirmado no ambiente de producao antes da execucao. `financeiro_bl` e o nome observado localmente e documentado em `docs/USAGE.md`.

## Fluxo de conexao
Fluxo preferencial:
1. Operador abre tunel SSH para a VPS/Coolify.
2. Operador exporta uma variavel local nao versionada com a URL read-only.
3. Operador executa `psql "$env:REPORT_DATABASE_URL"`.
4. Operador roda somente `SELECT`.

Exemplo de tunel a documentar:

```powershell
ssh -N -L 5434:localhost:5432 root@31.97.240.105
```

Exemplo de variavel local:

```powershell
$env:REPORT_DATABASE_URL="postgres://report_readonly:SENHA_GERADA_FORA_DO_GIT@localhost:5434/NOME_DATABASE_PRODUCAO"
```

## Boas praticas de consulta
Regras para o guia:
- Evitar `SELECT *`.
- Selecionar colunas explicitas.
- Filtrar por periodo sempre que possivel.
- Usar `LIMIT` em consultas exploratorias.
- Evitar transacoes abertas.
- Evitar funcoes sobre colunas filtradas quando houver alternativa sargable.
- Preferir agregacoes por mes/ano em intervalos pequenos.
- Comecar com `EXPLAIN` apenas quando necessario, sem `ANALYZE` em consultas pesadas.

Exemplo base mensal:

```sql
SELECT
  date_trunc('month', t.date)::date AS month,
  t.type,
  SUM(t.amount_cents) AS amount_cents
FROM transactions t
WHERE t.date >= DATE '2026-01-01'
  AND t.date < DATE '2027-01-01'
GROUP BY 1, 2
ORDER BY 1, 2;
```

Exemplo por categoria:

```sql
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
```

Exemplo pagos vs projetados:

```sql
SELECT
  SUM(CASE WHEN t.type = 'entry' THEN t.amount_cents ELSE 0 END) AS entries_cents,
  SUM(CASE WHEN t.type = 'exit' THEN t.amount_cents ELSE 0 END) AS exits_cents,
  SUM(CASE WHEN t.type = 'exit' AND t.is_paid THEN t.amount_cents ELSE 0 END) AS paid_exits_cents
FROM transactions t
WHERE t.date >= DATE '2026-07-01'
  AND t.date < DATE '2026-08-01';
```

## Validacao
Validacoes obrigatorias:
- `SELECT 1;` funciona.
- `SELECT` nas tabelas principais funciona.
- `INSERT` em tabela principal falha.
- `UPDATE` em tabela principal falha.
- `DELETE` em tabela principal falha.
- `CREATE TABLE` falha.
- `SHOW default_transaction_read_only;` retorna `on` para a role.
- `SHOW statement_timeout;` retorna valor definido.

Tabelas principais para smoke test:
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

## Plano com agentes

### Agent Planejador
Responsavel por transformar este design em plano executavel.

Entradas:
- Este spec.
- `docs/canonicos/RUNBOOK.md`
- `docs/canonicos/RULES.md`
- `docs/canonicos/MODELO_DADOS.md`
- Issue Linear `DEV-262`.

Saidas:
- Plano de implementacao por tarefas.
- Checklist de riscos.
- Dependencias externas confirmadas.

### Agent Revisor 1
Responsavel por revisar plano antes de execucao.

Criterios:
- Nenhum comando proibido em producao.
- Nenhum segredo em arquivo versionado.
- Role read-only realmente limitada.
- Escopo nao altera API, UX, schema ou regra de negocio.

### Agent Executor
Responsavel pela execucao tecnica.

Tarefas:
- Confirmar database/host/porta reais.
- Instalar ou orientar instalacao do `psql`, se ausente.
- Criar role read-only com SQL aprovado.
- Criar `docs/USAGE_REPORTING.md`.
- Atualizar `docs/logs/PDCA_LOG.md` com decisoes e execucao.

### Agent Testador
Responsavel pela validacao.

Tarefas:
- Testar SELECTs permitidos.
- Testar escritas/DDL negadas.
- Testar timeout/configs da role.
- Registrar resultados em `docs/logs/TEST_LOG.md`.

### Agent Revisor 2
Responsavel pela revisao final.

Criterios:
- DoD atendido.
- Docs suficientes para uso autonomo.
- Nao houve exposicao de segredo.
- Guardrails de producao mantidos.
- Pendencias/follow-ups registrados no Linear.

## Uso de subagent-driven-development
Usar `superpowers:subagent-driven-development` somente depois que houver plano de implementacao aprovado.

Sequencia esperada:
1. Ler plano e constraints globais.
2. Criar ledger `.superpowers/sdd/progress.md`.
3. Executar uma tarefa por vez com implementer subagent.
4. Revisar cada tarefa com task reviewer.
5. Corrigir Critical/Important antes de seguir.
6. Fazer review final do conjunto.
7. Encerrar com checklist de branch/commit/testes.

Observacao operacional: caso ferramentas multi-agent (`spawn_agent`, `wait_agent`, `close_agent`) nao estejam disponiveis na sessao, executar o mesmo fluxo manualmente no controlador, mantendo os papeis e gates.

## Riscos e mitigacoes
- Risco: credencial read-only vazada.
  - Mitigacao: nao versionar URL/senha, rotacionar senha, restringir via tunel/rede.
- Risco: consulta pesada afetar producao.
  - Mitigacao: `statement_timeout`, filtros por periodo, `LIMIT`, exemplos seguros.
- Risco: permissao alem de SELECT.
  - Mitigacao: testes negativos de escrita/DDL.
- Risco: conexao direta publica ao Postgres.
  - Mitigacao: preferir SSH tunnel; nao abrir porta publica.
- Risco: divergencia entre docs e schema.
  - Mitigacao: usar `shared/schema.ts` e `MODELO_DADOS.md` como fontes.

## Definition of Done
- Issue Linear criada e vinculada ao trabalho.
- Role read-only criada ou validada.
- Conexao via caminho seguro documentada.
- `docs/USAGE_REPORTING.md` criado com comandos e exemplos.
- Escritas e DDL negadas em testes.
- SELECTs de smoke test funcionando.
- `docs/logs/PDCA_LOG.md` e `docs/logs/TEST_LOG.md` atualizados.
- Nenhum segredo salvo em git.
- Nenhum comando proibido executado em producao.

## Perguntas pendentes para execucao
- Qual e o nome real do database de producao no Coolify/PostgreSQL?
- O acesso administrativo ao Postgres sera via container Coolify, SSH na VPS ou painel Coolify?
- A senha da role sera gerada por operador local, gerenciador de senha ou painel Coolify?
- O usuario quer apenas `psql` ou tambem DBeaver/TablePlus/Power BI no guia?

## Referencias internas
- `AGENTS.md`
- `docs/canonicos/RUNBOOK.md`
- `docs/canonicos/RULES.md`
- `docs/canonicos/API_CONTRACT.md`
- `docs/canonicos/MODELO_DADOS.md`
- `shared/schema.ts`
- `server/db.ts`
- `drizzle.config.ts`
