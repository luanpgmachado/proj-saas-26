-- Modelo Financeiro B&L (PT-BR) - PostgreSQL
-- Observação: valores monetários em CENTAVOS (int) pra evitar ponto flutuante.

BEGIN;

-- =========================
-- Tabelas base
-- =========================

CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('receita', 'despesa')),
  orcamento_mensal_centavos INT NULL CHECK (orcamento_mensal_centavos IS NULL OR orcamento_mensal_centavos >= 0)
);

CREATE TABLE metodos_pagamento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('dinheiro', 'transferencia', 'debito', 'cartao_credito', 'outro')),
  eh_cartao BOOLEAN NOT NULL DEFAULT FALSE,
  paga_no_mes BOOLEAN NOT NULL DEFAULT TRUE,
  dia_fechamento INT NULL CHECK (dia_fechamento IS NULL OR (dia_fechamento BETWEEN 1 AND 31)),
  dia_vencimento INT NULL CHECK (dia_vencimento IS NULL OR (dia_vencimento BETWEEN 1 AND 31)),
  -- Regrinha antiga e honesta:
  -- se é cartão, faz sentido ter dia_fechamento/dia_vencimento; se não é, geralmente fica NULL.
  CHECK (
    (eh_cartao = TRUE AND dia_fechamento IS NOT NULL AND dia_vencimento IS NOT NULL)
    OR (eh_cartao = FALSE)
  )
);

CREATE TABLE metas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  alvo_centavos INT NOT NULL CHECK (alvo_centavos >= 0)
);

CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL
);

CREATE TABLE investimentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL
);

CREATE TABLE recorrencias (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  grupo VARCHAR(15) NOT NULL CHECK (grupo IN ('fixo', 'parcelado', 'entrada')),
  valor_centavos INT NOT NULL CHECK (valor_centavos > 0),

  categoria_id INT NULL REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE SET NULL,
  metodo_pagamento_id INT NULL REFERENCES metodos_pagamento(id) ON UPDATE CASCADE ON DELETE SET NULL,

  data_inicio DATE NOT NULL,
  data_fim DATE NULL CHECK (data_fim IS NULL OR data_fim >= data_inicio),
  dia_mes INT NOT NULL CHECK (dia_mes BETWEEN 1 AND 31),
  parcela_total INT NULL CHECK (parcela_total IS NULL OR parcela_total >= 1),
  status VARCHAR(10) NOT NULL CHECK (status IN ('ativa', 'pausada', 'cancelada')),

  CHECK (
    (tipo = 'entrada' AND grupo = 'entrada')
    OR (tipo = 'saida' AND grupo IN ('fixo', 'parcelado'))
  ),
  CHECK (
    (grupo <> 'parcelado' AND parcela_total IS NULL)
    OR (grupo = 'parcelado' AND parcela_total IS NOT NULL)
  )
);

-- =========================
-- Tabelas de movimentos
-- =========================

CREATE TABLE lancamentos (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor_centavos INT NOT NULL CHECK (valor_centavos > 0),

  categoria_id INT NULL REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE SET NULL,
  metodo_pagamento_id INT NULL REFERENCES metodos_pagamento(id) ON UPDATE CASCADE ON DELETE SET NULL,

  grupo VARCHAR(15) NOT NULL CHECK (grupo IN ('fixo', 'variavel', 'parcelado', 'entrada')),

  grupo_parcelamento_id VARCHAR(64) NULL,
  parcela_indice INT NULL CHECK (parcela_indice IS NULL OR parcela_indice >= 1),
  parcela_total INT NULL CHECK (parcela_total IS NULL OR parcela_total >= 1),
  recorrencia_id INT NULL REFERENCES recorrencias(id) ON UPDATE CASCADE ON DELETE SET NULL,

  -- coerência de parcelamento
  CHECK (
    (grupo <> 'parcelado' AND grupo_parcelamento_id IS NULL AND parcela_indice IS NULL AND parcela_total IS NULL)
    OR
    (grupo = 'parcelado' AND grupo_parcelamento_id IS NOT NULL AND parcela_indice IS NOT NULL AND parcela_total IS NOT NULL AND parcela_indice <= parcela_total)
  )
);

CREATE INDEX idx_lancamentos_data ON lancamentos(data);
CREATE INDEX idx_lancamentos_categoria ON lancamentos(categoria_id);
CREATE INDEX idx_lancamentos_metodo_pagamento ON lancamentos(metodo_pagamento_id);
CREATE INDEX idx_lancamentos_grupo_parcelamento ON lancamentos(grupo_parcelamento_id);
CREATE INDEX idx_lancamentos_recorrencia ON lancamentos(recorrencia_id);

CREATE TABLE aportes_meta (
  id SERIAL PRIMARY KEY,
  meta_id INT NOT NULL REFERENCES metas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  data DATE NOT NULL,
  valor_centavos INT NOT NULL CHECK (valor_centavos > 0)
);

CREATE INDEX idx_aportes_meta_meta_data ON aportes_meta(meta_id, data);

CREATE TABLE aportes_reserva (
  id SERIAL PRIMARY KEY,
  reserva_id INT NOT NULL REFERENCES reservas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  data DATE NOT NULL,
  valor_centavos INT NOT NULL CHECK (valor_centavos > 0)
);

CREATE INDEX idx_aportes_reserva_reserva_data ON aportes_reserva(reserva_id, data);

CREATE TABLE aportes_investimento (
  id SERIAL PRIMARY KEY,
  investimento_id INT NOT NULL REFERENCES investimentos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  data DATE NOT NULL,
  valor_centavos INT NOT NULL CHECK (valor_centavos > 0)
);

CREATE INDEX idx_aportes_investimento_investimento_data ON aportes_investimento(investimento_id, data);

COMMIT;
