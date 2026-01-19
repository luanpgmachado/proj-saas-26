import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const router = Router();

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

router.get("/payment-methods", asyncHandler(async (req, res) => {
  const methods = await storage.getPaymentMethods();
  res.json(methods);
}));

router.post("/payment-methods", asyncHandler(async (req, res) => {
  const method = await storage.createPaymentMethod(req.body);
  res.json(method);
}));

router.patch("/payment-methods/:id", asyncHandler(async (req, res) => {
  const method = await storage.updatePaymentMethod(parseInt(req.params.id), req.body);
  if (!method) return res.status(404).json({ error: "Not found" });
  res.json(method);
}));

router.get("/transactions", asyncHandler(async (req, res) => {
  const { month, categoryId, methodId, type, group } = req.query;
  const transactions = await storage.getTransactions({
    month: month as string,
    categoryId: categoryId ? parseInt(categoryId as string) : undefined,
    methodId: methodId ? parseInt(methodId as string) : undefined,
    type: type as string,
    group: group as string,
  });
  res.json(transactions);
}));

router.post("/transactions", asyncHandler(async (req, res) => {
  const transaction = await storage.createTransaction(req.body);
  res.json(transaction);
}));

router.patch("/transactions/:id", asyncHandler(async (req, res) => {
  const transaction = await storage.updateTransaction(parseInt(req.params.id), req.body);
  if (!transaction) return res.status(404).json({ error: "Not found" });
  res.json(transaction);
}));

router.get("/months/:month/summary", asyncHandler(async (req, res) => {
  const summary = await storage.getMonthSummary(req.params.month);
  res.json({ month: req.params.month, ...summary });
}));

router.get("/months/:month/categories", asyncHandler(async (req, res) => {
  const categorySpend = await storage.getCategorySpend(req.params.month);
  res.json(categorySpend);
}));

router.get("/months/:month/transactions", asyncHandler(async (req, res) => {
  const { group } = req.query;
  const transactions = await storage.getTransactions({
    month: req.params.month,
    group: group as string,
  });
  res.json(transactions);
}));

router.get("/years/:year/summary", asyncHandler(async (req, res) => {
  const summary = await storage.getAnnualSummary(req.params.year);
  res.json(summary);
}));

router.get("/goals", asyncHandler(async (req, res) => {
  const goals = await storage.getGoals();
  res.json(goals);
}));

router.get("/goals/:id/contributions", asyncHandler(async (req, res) => {
  const contributions = await storage.getGoalContributions(parseInt(req.params.id));
  res.json(contributions);
}));

router.post("/goals/:id/contributions", asyncHandler(async (req, res) => {
  const contribution = await storage.createGoalContribution({
    ...req.body,
    goalId: parseInt(req.params.id),
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
  const contributions = await storage.getInvestmentContributions(parseInt(req.params.id));
  res.json(contributions);
}));

router.post("/investments/:id/contributions", asyncHandler(async (req, res) => {
  const contribution = await storage.createInvestmentContribution({
    ...req.body,
    investmentId: parseInt(req.params.id),
  });
  res.json(contribution);
}));

export default router;
