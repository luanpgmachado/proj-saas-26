# Registro de Testes

## 2026-01-30 — Backend local (recorrencias)
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

## 2026-01-31 — Backend no Replit (recorrencias)
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
- Conclusao: Backend funcionando conforme `docs/API_CONTRACT.md` e `docs/MODELO_DADOS.md`.

## 2026-02-06 — Categorias (CRUD via Tela de Lancamentos)
- Ambiente: local (frontend Vite + backend Express).
- Cenarios testados:
  - Criar categoria pela tela de Lancamentos (nome + tipo + orcamento opcional).
  - Editar categoria selecionada no filtro (alterar nome/tipo/orcamento).
  - Excluir categoria sem referencias (sucesso).
  - Excluir categoria em uso por lancamentos/recorrencias (bloqueio `409` com mensagem).
- Verificacoes:
  - Lista de categorias recarrega apos salvar/excluir.
  - Ao criar, a categoria criada fica selecionada no filtro.
  - Erros de API aparecem na tela (mensagem do backend).

## 2026-02-06 — UI (refino visual)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
  - Sem animacoes CSS introduzidas (removido `transition` da barra de progresso).

## 2026-02-06 — Performance (front)
- Ambiente: local.
- Verificacoes:
  - Build: `npm run build` OK.
  - Output: chunks por pagina gerados (code-splitting por rota).
