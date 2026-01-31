import { pgTable, serial, varchar, integer, date, text, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  kind: varchar("kind", { length: 50 }).notNull(),
  monthlyBudgetCents: integer("monthly_budget_cents"),
});

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isCard: boolean("is_card").notNull().default(false),
  paidInMonth: boolean("paid_in_month").notNull().default(true),
  closingDay: integer("closing_day"),
  dueDay: integer("due_day"),
});

export const recurrences = pgTable("recurrences", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  group: varchar("group", { length: 50 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  dayOfMonth: integer("day_of_month").notNull(),
  installmentTotal: integer("installment_total"),
  status: varchar("status", { length: 50 }).notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  group: varchar("group", { length: 50 }).notNull(),
  installmentGroupId: varchar("installment_group_id", { length: 255 }),
  installmentIndex: integer("installment_index"),
  installmentTotal: integer("installment_total"),
  recurrenceId: integer("recurrence_id").references(() => recurrences.id),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  targetCents: integer("target_cents").notNull(),
});

export const goalContributions = pgTable("goal_contributions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => goals.id).notNull(),
  date: date("date").notNull(),
  amountCents: integer("amount_cents").notNull(),
});

export const reserves = pgTable("reserves", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().default("Reserva de Emergência"),
});

export const reserveContributions = pgTable("reserve_contributions", {
  id: serial("id").primaryKey(),
  reserveId: integer("reserve_id").references(() => reserves.id).notNull(),
  date: date("date").notNull(),
  amountCents: integer("amount_cents").notNull(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const investmentContributions = pgTable("investment_contributions", {
  id: serial("id").primaryKey(),
  investmentId: integer("investment_id").references(() => investments.id).notNull(),
  date: date("date").notNull(),
  amountCents: integer("amount_cents").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  recurrences: many(recurrences),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  transactions: many(transactions),
  recurrences: many(recurrences),
}));

export const recurrencesRelations = relations(recurrences, ({ many, one }) => ({
  category: one(categories, {
    fields: [recurrences.categoryId],
    references: [categories.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [recurrences.paymentMethodId],
    references: [paymentMethods.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id],
  }),
  recurrence: one(recurrences, {
    fields: [transactions.recurrenceId],
    references: [recurrences.id],
  }),
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  contributions: many(goalContributions),
}));

export const goalContributionsRelations = relations(goalContributions, ({ one }) => ({
  goal: one(goals, {
    fields: [goalContributions.goalId],
    references: [goals.id],
  }),
}));

export const reservesRelations = relations(reserves, ({ many }) => ({
  contributions: many(reserveContributions),
}));

export const reserveContributionsRelations = relations(reserveContributions, ({ one }) => ({
  reserve: one(reserves, {
    fields: [reserveContributions.reserveId],
    references: [reserves.id],
  }),
}));

export const investmentsRelations = relations(investments, ({ many }) => ({
  contributions: many(investmentContributions),
}));

export const investmentContributionsRelations = relations(investmentContributions, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentContributions.investmentId],
    references: [investments.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
export type Recurrence = typeof recurrences.$inferSelect;
export type InsertRecurrence = typeof recurrences.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;
export type GoalContribution = typeof goalContributions.$inferSelect;
export type InsertGoalContribution = typeof goalContributions.$inferInsert;
export type Reserve = typeof reserves.$inferSelect;
export type InsertReserve = typeof reserves.$inferInsert;
export type ReserveContribution = typeof reserveContributions.$inferSelect;
export type InsertReserveContribution = typeof reserveContributions.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;
export type InvestmentContribution = typeof investmentContributions.$inferSelect;
export type InsertInvestmentContribution = typeof investmentContributions.$inferInsert;
