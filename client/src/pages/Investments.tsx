import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalConfirmacao from "../components/ModalConfirmacao";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

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

  const [modalAporteReserva, setModalAporteReserva] = useState(false);
  const [modalAporteInvestimento, setModalAporteInvestimento] = useState<number | null>(null);
  const [formAporte, setFormAporte] = useState({ date: "", amountCents: "" });
  const [salvandoAporte, setSalvandoAporte] = useState(false);

  const [modalReserva, setModalReserva] = useState(false);
  const [formReserva, setFormReserva] = useState({ name: "" });
  const [salvandoReserva, setSalvandoReserva] = useState(false);

  const [confirmarExclusaoReserva, setConfirmarExclusaoReserva] = useState<number | null>(null);
  const [confirmarExclusaoInv, setConfirmarExclusaoInv] = useState<number | null>(null);
  const [confirmarExclusaoAporteReserva, setConfirmarExclusaoAporteReserva] = useState<number | null>(null);
  const [confirmarExclusaoAporteInv, setConfirmarExclusaoAporteInv] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarDados = () => {
    api.getReserve().then(setReserve).catch(() => setReserve(null));
    api.getInvestments().then(setInvestments).catch(console.error);
  };

  useEffect(() => { carregarDados(); }, []);

  const carregarReserveContribs = async () => {
    if (showReserveContribs) {
      setShowReserveContribs(false);
      return;
    }
    const contribs = await api.getReserveContributions();
    setReserveContributions(contribs);
    setShowReserveContribs(true);
  };

  const abrirNovaReserva = () => {
    setFormReserva({ name: "Reserva de Emergencia" });
    setModalReserva(true);
  };

  const abrirEditarReserva = () => {
    if (reserve) {
      setFormReserva({ name: reserve.name });
      setModalReserva(true);
    }
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

  const carregarInvestmentContribs = async (invId: number) => {
    if (expandedInvestment === invId) {
      setExpandedInvestment(null);
      return;
    }
    const contribs = await api.getInvestmentContributions(invId);
    setInvestmentContribs({ ...investmentContribs, [invId]: contribs });
    setExpandedInvestment(invId);
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

  const abrirAporteInvestimento = (invId: number) => {
    const hoje = new Date().toISOString().split("T")[0];
    setFormAporte({ date: hoje, amountCents: "" });
    setModalAporteInvestimento(invId);
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
        setInvestmentContribs({ ...investmentContribs, [modalAporteInvestimento]: contribs });
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
        setInvestmentContribs({ ...investmentContribs, [expandedInvestment]: contribs });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Reserva e Investimentos</h2>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3>Reserva de Emergencia</h3>
          {reserve && (
            <div>
              <button onClick={abrirEditarReserva} style={{ marginRight: 8 }}>Editar</button>
              <button className="btn-danger" onClick={() => setConfirmarExclusaoReserva(reserve.id)}>Excluir</button>
            </div>
          )}
        </div>
        {reserve ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 500, marginRight: 12 }}>{reserve.name}</span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(reserve.currentCents)}</span>
              </div>
              <div>
                <button onClick={carregarReserveContribs} style={{ marginRight: 8 }}>
                  {showReserveContribs ? "Ocultar Aportes" : "Ver Aportes"}
                </button>
                <button className="btn-primary" onClick={abrirAporteReserva}>+ Aporte</button>
              </div>
            </div>
            {showReserveContribs && (
              <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <h4 style={{ marginBottom: 12 }}>Aportes</h4>
                {reserveContributions.length === 0 ? (
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
                      {reserveContributions.map((c) => (
                        <tr key={c.id}>
                          <td>{c.date}</td>
                          <td className="text-right">{formatCurrency(c.amountCents)}</td>
                          <td className="text-right">
                            <button className="btn-danger" onClick={() => setConfirmarExclusaoAporteReserva(c.id)}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        ) : (
          <div>
            <p>Nenhuma reserva configurada.</p>
            <button className="btn-primary" onClick={abrirNovaReserva}>Criar Reserva</button>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3>Investimentos</h3>
          <button className="btn-primary" onClick={abrirNovoInvestimento}>+ Novo Investimento</button>
        </div>
        {investments.length === 0 ? (
          <p>Nenhum investimento cadastrado.</p>
        ) : (
          investments.map((inv) => (
            <div key={inv.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{inv.name}</strong>
                  <span style={{ marginLeft: 16, fontSize: 18, fontWeight: 600 }}>{formatCurrency(inv.currentCents)}</span>
                </div>
                <div>
                  <button onClick={() => abrirEditarInvestimento(inv)} style={{ marginRight: 8 }}>Editar</button>
                  <button className="btn-danger" onClick={() => setConfirmarExclusaoInv(inv.id)} style={{ marginRight: 8 }}>Excluir</button>
                  <button onClick={() => carregarInvestmentContribs(inv.id)} style={{ marginRight: 8 }}>
                    {expandedInvestment === inv.id ? "Ocultar" : "Ver Aportes"}
                  </button>
                  <button className="btn-primary" onClick={() => abrirAporteInvestimento(inv.id)}>+ Aporte</button>
                </div>
              </div>
              {expandedInvestment === inv.id && investmentContribs[inv.id] && (
                <div style={{ marginTop: 12, paddingLeft: 16 }}>
                  {investmentContribs[inv.id].length === 0 ? (
                    <p>Nenhum aporte.</p>
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
                        {investmentContribs[inv.id].map((c) => (
                          <tr key={c.id}>
                            <td>{c.date}</td>
                            <td className="text-right">{formatCurrency(c.amountCents)}</td>
                            <td className="text-right">
                              <button className="btn-danger" onClick={() => setConfirmarExclusaoAporteInv(c.id)}>Excluir</button>
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
      </div>

      {modalInvestimento && (
        <div className="modal-fundo" onClick={() => setModalInvestimento(false)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{editandoInvestimento ? "Editar Investimento" : "Novo Investimento"}</h3>
            </div>
            <form onSubmit={salvarInvestimento}>
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={formInvestimento.name} onChange={(e) => setFormInvestimento({ name: e.target.value })} required />
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalInvestimento(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoInvestimento}>{salvandoInvestimento ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAporteReserva && (
        <div className="modal-fundo" onClick={() => setModalAporteReserva(false)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>Aporte na Reserva</h3>
            </div>
            <form onSubmit={salvarAporteReserva}>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={formAporte.date} onChange={(e) => setFormAporte({ ...formAporte, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" min="0" value={formAporte.amountCents} onChange={(e) => setFormAporte({ ...formAporte, amountCents: e.target.value })} required />
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalAporteReserva(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoAporte}>{salvandoAporte ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAporteInvestimento !== null && (
        <div className="modal-fundo" onClick={() => setModalAporteInvestimento(null)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>Aporte no Investimento</h3>
            </div>
            <form onSubmit={salvarAporteInvestimento}>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={formAporte.date} onChange={(e) => setFormAporte({ ...formAporte, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" min="0" value={formAporte.amountCents} onChange={(e) => setFormAporte({ ...formAporte, amountCents: e.target.value })} required />
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalAporteInvestimento(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoAporte}>{salvandoAporte ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalReserva && (
        <div className="modal-fundo" onClick={() => setModalReserva(false)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{reserve ? "Editar Reserva" : "Nova Reserva"}</h3>
            </div>
            <form onSubmit={salvarReserva}>
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={formReserva.name} onChange={(e) => setFormReserva({ ...formReserva, name: e.target.value })} required />
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalReserva(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvandoReserva}>{salvandoReserva ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={confirmarExclusaoReserva !== null}
        titulo="Excluir Reserva"
        mensagem="Tem certeza que deseja excluir a reserva? Todos os aportes serao removidos."
        aoConfirmar={excluirReserva}
        aoCancelar={() => setConfirmarExclusaoReserva(null)}
        confirmando={excluindo}
      />

      <ModalConfirmacao
        aberto={confirmarExclusaoInv !== null}
        titulo="Excluir Investimento"
        mensagem="Tem certeza que deseja excluir este investimento? Todos os aportes serao removidos."
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
