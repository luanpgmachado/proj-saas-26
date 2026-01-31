import {
  categories,
  paymentMethods,
  transactions,
  recurrences,
  goals,
  goalContributions,
  reserves,
  reserveContributions,
  investments,
  investmentContributions,
  type Category,
  type InsertCategory,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Transaction,
  type InsertTransaction,
  type Recurrence,
  type InsertRecurrence,
  type Goal,
  type InsertGoal,
  type GoalContribution,
  type InsertGoalContribution,
  type Reserve,
  type InsertReserve,
  type ReserveContribution,
  type InsertReserveContribution,
  type Investment,
  type InsertInvestment,
  type InvestmentContribution,
  type InsertInvestmentContribution,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

const recurrenceTypes = new Set(["entry", "exit"]);
const recurrenceGroups = new Set(["fixed", "installment", "entry"]);
const recurrenceStatuses = new Set(["active", "paused", "canceled"]);

function normalizeRecurrenceText(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isValidIsoDate(value: string | undefined | null): boolean {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

function parseYearMonth(value: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [yearStr, monthStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = getMonthIndex(year, month) + delta;
  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12) + 1;
  return { year: newYear, month: newMonth };
}

function assertRecurrenceRules(data: {
  description?: string | null;
  type?: string | null;
  group?: string | null;
  amountCents?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  dayOfMonth?: number | null;
  installmentTotal?: number | null;
  status?: string | null;
}) {
  const errors: string[] = [];

  if (!data.description) errors.push("description é obrigatório");
  if (!data.type || !recurrenceTypes.has(data.type)) errors.push("type inválido");
  if (!data.group || !recurrenceGroups.has(data.group)) errors.push("group inválido");
  if (!data.status || !recurrenceStatuses.has(data.status)) errors.push("status inválido");
  if (data.amountCents === undefined || data.amountCents === null || data.amountCents <= 0) {
    errors.push("amountCents deve ser maior que zero");
  }

  if (!data.startDate || !isValidIsoDate(data.startDate)) {
    errors.push("startDate inválido");
  }
  if (data.endDate && !isValidIsoDate(data.endDate)) {
    errors.push("endDate inválido");
  }
  if (data.startDate && data.endDate) {
    if (data.endDate < data.startDate) errors.push("endDate deve ser >= startDate");
  }

  if (data.dayOfMonth === undefined || data.dayOfMonth === null || !Number.isInteger(data.dayOfMonth)) {
    errors.push("dayOfMonth inválido");
  } else if (data.dayOfMonth < 1 || data.dayOfMonth > 31) {
    errors.push("dayOfMonth deve estar entre 1 e 31");
  }

  if (data.type === "entry" && data.group !== "entry") {
    errors.push("entry exige group = entry");
  }
  if (data.type === "exit" && data.group === "entry") {
    errors.push("exit não pode usar group = entry");
  }

  if (data.group === "installment") {
    if (data.installmentTotal === undefined || data.installmentTotal === null || data.installmentTotal < 1) {
      errors.push("installmentTotal é obrigatório para parcelamento");
    }
  } else if (data.installmentTotal !== undefined && data.installmentTotal !== null) {
    errors.push("installmentTotal só é permitido quando group = installment");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

export interface IStorage {
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getPaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  getTransactions(filters: { month?: string; categoryId?: number; methodId?: number; type?: string; group?: string }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getRecurrences(): Promise<Recurrence[]>;
  createRecurrence(recurrence: InsertRecurrence): Promise<Recurrence>;
  updateRecurrence(id: number, recurrence: Partial<InsertRecurrence>): Promise<Recurrence | undefined>;
  generateRecurrenceTransactions(month: string): Promise<Transaction[]>;
  getMonthSummary(month: string): Promise<{ entriesCents: number; exitsCents: number; balanceCents: number }>;
  getCategorySpend(month: string): Promise<{ categoryId: number; categoryName: string; budgetCents: number | null; spentCents: number; diffCents: number }[]>;
  getGoals(): Promise<(Goal & { currentCents: number; progressPercent: number })[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  getGoalContributions(goalId: number): Promise<GoalContribution[]>;
  createGoalContribution(contribution: InsertGoalContribution): Promise<GoalContribution>;
  deleteGoalContribution(id: number): Promise<boolean>;
  getReserve(): Promise<(Reserve & { currentCents: number }) | undefined>;
  createReserve(reserve: InsertReserve): Promise<Reserve>;
  updateReserve(id: number, reserve: Partial<InsertReserve>): Promise<Reserve | undefined>;
  deleteReserve(id: number): Promise<boolean>;
  getReserveContributions(): Promise<ReserveContribution[]>;
  createReserveContribution(contribution: InsertReserveContribution): Promise<ReserveContribution>;
  deleteReserveContribution(id: number): Promise<boolean>;
  getInvestments(): Promise<(Investment & { currentCents: number })[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment | undefined>;
  deleteInvestment(id: number): Promise<boolean>;
  getInvestmentContributions(investmentId: number): Promise<InvestmentContribution[]>;
  createInvestmentContribution(contribution: InsertInvestmentContribution): Promise<InvestmentContribution>;
  deleteInvestmentContribution(id: number): Promise<boolean>;
  getAnnualSummary(year: string): Promise<{ month: string; entriesCents: number; exitsCents: number; balanceCents: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return db.select().from(paymentMethods);
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const [created] = await db.insert(paymentMethods).values(method).returning();
    return created;
  }

  async updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [updated] = await db.update(paymentMethods).set(method).where(eq(paymentMethods.id, id)).returning();
    return updated;
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).returning();
    return result.length > 0;
  }

  async getTransactions(filters: { month?: string; categoryId?: number; methodId?: number; type?: string; group?: string }): Promise<Transaction[]> {
    let query = db.select().from(transactions);
    const conditions = [];

    if (filters.month) {
      const [year, monthNum] = filters.month.split("-").map(Number);
      const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      conditions.push(gte(transactions.date, startDate));
      conditions.push(lte(transactions.date, endDate));
    }
    if (filters.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
    if (filters.methodId) {
      conditions.push(eq(transactions.paymentMethodId, filters.methodId));
    }
    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters.group) {
      conditions.push(eq(transactions.group, filters.group));
    }

    if (conditions.length > 0) {
      return db.select().from(transactions).where(and(...conditions));
    }
    return db.select().from(transactions);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return result.length > 0;
  }

  async getRecurrences(): Promise<Recurrence[]> {
    return db.select().from(recurrences);
  }

  async createRecurrence(recurrence: InsertRecurrence): Promise<Recurrence> {
    const normalized = {
      ...recurrence,
      description: normalizeRecurrenceText(recurrence.description) ?? "",
    };
    assertRecurrenceRules(normalized);
    const [created] = await db.insert(recurrences).values(normalized).returning();
    return created;
  }

  async updateRecurrence(id: number, recurrence: Partial<InsertRecurrence>): Promise<Recurrence | undefined> {
    const [existing] = await db.select().from(recurrences).where(eq(recurrences.id, id));
    if (!existing) return undefined;

    const normalizedPatch: Partial<InsertRecurrence> = { ...recurrence };
    if (recurrence.description !== undefined) {
      normalizedPatch.description = normalizeRecurrenceText(recurrence.description) ?? "";
    }

    const merged = { ...existing, ...normalizedPatch };
    assertRecurrenceRules(merged);

    const [updated] = await db.update(recurrences).set(normalizedPatch).where(eq(recurrences.id, id)).returning();
    return updated;
  }

  async generateRecurrenceTransactions(month: string): Promise<Transaction[]> {
    const parsed = parseYearMonth(month);
    if (!parsed) {
      throw new Error("month inválido. Use YYYY-MM.");
    }
    const { year, month: monthNum } = parsed;
    const lastDay = getLastDayOfMonth(year, monthNum);
    const monthStart = toIsoDate(year, monthNum, 1);
    const monthEnd = toIsoDate(year, monthNum, lastDay);

    const activeRecurrences = await db
      .select()
      .from(recurrences)
      .where(eq(recurrences.status, "active"));

    const existing = await db
      .select()
      .from(transactions)
      .where(and(
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
        isNotNull(transactions.recurrenceId),
      ));

    const existingKeys = new Set(
      existing.map((t) => `${t.recurrenceId}-${t.date}`),
    );

    const toInsert: InsertTransaction[] = [];

    for (const recurrence of activeRecurrences) {
      if (!recurrence.startDate) continue;

      const [startYear, startMonth, startDay] = recurrence.startDate.split("-").map(Number);
      if (!startYear || !startMonth || !startDay) continue;

      const startMonthLastDay = getLastDayOfMonth(startYear, startMonth);
      const startOccurrenceDay = Math.min(recurrence.dayOfMonth, startMonthLastDay);
      const startOccurrenceDate = toIsoDate(startYear, startMonth, startOccurrenceDay);

      const firstOccurrenceMonth = startOccurrenceDate < recurrence.startDate
        ? addMonths(startYear, startMonth, 1)
        : { year: startYear, month: startMonth };

      const firstIndex = getMonthIndex(firstOccurrenceMonth.year, firstOccurrenceMonth.month);
      const targetIndex = getMonthIndex(year, monthNum);
      const monthDiff = targetIndex - firstIndex;

      if (monthDiff < 0) continue;

      const occurrenceDay = Math.min(recurrence.dayOfMonth, lastDay);
      const occurrenceDate = toIsoDate(year, monthNum, occurrenceDay);

      if (occurrenceDate < recurrence.startDate) continue;
      if (recurrence.endDate && occurrenceDate > recurrence.endDate) continue;

      let installmentIndex: number | undefined;
      if (recurrence.group === "installment") {
        installmentIndex = monthDiff + 1;
        if (recurrence.installmentTotal && installmentIndex > recurrence.installmentTotal) {
          continue;
        }
      }

      const key = `${recurrence.id}-${occurrenceDate}`;
      if (existingKeys.has(key)) continue;

      toInsert.push({
        date: occurrenceDate,
        description: recurrence.description,
        type: recurrence.type,
        amountCents: recurrence.amountCents,
        categoryId: recurrence.categoryId,
        paymentMethodId: recurrence.paymentMethodId,
        group: recurrence.group,
        recurrenceId: recurrence.id,
        installmentGroupId: recurrence.group === "installment" ? `recurrence-${recurrence.id}` : null,
        installmentIndex,
        installmentTotal: recurrence.group === "installment" ? recurrence.installmentTotal ?? null : null,
      });
    }

    if (toInsert.length === 0) return [];
    const created = await db.insert(transactions).values(toInsert).returning();
    return created;
  }

  async getMonthSummary(month: string): Promise<{ entriesCents: number; exitsCents: number; balanceCents: number }> {
    const txns = await this.getTransactions({ month });
    const entriesCents = txns.filter((t) => t.type === "entry").reduce((acc, t) => acc + t.amountCents, 0);
    const exitsCents = txns.filter((t) => t.type === "exit").reduce((acc, t) => acc + t.amountCents, 0);
    return { entriesCents, exitsCents, balanceCents: entriesCents - exitsCents };
  }

  async getCategorySpend(month: string): Promise<{ categoryId: number; categoryName: string; budgetCents: number | null; spentCents: number; diffCents: number }[]> {
    const cats = await this.getCategories();
    const txns = await this.getTransactions({ month, type: "exit" });

    return cats
      .filter((c) => c.kind === "expense")
      .map((cat) => {
        const spentCents = txns.filter((t) => t.categoryId === cat.id).reduce((acc, t) => acc + t.amountCents, 0);
        const diffCents = cat.monthlyBudgetCents ? cat.monthlyBudgetCents - spentCents : -spentCents;
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          budgetCents: cat.monthlyBudgetCents,
          spentCents,
          diffCents,
        };
      });
  }

  async getGoals(): Promise<(Goal & { currentCents: number; progressPercent: number })[]> {
    const allGoals = await db.select().from(goals);
    const result = [];
    for (const goal of allGoals) {
      const contributions = await db.select().from(goalContributions).where(eq(goalContributions.goalId, goal.id));
      const currentCents = contributions.reduce((acc, c) => acc + c.amountCents, 0);
      const progressPercent = goal.targetCents > 0 ? Math.round((currentCents / goal.targetCents) * 100) : 0;
      result.push({ ...goal, currentCents, progressPercent });
    }
    return result;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values(goal).returning();
    return created;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db.update(goals).set(goal).where(eq(goals.id, id)).returning();
    return updated;
  }

  async deleteGoal(id: number): Promise<boolean> {
    await db.delete(goalContributions).where(eq(goalContributions.goalId, id));
    const result = await db.delete(goals).where(eq(goals.id, id)).returning();
    return result.length > 0;
  }

  async getGoalContributions(goalId: number): Promise<GoalContribution[]> {
    return db.select().from(goalContributions).where(eq(goalContributions.goalId, goalId));
  }

  async createGoalContribution(contribution: InsertGoalContribution): Promise<GoalContribution> {
    const [created] = await db.insert(goalContributions).values(contribution).returning();
    return created;
  }

  async deleteGoalContribution(id: number): Promise<boolean> {
    const result = await db.delete(goalContributions).where(eq(goalContributions.id, id)).returning();
    return result.length > 0;
  }

  async getReserve(): Promise<(Reserve & { currentCents: number }) | undefined> {
    const [reserve] = await db.select().from(reserves).limit(1);
    if (!reserve) return undefined;
    const contributions = await db.select().from(reserveContributions).where(eq(reserveContributions.reserveId, reserve.id));
    const currentCents = contributions.reduce((acc, c) => acc + c.amountCents, 0);
    return { ...reserve, currentCents };
  }

  async createReserve(reserve: InsertReserve): Promise<Reserve> {
    const [created] = await db.insert(reserves).values(reserve).returning();
    return created;
  }

  async updateReserve(id: number, reserve: Partial<InsertReserve>): Promise<Reserve | undefined> {
    const [updated] = await db.update(reserves).set(reserve).where(eq(reserves.id, id)).returning();
    return updated;
  }

  async deleteReserve(id: number): Promise<boolean> {
    await db.delete(reserveContributions).where(eq(reserveContributions.reserveId, id));
    const result = await db.delete(reserves).where(eq(reserves.id, id)).returning();
    return result.length > 0;
  }

  async getReserveContributions(): Promise<ReserveContribution[]> {
    const reserve = await this.getReserve();
    if (!reserve) return [];
    return db.select().from(reserveContributions).where(eq(reserveContributions.reserveId, reserve.id));
  }

  async createReserveContribution(contribution: InsertReserveContribution): Promise<ReserveContribution> {
    const [created] = await db.insert(reserveContributions).values(contribution).returning();
    return created;
  }

  async deleteReserveContribution(id: number): Promise<boolean> {
    const result = await db.delete(reserveContributions).where(eq(reserveContributions.id, id)).returning();
    return result.length > 0;
  }

  async getInvestments(): Promise<(Investment & { currentCents: number })[]> {
    const allInvestments = await db.select().from(investments);
    const result = [];
    for (const inv of allInvestments) {
      const contributions = await db.select().from(investmentContributions).where(eq(investmentContributions.investmentId, inv.id));
      const currentCents = contributions.reduce((acc, c) => acc + c.amountCents, 0);
      result.push({ ...inv, currentCents });
    }
    return result;
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [created] = await db.insert(investments).values(investment).returning();
    return created;
  }

  async updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment | undefined> {
    const [updated] = await db.update(investments).set(investment).where(eq(investments.id, id)).returning();
    return updated;
  }

  async deleteInvestment(id: number): Promise<boolean> {
    await db.delete(investmentContributions).where(eq(investmentContributions.investmentId, id));
    const result = await db.delete(investments).where(eq(investments.id, id)).returning();
    return result.length > 0;
  }

  async getInvestmentContributions(investmentId: number): Promise<InvestmentContribution[]> {
    return db.select().from(investmentContributions).where(eq(investmentContributions.investmentId, investmentId));
  }

  async createInvestmentContribution(contribution: InsertInvestmentContribution): Promise<InvestmentContribution> {
    const [created] = await db.insert(investmentContributions).values(contribution).returning();
    return created;
  }

  async deleteInvestmentContribution(id: number): Promise<boolean> {
    const result = await db.delete(investmentContributions).where(eq(investmentContributions.id, id)).returning();
    return result.length > 0;
  }

  async getAnnualSummary(year: string): Promise<{ month: string; entriesCents: number; exitsCents: number; balanceCents: number }[]> {
    const result = [];
    for (let m = 1; m <= 12; m++) {
      const month = `${year}-${m.toString().padStart(2, "0")}`;
      const summary = await this.getMonthSummary(month);
      result.push({ month, ...summary });
    }
    return result;
  }
}

export const storage = new DatabaseStorage();
