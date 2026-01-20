import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalLancamento, { type DadosLancamento } from "../components/ModalLancamento";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

export default function Dashboard() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summary, setSummary] = useState({ entriesCents: 0, exitsCents: 0, balanceCents: 0 });
  const [categorySpend, setCategorySpend] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState("fixed");
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    api.getMonthSummary(month).then(setSummary).catch(console.error);
    api.getCategorySpend(month).then(setCategorySpend).catch(console.error);
  }, [month]);

  useEffect(() => {
    api.getTransactions({ month, group: tab }).then(setTransactions).catch(console.error);
  }, [month, tab]);

  const changeMonth = (delta: number) => {
    const [year, m] = month.split("-").map(Number);
    const date = new Date(year, m - 1 + delta, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const abrirModal = () => setModalAberto(true);
  const fecharModal = () => setModalAberto(false);

  const recarregarDados = async () => {
    const [novoResumo, novosGastos, novasTransacoes] = await Promise.all([
      api.getMonthSummary(month),
      api.getCategorySpend(month),
      api.getTransactions({ month, group: tab }),
    ]);
    setSummary(novoResumo);
    setCategorySpend(novosGastos);
    setTransactions(novasTransacoes);
  };

  const aoSalvarLancamento = async (dados: DadosLancamento) => {
    await api.createTransaction(dados);
    await recarregarDados();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="month-selector">
          <button onClick={() => changeMonth(-1)}>&lt;</button>
          <span style={{ fontWeight: 600, fontSize: 18 }}>{month}</span>
          <button onClick={() => changeMonth(1)}>&gt;</button>
        </div>
        <button className="primary" onClick={abrirModal}>+ Novo Lancamento</button>
      </div>

      <div className="cards-row">
        <div className="card">
          <h3>Entradas</h3>
          <div className="value positive">{formatCurrency(summary.entriesCents)}</div>
        </div>
        <div className="card">
          <h3>Saídas</h3>
          <div className="value negative">{formatCurrency(summary.exitsCents)}</div>
        </div>
        <div className="card">
          <h3>Saldo</h3>
          <div className={`value ${summary.balanceCents >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(summary.balanceCents)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Gastos por Categoria</h3>
        {categorySpend.length === 0 ? (
          <p>Nenhuma categoria de despesa cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th className="text-right">Orçamento</th>
                <th className="text-right">Gasto</th>
                <th className="text-right">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {categorySpend.map((cat) => (
                <tr key={cat.categoryId}>
                  <td>{cat.categoryName}</td>
                  <td className="text-right">{cat.budgetCents ? formatCurrency(cat.budgetCents) : "-"}</td>
                  <td className="text-right">{formatCurrency(cat.spentCents)}</td>
                  <td className={`text-right ${cat.diffCents < 0 ? "over-budget" : ""}`}>
                    {formatCurrency(cat.diffCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="tabs">
        {["fixed", "variable", "installment", "entry"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "fixed" ? "Fixos" : t === "variable" ? "Variáveis" : t === "installment" ? "Parcelados" : "Entradas"}
          </button>
        ))}
      </div>

      <div className="card">
        {transactions.length === 0 ? (
          <p>Nenhum lançamento nesta categoria.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td className="text-right">{formatCurrency(t.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ModalLancamento aberto={modalAberto} aoFechar={fecharModal} aoSalvar={aoSalvarLancamento} />
    </div>
  );
}
