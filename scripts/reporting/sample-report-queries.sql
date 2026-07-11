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
