import { useEffect, useState } from "react";
import { api } from "../lib/api";

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

const traduzirTipo = (tipo: string) => (tipo === "entry" ? "Entrada" : "Saida");
const traduzirGrupo = (grupo: string) => {
  if (grupo === "fixed") return "Fixo";
  if (grupo === "installment") return "Parcelado";
  return "Entrada";
};
const traduzirStatus = (status: string) => {
  if (status === "active") return "Ativo";
  if (status === "paused") return "Pausado";
  return "Cancelado";
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

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [recs, cats, mets] = await Promise.all([
      api.getRecurrences(),
      api.getCategories(),
      api.getPaymentMethods(),
    ]);
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

  const gerarMes = async () => {
    setCarregando(true);
    setMensagem(null);
    try {
      const transacoes = await api.generateRecurrences(mesSelecionado);
      setMensagem(`${transacoes.length} transacao(oes) criada(s) para ${mesSelecionado}.`);
    } catch {
      setMensagem("Erro ao gerar transacoes.");
    }
    setCarregando(false);
  };

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
    if (!descricao.trim()) return "Descricao e obrigatoria.";
    const valorNumerico = parseFloat(valorReais.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) return "Valor deve ser maior que zero.";
    if (!dataInicio) return "Data de inicio e obrigatoria.";
    if (diaDoMes < 1 || diaDoMes > 31) return "Dia do mes deve ser entre 1 e 31.";
    if (grupo === "installment" && (!totalParcelas || totalParcelas < 1)) {
      return "Total de parcelas e obrigatorio para recorrencias parceladas.";
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

    const valorCentavos = Math.round(parseFloat(valorReais.replace(",", ".")) * 100);
    const dados = {
      description: descricao,
      type: tipo,
      group: grupo,
      amountCents: valorCentavos,
      categoryId: categoriaId,
      paymentMethodId: metodoId,
      startDate: dataInicio,
      endDate: dataFim || null,
      dayOfMonth: diaDoMes,
      installmentTotal: grupo === "installment" ? totalParcelas : null,
    };

    if (editandoId) {
      await api.updateRecurrence(editandoId, dados);
    } else {
      await api.createRecurrence({ ...dados, status: "active" });
    }
    limparFormulario();
    carregarDados();
  };

  const alterarStatus = async (id: number, novoStatus: "active" | "paused" | "canceled") => {
    await api.updateRecurrence(id, { status: novoStatus });
    carregarDados();
  };

  const aoMudarTipo = (novoTipo: "entry" | "exit") => {
    setTipo(novoTipo);
    if (novoTipo === "entry") {
      setGrupo("entry");
    } else if (grupo === "entry") {
      setGrupo("fixed");
    }
  };

  return (
    <div className="pagina-recorrencias">
      <div className="cabecalho-pagina">
        <div className="seletor-mes">
          <input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          />
        </div>
        <div className="acoes-cabecalho">
          <button onClick={gerarMes} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar Mes"}
          </button>
          <button onClick={abrirNovaRecorrencia}>+ Nova Recorrencia</button>
        </div>
      </div>

      {mensagem && <div className="mensagem-feedback">{mensagem}</div>}

      {mostraFormulario && (
        <div className="formulario-recorrencia">
          {erroFormulario && <div className="erro-formulario">{erroFormulario}</div>}
          <div className="formulario-grade">
            <label className="formulario-campo">
              Descricao
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </label>
            <label className="formulario-campo">
              Tipo
              <select value={tipo} onChange={(e) => aoMudarTipo(e.target.value as "entry" | "exit")}>
                <option value="exit">Saida</option>
                <option value="entry">Entrada</option>
              </select>
            </label>
            <label className="formulario-campo">
              Grupo
              <select
                value={grupo}
                onChange={(e) => setGrupo(e.target.value as "fixed" | "installment" | "entry")}
                disabled={tipo === "entry"}
              >
                {tipo === "entry" ? (
                  <option value="entry">Entrada</option>
                ) : (
                  <>
                    <option value="fixed">Fixo</option>
                    <option value="installment">Parcelado</option>
                  </>
                )}
              </select>
            </label>
            <label className="formulario-campo">
              Valor (R$)
              <input
                type="text"
                value={valorReais}
                onChange={(e) => setValorReais(e.target.value)}
                placeholder="0,00"
              />
            </label>
            <label className="formulario-campo">
              Categoria
              <select
                value={categoriaId ?? ""}
                onChange={(e) => setCategoriaId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="formulario-campo">
              Metodo de pagamento
              <select
                value={metodoId ?? ""}
                onChange={(e) => setMetodoId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione</option>
                {metodos.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label className="formulario-campo">
              Data inicio
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </label>
            <label className="formulario-campo">
              Data fim (opcional)
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </label>
            <label className="formulario-campo">
              Dia do mes
              <input
                type="number"
                min={1}
                max={31}
                value={diaDoMes}
                onChange={(e) => setDiaDoMes(parseInt(e.target.value) || 1)}
              />
            </label>
            {grupo === "installment" && (
              <label className="formulario-campo">
                Total de parcelas
                <input
                  type="number"
                  min={1}
                  value={totalParcelas ?? ""}
                  onChange={(e) => setTotalParcelas(e.target.value ? parseInt(e.target.value) : null)}
                />
              </label>
            )}
          </div>
          <div className="acoes-formulario">
            <button onClick={salvar}>{editandoId ? "Salvar" : "Criar"}</button>
            <button onClick={limparFormulario}>Cancelar</button>
          </div>
        </div>
      )}

      <table className="tabela-recorrencias">
        <thead>
          <tr>
            <th>Descricao</th>
            <th>Tipo</th>
            <th>Grupo</th>
            <th>Valor</th>
            <th>Categoria</th>
            <th>Metodo</th>
            <th>Dia</th>
            <th>Status</th>
            <th>Inicio</th>
            <th>Fim</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {recorrencias.map((rec) => (
            <tr key={rec.id}>
              <td>{rec.description}</td>
              <td>{traduzirTipo(rec.type)}</td>
              <td>{traduzirGrupo(rec.group)}</td>
              <td className="valor-direita">{formatarMoeda(rec.amountCents)}</td>
              <td>{nomeCategoria(rec.categoryId)}</td>
              <td>{nomeMetodo(rec.paymentMethodId)}</td>
              <td>{rec.dayOfMonth}</td>
              <td>{traduzirStatus(rec.status)}</td>
              <td>{formatarData(rec.startDate)}</td>
              <td>{formatarData(rec.endDate)}</td>
              <td className="acoes-linha">
                <button onClick={() => abrirEdicao(rec)}>Editar</button>
                {rec.status === "active" && (
                  <>
                    <button onClick={() => alterarStatus(rec.id, "paused")}>Pausar</button>
                    <button onClick={() => alterarStatus(rec.id, "canceled")}>Cancelar</button>
                  </>
                )}
                {rec.status === "paused" && (
                  <>
                    <button onClick={() => alterarStatus(rec.id, "active")}>Reativar</button>
                    <button onClick={() => alterarStatus(rec.id, "canceled")}>Cancelar</button>
                  </>
                )}
                {rec.status === "canceled" && (
                  <button onClick={() => alterarStatus(rec.id, "active")}>Reativar</button>
                )}
              </td>
            </tr>
          ))}
          {recorrencias.length === 0 && (
            <tr>
              <td colSpan={11} className="sem-dados">Nenhuma recorrencia cadastrada.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
