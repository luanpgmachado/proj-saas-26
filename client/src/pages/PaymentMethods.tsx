import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import {
  Plus,
  CreditCard,
  Wallet,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Banknote,
} from "lucide-react";

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

const emptyForm: FormData = {
  name: "",
  type: "cash",
  isCard: false,
  paidInMonth: true,
  closingDay: "",
  dueDay: "",
};

const rotuloTipo = (tipo: string) => {
  if (tipo === "cash") return "Dinheiro";
  if (tipo === "transfer") return "Transferência";
  if (tipo === "debit") return "Débito";
  if (tipo === "credit_card") return "Cartão de crédito";
  return tipo.toUpperCase();
};

function gradienteCartao(nome: string, indice: number) {
  const chave = nome.toLowerCase();
  if (chave.includes("nubank")) return "from-purple-600 to-purple-800";
  if (chave.includes("inter")) return "from-orange-500 to-orange-700";
  if (chave.includes("c6")) return "from-gray-700 to-gray-900";
  const outros = ["from-blue-600 to-blue-800", "from-emerald-600 to-emerald-800", "from-slate-700 to-slate-900"];
  return outros[indice % outros.length];
}

const iconeMetodo = (m: PaymentMethod) => {
  if (m.isCard) return CreditCard;
  if (m.type === "cash") return Banknote;
  if (m.type === "transfer") return ArrowRightLeft;
  return Wallet;
};

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

  useEffect(() => {
    carregarDados();
  }, []);

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

  const cards = useMemo(() => methods.filter((m) => m.isCard), [methods]);
  const nonCards = useMemo(() => methods.filter((m) => !m.isCard), [methods]);

  return (
    <div>
      <CabecalhoConteudo
        titulo="Métodos de Pagamento"
        subtitulo="Gerencie seus cartões e contas"
        acaoDireita={
          <button
            type="button"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring flex items-center gap-2"
            onClick={abrirNovo}
          >
            <Plus className="w-4 h-4" />
            Novo Método
          </button>
        }
      />

      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          Cartões de Crédito
        </h3>
        {cards.length === 0 ? (
          <div className="surface-card-sm p-4 text-sm text-muted-foreground">Nenhum cartão cadastrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                className={[
                  "relative rounded-xl p-5 text-white bg-gradient-to-br overflow-hidden group surface-card-hover",
                  gradienteCartao(card.name, idx),
                ].join(" ")}
                style={{ aspectRatio: "1.58 / 1" }}
              >
                <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                  <button
                    type="button"
                    onClick={() => abrirEditar(card)}
                    className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-smooth focus-ring"
                    aria-label={`Editar ${card.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarExclusao(card.id)}
                    className="p-1.5 rounded-md bg-white/20 hover:bg-red-500/50 transition-smooth focus-ring"
                    aria-label={`Excluir ${card.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <div>
                    <p className="text-xs font-medium opacity-80">{rotuloTipo("credit_card")}</p>
                    <p className="text-lg font-semibold mt-1">{card.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs opacity-80">
                      Fechamento: {card.closingDay ? `dia ${card.closingDay}` : "—"} · Vencimento:{" "}
                      {card.dueDay ? `dia ${card.dueDay}` : "—"}
                    </p>
                    <p className="text-xs opacity-80">Pago no mês: {card.paidInMonth ? "Sim" : "Não"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          Contas e Outros
        </h3>
        {nonCards.length === 0 ? (
          <div className="surface-card-sm p-4 text-sm text-muted-foreground">Nenhum método cadastrado.</div>
        ) : (
          <div className="surface-card overflow-hidden">
            {nonCards.map((method, i) => {
              const Icone = iconeMetodo(method);
              return (
                <div
                  key={method.id}
                  className="flex items-center justify-between px-5 py-4 group hover:bg-muted/30 transition-smooth"
                  style={{ borderBottom: i < nonCards.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{method.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{rotuloTipo(method.type)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-smooth">
                    <button
                      type="button"
                      onClick={() => abrirEditar(method)}
                      className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
                      aria-label={`Editar ${method.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmarExclusao(method.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth focus-ring"
                      aria-label={`Excluir ${method.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(false)}>
          <div className="surface-card w-full max-w-[560px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold">{editando ? "Editar Método" : "Novo Método"}</h3>
            </div>
            <form onSubmit={salvar} className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="sm:col-span-2">
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Tipo</span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                  >
                    <option value="cash">Dinheiro</option>
                    <option value="transfer">Transferência</option>
                    <option value="debit">Débito</option>
                    <option value="credit_card">Cartão de crédito</option>
                    <option value="other">Outro</option>
                  </select>
                </label>

                <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isCard}
                    onChange={(e) => setForm({ ...form, isCard: e.target.checked })}
                  />
                  <span>É um cartão de crédito</span>
                </label>

                {form.isCard ? (
                  <>
                    <label>
                      <span className="block text-xs font-medium text-muted-foreground mb-1">Dia de fechamento</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.closingDay}
                        onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
                        className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                      />
                    </label>
                    <label>
                      <span className="block text-xs font-medium text-muted-foreground mb-1">Dia de vencimento</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.dueDay}
                        onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                        className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                      />
                    </label>
                  </>
                ) : null}

                <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.paidInMonth}
                    onChange={(e) => setForm({ ...form, paidInMonth: e.target.checked })}
                  />
                  <span>Pago no mês</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ModalConfirmacao
        aberto={confirmarExclusao !== null}
        titulo="Excluir Método"
        mensagem="Tem certeza que deseja excluir este método de pagamento?"
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmarExclusao(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
