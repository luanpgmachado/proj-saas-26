import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

type Categoria = {
  id: number;
  name: string;
  kind: "income" | "expense";
  monthlyBudgetCents: number | null;
};

type Transacao = {
  id: number;
  month: string;
  categoryId: number | null;
};

const mesAtual = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatarMoeda = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

const parsearCentavosDeTexto = (valor: string) => {
  const somenteDigitos = valor.replace(/\D/g, "");
  return somenteDigitos ? parseInt(somenteDigitos, 10) : 0;
};

const cores = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 67%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(215, 15%, 65%)",
];

export default function Categories() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contagemPorId, setContagemPorId] = useState<Record<number, number>>({});
  const [month] = useState(mesAtual);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"income" | "expense">("expense");
  const [orcamentoCentavos, setOrcamentoCentavos] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [confirmarExclusao, setConfirmarExclusao] = useState<Categoria | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = async () => {
    const cats = await api.getCategories();
    setCategorias(cats);

    // Contagem opcional (mês atual) sem novo endpoint.
    try {
      const transacoes: Transacao[] = await api.getTransactions({ month });
      const mapa: Record<number, number> = {};
      for (const t of transacoes) {
        if (!t.categoryId) continue;
        mapa[t.categoryId] = (mapa[t.categoryId] ?? 0) + 1;
      }
      setContagemPorId(mapa);
    } catch {
      setContagemPorId({});
    }
  };

  useEffect(() => {
    carregar().catch(console.error);
  }, []);

  const maxContagem = useMemo(() => {
    const valores = Object.values(contagemPorId);
    return valores.length ? Math.max(...valores) : 0;
  }, [contagemPorId]);

  const abrirNovo = () => {
    setErro("");
    setEditando(null);
    setNome("");
    setTipo("expense");
    setOrcamentoCentavos(null);
    setModalAberto(true);
  };

  const abrirEditar = (c: Categoria) => {
    setErro("");
    setEditando(c);
    setNome(c.name);
    setTipo(c.kind);
    setOrcamentoCentavos(c.monthlyBudgetCents ?? null);
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const payload = {
        name: nome.trim(),
        kind: tipo,
        monthlyBudgetCents: orcamentoCentavos,
      };
      if (editando) {
        await api.updateCategory(editando.id, payload);
      } else {
        await api.createCategory(payload);
      }
      setModalAberto(false);
      await carregar();
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Erro ao salvar categoria.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!confirmarExclusao) return;
    setExcluindo(true);
    try {
      await api.deleteCategory(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await carregar();
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Erro ao excluir categoria.";
      setErro(msg);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <CabecalhoConteudo
        titulo="Categorias"
        subtitulo="Organize seus lançamentos por tipo"
        acaoDireita={
          <button
            type="button"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring flex items-center gap-2"
            onClick={abrirNovo}
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        }
      />

      {erro ? (
        <div className="surface-card-sm p-4 mb-6 text-sm text-destructive border border-destructive/20">
          {erro}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categorias.map((cat, idx) => {
          const cor = cores[idx % cores.length];
          const contagem = contagemPorId[cat.id] ?? 0;
          const largura = maxContagem ? Math.min(100, Math.round((contagem / maxContagem) * 100)) : 0;
          const inicial = cat.name.trim().slice(0, 1).toUpperCase() || "C";

          return (
            <div key={cat.id} className="surface-card surface-card-hover p-5 group cursor-default">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ background: `${cor}15`, color: cor }}
                    aria-hidden="true"
                  >
                    {inicial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contagem} {contagem === 1 ? "lançamento" : "lançamentos"} ·{" "}
                      {cat.kind === "income" ? "Receita" : "Despesa"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-smooth">
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
                    onClick={() => abrirEditar(cat)}
                    aria-label={`Editar ${cat.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth focus-ring"
                    onClick={() => setConfirmarExclusao(cat)}
                    aria-label={`Excluir ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${largura}%`, background: cor }} />
              </div>

              {cat.monthlyBudgetCents ? (
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Tags className="w-3.5 h-3.5" />
                  <span>Orçamento: <span className="font-medium tabular-nums text-foreground">{formatarMoeda(cat.monthlyBudgetCents)}</span></span>
                </div>
              ) : null}
            </div>
          );
        })}

        {categorias.length === 0 ? (
          <div className="surface-card-sm p-6 text-sm text-muted-foreground col-span-full">
            Nenhuma categoria cadastrada.
          </div>
        ) : null}
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(false)}>
          <div className="surface-card w-full max-w-[420px] p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold">{editando ? "Editar Categoria" : "Nova Categoria"}</h3>
            </div>

            <form onSubmit={salvar} className="px-6 py-5">
              <div className="space-y-4">
                <label>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Nome</span>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Investimentos, Pets..."
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                  />
                </label>

                <label>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Tipo</span>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </label>

                <label>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">Orçamento mensal (R$)</span>
                  <input
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={orcamentoCentavos === null ? "" : formatarMoeda(orcamentoCentavos)}
                    onChange={(e) => {
                      const centavos = parsearCentavosDeTexto(e.target.value);
                      setOrcamentoCentavos(e.target.value.trim() ? centavos : null);
                    }}
                    className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                  />
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
                  {salvando ? "Salvando..." : "Salvar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ModalConfirmacao
        aberto={confirmarExclusao !== null}
        titulo="Excluir Categoria"
        mensagem={
          confirmarExclusao
            ? `Tem certeza que deseja excluir a categoria "${confirmarExclusao.name}"?`
            : "Tem certeza que deseja excluir esta categoria?"
        }
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmarExclusao(null)}
        confirmando={excluindo}
      />
    </div>
  );
}

