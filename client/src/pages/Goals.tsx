import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import { Plus, X } from "lucide-react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

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

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarContribuicoes = async (goalId: number) => {
    if (expandedGoal === goalId) {
      setExpandedGoal(null);
      return;
    }
    const contribs = await api.getGoalContributions(goalId);
    setContributions((prev) => ({ ...prev, [goalId]: contribs }));
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
      setExpandedGoal(null);
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
        setContributions((prev) => ({ ...prev, [modalAporte]: contribs }));
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
        setContributions((prev) => ({ ...prev, [expandedGoal]: contribs }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <CabecalhoConteudo
        titulo="Metas Financeiras"
        subtitulo="Acompanhe progresso e aportes"
        acaoDireita={
          <button
            type="button"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring flex items-center gap-2"
            onClick={abrirNovaMeta}
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        }
      />

      {goals.length === 0 ? (
        <div className="surface-card-sm p-6 text-sm text-muted-foreground">Nenhuma meta cadastrada.</div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div className="surface-card p-6" key={goal.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{goal.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {formatCurrency(goal.currentCents)} de {formatCurrency(goal.targetCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                    onClick={() => abrirEditarMeta(goal)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth focus-ring"
                    onClick={() => setConfirmarExclusaoMeta(goal.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(0, Math.min(100, goal.progressPercent ?? 0))}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Progresso: <span className="font-medium tabular-nums text-foreground">{Math.round(goal.progressPercent)}%</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                      onClick={() => carregarContribuicoes(goal.id)}
                    >
                      {expandedGoal === goal.id ? "Ocultar Aportes" : "Ver Aportes"}
                    </button>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring"
                      onClick={() => abrirAporte(goal.id)}
                    >
                      + Aporte
                    </button>
                  </div>
                </div>

                {expandedGoal === goal.id && contributions[goal.id] ? (
                  <div className="mt-5 surface-card-sm p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Aportes</p>
                    </div>
                    {contributions[goal.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">Nenhum aporte realizado.</p>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                              <th className="text-left font-medium px-4 py-2">Data</th>
                              <th className="text-right font-medium px-4 py-2">Valor</th>
                              <th className="text-right font-medium px-4 py-2 w-24"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {contributions[goal.id].map((c, idx) => (
                              <tr
                                key={c.id}
                                className={[
                                  "hover:bg-muted/30 transition-smooth",
                                  idx < contributions[goal.id].length - 1 ? "border-b border-border" : "",
                                ].join(" ")}
                              >
                                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{c.date}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(c.amountCents)}</td>
                                <td className="px-4 py-2.5 text-right">
                                  <button
                                    type="button"
                                    className="text-sm font-medium text-destructive hover:underline underline-offset-4"
                                    onClick={() => setConfirmarExclusaoAporte(c.id)}
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
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMeta ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalMeta(false)}>
          <div className="surface-card w-full max-w-[520px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{editandoMeta ? "Editar Meta" : "Nova Meta"}</h3>
              <button
                type="button"
                onClick={() => setModalMeta(false)}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarMeta} className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="sm:col-span-2">
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
                  <input
                    type="text"
                    value={formMeta.name}
                    onChange={(e) => setFormMeta({ ...formMeta, name: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Valor alvo (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMeta.targetCents}
                    onChange={(e) => setFormMeta({ ...formMeta, targetCents: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalMeta(false)}
                  className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoMeta}
                  className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring disabled:opacity-60"
                >
                  {salvandoMeta ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalAporte !== null ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalAporte(null)}>
          <div className="surface-card w-full max-w-[520px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Novo Aporte</h3>
              <button
                type="button"
                onClick={() => setModalAporte(null)}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarAporte} className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Data</span>
                  <input
                    type="date"
                    value={formAporte.date}
                    onChange={(e) => setFormAporte({ ...formAporte, date: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAporte.amountCents}
                    onChange={(e) => setFormAporte({ ...formAporte, amountCents: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAporte(null)}
                  className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAporte}
                  className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring disabled:opacity-60"
                >
                  {salvandoAporte ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ModalConfirmacao
        aberto={confirmarExclusaoMeta !== null}
        titulo="Excluir Meta"
        mensagem="Tem certeza que deseja excluir esta meta? Todos os aportes serão removidos."
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

