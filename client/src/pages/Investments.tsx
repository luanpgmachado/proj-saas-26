import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import { Plus, X } from "lucide-react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

type Investment = {
  id: number;
  name: string;
  currentCents: number;
};

type Reserve = {
  id: number;
  name: string;
  currentCents: number;
};

type Contribution = {
  id: number;
  date: string;
  amountCents: number;
};

export default function Investments() {
  const [reserve, setReserve] = useState<Reserve | null>(null);
  const [reserveContributions, setReserveContributions] = useState<Contribution[]>([]);
  const [showReserveContribs, setShowReserveContribs] = useState(false);

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentContribs, setInvestmentContribs] = useState<Record<number, Contribution[]>>({});
  const [expandedInvestment, setExpandedInvestment] = useState<number | null>(null);

  const [modalInvestimento, setModalInvestimento] = useState(false);
  const [editandoInvestimento, setEditandoInvestimento] = useState<Investment | null>(null);
  const [formInvestimento, setFormInvestimento] = useState({ name: "" });
  const [salvandoInvestimento, setSalvandoInvestimento] = useState(false);

  const [modalReserva, setModalReserva] = useState(false);
  const [formReserva, setFormReserva] = useState({ name: "" });
  const [salvandoReserva, setSalvandoReserva] = useState(false);

  const [modalAporteReserva, setModalAporteReserva] = useState(false);
  const [modalAporteInvestimento, setModalAporteInvestimento] = useState<number | null>(null);
  const [formAporte, setFormAporte] = useState({ date: "", amountCents: "" });
  const [salvandoAporte, setSalvandoAporte] = useState(false);

  const [confirmarExclusaoReserva, setConfirmarExclusaoReserva] = useState<number | null>(null);
  const [confirmarExclusaoInv, setConfirmarExclusaoInv] = useState<number | null>(null);
  const [confirmarExclusaoAporteReserva, setConfirmarExclusaoAporteReserva] = useState<number | null>(null);
  const [confirmarExclusaoAporteInv, setConfirmarExclusaoAporteInv] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarDados = () => {
    api.getReserve().then(setReserve).catch(() => setReserve(null));
    api.getInvestments().then(setInvestments).catch(console.error);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarReserveContribs = async () => {
    if (showReserveContribs) {
      setShowReserveContribs(false);
      return;
    }
    const contribs = await api.getReserveContributions();
    setReserveContributions(contribs);
    setShowReserveContribs(true);
  };

  const carregarInvestmentContribs = async (invId: number) => {
    if (expandedInvestment === invId) {
      setExpandedInvestment(null);
      return;
    }
    const contribs = await api.getInvestmentContributions(invId);
    setInvestmentContribs((prev) => ({ ...prev, [invId]: contribs }));
    setExpandedInvestment(invId);
  };

  const abrirNovaReserva = () => {
    setFormReserva({ name: reserve?.name ?? "Reserva de Emergência" });
    setModalReserva(true);
  };

  const salvarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoReserva(true);
    try {
      if (reserve) {
        await api.updateReserve(reserve.id, formReserva);
      } else {
        await api.createReserve(formReserva);
      }
      setModalReserva(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoReserva(false);
    }
  };

  const excluirReserva = async () => {
    if (!confirmarExclusaoReserva) return;
    setExcluindo(true);
    try {
      await api.deleteReserve(confirmarExclusaoReserva);
      setConfirmarExclusaoReserva(null);
      setShowReserveContribs(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const abrirNovoInvestimento = () => {
    setEditandoInvestimento(null);
    setFormInvestimento({ name: "" });
    setModalInvestimento(true);
  };

  const abrirEditarInvestimento = (inv: Investment) => {
    setEditandoInvestimento(inv);
    setFormInvestimento({ name: inv.name });
    setModalInvestimento(true);
  };

  const salvarInvestimento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoInvestimento(true);
    try {
      if (editandoInvestimento) {
        await api.updateInvestment(editandoInvestimento.id, formInvestimento);
      } else {
        await api.createInvestment(formInvestimento);
      }
      setModalInvestimento(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoInvestimento(false);
    }
  };

  const excluirInvestimento = async () => {
    if (!confirmarExclusaoInv) return;
    setExcluindo(true);
    try {
      await api.deleteInvestment(confirmarExclusaoInv);
      setConfirmarExclusaoInv(null);
      setExpandedInvestment(null);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const abrirAporteReserva = () => {
    const hoje = new Date().toISOString().split("T")[0];
    setFormAporte({ date: hoje, amountCents: "" });
    setModalAporteReserva(true);
  };

  const salvarAporteReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoAporte(true);
    try {
      await api.createReserveContribution({
        date: formAporte.date,
        amountCents: Math.round(parseFloat(formAporte.amountCents) * 100),
      });
      setModalAporteReserva(false);
      carregarDados();
      if (showReserveContribs) {
        const contribs = await api.getReserveContributions();
        setReserveContributions(contribs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoAporte(false);
    }
  };

  const abrirAporteInvestimento = (invId: number) => {
    const hoje = new Date().toISOString().split("T")[0];
    setFormAporte({ date: hoje, amountCents: "" });
    setModalAporteInvestimento(invId);
  };

  const salvarAporteInvestimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAporteInvestimento) return;
    setSalvandoAporte(true);
    try {
      await api.createInvestmentContribution(modalAporteInvestimento, {
        date: formAporte.date,
        amountCents: Math.round(parseFloat(formAporte.amountCents) * 100),
      });
      setModalAporteInvestimento(null);
      carregarDados();
      if (expandedInvestment === modalAporteInvestimento) {
        const contribs = await api.getInvestmentContributions(modalAporteInvestimento);
        setInvestmentContribs((prev) => ({ ...prev, [modalAporteInvestimento]: contribs }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoAporte(false);
    }
  };

  const excluirAporteReserva = async () => {
    if (!confirmarExclusaoAporteReserva) return;
    setExcluindo(true);
    try {
      await api.deleteReserveContribution(confirmarExclusaoAporteReserva);
      setConfirmarExclusaoAporteReserva(null);
      carregarDados();
      if (showReserveContribs) {
        const contribs = await api.getReserveContributions();
        setReserveContributions(contribs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const excluirAporteInvestimento = async () => {
    if (!confirmarExclusaoAporteInv) return;
    setExcluindo(true);
    try {
      await api.deleteInvestmentContribution(confirmarExclusaoAporteInv);
      setConfirmarExclusaoAporteInv(null);
      carregarDados();
      if (expandedInvestment) {
        const contribs = await api.getInvestmentContributions(expandedInvestment);
        setInvestmentContribs((prev) => ({ ...prev, [expandedInvestment]: contribs }));
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
        titulo="Investimentos / Reserva"
        subtitulo="Acompanhe sua reserva e contas de investimento"
        acaoDireita={
          <button
            type="button"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring flex items-center gap-2"
            onClick={abrirNovoInvestimento}
          >
            <Plus className="w-4 h-4" />
            Novo Investimento
          </button>
        }
      />

      <div className="space-y-4">
        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{reserve ? reserve.name : "Reserva de Emergência"}</p>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                Total: <span className="font-semibold text-foreground">{formatCurrency(reserve?.currentCents ?? 0)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                onClick={abrirNovaReserva}
              >
                {reserve ? "Editar" : "Criar"}
              </button>
              {reserve ? (
                <button
                  type="button"
                  className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth focus-ring"
                  onClick={() => setConfirmarExclusaoReserva(reserve.id)}
                >
                  Excluir
                </button>
              ) : null}
              <button
                type="button"
                className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring"
                onClick={abrirAporteReserva}
                disabled={!reserve}
              >
                + Aporte
              </button>
              <button
                type="button"
                className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                onClick={carregarReserveContribs}
              >
                {showReserveContribs ? "Ocultar Aportes" : "Ver Aportes"}
              </button>
            </div>
          </div>

          {showReserveContribs ? (
            <div className="mt-5 surface-card-sm p-4">
              <p className="text-sm font-semibold">Aportes na Reserva</p>
              {reserveContributions.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Nenhum aporte registrado.</p>
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
                      {reserveContributions.map((c, idx) => (
                        <tr
                          key={c.id}
                          className={[
                            "hover:bg-muted/30 transition-smooth",
                            idx < reserveContributions.length - 1 ? "border-b border-border" : "",
                          ].join(" ")}
                        >
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{c.date}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(c.amountCents)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              className="text-sm font-medium text-destructive hover:underline underline-offset-4"
                              onClick={() => setConfirmarExclusaoAporteReserva(c.id)}
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

        <div className="surface-card p-6">
          <p className="text-sm font-semibold mb-4">Investimentos</p>
          {investments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum investimento cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {investments.map((inv) => (
                <div key={inv.id} className="surface-card-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{inv.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                        Total: <span className="font-semibold text-foreground">{formatCurrency(inv.currentCents)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                        onClick={() => abrirEditarInvestimento(inv)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth focus-ring"
                        onClick={() => setConfirmarExclusaoInv(inv.id)}
                      >
                        Excluir
                      </button>
                      <button
                        type="button"
                        className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring"
                        onClick={() => abrirAporteInvestimento(inv.id)}
                      >
                        + Aporte
                      </button>
                      <button
                        type="button"
                        className="h-9 px-3 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                        onClick={() => carregarInvestmentContribs(inv.id)}
                      >
                        {expandedInvestment === inv.id ? "Ocultar Aportes" : "Ver Aportes"}
                      </button>
                    </div>
                  </div>

                  {expandedInvestment === inv.id && investmentContribs[inv.id] ? (
                    <div className="mt-4 overflow-x-auto">
                      {investmentContribs[inv.id].length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum aporte registrado.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                              <th className="text-left font-medium px-4 py-2">Data</th>
                              <th className="text-right font-medium px-4 py-2">Valor</th>
                              <th className="text-right font-medium px-4 py-2 w-24"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {investmentContribs[inv.id].map((c, idx) => (
                              <tr
                                key={c.id}
                                className={[
                                  "hover:bg-muted/30 transition-smooth",
                                  idx < investmentContribs[inv.id].length - 1 ? "border-b border-border" : "",
                                ].join(" ")}
                              >
                                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{c.date}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(c.amountCents)}</td>
                                <td className="px-4 py-2.5 text-right">
                                  <button
                                    type="button"
                                    className="text-sm font-medium text-destructive hover:underline underline-offset-4"
                                    onClick={() => setConfirmarExclusaoAporteInv(c.id)}
                                  >
                                    Excluir
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalReserva ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalReserva(false)}>
          <div className="surface-card w-full max-w-[520px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{reserve ? "Editar Reserva" : "Nova Reserva"}</h3>
              <button
                type="button"
                onClick={() => setModalReserva(false)}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={salvarReserva} className="px-6 py-5">
              <label>
                <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
                <input
                  type="text"
                  value={formReserva.name}
                  onChange={(e) => setFormReserva({ name: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                />
              </label>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalReserva(false)}
                  className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoReserva}
                  className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring disabled:opacity-60"
                >
                  {salvandoReserva ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalInvestimento ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalInvestimento(false)}>
          <div className="surface-card w-full max-w-[520px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{editandoInvestimento ? "Editar Investimento" : "Novo Investimento"}</h3>
              <button
                type="button"
                onClick={() => setModalInvestimento(false)}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={salvarInvestimento} className="px-6 py-5">
              <label>
                <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
                <input
                  type="text"
                  value={formInvestimento.name}
                  onChange={(e) => setFormInvestimento({ name: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                />
              </label>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalInvestimento(false)}
                  className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoInvestimento}
                  className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring disabled:opacity-60"
                >
                  {salvandoInvestimento ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalAporteReserva ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalAporteReserva(false)}>
          <div className="surface-card w-full max-w-[520px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Aporte na Reserva</h3>
              <button
                type="button"
                onClick={() => setModalAporteReserva(false)}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={salvarAporteReserva} className="px-6 py-5">
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
                  onClick={() => setModalAporteReserva(false)}
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

      {modalAporteInvestimento !== null ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalAporteInvestimento(null)}>
          <div className="surface-card w-full max-w-[520px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Aporte no Investimento</h3>
              <button
                type="button"
                onClick={() => setModalAporteInvestimento(null)}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={salvarAporteInvestimento} className="px-6 py-5">
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
                  onClick={() => setModalAporteInvestimento(null)}
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
        aberto={confirmarExclusaoReserva !== null}
        titulo="Excluir Reserva"
        mensagem="Tem certeza que deseja excluir a reserva? Todos os aportes serão removidos."
        aoConfirmar={excluirReserva}
        aoCancelar={() => setConfirmarExclusaoReserva(null)}
        confirmando={excluindo}
      />

      <ModalConfirmacao
        aberto={confirmarExclusaoInv !== null}
        titulo="Excluir Investimento"
        mensagem="Tem certeza que deseja excluir este investimento? Todos os aportes serão removidos."
        aoConfirmar={excluirInvestimento}
        aoCancelar={() => setConfirmarExclusaoInv(null)}
        confirmando={excluindo}
      />

      <ModalConfirmacao
        aberto={confirmarExclusaoAporteReserva !== null}
        titulo="Excluir Aporte"
        mensagem="Tem certeza que deseja excluir este aporte da reserva?"
        aoConfirmar={excluirAporteReserva}
        aoCancelar={() => setConfirmarExclusaoAporteReserva(null)}
        confirmando={excluindo}
      />

      <ModalConfirmacao
        aberto={confirmarExclusaoAporteInv !== null}
        titulo="Excluir Aporte"
        mensagem="Tem certeza que deseja excluir este aporte?"
        aoConfirmar={excluirAporteInvestimento}
        aoCancelar={() => setConfirmarExclusaoAporteInv(null)}
        confirmando={excluindo}
      />
    </div>
  );
}

