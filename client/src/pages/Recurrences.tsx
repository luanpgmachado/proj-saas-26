import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { PlayCircle, Plus, Repeat } from "lucide-react";

type Recurrence = {
  id: number;
  description: string;
  type: "entry" | "exit";
  group: "fixed" | "installment" | "entry";
  amountCents: number;
  categoryId: number | null;
  paymentMethodId: number | null;
  startDate: string;
  endDate: string | null;
  dayOfMonth: number;
  installmentTotal: number | null;
  status: "active" | "paused" | "canceled";
};

type Category = { id: number; name: string };
type PaymentMethod = { id: number; name: string };

const formatarMoeda = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

const formatarData = (data: string | null) => {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

const traduzirGrupo = (grupo: string) => {
  if (grupo === "fixed") return "Fixo";
  if (grupo === "installment") return "Parcelado";
  return "Entrada";
};

const traduzirStatus = (status: string) => {
  if (status === "active") return "Ativa";
  if (status === "paused") return "Pausada";
  return "Cancelada";
};

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Recurrences() {
  const [recorrencias, setRecorrencias] = useState<Recurrence[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [metodos, setMetodos] = useState<PaymentMethod[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [mostraFormulario, setMostraFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"entry" | "exit">("exit");
  const [grupo, setGrupo] = useState<"fixed" | "installment" | "entry">("fixed");
  const [valorReais, setValorReais] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [metodoId, setMetodoId] = useState<number | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [diaDoMes, setDiaDoMes] = useState(1);
  const [totalParcelas, setTotalParcelas] = useState<number | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const [confirmarGeracao, setConfirmarGeracao] = useState(false);

  useEffect(() => {
    carregarDados().catch(console.error);
  }, []);

  const carregarDados = async () => {
    const [recs, cats, mets] = await Promise.all([api.getRecurrences(), api.getCategories(), api.getPaymentMethods()]);
    setRecorrencias(recs);
    setCategorias(cats);
    setMetodos(mets);
  };

  const nomeCategoria = (id: number | null) => {
    if (!id) return "-";
    return categorias.find((c) => c.id === id)?.name ?? "-";
  };

  const nomeMetodo = (id: number | null) => {
    if (!id) return "-";
    return metodos.find((m) => m.id === id)?.name ?? "-";
  };

  const recorrenciasAtivas = useMemo(() => recorrencias.filter((r) => r.status === "active"), [recorrencias]);
  const totalMensalAtivo = useMemo(
    () => recorrenciasAtivas.reduce((acc, r) => acc + r.amountCents, 0),
    [recorrenciasAtivas]
  );

  const limparFormulario = () => {
    setDescricao("");
    setTipo("exit");
    setGrupo("fixed");
    setValorReais("");
    setCategoriaId(null);
    setMetodoId(null);
    setDataInicio("");
    setDataFim("");
    setDiaDoMes(1);
    setTotalParcelas(null);
    setEditandoId(null);
    setErroFormulario(null);
    setMostraFormulario(false);
  };

  const abrirNovaRecorrencia = () => {
    limparFormulario();
    setMostraFormulario(true);
  };

  const abrirEdicao = (rec: Recurrence) => {
    setEditandoId(rec.id);
    setDescricao(rec.description);
    setTipo(rec.type);
    setGrupo(rec.group);
    setValorReais((rec.amountCents / 100).toFixed(2).replace(".", ","));
    setCategoriaId(rec.categoryId);
    setMetodoId(rec.paymentMethodId);
    setDataInicio(rec.startDate);
    setDataFim(rec.endDate ?? "");
    setDiaDoMes(rec.dayOfMonth);
    setTotalParcelas(rec.installmentTotal);
    setErroFormulario(null);
    setMostraFormulario(true);
  };

  const validarFormulario = (): string | null => {
    if (!descricao.trim()) return "Descrição é obrigatória.";
    const valorNumerico = parseFloat(valorReais.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) return "Valor deve ser maior que zero.";
    if (!categoriaId) return "Categoria é obrigatória.";
    if (!metodoId) return "Método é obrigatório.";
    if (!dataInicio) return "Data de início é obrigatória.";
    if (diaDoMes < 1 || diaDoMes > 31) return "Dia do mês deve estar entre 1 e 31.";

    if (tipo === "entry" && grupo !== "entry") return "Para entradas, o grupo deve ser 'Entrada'.";
    if (tipo === "exit" && grupo === "entry") return "Para saídas, o grupo não pode ser 'Entrada'.";
    if (grupo === "installment") {
      if (!dataFim) return "Data fim é obrigatória para parcelados.";
      if (!totalParcelas || totalParcelas < 1) return "Total de parcelas é obrigatório para parcelados.";
    }
    return null;
  };

  const salvar = async () => {
    const erro = validarFormulario();
    if (erro) {
      setErroFormulario(erro);
      return;
    }
    setErroFormulario(null);
    setCarregando(true);
    setMensagem(null);
    try {
      const amountCents = Math.round(parseFloat(valorReais.replace(",", ".")) * 100);
      const payload: any = {
        description: descricao.trim(),
        type: tipo,
        group: grupo,
        amountCents,
        categoryId: categoriaId,
        paymentMethodId: metodoId,
        startDate: dataInicio,
        endDate: dataFim ? dataFim : null,
        dayOfMonth: diaDoMes,
        installmentTotal: grupo === "installment" ? totalParcelas : null,
      };

      if (!editandoId) payload.status = "active";

      if (editandoId) {
        await api.updateRecurrence(editandoId, payload);
      } else {
        await api.createRecurrence(payload);
      }

      await carregarDados();
      setMensagem(editandoId ? "Recorrência atualizada." : "Recorrência criada.");
      limparFormulario();
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao salvar recorrência.");
    } finally {
      setCarregando(false);
    }
  };

  const alterarStatus = async (id: number, status: "active" | "paused" | "canceled") => {
    setCarregando(true);
    setMensagem(null);
    try {
      await api.updateRecurrence(id, { status });
      await carregarDados();
      setMensagem("Status atualizado.");
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao atualizar status.");
    } finally {
      setCarregando(false);
    }
  };

  const gerarMes = async () => {
    setConfirmarGeracao(false);
    setCarregando(true);
    setMensagem(null);
    try {
      const transacoes = await api.generateRecurrences(mesSelecionado);
      setMensagem(`${transacoes.length} transação(ões) criada(s) para ${mesSelecionado}.`);
    } catch {
      setMensagem("Erro ao gerar transações.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <CabecalhoConteudo
        titulo="Recorrências"
        subtitulo="Lançamentos automáticos mensais"
        seletorDireita={
          <input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
            aria-label="Mês para gerar"
          />
        }
        acaoDireita={
          <div className="flex gap-2">
            <button
              type="button"
              className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring flex items-center gap-2"
              onClick={() => setConfirmarGeracao(true)}
              disabled={carregando}
            >
              <PlayCircle className="w-4 h-4" />
              Gerar Mês
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring flex items-center gap-2"
              onClick={abrirNovaRecorrencia}
            >
              <Plus className="w-4 h-4" />
              Nova Recorrência
            </button>
          </div>
        }
      />

      <div className="surface-card-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-primary" />
          <span className="text-sm">
            <span className="font-semibold">{recorrenciasAtivas.length}</span> recorrências ativas
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Total mensal estimado:{" "}
          <span className="font-semibold text-foreground tabular-nums">{formatarMoeda(totalMensalAtivo)}</span>
        </span>
      </div>

      {mensagem ? <div className="surface-card-sm p-4 mb-6 text-sm text-muted-foreground">{mensagem}</div> : null}

      {mostraFormulario ? (
        <div className="surface-card p-6 mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-semibold">
              {editandoId ? "Editar Recorrência" : "Nova Recorrência"}
            </h3>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth focus-ring rounded-md px-2 py-1"
              onClick={limparFormulario}
            >
              Fechar
            </button>
          </div>

          {erroFormulario ? (
            <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium">
              {erroFormulario}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2">
              <span className="block text-xs font-medium text-muted-foreground mb-1">Descrição</span>
              <input
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Aluguel, Netflix..."
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Tipo</span>
              <select
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={tipo}
                onChange={(e) => {
                  const novo = e.target.value as "entry" | "exit";
                  setTipo(novo);
                  if (novo === "entry") setGrupo("entry");
                  if (novo === "exit" && grupo === "entry") setGrupo("fixed");
                }}
              >
                <option value="exit">Saída</option>
                <option value="entry">Entrada</option>
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Grupo</span>
              <select
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value as any)}
                disabled={tipo === "entry"}
              >
                <option value="fixed">Fixo</option>
                <option value="installment">Parcelado</option>
                <option value="entry">Entrada</option>
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$)</span>
              <input
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                value={valorReais}
                onChange={(e) => setValorReais(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Categoria</span>
              <select
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={categoriaId ?? ""}
                onChange={(e) => setCategoriaId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Método</span>
              <select
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={metodoId ?? ""}
                onChange={(e) => setMetodoId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione</option>
                {metodos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Data início</span>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">
                {grupo === "installment" ? "Data fim" : "Data fim (opcional)"}
              </span>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Dia do mês</span>
              <input
                type="number"
                min={1}
                max={31}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                value={diaDoMes}
                onChange={(e) => setDiaDoMes(parseInt(e.target.value) || 1)}
              />
            </label>

            {grupo === "installment" ? (
              <label>
                <span className="block text-xs font-medium text-muted-foreground mb-1">Total de parcelas</span>
                <input
                  type="number"
                  min={1}
                  className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
                  value={totalParcelas ?? ""}
                  onChange={(e) => setTotalParcelas(e.target.value ? parseInt(e.target.value) : null)}
                />
              </label>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              type="button"
              className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
              onClick={limparFormulario}
              disabled={carregando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring"
              onClick={salvar}
              disabled={carregando}
            >
              {carregando ? "Salvando..." : editandoId ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left font-medium px-5 py-3">Descrição</th>
                <th className="text-left font-medium px-5 py-3">Categoria</th>
                <th className="text-left font-medium px-5 py-3">Método</th>
                <th className="text-left font-medium px-5 py-3">Dia</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-right font-medium px-5 py-3">Valor</th>
                <th className="text-right font-medium px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {recorrencias.map((rec, idx) => (
                <tr
                  key={rec.id}
                  className={[
                    "group hover:bg-muted/30 transition-smooth",
                    idx < recorrencias.length - 1 ? "border-b border-border" : "",
                    rec.status !== "active" ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <td className="px-5 py-3.5 font-medium">{rec.description}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{nomeCategoria(rec.categoryId)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{nomeMetodo(rec.paymentMethodId)}</td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{rec.dayOfMonth}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={[
                        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium",
                        rec.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {traduzirStatus(rec.status)}
                    </span>
                    <span className="sr-only">{traduzirGrupo(rec.group)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-destructive">
                    {formatarMoeda(rec.amountCents)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-smooth">
                      <button
                        type="button"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-smooth focus-ring rounded-md px-2 py-1"
                        onClick={() => abrirEdicao(rec)}
                      >
                        Editar
                      </button>

                      {rec.status === "active" ? (
                        <>
                          <button
                            type="button"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-smooth focus-ring rounded-md px-2 py-1"
                            onClick={() => alterarStatus(rec.id, "paused")}
                          >
                            Pausar
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-muted-foreground hover:text-destructive transition-smooth focus-ring rounded-md px-2 py-1"
                            onClick={() => alterarStatus(rec.id, "canceled")}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : rec.status === "paused" ? (
                        <>
                          <button
                            type="button"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-smooth focus-ring rounded-md px-2 py-1"
                            onClick={() => alterarStatus(rec.id, "active")}
                          >
                            Reativar
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-muted-foreground hover:text-destructive transition-smooth focus-ring rounded-md px-2 py-1"
                            onClick={() => alterarStatus(rec.id, "canceled")}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-smooth focus-ring rounded-md px-2 py-1"
                          onClick={() => alterarStatus(rec.id, "active")}
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {recorrencias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma recorrência cadastrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ModalConfirmacao
        aberto={confirmarGeracao}
        titulo="Gerar Lançamentos do Mês"
        mensagem={`Isso criará lançamentos para ${mesSelecionado}. Deseja confirmar a geração?`}
        aoConfirmar={gerarMes}
        aoCancelar={() => setConfirmarGeracao(false)}
        confirmando={carregando}
        textoConfirmar="Confirmar geração"
        textoCancelar="Cancelar"
        varianteConfirmar="primario"
      />
    </div>
  );
}
