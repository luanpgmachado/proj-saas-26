import type { Transacao } from "../model/transacao";

export function dataLocalHojeIso(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

type AtualizarTransacao = (id: number, patch: { isPaid: boolean; paidAt: string | null }) => Promise<Transacao>;

export async function alternarPagoOptimista(params: {
  id: number;
  marcar: boolean;
  transacoes: Transacao[];
  setTransacoes: (value: Transacao[] | ((prev: Transacao[]) => Transacao[])) => void;
  atualizarTransacao: AtualizarTransacao;
}): Promise<Transacao> {
  const { id, marcar, transacoes, setTransacoes, atualizarTransacao } = params;

  const anterior = transacoes.find((t) => t.id === id);
  if (!anterior) {
    throw new Error("Lancamento nao encontrado para atualizar.");
  }

  const patch = marcar
    ? { isPaid: true, paidAt: dataLocalHojeIso() }
    : { isPaid: false, paidAt: null };

  setTransacoes((prev) =>
    prev.map((t) =>
      t.id === id
        ? {
          ...t,
          isPaid: patch.isPaid,
          paidAt: patch.paidAt,
        }
        : t,
    ),
  );

  try {
    const atualizado = await atualizarTransacao(id, patch);
    setTransacoes((prev) => prev.map((t) => (t.id === id ? atualizado : t)));
    return atualizado;
  } catch (err) {
    setTransacoes((prev) => prev.map((t) => (t.id === id ? anterior : t)));
    throw err;
  }
}
