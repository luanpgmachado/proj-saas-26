import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalConfirmacao from "../components/ModalConfirmacao";

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  isCard: boolean;
  paidInMonth: boolean;
  closingDay: number | null;
  dueDay: number | null;
};

type FormData = {
  name: string;
  type: string;
  isCard: boolean;
  paidInMonth: boolean;
  closingDay: string;
  dueDay: string;
};

const emptyForm: FormData = { name: "", type: "pix", isCard: false, paidInMonth: true, closingDay: "", dueDay: "" };

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarDados = () => {
    api.getPaymentMethods().then(setMethods).catch(console.error);
  };

  useEffect(() => { carregarDados(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm(emptyForm);
    setModalAberto(true);
  };

  const abrirEditar = (m: PaymentMethod) => {
    setEditando(m);
    setForm({
      name: m.name,
      type: m.type,
      isCard: m.isCard,
      paidInMonth: m.paidInMonth,
      closingDay: m.closingDay?.toString() || "",
      dueDay: m.dueDay?.toString() || "",
    });
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const data = {
        name: form.name,
        type: form.type,
        isCard: form.isCard,
        paidInMonth: form.paidInMonth,
        closingDay: form.isCard && form.closingDay ? parseInt(form.closingDay) : null,
        dueDay: form.isCard && form.dueDay ? parseInt(form.dueDay) : null,
      };
      if (editando) {
        await api.updatePaymentMethod(editando.id, data);
      } else {
        await api.createPaymentMethod(data);
      }
      setModalAberto(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!confirmarExclusao) return;
    setExcluindo(true);
    try {
      await api.deletePaymentMethod(confirmarExclusao);
      setConfirmarExclusao(null);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const nonCards = methods.filter((m) => !m.isCard);
  const cards = methods.filter((m) => m.isCard);

  return (
    <div>
      <div className="barra-topo">
        <h2>Metodos de Pagamento</h2>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo Metodo</button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Metodos Gerais</h3>
        {nonCards.length === 0 ? (
          <p>Nenhum metodo cadastrado.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Pago no mes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {nonCards.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.type}</td>
                    <td>{m.paidInMonth ? "Sim" : "Nao"}</td>
                    <td className="text-right">
                      <button onClick={() => abrirEditar(m)} style={{ marginRight: 8 }}>Editar</button>
                      <button className="btn-danger" onClick={() => setConfirmarExclusao(m.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Cartoes de Credito</h3>
        {cards.length === 0 ? (
          <p>Nenhum cartao cadastrado.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Fechamento</th>
                  <th>Vencimento</th>
                  <th>Pago no mes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>Dia {m.closingDay}</td>
                    <td>Dia {m.dueDay}</td>
                    <td>{m.paidInMonth ? "Sim" : "Nao"}</td>
                    <td className="text-right">
                      <button onClick={() => abrirEditar(m)} style={{ marginRight: 8 }}>Editar</button>
                      <button className="btn-danger" onClick={() => setConfirmarExclusao(m.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="modal-fundo" onClick={() => setModalAberto(false)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <h3>{editando ? "Editar Metodo" : "Novo Metodo"}</h3>
            </div>
            <form onSubmit={salvar}>
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="debito">Debito</option>
                  <option value="credito">Credito</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.isCard} onChange={(e) => setForm({ ...form, isCard: e.target.checked })} />
                  {" "}E um cartao de credito
                </label>
              </div>
              {form.isCard && (
                <>
                  <div className="form-group">
                    <label>Dia de Fechamento</label>
                    <input type="number" min="1" max="31" value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Dia de Vencimento</label>
                    <input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.paidInMonth} onChange={(e) => setForm({ ...form, paidInMonth: e.target.checked })} />
                  {" "}Pago no mes
                </label>
              </div>
              <div className="modal-acoes">
                <button type="button" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={confirmarExclusao !== null}
        titulo="Excluir Metodo"
        mensagem="Tem certeza que deseja excluir este metodo de pagamento?"
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmarExclusao(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
