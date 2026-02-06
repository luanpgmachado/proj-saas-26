import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalLancamento, { type DadosLancamento } from "../components/ModalLancamento";
import ModalConfirmacao from "../components/ModalConfirmacao";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

const formatarMesAno = (mes: string) => {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const nome = nomes[(numeroMes || 1) - 1] ?? "mes";
  return `${nome}/${ano}`;
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
  const [transacaoEditando, setTransacaoEditando] = useState<any | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

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

  const abrirModalNovo = () => {
    setTransacaoEditando(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (transacao: any) => {
    setTransacaoEditando(transacao);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setTransacaoEditando(null);
  };

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
    if (transacaoEditando) {
      await api.updateTransaction(transacaoEditando.id, dados);
    } else {
      await api.createTransaction(dados);
    }
    await recarregarDados();
  };

  const aoExcluirTransacao = async () => {
    if (confirmarExclusao === null) return;
    setExcluindo(true);
    try {
      await api.deleteTransaction(confirmarExclusao);
      await recarregarDados();
      setConfirmarExclusao(null);
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <div className="barra-topo">
        <div className="seletor-mes" aria-label="Seletor de mes">
          <button className="btn-ghost" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
            &lt;
          </button>
          <span className="seletor-mes-label" title={month}>
            {formatarMesAno(month)}
          </span>
          <button className="btn-ghost" onClick={() => changeMonth(1)} aria-label="Proximo mes">
            &gt;
          </button>
        </div>
        <button className="btn-primary" onClick={abrirModalNovo}>
          + Novo Lancamento
        </button>
      </div>

      <div className="cards-row">
        <div className="card">
          <h3>Entradas</h3>
          <div className="value positive">{formatCurrency(summary.entriesCents)}</div>
        </div>
        <div className="card">
          <h3>Saidas</h3>
          <div className="value negative">{formatCurrency(summary.exitsCents)}</div>
        </div>
        <div className="card card--saldo">
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
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th className="text-right">Orcamento</th>
                  <th className="text-right">Gasto</th>
                  <th className="text-right">Diferenca</th>
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
          </div>
        )}
      </div>

      <div className="tabs">
        {["fixed", "variable", "installment", "entry"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "fixed" ? "Fixos" : t === "variable" ? "Variaveis" : t === "installment" ? "Parcelados" : "Entradas"}
          </button>
        ))}
      </div>

      <div className="card">
        {transactions.length === 0 ? (
          <p>Nenhum lancamento nesta categoria.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descricao</th>
                  <th className="text-right">Valor</th>
                  <th className="text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td className="text-right">{formatCurrency(t.amountCents)}</td>
                    <td className="text-right">
                      <button
                        className="btn-sm"
                        style={{ marginRight: 6 }}
                        onClick={() => abrirModalEditar(t)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => setConfirmarExclusao(t.id)}
                      >
                        Excluir
                      </button>
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
        aoFechar={fecharModal}
        aoSalvar={aoSalvarLancamento}
        transacaoInicial={transacaoEditando}
      />

      <ModalConfirmacao
        aberto={confirmarExclusao !== null}
        titulo="Confirmar exclusao"
        mensagem="Tem certeza que deseja excluir este lancamento? Esta acao nao pode ser desfeita."
        aoConfirmar={aoExcluirTransacao}
        aoCancelar={() => setConfirmarExclusao(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
