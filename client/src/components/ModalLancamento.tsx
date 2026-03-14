import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { X } from "lucide-react";

export type DadosLancamento = {
  description: string;
  amountCents: number;
  type: "entry" | "exit";
  group: "fixed" | "variable" | "installment" | "entry";
  date: string;
  categoryId: number;
  paymentMethodId: number;
};

type TransacaoExistente = {
  id: number;
  description: string;
  amountCents: number;
  type: "entry" | "exit";
  group: "fixed" | "variable" | "installment" | "entry";
  date: string;
  categoryId: number;
  paymentMethodId: number;
};

type ModalLancamentoProps = {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: DadosLancamento) => Promise<void>;
  transacaoInicial?: TransacaoExistente | null;
};

const formatarMoeda = (centavos: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
};

const obterDataHoje = () => {
  return new Date().toISOString().slice(0, 10);
};

export default function ModalLancamento({ aberto, aoFechar, aoSalvar, transacaoInicial }: ModalLancamentoProps) {
  const [descricao, setDescricao] = useState("");
  const [valorCentavos, setValorCentavos] = useState(0);
  const [tipo, setTipo] = useState<"entry" | "exit">("exit");
  const [grupo, setGrupo] = useState<"fixed" | "variable" | "installment" | "entry">("fixed");
  const [data, setData] = useState(obterDataHoje);
  const [categoriaId, setCategoriaId] = useState("");
  const [metodoPagamentoId, setMetodoPagamentoId] = useState("");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [metodosPagamento, setMetodosPagamento] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    if (transacaoInicial) {
      setDescricao(transacaoInicial.description);
      setValorCentavos(transacaoInicial.amountCents);
      setTipo(transacaoInicial.type);
      setGrupo(transacaoInicial.group);
      setData(transacaoInicial.date);
      setCategoriaId(String(transacaoInicial.categoryId));
      setMetodoPagamentoId(String(transacaoInicial.paymentMethodId));
    } else {
      setDescricao("");
      setValorCentavos(0);
      setTipo("exit");
      setGrupo("fixed");
      setData(obterDataHoje());
      setCategoriaId("");
      setMetodoPagamentoId("");
    }
    setErro("");
  }, [aberto, transacaoInicial]);

  useEffect(() => {
    if (!aberto) return;
    api.getCategories().then(setCategorias).catch(console.error);
    api.getPaymentMethods().then(setMetodosPagamento).catch(console.error);
  }, [aberto]);

  if (!aberto) return null;

  const textoValor = valorCentavos > 0 ? formatarMoeda(valorCentavos) : "";
  const podeSalvar =
    descricao.trim().length > 0 &&
    valorCentavos > 0 &&
    data &&
    categoriaId &&
    metodoPagamentoId;

  const aoAlterarValor = (valor: string) => {
    const somenteDigitos = valor.replace(/\D/g, "");
    const centavos = somenteDigitos ? parseInt(somenteDigitos, 10) : 0;
    setValorCentavos(centavos);
  };

  const aoAlterarTipo = (novoTipo: "entry" | "exit") => {
    setTipo(novoTipo);
    if (novoTipo === "entry") {
      setGrupo("entry");
      return;
    }
    if (grupo === "entry") {
      setGrupo("fixed");
    }
  };

  const aoSalvarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!podeSalvar) {
      setErro("Preencha os campos obrigatorios.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await aoSalvar({
        description: descricao.trim(),
        amountCents: valorCentavos,
        type: tipo,
        group: grupo,
        date: data,
        categoryId: Number(categoriaId),
        paymentMethodId: Number(metodoPagamentoId),
      });
      aoFechar();
    } catch (error) {
      console.error(error);
      setErro("Nao foi possivel salvar o lancamento.");
    } finally {
      setSalvando(false);
    }
  };

  const gruposDisponiveis = tipo === "entry"
    ? [{ value: "entry", label: "Entrada" }]
    : [
      { value: "fixed", label: "Fixo" },
      { value: "variable", label: "Variavel" },
      { value: "installment", label: "Parcelado" },
    ];

  const modoEdicao = !!transacaoInicial;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={aoFechar}>
      <div className="surface-card w-full max-w-[600px] p-0" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 pt-6 pb-0 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">{modoEdicao ? "Editar lançamento" : "Novo lançamento"}</h3>
          <button
            type="button"
            onClick={aoFechar}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth focus-ring"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={aoSalvarFormulario} className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2">
              <span className="block text-xs font-medium text-muted-foreground mb-1">Descrição</span>
              <input
                type="text"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex: Supermercado, Aluguel, Freelance..."
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$)</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={textoValor}
                onChange={(event) => aoAlterarValor(event.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Data</span>
              <input
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring tabular-nums"
              />
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Categoria</span>
              <select
                value={categoriaId}
                onChange={(event) => setCategoriaId(event.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
              >
                <option value="">Selecione</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Método de pagamento</span>
              <select
                value={metodoPagamentoId}
                onChange={(event) => setMetodoPagamentoId(event.target.value)}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
              >
                <option value="">Selecione</option>
                {metodosPagamento.map((metodo) => (
                  <option key={metodo.id} value={metodo.id}>
                    {metodo.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Tipo</span>
              <select
                value={tipo}
                onChange={(event) => aoAlterarTipo(event.target.value as "entry" | "exit")}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring"
              >
                <option value="entry">Entrada</option>
                <option value="exit">Saída</option>
              </select>
            </label>

            <label>
              <span className="block text-xs font-medium text-muted-foreground mb-1">Grupo</span>
              <select
                value={grupo}
                onChange={(event) => setGrupo(event.target.value as "fixed" | "variable" | "installment" | "entry")}
                disabled={tipo === "entry"}
                className="w-full h-10 px-3 rounded-md bg-surface border border-input text-sm focus-ring disabled:opacity-60"
              >
                {gruposDisponiveis.map((grupoItem) => (
                  <option key={grupoItem.value} value={grupoItem.value}>
                    {grupoItem.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {erro ? (
            <div className="mt-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium">
              {erro}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={aoFechar}
              className="h-10 px-4 rounded-md border border-input bg-surface text-sm font-medium text-foreground hover:bg-secondary transition-smooth focus-ring"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeSalvar || salvando}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-card-sm transition-smooth hover:brightness-[0.98] focus-ring disabled:opacity-60"
            >
              {salvando ? "Salvando..." : modoEdicao ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
