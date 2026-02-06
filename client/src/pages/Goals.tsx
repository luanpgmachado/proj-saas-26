import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalConfirmacao from "../components/ModalConfirmacao";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

type Goal = {
  id: number;
  name: string;
  targetCents: number;
  currentCents: number;
  progressPercent: number;
};

type Contribution = {
  id: number;
  goalId: number;
  date: string;
  amountCents: number;
};

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<Record<number, Contribution[]>>({});
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [modalMeta, setModalMeta] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState<Goal | null>(null);
  const [formMeta, setFormMeta] = useState({ name: "", targetCents: "" });
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [modalAporte, setModalAporte] = useState<number | null>(null);
  const [formAporte, setFormAporte] = useState({ date: "", amountCents: "" });
  const [salvandoAporte, setSalvandoAporte] = useState(false);
  const [confirmarExclusaoMeta, setConfirmarExclusaoMeta] = useState<number | null>(null);
  const [confirmarExclusaoAporte, setConfirmarExclusaoAporte] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarDados = () => {
    api.getGoals().then(setGoals).catch(console.error);
  };

  useEffect(() => { carregarDados(); }, []);

  const carregarContribuicoes = async (goalId: number) => {
    if (expandedGoal === goalId) {
      setExpandedGoal(null);
      return;
    }
    const contribs = await api.getGoalContributions(goalId);
    setContributions({ ...contributions, [goalId]: contribs });
    setExpandedGoal(goalId);
  };

  const abrirNovaMeta = () => {
    setEditandoMeta(null);
    setFormMeta({ name: "", targetCents: "" });
    setModalMeta(true);
  };

  const abrirEditarMeta = (g: Goal) => {
    setEditandoMeta(g);
    setFormMeta({ name: g.name, targetCents: (g.targetCents / 100).toString() });
    setModalMeta(true);
  };

  const salvarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoMeta(true);
    try {
      const data = { name: formMeta.name, targetCents: Math.round(parseFloat(formMeta.targetCents) * 100) };
      if (editandoMeta) {
        await api.updateGoal(editandoMeta.id, data);
      } else {
        await api.createGoal(data);
      }
      setModalMeta(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoMeta(false);
    }
  };

  const excluirMeta = async () => {
    if (!confirmarExclusaoMeta) return;
    setExcluindo(true);
    try {
      await api.deleteGoal(confirmarExclusaoMeta);
      setConfirmarExclusaoMeta(null);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const abrirAporte = (goalId: number) => {
    const hoje = new Date().toISOString().split("T")[0];
    setFormAporte({ date: hoje, amountCents: "" });
    setModalAporte(goalId);
  };

  const salvarAporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAporte) return;
    setSalvandoAporte(true);
    try {
      await api.createGoalContribution(modalAporte, {
        date: formAporte.date,
        amountCents: Math.round(parseFloat(formAporte.amountCents) * 100),
      });
      setModalAporte(null);
      carregarDados();
      if (expandedGoal === modalAporte) {
        const contribs = await api.getGoalContributions(modalAporte);
        setContributions({ ...contributions, [modalAporte]: contribs });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoAporte(false);
    }
  };

  const excluirAporte = async () => {
    if (!confirmarExclusaoAporte) return;
    setExcluindo(true);
    try {
      await api.deleteGoalContribution(confirmarExclusaoAporte);
      setConfirmarExclusaoAporte(null);
      carregarDados();
      if (expandedGoal) {
        const contribs = await api.getGoalContributions(expandedGoal);
        setContributions({ ...contributions, [expandedGoal]: contribs });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <div className="barra-topo">
        <h2>Metas Financeiras</h2>
        <button className="btn-primary" onClick={abrirNovaMeta}>+ Nova Meta</button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <p>Nenhuma meta cadastrada.</p>
        </div>
      ) : (
        goals.map((goal) => (
          <div className="card" key={goal.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ cursor: "pointer" }} onClick={() => carregarContribuicoes(goal.id)}>{goal.name}</h3>
              <div>
                <button onClick={() => abrirEditarMeta(goal)} style={{ marginRight: 8 }}>Editar</button>
                <button className="btn-danger" onClick={() => setConfirmarExclusaoMeta(goal.id)}>Excluir</button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span>{goal.progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="fill" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }} />
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{formatCurrency(goal.currentCents)} de {formatCurrency(goal.targetCents)}</span>
              <div>
                <button onClick={() => carregarContribuicoes(goal.id)} style={{ marginRight: 8 }}>
                  {expandedGoal === goal.id ? "Ocultar Aportes" : "Ver Aportes"}
                </button>
                <button className="btn-primary" onClick={() => abrirAporte(goal.id)}>+ Aporte</button>
              </div>
            </div>
            {expandedGoal === goal.id && contributions[goal.id] && (
              <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <h4 style={{ marginBottom: 12 }}>Aportes</h4>
                {contributions[goal.id].length === 0 ? (
                  <p>Nenhum aporte realizado.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th className="text-right">Valor</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions[goal.id].map((c) => (
                        <tr key={c.id}>
                          <td>{c.date}</td>
                          <td className="text-right">{formatCurrency(c.amountCents)}</td>
                          <td className="text-right">
                            <button className="btn-danger" onClick={() => setConfirmarExclusaoAporte(c.id)}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {modalMeta && (
        <div className="modal-fundo" onClick={() => setModalMeta(false)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{editandoMeta ? "Editar Meta" : "Nova Meta"}</h3>
            </div>
            <form onSubmit={salvarMeta}>
              <div className="form-group">
                <label>Nome da Meta</label>
                <input type="text" value={formMeta.name} onChange={(e) => setFormMeta({ ...formMeta, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Valor Alvo (R$)</label>
                <input type="number" step="0.01" min="0" value={formMeta.targetCents} onChange={(e) => setFormMeta({ ...formMeta, targetCents: e.target.value })} required />
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalMeta(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoMeta}>{salvandoMeta ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAporte !== null && (
        <div className="modal-fundo" onClick={() => setModalAporte(null)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>Novo Aporte</h3>
            </div>
            <form onSubmit={salvarAporte}>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={formAporte.date} onChange={(e) => setFormAporte({ ...formAporte, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" min="0" value={formAporte.amountCents} onChange={(e) => setFormAporte({ ...formAporte, amountCents: e.target.value })} required />
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalAporte(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoAporte}>{salvandoAporte ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={confirmarExclusaoMeta !== null}
        titulo="Excluir Meta"
        mensagem="Tem certeza que deseja excluir esta meta? Todos os aportes serao removidos."
        aoConfirmar={excluirMeta}
        aoCancelar={() => setConfirmarExclusaoMeta(null)}
        confirmando={excluindo}
      />

      <ModalConfirmacao
        aberto={confirmarExclusaoAporte !== null}
        titulo="Excluir Aporte"
        mensagem="Tem certeza que deseja excluir este aporte?"
        aoConfirmar={excluirAporte}
        aoCancelar={() => setConfirmarExclusaoAporte(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
