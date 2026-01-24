import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";

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
    <div className="modal-fundo" onClick={aoFechar}>
      <div className="modal-caixa" onClick={(event) => event.stopPropagation()}>
        <div className="modal-cabecalho">
          <h3>{modoEdicao ? "Editar lancamento" : "Novo lancamento"}</h3>
          <button type="button" onClick={aoFechar}>Fechar</button>
        </div>
        <form onSubmit={aoSalvarFormulario}>
          <div className="formulario-grade">
            <label className="formulario-campo linha-inteira">
              Descricao
              <input
                type="text"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
              />
            </label>
            <label className="formulario-campo">
              Valor (R$)
              <input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={textoValor}
                onChange={(event) => aoAlterarValor(event.target.value)}
              />
            </label>
            <label className="formulario-campo">
              Tipo
              <select
                value={tipo}
                onChange={(event) => aoAlterarTipo(event.target.value as "entry" | "exit")}
              >
                <option value="entry">Entrada</option>
                <option value="exit">Saida</option>
              </select>
            </label>
            <label className="formulario-campo">
              Grupo
              <select
                value={grupo}
                onChange={(event) => setGrupo(event.target.value as "fixed" | "variable" | "installment" | "entry")}
                disabled={tipo === "entry"}
              >
                {gruposDisponiveis.map((grupoItem) => (
                  <option key={grupoItem.value} value={grupoItem.value}>
                    {grupoItem.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="formulario-campo">
              Data
              <input type="date" value={data} onChange={(event) => setData(event.target.value)} />
            </label>
            <label className="formulario-campo">
              Categoria
              <select value={categoriaId} onChange={(event) => setCategoriaId(event.target.value)}>
                <option value="">Selecione</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="formulario-campo linha-inteira">
              Metodo de pagamento
              <select value={metodoPagamentoId} onChange={(event) => setMetodoPagamentoId(event.target.value)}>
                <option value="">Selecione</option>
                {metodosPagamento.map((metodo) => (
                  <option key={metodo.id} value={metodo.id}>
                    {metodo.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {erro ? <div className="modal-erro">{erro}</div> : null}
          <div className="modal-acoes">
            <button type="button" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="primary" disabled={!podeSalvar || salvando}>
              {salvando ? "Salvando..." : modoEdicao ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
