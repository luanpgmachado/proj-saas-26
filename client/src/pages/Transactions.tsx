import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { api } from "../lib/api";
import ModalLancamento, { DadosLancamento } from "../components/ModalLancamento";
import ModalConfirmacao from "../components/ModalConfirmacao";
import type { Transacao } from "../model/transacao";
import { alternarPagoOptimista } from "../service/transacoes.service";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import { useCompetenciaMensal } from "../context/CompetenciaMensalContext";
import { Search, Plus, Pencil, Trash2, Check } from "lucide-react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

type Categoria = {
  id: number;
  name: string;
  kind: "income" | "expense";
  monthlyBudgetCents: number | null;
};

type MetodoPagamento = { id: number; name: string };

type ChipStatus = "todos" | "pagos" | "pendentes" | "atrasados";

const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function Transactions() {
  const { competenciaMensal } = useCompetenciaMensal();
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [methods, setMethods] = useState<MetodoPagamento[]>([]);
  const [filters, setFilters] = useState({ categoryId: "", methodId: "", type: "" });

  const [chip, setChip] = useState<ChipStatus>("todos");
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [atualizandoPagoPorId, setAtualizandoPagoPorId] = useState<Record<number, boolean>>({});
  const [erroPagoPorId, setErroPagoPorId] = useState<Record<number, string>>({});

  const carregarTransacoes = () => {
    const params: Record<string, string> = { month: competenciaMensal };
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
    carregarTransacoes();
  }, [filters, competenciaMensal]);

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

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const hoje = hojeISO();

    return transactions.filter((t) => {
      if (termo && !t.description.toLowerCase().includes(termo)) return false;

      if (chip === "pagos") {
        return t.type === "exit" && !!t.isPaid;
      }
      if (chip === "pendentes") {
        return t.type === "exit" && !t.isPaid;
      }
      if (chip === "atrasados") {
        return t.type === "exit" && !t.isPaid && String(t.date) < hoje;
      }
      return true;
    });
  }, [transactions, busca, chip]);

  const resumoTotais = useMemo(() => {
    return listaFiltrada.reduce(
      (acc, t) => {
        if (t.type === "entry") {
          acc.totalGeralCents += t.amountCents;
        } else {
          acc.totalGeralCents -= t.amountCents;
          if (t.isPaid) acc.totalPagoCents += t.amountCents;
        }
        return acc;
      },
      { totalGeralCents: 0, totalPagoCents: 0 },
    );
  }, [listaFiltrada]);

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
    setTransacaoEditando(null);
    carregarTransacoes();
  };

  const excluir = async () => {
    if (!confirmarExclusao) return;
    setExcluindo(true);
    try {
      await api.deleteTransaction(confirmarExclusao);
      setConfirmarExclusao(null);
      carregarTransacoes();
    } catch (err) {
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const aoAlternarPago = async (id: number, marcar: boolean) => {
    setAtualizandoPagoPorId((prev) => ({ ...prev, [id]: true }));
    setErroPagoPorId((prev) => ({ ...prev, [id]: "" }));
    try {
      await alternarPagoOptimista({
        id,
        marcar,
        transacoes: transactions,
        setTransacoes: setTransactions,
        atualizarTransacao: (transacaoId, patch) => api.updateTransaction(transacaoId, patch),
      });
    } catch (err: any) {
      const mensagem = err?.message ? String(err.message) : "Erro ao atualizar.";
      setErroPagoPorId((prev) => ({ ...prev, [id]: mensagem }));
    } finally {
      setAtualizandoPagoPorId((prev) => ({ ...prev, [id]: false }));
    }
  };

  const limparFiltros = () => setFilters({ categoryId: "", methodId: "", type: "" });

  const chips: { label: string; value: ChipStatus }[] = [
    { label: "Todos", value: "todos" },
    { label: "Pagos", value: "pagos" },
    { label: "Pendentes", value: "pendentes" },
    { label: "Atrasados", value: "atrasados" },
  ];

  const classeTotalGeral =
    resumoTotais.totalGeralCents > 0
      ? "text-success"
      : resumoTotais.totalGeralCents < 0
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div>
      <CabecalhoConteudo
        titulo="Lançamentos"
        subtitulo="Gerencie suas receitas e despesas"
        acaoDireita={
          <button
            type="button"
            onClick={abrirNovo}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        }
      />

      <div className="surface-card-sm p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1.5">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setChip(c.value)}
              className={[
                "px-3 py-1.5 rounded-md text-xs font-medium transition-smooth",
                chip === c.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lançamento..."
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-input text-sm focus-ring"
          />
        </div>
      </div>

      <div className="surface-card-sm p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Geral</p>
          <p className={`text-base font-semibold tabular-nums ${classeTotalGeral}`}>
            {formatCurrency(resumoTotais.totalGeralCents)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Pago</p>
          <p className="text-base font-semibold tabular-nums text-success">
            {formatCurrency(resumoTotais.totalPagoCents)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Resumo da lista filtrada visível.
        </p>
      </div>

      <div className="surface-card-sm p-3 mb-6 flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <label className="text-sm">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Categoria</span>
            <select
              className="w-full h-9 rounded-md bg-surface border border-input px-3 text-sm focus-ring"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Método</span>
            <select
              className="w-full h-9 rounded-md bg-surface border border-input px-3 text-sm focus-ring"
              value={filters.methodId}
              onChange={(e) => setFilters({ ...filters, methodId: e.target.value })}
            >
              <option value="">Todos</option>
              {methods.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Tipo</span>
            <select
              className="w-full h-9 rounded-md bg-surface border border-input px-3 text-sm focus-ring"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="entry">Entrada</option>
              <option value="exit">Saída</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 justify-between lg:justify-end">
          <Link
            href="/categories"
            className="text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Gerenciar categorias
          </Link>
          <button
            type="button"
            className="h-9 px-3 rounded-md border border-input bg-surface text-sm text-foreground hover:bg-secondary transition-smooth focus-ring"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {listaFiltrada.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum lançamento encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left font-medium px-5 py-3">Data</th>
                  <th className="text-left font-medium px-5 py-3">Descrição</th>
                  <th className="text-left font-medium px-5 py-3">Tipo</th>
                  <th className="text-left font-medium px-5 py-3">Categoria</th>
                  <th className="text-left font-medium px-5 py-3">Método</th>
                  <th className="text-right font-medium px-5 py-3">Valor</th>
                  <th className="text-center font-medium px-5 py-3 w-24">Pago</th>
                  <th className="text-right font-medium px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((t, idx) => {
                  const pago = t.type === "exit" && !!t.isPaid;
                  const hoje = hojeISO();
                  const atrasado = t.type === "exit" && !t.isPaid && String(t.date) < hoje;
                  const pendente = t.type === "exit" && !t.isPaid;

                  return (
                    <tr
                      key={t.id}
                      className={[
                        "group transition-smooth",
                        idx < listaFiltrada.length - 1 ? "border-b" : "",
                        "border-border",
                        "hover:bg-muted/30",
                        !pago && atrasado ? "bg-destructive/5" : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{t.date}</td>
                      <td className="px-5 py-3.5 font-medium">{t.description}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {t.type === "entry" ? "Entrada" : "Saída"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {t.categoryId ? nomeCategoriaPorId.get(t.categoryId) ?? "-" : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {t.paymentMethodId ? nomeMetodoPorId.get(t.paymentMethodId) ?? "-" : "-"}
                      </td>
                      <td
                        className={[
                          "px-5 py-3.5 text-right tabular-nums font-semibold",
                          pago && t.type === "exit"
                            ? "text-muted-foreground line-through"
                            : t.type === "entry"
                            ? "text-success"
                            : "text-destructive",
                        ].join(" ")}
                      >
                        {t.type === "entry" ? "+" : "-"} {formatCurrency(t.amountCents)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {t.type === "exit" ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={!!t.isPaid}
                                disabled={!!atualizandoPagoPorId[t.id]}
                                onChange={(e) => aoAlternarPago(t.id, e.target.checked)}
                                aria-label={`Marcar ${t.description} como pago`}
                              />
                              <span className="sr-only">
                                {pago ? "Pago" : pendente ? "Pendente" : "Status"}
                              </span>
                            </label>
                            {erroPagoPorId[t.id] ? (
                              <div className="text-[11px] leading-tight text-destructive max-w-[140px]">
                                {erroPagoPorId[t.id]}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-smooth">
                          {t.type === "exit" ? (
                            <button
                              type="button"
                              onClick={() => aoAlternarPago(t.id, !t.isPaid)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-success transition-smooth focus-ring"
                              title="Alternar pago"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => abrirEditar(t)}
                            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmarExclusao(t.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth focus-ring"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        titulo="Excluir Lançamento"
        mensagem="Tem certeza que deseja excluir este lançamento?"
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmarExclusao(null)}
        confirmando={excluindo}
      />
    </div>
  );
}
