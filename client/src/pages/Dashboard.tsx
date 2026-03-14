import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import { CartaoMetrica } from "../components/CartaoMetrica";
import ModalLancamento, { type DadosLancamento } from "../components/ModalLancamento";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

const formatarMoeda = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

const mesParaRotulo = (mes: string) => {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${nomes[(numeroMes || 1) - 1] ?? "Mês"} ${ano}`;
};

const formatarDiaMes = (dataISO: string) => {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
};

const paleta = [
  "hsl(221, 83%, 53%)", // azul
  "hsl(142, 71%, 45%)", // verde
  "hsl(38, 92%, 50%)", // amarelo
  "hsl(280, 67%, 55%)", // roxo
  "hsl(0, 84%, 60%)", // vermelho
  "hsl(215, 15%, 65%)", // cinza
];

type ResumoMes = {
  entriesCents: number;
  exitsCents: number;
  paidExitsCents: number;
  balanceCents: number;
  realBalanceCents: number;
};

type GastoCategoria = {
  categoryId: number;
  categoryName: string;
  spentCents: number;
  budgetCents: number | null;
};

type Transacao = {
  id: number;
  date: string;
  description: string;
  type: "entry" | "exit";
  amountCents: number;
  categoryId: number | null;
  paymentMethodId: number | null;
  isPaid: boolean;
};

type Categoria = { id: number; name: string };

export default function Dashboard() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summary, setSummary] = useState<ResumoMes>({
    entriesCents: 0,
    exitsCents: 0,
    paidExitsCents: 0,
    balanceCents: 0,
    realBalanceCents: 0,
  });
  const [categorySpend, setCategorySpend] = useState<GastoCategoria[]>([]);
  const [transacoesSaida, setTransacoesSaida] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<any | null>(null);

  useEffect(() => {
    api.getCategories().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    api.getMonthSummary(month).then(setSummary).catch(console.error);
    api.getCategorySpend(month).then(setCategorySpend).catch(console.error);
    api.getTransactions({ month, type: "exit" }).then(setTransacoesSaida).catch(console.error);
  }, [month]);

  const mapaCategoriaPorId = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const c of categorias) mapa.set(c.id, c.name);
    return mapa;
  }, [categorias]);

  const proximosVencimentos = useMemo(() => {
    return [...transacoesSaida]
      .filter((t) => t.type === "exit" && !t.isPaid)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);
  }, [transacoesSaida]);

  const segmentos = useMemo(() => {
    const itens = categorySpend.filter((c) => c.spentCents > 0);
    const total = itens.reduce((acc, c) => acc + c.spentCents, 0);
    if (!total) return { css: "conic-gradient(#e5e7eb 0 360deg)", itens: [] as any[] };

    let acumulado = 0;
    const partes = itens.map((c, idx) => {
      const proporcao = c.spentCents / total;
      const inicio = acumulado;
      acumulado += proporcao;
      const fim = acumulado;
      return {
        ...c,
        cor: paleta[idx % paleta.length],
        inicio,
        fim,
      };
    });

    const stops = partes
      .map((p) => `${p.cor} ${Math.round(p.inicio * 360)}deg ${Math.round(p.fim * 360)}deg`)
      .join(", ");

    return { css: `conic-gradient(${stops})`, itens: partes };
  }, [categorySpend]);

  const changeMonth = (delta: number) => {
    const [year, m] = month.split("-").map(Number);
    const date = new Date(year, m - 1 + delta, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const abrirModalNovo = () => {
    setTransacaoEditando(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setTransacaoEditando(null);
  };

  const recarregarDados = async () => {
    const [novoResumo, novosGastos, novasSaidas] = await Promise.all([
      api.getMonthSummary(month),
      api.getCategorySpend(month),
      api.getTransactions({ month, type: "exit" }),
    ]);
    setSummary(novoResumo);
    setCategorySpend(novosGastos);
    setTransacoesSaida(novasSaidas);
  };

  const aoSalvarLancamento = async (dados: DadosLancamento) => {
    if (transacaoEditando) {
      await api.updateTransaction(transacaoEditando.id, dados);
    } else {
      await api.createTransaction(dados);
    }
    await recarregarDados();
  };

  return (
    <div>
      <CabecalhoConteudo
        titulo="Dashboard"
        subtitulo="Visão geral das suas finanças"
        seletorDireita={
          <div className="surface-card-sm px-2 py-1.5 flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-md hover:bg-secondary text-muted-foreground transition-smooth"
              onClick={() => changeMonth(-1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 mx-auto" />
            </button>
            <span className="text-sm font-medium tabular-nums min-w-[120px] text-center">{mesParaRotulo(month)}</span>
            <button
              type="button"
              className="w-8 h-8 rounded-md hover:bg-secondary text-muted-foreground transition-smooth"
              onClick={() => changeMonth(1)}
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          </div>
        }
        acaoDireita={
          <button
            type="button"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring"
            onClick={abrirModalNovo}
          >
            + Novo Lançamento
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CartaoMetrica
          titulo="Entradas"
          valor={formatarMoeda(summary.entriesCents)}
          variacao="Leitura do mês selecionado"
          tipoVariacao="neutra"
          Icone={TrendingUp}
          classIcone="bg-success/10 text-success"
        />
        <CartaoMetrica
          titulo="Saídas"
          valor={formatarMoeda(summary.exitsCents)}
          variacao="Total de despesas do mês"
          tipoVariacao="neutra"
          Icone={TrendingDown}
          classIcone="bg-destructive/10 text-destructive"
        />
        <CartaoMetrica
          titulo="Saldo Real"
          valor={formatarMoeda(summary.realBalanceCents)}
          variacao="Já pago/recebido"
          tipoVariacao="neutra"
          Icone={CheckCircle2}
          classIcone="bg-primary/10 text-primary"
        />
        <CartaoMetrica
          titulo="Saldo Projetado"
          valor={formatarMoeda(summary.balanceCents)}
          variacao="Incluindo pendências"
          tipoVariacao="neutra"
          Icone={Wallet}
          classIcone="bg-warning/10 text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 surface-card p-6">
          <h3 className="text-sm font-semibold mb-4">Distribuição por Categoria</h3>
          <div className="h-52 flex items-center justify-center">
            <div className="relative w-44 h-44 rounded-full" style={{ background: segmentos.css }}>
              <div className="absolute inset-6 rounded-full bg-surface shadow-card-sm" aria-hidden="true" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {segmentos.itens.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2">Sem gastos por categoria no mês.</p>
            ) : (
              segmentos.itens.map((cat: any) => (
                <div key={cat.categoryId} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.cor }} />
                  <span className="text-muted-foreground truncate">{cat.categoryName}</span>
                  <span className="ml-auto tabular-nums font-medium">{formatarMoeda(cat.spentCents).replace("R$", "R$")}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Próximos Vencimentos</h3>
            <span className="text-xs text-muted-foreground">{proximosVencimentos.length} pendentes</span>
          </div>
          <div className="space-y-0">
            {proximosVencimentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência no mês selecionado.</p>
            ) : (
              proximosVencimentos.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 group hover:bg-muted/30 -mx-3 px-3 rounded-md transition-smooth"
                  style={{
                    borderBottom: idx < proximosVencimentos.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(t.categoryId ? mapaCategoriaPorId.get(t.categoryId) : null) ?? "Sem categoria"} · Vence{" "}
                        {formatarDiaMes(t.date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-destructive">
                    {formatarMoeda(t.amountCents)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="surface-card-sm p-4 mt-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-4 h-4 text-success" />
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe pendências e mantenha o controle do mês com previsibilidade.
        </p>
      </div>

      <ModalLancamento
        aberto={modalAberto}
        aoFechar={fecharModal}
        aoSalvar={aoSalvarLancamento}
        transacaoInicial={transacaoEditando}
      />
    </div>
  );
}
