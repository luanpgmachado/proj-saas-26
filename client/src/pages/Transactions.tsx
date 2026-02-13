import { useMemo, useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalLancamento, { DadosLancamento } from "../components/ModalLancamento";
import ModalConfirmacao from "../components/ModalConfirmacao";
import type { Transacao } from "../model/transacao";
import { alternarPagoOptimista } from "../service/transacoes.service";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

const parsearCentavosDeTexto = (valor: string) => {
  const somenteDigitos = valor.replace(/\D/g, "");
  return somenteDigitos ? parseInt(somenteDigitos, 10) : 0;
};

type Categoria = {
  id: number;
  name: string;
  kind: "income" | "expense";
  monthlyBudgetCents: number | null;
};

export default function Transactions() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [filters, setFilters] = useState({ categoryId: "", methodId: "", type: "" });
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [atualizandoPagoPorId, setAtualizandoPagoPorId] = useState<Record<number, boolean>>({});
  const [erroPagoPorId, setErroPagoPorId] = useState<Record<number, string>>({});

  const [categoriaFormularioAberto, setCategoriaFormularioAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [categoriaNome, setCategoriaNome] = useState("");
  const [categoriaTipo, setCategoriaTipo] = useState<"income" | "expense">("expense");
  const [categoriaOrcamentoCentavos, setCategoriaOrcamentoCentavos] = useState<number | null>(null);
  const [categoriaSalvando, setCategoriaSalvando] = useState(false);
  const [categoriaErro, setCategoriaErro] = useState("");
  const [categoriaConfirmandoExclusao, setCategoriaConfirmandoExclusao] = useState(false);
  const [categoriaExcluindo, setCategoriaExcluindo] = useState(false);

  const carregarDados = () => {
    const params: Record<string, string> = { month };
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.methodId) params.methodId = filters.methodId;
    if (filters.type) params.type = filters.type;
    api.getTransactions(params).then(setTransactions).catch(console.error);
  };

  const carregarCategorias = async () => {
    const cats = await api.getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    carregarCategorias().catch(console.error);
    api.getPaymentMethods().then(setMethods).catch(console.error);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [month, filters]);

  const nomeCategoriaPorId = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const c of categories) mapa.set(c.id, c.name);
    return mapa;
  }, [categories]);

  const nomeMetodoPorId = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const m of methods) mapa.set(m.id, m.name);
    return mapa;
  }, [methods]);

  const clearFilters = () => setFilters({ categoryId: "", methodId: "", type: "" });

  const categoriaSelecionada = filters.categoryId
    ? categories.find((c) => String(c.id) === filters.categoryId) ?? null
    : null;

  const abrirFormularioCriarCategoria = () => {
    setCategoriaErro("");
    setCategoriaEditando(null);
    setCategoriaNome("");
    setCategoriaTipo("expense");
    setCategoriaOrcamentoCentavos(null);
    setCategoriaConfirmandoExclusao(false);
    setCategoriaFormularioAberto(true);
  };

  const abrirFormularioEditarCategoria = () => {
    if (!categoriaSelecionada) return;
    setCategoriaErro("");
    setCategoriaEditando(categoriaSelecionada);
    setCategoriaNome(categoriaSelecionada.name);
    setCategoriaTipo(categoriaSelecionada.kind);
    setCategoriaOrcamentoCentavos(categoriaSelecionada.monthlyBudgetCents ?? null);
    setCategoriaConfirmandoExclusao(false);
    setCategoriaFormularioAberto(true);
  };

  const fecharFormularioCategoria = () => {
    setCategoriaFormularioAberto(false);
    setCategoriaEditando(null);
    setCategoriaNome("");
    setCategoriaTipo("expense");
    setCategoriaOrcamentoCentavos(null);
    setCategoriaErro("");
  };

  const salvarCategoria = async () => {
    if (!categoriaNome.trim()) {
      setCategoriaErro("Nome é obrigatório.");
      return;
    }

    setCategoriaSalvando(true);
    setCategoriaErro("");
    try {
      const payload = {
        name: categoriaNome.trim(),
        kind: categoriaTipo,
        monthlyBudgetCents: categoriaOrcamentoCentavos,
      };

      const saved = categoriaEditando
        ? await api.updateCategory(categoriaEditando.id, payload)
        : await api.createCategory(payload);

      await carregarCategorias();

      if (!categoriaEditando && saved?.id) {
        setFilters((prev) => ({ ...prev, categoryId: String(saved.id) }));
      }

      fecharFormularioCategoria();
    } catch (err: any) {
      setCategoriaErro(err?.message || "Nao foi possivel salvar a categoria.");
    } finally {
      setCategoriaSalvando(false);
    }
  };

  const iniciarExclusaoCategoria = () => {
    if (!categoriaSelecionada) return;
    setCategoriaErro("");
    setCategoriaFormularioAberto(false);
    setCategoriaConfirmandoExclusao(true);
  };

  const cancelarExclusaoCategoria = () => {
    setCategoriaConfirmandoExclusao(false);
    setCategoriaExcluindo(false);
    setCategoriaErro("");
  };

  const excluirCategoria = async () => {
    if (!categoriaSelecionada) return;
    setCategoriaExcluindo(true);
    setCategoriaErro("");
    try {
      await api.deleteCategory(categoriaSelecionada.id);
      await carregarCategorias();
      setCategoriaConfirmandoExclusao(false);
      setFilters((prev) => ({ ...prev, categoryId: "" }));
    } catch (err: any) {
      setCategoriaErro(err?.message || "Nao foi possivel excluir a categoria.");
    } finally {
      setCategoriaExcluindo(false);
    }
  };

  const abrirNovo = () => {
    setTransacaoEditando(null);
    setModalAberto(true);
  };

  const abrirEditar = (t: Transacao) => {
    setTransacaoEditando(t);
    setModalAberto(true);
  };

  const salvar = async (dados: DadosLancamento) => {
    if (transacaoEditando) {
      await api.updateTransaction(transacaoEditando.id, dados);
    } else {
      await api.createTransaction(dados);
    }
    setModalAberto(false);
    carregarDados();
  };

  const excluir = async () => {
    if (!confirmarExclusao) return;
    setExcluindo(true);
    try {
      await api.deleteTransaction(confirmarExclusao);
      setConfirmarExclusao(null);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const aoAlternarPago = async (id: number, marcar: boolean) => {
    setAtualizandoPagoPorId((prev) => ({ ...prev, [id]: true }));
    setErroPagoPorId((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, id)) return prev;
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    try {
      await alternarPagoOptimista({
        id,
        marcar,
        transacoes: transactions,
        setTransacoes: setTransactions,
        atualizarTransacao: async (tid, patch) => api.updateTransaction(tid, patch),
      });
    } catch (err: any) {
      const mensagem = typeof err?.message === "string" ? err.message : "Nao foi possivel atualizar o pagamento.";
      setErroPagoPorId((prev) => ({ ...prev, [id]: mensagem }));
    } finally {
      setAtualizandoPagoPorId((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div>
      <div className="barra-topo">
        <h2>Lancamentos</h2>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo Lancamento</button>
      </div>
      
      <div className="filters">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={abrirFormularioCriarCategoria}>+ Nova categoria</button>
          {categoriaSelecionada ? (
            <>
              <button onClick={abrirFormularioEditarCategoria}>Editar categoria</button>
              <button className="btn-danger" onClick={iniciarExclusaoCategoria}>Excluir categoria</button>
            </>
          ) : null}
        </div>
        <select value={filters.methodId} onChange={(e) => setFilters({ ...filters, methodId: e.target.value })}>
          <option value="">Todos metodos</option>
          {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">Todos tipos</option>
          <option value="entry">Entrada</option>
          <option value="exit">Saida</option>
        </select>
        <button onClick={clearFilters}>Limpar filtros</button>
      </div>

      {categoriaFormularioAberto ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{categoriaEditando ? "Editar categoria" : "Nova categoria"}</h3>
            <button onClick={fecharFormularioCategoria}>Fechar</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <label>
              Nome
              <input value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} />
            </label>
            <label>
              Tipo
              <select value={categoriaTipo} onChange={(e) => setCategoriaTipo(e.target.value as any)}>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </label>
            <label>
              Orcamento mensal (R$)
              <input
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={categoriaOrcamentoCentavos === null ? "" : formatCurrency(categoriaOrcamentoCentavos)}
                onChange={(e) => {
                  const centavos = parsearCentavosDeTexto(e.target.value);
                  setCategoriaOrcamentoCentavos(e.target.value.trim() ? centavos : null);
                }}
              />
            </label>
            <button className="btn-primary" onClick={salvarCategoria} disabled={categoriaSalvando}>
              {categoriaSalvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
          {categoriaErro ? <div style={{ marginTop: 10, color: "#b91c1c" }}>{categoriaErro}</div> : null}
        </div>
      ) : null}

      {categoriaConfirmandoExclusao && categoriaSelecionada ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <strong>Excluir categoria:</strong> {categoriaSelecionada.name}
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                A exclusao e bloqueada se houver lancamentos ou recorrencias usando essa categoria.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={cancelarExclusaoCategoria} disabled={categoriaExcluindo}>Cancelar</button>
              <button className="btn-danger" onClick={excluirCategoria} disabled={categoriaExcluindo}>
                {categoriaExcluindo ? "Excluindo..." : "Confirmar exclusao"}
              </button>
            </div>
          </div>
          {categoriaErro ? <div style={{ marginTop: 10, color: "#b91c1c" }}>{categoriaErro}</div> : null}
        </div>
      ) : null}

      <div className="card">
        {transactions.length === 0 ? (
          <p>Nenhum lancamento encontrado.</p>
        ) : (
          <div className="table-container tabela-scroll" aria-label="Tabela de lancamentos">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descricao</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Metodo</th>
                  <th className="text-right">Valor</th>
                  <th className="coluna-pago">Pago</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className={t.type === "exit" && t.isPaid ? "linha-paga" : ""}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.type === "entry" ? "Entrada" : "Saida"}</td>
                    <td>{nomeCategoriaPorId.get(t.categoryId) || "-"}</td>
                    <td>{nomeMetodoPorId.get(t.paymentMethodId) || "-"}</td>
                    <td className="text-right">{formatCurrency(t.amountCents)}</td>
                    <td className="coluna-pago">
                      {t.type === "exit" ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <input
                            type="checkbox"
                            checked={!!t.isPaid}
                            disabled={!!atualizandoPagoPorId[t.id]}
                            onChange={(e) => aoAlternarPago(t.id, e.target.checked)}
                            aria-label={`Marcar lancamento ${t.description} como pago`}
                          />
                          {erroPagoPorId[t.id] ? <div className="erro-pago">{erroPagoPorId[t.id]}</div> : null}
                        </div>
                      ) : null}
                    </td>
                    <td className="text-right">
                      <button onClick={() => abrirEditar(t)} style={{ marginRight: 8 }}>Editar</button>
                      <button className="btn-danger" onClick={() => setConfirmarExclusao(t.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalLancamento
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={salvar}
        transacaoInicial={transacaoEditando}
      />

      <ModalConfirmacao
        aberto={confirmarExclusao !== null}
        titulo="Excluir Lancamento"
        mensagem="Tem certeza que deseja excluir este lancamento?"
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmarExclusao(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
