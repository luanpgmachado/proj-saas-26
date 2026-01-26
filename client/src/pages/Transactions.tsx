import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalLancamento, { DadosLancamento } from "../components/ModalLancamento";
import ModalConfirmacao from "../components/ModalConfirmacao";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

type Transaction = {
  id: number;
  date: string;
  description: string;
  type: "entry" | "exit";
  amountCents: number;
  categoryId: number;
  paymentMethodId: number;
  group: "fixed" | "variable" | "installment" | "entry";
};

export default function Transactions() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [filters, setFilters] = useState({ categoryId: "", methodId: "", type: "" });
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<Transaction | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarDados = () => {
    const params: Record<string, string> = { month };
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.methodId) params.methodId = filters.methodId;
    if (filters.type) params.type = filters.type;
    api.getTransactions(params).then(setTransactions).catch(console.error);
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getPaymentMethods().then(setMethods).catch(console.error);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [month, filters]);

  const clearFilters = () => setFilters({ categoryId: "", methodId: "", type: "" });

  const abrirNovo = () => {
    setTransacaoEditando(null);
    setModalAberto(true);
  };

  const abrirEditar = (t: Transaction) => {
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Lancamentos</h2>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo Lancamento</button>
      </div>
      
      <div className="filters">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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

      <div className="card">
        {transactions.length === 0 ? (
          <p>Nenhum lancamento encontrado.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descricao</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Metodo</th>
                  <th className="text-right">Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.type === "entry" ? "Entrada" : "Saida"}</td>
                    <td>{categories.find((c) => c.id === t.categoryId)?.name || "-"}</td>
                    <td>{methods.find((m) => m.id === t.paymentMethodId)?.name || "-"}</td>
                    <td className="text-right">{formatCurrency(t.amountCents)}</td>
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
