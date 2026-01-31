import { db, pool } from "./db";
import { recurrences, transactions } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";

type Lancamento = typeof transactions.$inferSelect;

type Inconsistencia = {
  grupoId: string;
  motivo: string;
};

type ResultadoGrupo = {
  grupoId: string;
  recorrenciaId: number;
  quantidadeLancamentos: number;
};

function ordenarPorData(lancamentos: Lancamento[]): Lancamento[] {
  return [...lancamentos].sort((a, b) => a.date.localeCompare(b.date));
}

function encontrarPrimeiraData(lancamentos: Lancamento[]): string {
  return ordenarPorData(lancamentos)[0]?.date ?? "";
}

function compararCampos(base: Lancamento, atual: Lancamento): string | null {
  if (atual.group !== "installment") return "grupo diferente de parcelado";
  if (atual.type !== base.type) return "type divergente";
  if (atual.description !== base.description) return "description divergente";
  if (atual.amountCents !== base.amountCents) return "amountCents divergente";
  if (atual.categoryId !== base.categoryId) return "categoryId divergente";
  if (atual.paymentMethodId !== base.paymentMethodId) return "paymentMethodId divergente";
  if (atual.installmentTotal !== base.installmentTotal) return "installmentTotal divergente";
  return null;
}

async function executarBackfillRecorrencias() {
  const lancamentosParcelados = await db
    .select()
    .from(transactions)
    .where(isNotNull(transactions.installmentGroupId));

  const grupos = new Map<string, Lancamento[]>();
  for (const lancamento of lancamentosParcelados) {
    if (!lancamento.installmentGroupId) continue;
    const lista = grupos.get(lancamento.installmentGroupId) ?? [];
    lista.push(lancamento);
    grupos.set(lancamento.installmentGroupId, lista);
  }

  const inconsistencias: Inconsistencia[] = [];
  const ignorados: string[] = [];
  const criados: ResultadoGrupo[] = [];

  for (const [grupoId, itens] of grupos.entries()) {
    if (itens.some((item) => item.recurrenceId)) {
      ignorados.push(grupoId);
      continue;
    }

    const base = itens[0];
    if (!base) continue;
    if (base.installmentTotal === null || base.installmentTotal === undefined) {
      inconsistencias.push({ grupoId, motivo: "installmentTotal ausente" });
      continue;
    }
    if (base.type !== "exit") {
      inconsistencias.push({ grupoId, motivo: "type diferente de exit" });
      continue;
    }

    let divergencia: string | null = null;
    for (const item of itens) {
      divergencia = compararCampos(base, item);
      if (divergencia) break;
    }
    if (divergencia) {
      inconsistencias.push({ grupoId, motivo: divergencia });
      continue;
    }

    const dataInicio = encontrarPrimeiraData(itens);
    if (!dataInicio) {
      inconsistencias.push({ grupoId, motivo: "dataInicio invalida" });
      continue;
    }
    const diaMes = Number(dataInicio.split("-")[2] ?? 0);
    if (!Number.isInteger(diaMes) || diaMes < 1 || diaMes > 31) {
      inconsistencias.push({ grupoId, motivo: "diaMes invalido" });
      continue;
    }

    const [recorrenciaCriada] = await db
      .insert(recurrences)
      .values({
        description: base.description,
        type: base.type,
        group: "installment",
        amountCents: base.amountCents,
        categoryId: base.categoryId,
        paymentMethodId: base.paymentMethodId,
        startDate: dataInicio,
        endDate: null,
        dayOfMonth: diaMes,
        installmentTotal: base.installmentTotal,
        status: "active",
      })
      .returning();

    await db
      .update(transactions)
      .set({ recurrenceId: recorrenciaCriada.id })
      .where(eq(transactions.installmentGroupId, grupoId));

    criados.push({
      grupoId,
      recorrenciaId: recorrenciaCriada.id,
      quantidadeLancamentos: itens.length,
    });
  }

  console.log("Backfill concluido.");
  console.log(`Recorrencias criadas: ${criados.length}`);
  console.log(`Grupos ignorados (ja vinculados): ${ignorados.length}`);
  console.log(`Grupos inconsistentes: ${inconsistencias.length}`);

  if (inconsistencias.length > 0) {
    console.log("Detalhes de inconsistencias:");
    for (const item of inconsistencias) {
      console.log(`- ${item.grupoId}: ${item.motivo}`);
    }
  }
}

executarBackfillRecorrencias()
  .catch((erro) => {
    console.error("Erro no backfill de recorrencias:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
