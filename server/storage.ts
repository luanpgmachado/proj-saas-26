import {
  categories,
  paymentMethods,
  transactions,
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
import { eq, and, gte, lte, sql, sum } from "drizzle-orm";

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
  getMonthSummary(month: string): Promise<{ entriesCents: number; exitsCents: number; balanceCents: number }>;
  getCategorySpend(month: string): Promise<{ categoryId: number; categoryName: string; budgetCents: number | null; spentCents: number; diffCents: number }[]>;
  getGoals(): Promise<(Goal & { currentCents: number; progressPercent: number })[]>;
  getGoalContributions(goalId: number): Promise<GoalContribution[]>;
  createGoalContribution(contribution: InsertGoalContribution): Promise<GoalContribution>;
  getReserve(): Promise<(Reserve & { currentCents: number }) | undefined>;
  getReserveContributions(): Promise<ReserveContribution[]>;
  createReserveContribution(contribution: InsertReserveContribution): Promise<ReserveContribution>;
  getInvestments(): Promise<(Investment & { currentCents: number })[]>;
  getInvestmentContributions(investmentId: number): Promise<InvestmentContribution[]>;
  createInvestmentContribution(contribution: InsertInvestmentContribution): Promise<InvestmentContribution>;
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

  async getGoalContributions(goalId: number): Promise<GoalContribution[]> {
    return db.select().from(goalContributions).where(eq(goalContributions.goalId, goalId));
  }

  async createGoalContribution(contribution: InsertGoalContribution): Promise<GoalContribution> {
    const [created] = await db.insert(goalContributions).values(contribution).returning();
    return created;
  }

  async getReserve(): Promise<(Reserve & { currentCents: number }) | undefined> {
    const [reserve] = await db.select().from(reserves).limit(1);
    if (!reserve) return undefined;
    const contributions = await db.select().from(reserveContributions).where(eq(reserveContributions.reserveId, reserve.id));
    const currentCents = contributions.reduce((acc, c) => acc + c.amountCents, 0);
    return { ...reserve, currentCents };
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

  async getInvestmentContributions(investmentId: number): Promise<InvestmentContribution[]> {
    return db.select().from(investmentContributions).where(eq(investmentContributions.investmentId, investmentId));
  }

  async createInvestmentContribution(contribution: InsertInvestmentContribution): Promise<InvestmentContribution> {
    const [created] = await db.insert(investmentContributions).values(contribution).returning();
    return created;
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
