import { db, pool } from "./db";
import { categories, paymentMethods, transactions } from "@shared/schema";

async function seed() {
  console.log("Iniciando seed do banco de dados...");

  try {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) {
      console.log("Banco ja possui dados. Pulando seed.");
      await pool.end();
      process.exit(0);
    }
  } catch (err) {
    console.error("Erro ao verificar dados existentes:", err);
    await pool.end();
    process.exit(1);
  }

  const createdCategories = await db.insert(categories).values([
    { name: "Salário", kind: "income", monthlyBudgetCents: null },
    { name: "Freelance", kind: "income", monthlyBudgetCents: null },
    { name: "Moradia", kind: "expense", monthlyBudgetCents: 200000 },
    { name: "Alimentação", kind: "expense", monthlyBudgetCents: 150000 },
    { name: "Transporte", kind: "expense", monthlyBudgetCents: 80000 },
    { name: "Saúde", kind: "expense", monthlyBudgetCents: 50000 },
    { name: "Educação", kind: "expense", monthlyBudgetCents: 40000 },
    { name: "Lazer", kind: "expense", monthlyBudgetCents: 60000 },
    { name: "Vestuário", kind: "expense", monthlyBudgetCents: 30000 },
    { name: "Outros", kind: "expense", monthlyBudgetCents: 20000 },
  ]).returning();
  console.log(`Criadas ${createdCategories.length} categorias`);

  const createdMethods = await db.insert(paymentMethods).values([
    { name: "Dinheiro", kind: "cash", closingDay: null, dueDay: null },
    { name: "Pix", kind: "debit", closingDay: null, dueDay: null },
    { name: "Cartão Débito", kind: "debit", closingDay: null, dueDay: null },
    { name: "Cartão Crédito Nubank", kind: "credit", closingDay: 15, dueDay: 22 },
    { name: "Cartão Crédito Itaú", kind: "credit", closingDay: 10, dueDay: 17 },
  ]).returning();
  console.log(`Criados ${createdMethods.length} métodos de pagamento`);

  const catMap: Record<string, number> = {};
  for (const c of createdCategories) {
    catMap[c.name] = c.id;
  }

  const methodMap: Record<string, number> = {};
  for (const m of createdMethods) {
    methodMap[m.name] = m.id;
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

  const createdTransactions = await db.insert(transactions).values([
    { description: "Salário mensal", amountCents: 800000, type: "entry", group: "entry", date: `${currentMonth}-05`, categoryId: catMap["Salário"], paymentMethodId: methodMap["Pix"] },
    { description: "Projeto freelance", amountCents: 150000, type: "entry", group: "entry", date: `${currentMonth}-10`, categoryId: catMap["Freelance"], paymentMethodId: methodMap["Pix"] },
    { description: "Aluguel", amountCents: 180000, type: "exit", group: "fixed", date: `${currentMonth}-01`, categoryId: catMap["Moradia"], paymentMethodId: methodMap["Pix"] },
    { description: "Condomínio", amountCents: 45000, type: "exit", group: "fixed", date: `${currentMonth}-05`, categoryId: catMap["Moradia"], paymentMethodId: methodMap["Pix"] },
    { description: "Energia elétrica", amountCents: 18000, type: "exit", group: "variable", date: `${currentMonth}-08`, categoryId: catMap["Moradia"], paymentMethodId: methodMap["Pix"] },
    { description: "Internet", amountCents: 12000, type: "exit", group: "fixed", date: `${currentMonth}-10`, categoryId: catMap["Moradia"], paymentMethodId: methodMap["Cartão Débito"] },
    { description: "Supermercado", amountCents: 85000, type: "exit", group: "variable", date: `${currentMonth}-07`, categoryId: catMap["Alimentação"], paymentMethodId: methodMap["Cartão Crédito Nubank"] },
    { description: "Restaurante", amountCents: 12000, type: "exit", group: "variable", date: `${currentMonth}-12`, categoryId: catMap["Alimentação"], paymentMethodId: methodMap["Cartão Crédito Nubank"] },
    { description: "Uber", amountCents: 8500, type: "exit", group: "variable", date: `${currentMonth}-06`, categoryId: catMap["Transporte"], paymentMethodId: methodMap["Cartão Crédito Nubank"] },
    { description: "Gasolina", amountCents: 25000, type: "exit", group: "variable", date: `${currentMonth}-09`, categoryId: catMap["Transporte"], paymentMethodId: methodMap["Cartão Débito"] },
    { description: "Plano de saúde", amountCents: 35000, type: "exit", group: "fixed", date: `${currentMonth}-15`, categoryId: catMap["Saúde"], paymentMethodId: methodMap["Cartão Débito"] },
    { description: "Farmácia", amountCents: 8000, type: "exit", group: "variable", date: `${currentMonth}-11`, categoryId: catMap["Saúde"], paymentMethodId: methodMap["Dinheiro"] },
    { description: "Curso online", amountCents: 19900, type: "exit", group: "fixed", date: `${currentMonth}-01`, categoryId: catMap["Educação"], paymentMethodId: methodMap["Cartão Crédito Itaú"] },
    { description: "Cinema", amountCents: 6000, type: "exit", group: "variable", date: `${currentMonth}-14`, categoryId: catMap["Lazer"], paymentMethodId: methodMap["Cartão Crédito Nubank"] },
    { description: "Streaming", amountCents: 5500, type: "exit", group: "fixed", date: `${currentMonth}-02`, categoryId: catMap["Lazer"], paymentMethodId: methodMap["Cartão Crédito Nubank"] },
    { description: "Salário mês anterior", amountCents: 800000, type: "entry", group: "entry", date: `${lastMonth}-05`, categoryId: catMap["Salário"], paymentMethodId: methodMap["Pix"] },
    { description: "Aluguel mês anterior", amountCents: 180000, type: "exit", group: "fixed", date: `${lastMonth}-01`, categoryId: catMap["Moradia"], paymentMethodId: methodMap["Pix"] },
    { description: "Supermercado mês anterior", amountCents: 92000, type: "exit", group: "variable", date: `${lastMonth}-10`, categoryId: catMap["Alimentação"], paymentMethodId: methodMap["Cartão Crédito Nubank"] },
  ]).returning();
  console.log(`Criadas ${createdTransactions.length} transações`);

  console.log("Seed concluido com sucesso!");
  await pool.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Erro no seed:", err);
  await pool.end();
  process.exit(1);
});
