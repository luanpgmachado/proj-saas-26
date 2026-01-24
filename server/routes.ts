import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { ParsedQs } from "qs";

const router = Router();

function getQueryString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

function getParamString(value: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return value;
}

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.get("/categories", asyncHandler(async (req, res) => {
  const categories = await storage.getCategories();
  res.json(categories);
}));

router.post("/categories", asyncHandler(async (req, res) => {
  const category = await storage.createCategory(req.body);
  res.json(category);
}));

router.patch("/categories/:id", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const category = await storage.updateCategory(parseInt(id), req.body);
  if (!category) return res.status(404).json({ error: "Not found" });
  res.json(category);
}));

router.delete("/categories/:id", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const deleted = await storage.deleteCategory(parseInt(id));
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
}));

router.get("/payment-methods", asyncHandler(async (req, res) => {
  const methods = await storage.getPaymentMethods();
  res.json(methods);
}));

router.post("/payment-methods", asyncHandler(async (req, res) => {
  const method = await storage.createPaymentMethod(req.body);
  res.json(method);
}));

router.patch("/payment-methods/:id", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const method = await storage.updatePaymentMethod(parseInt(id), req.body);
  if (!method) return res.status(404).json({ error: "Not found" });
  res.json(method);
}));

router.delete("/payment-methods/:id", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const deleted = await storage.deletePaymentMethod(parseInt(id));
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
}));

router.get("/transactions", asyncHandler(async (req, res) => {
  const month = getQueryString(req.query.month);
  const categoryId = getQueryString(req.query.categoryId);
  const methodId = getQueryString(req.query.methodId);
  const type = getQueryString(req.query.type);
  const group = getQueryString(req.query.group);
  const transactions = await storage.getTransactions({
    month,
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    methodId: methodId ? parseInt(methodId) : undefined,
    type,
    group,
  });
  res.json(transactions);
}));

router.post("/transactions", asyncHandler(async (req, res) => {
  const transaction = await storage.createTransaction(req.body);
  res.json(transaction);
}));

router.patch("/transactions/:id", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const transaction = await storage.updateTransaction(parseInt(id), req.body);
  if (!transaction) return res.status(404).json({ error: "Not found" });
  res.json(transaction);
}));

router.delete("/transactions/:id", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const deleted = await storage.deleteTransaction(parseInt(id));
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
}));

router.get("/months/:month/summary", asyncHandler(async (req, res) => {
  const month = getParamString(req.params.month);
  const summary = await storage.getMonthSummary(month);
  res.json({ month, ...summary });
}));

router.get("/months/:month/categories", asyncHandler(async (req, res) => {
  const month = getParamString(req.params.month);
  const categorySpend = await storage.getCategorySpend(month);
  res.json(categorySpend);
}));

router.get("/months/:month/transactions", asyncHandler(async (req, res) => {
  const month = getParamString(req.params.month);
  const group = getQueryString(req.query.group);
  const transactions = await storage.getTransactions({
    month,
    group,
  });
  res.json(transactions);
}));

router.get("/years/:year/summary", asyncHandler(async (req, res) => {
  const year = getParamString(req.params.year);
  const summary = await storage.getAnnualSummary(year);
  res.json(summary);
}));

router.get("/goals", asyncHandler(async (req, res) => {
  const goals = await storage.getGoals();
  res.json(goals);
}));

router.get("/goals/:id/contributions", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const contributions = await storage.getGoalContributions(parseInt(id));
  res.json(contributions);
}));

router.post("/goals/:id/contributions", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const contribution = await storage.createGoalContribution({
    ...req.body,
    goalId: parseInt(id),
  });
  res.json(contribution);
}));

router.get("/reserve", asyncHandler(async (req, res) => {
  const reserve = await storage.getReserve();
  if (!reserve) return res.status(404).json({ error: "No reserve found" });
  res.json(reserve);
}));

router.get("/reserve/contributions", asyncHandler(async (req, res) => {
  const contributions = await storage.getReserveContributions();
  res.json(contributions);
}));

router.post("/reserve/contributions", asyncHandler(async (req, res) => {
  const reserve = await storage.getReserve();
  if (!reserve) return res.status(404).json({ error: "No reserve found" });
  const contribution = await storage.createReserveContribution({
    ...req.body,
    reserveId: reserve.id,
  });
  res.json(contribution);
}));

router.get("/investments", asyncHandler(async (req, res) => {
  const investments = await storage.getInvestments();
  res.json(investments);
}));

router.get("/investments/:id/contributions", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const contributions = await storage.getInvestmentContributions(parseInt(id));
  res.json(contributions);
}));

router.post("/investments/:id/contributions", asyncHandler(async (req, res) => {
  const id = getParamString(req.params.id);
  const contribution = await storage.createInvestmentContribution({
    ...req.body,
    investmentId: parseInt(id),
  });
  res.json(contribution);
}));

export default router;
