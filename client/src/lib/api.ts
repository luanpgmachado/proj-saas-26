const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export const api = {
  getMonthSummary: (month: string) => request<any>(`/months/${month}/summary`),
  getCategorySpend: (month: string) => request<any[]>(`/months/${month}/categories`),
  getTransactions: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/transactions?${query}`);
  },
  createTransaction: (data: any) => request<any>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id: number, data: any) => request<any>(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTransaction: (id: number) => request<any>(`/transactions/${id}`, { method: "DELETE" }),
  getCategories: () => request<any[]>("/categories"),
  createCategory: (data: any) => request<any>("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) => request<any>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request<any>(`/categories/${id}`, { method: "DELETE" }),
  getPaymentMethods: () => request<any[]>("/payment-methods"),
  createPaymentMethod: (data: any) => request<any>("/payment-methods", { method: "POST", body: JSON.stringify(data) }),
  updatePaymentMethod: (id: number, data: any) => request<any>(`/payment-methods/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePaymentMethod: (id: number) => request<any>(`/payment-methods/${id}`, { method: "DELETE" }),
  getAnnualSummary: (year: string) => request<any[]>(`/years/${year}/summary`),
  getGoals: () => request<any[]>("/goals"),
  createGoal: (data: any) => request<any>("/goals", { method: "POST", body: JSON.stringify(data) }),
  updateGoal: (id: number, data: any) => request<any>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGoal: (id: number) => request<any>(`/goals/${id}`, { method: "DELETE" }),
  getGoalContributions: (id: number) => request<any[]>(`/goals/${id}/contributions`),
  createGoalContribution: (id: number, data: any) => request<any>(`/goals/${id}/contributions`, { method: "POST", body: JSON.stringify(data) }),
  deleteGoalContribution: (id: number) => request<any>(`/goal-contributions/${id}`, { method: "DELETE" }),
  getReserve: () => request<any>("/reserve"),
  createReserve: (data: any) => request<any>("/reserve", { method: "POST", body: JSON.stringify(data) }),
  updateReserve: (id: number, data: any) => request<any>(`/reserve/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteReserve: (id: number) => request<any>(`/reserve/${id}`, { method: "DELETE" }),
  getReserveContributions: () => request<any[]>("/reserve/contributions"),
  createReserveContribution: (data: any) => request<any>("/reserve/contributions", { method: "POST", body: JSON.stringify(data) }),
  deleteReserveContribution: (id: number) => request<any>(`/reserve-contributions/${id}`, { method: "DELETE" }),
  getInvestments: () => request<any[]>("/investments"),
  createInvestment: (data: any) => request<any>("/investments", { method: "POST", body: JSON.stringify(data) }),
  updateInvestment: (id: number, data: any) => request<any>(`/investments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteInvestment: (id: number) => request<any>(`/investments/${id}`, { method: "DELETE" }),
  getInvestmentContributions: (id: number) => request<any[]>(`/investments/${id}/contributions`),
  createInvestmentContribution: (id: number, data: any) => request<any>(`/investments/${id}/contributions`, { method: "POST", body: JSON.stringify(data) }),
  deleteInvestmentContribution: (id: number) => request<any>(`/investment-contributions/${id}`, { method: "DELETE" }),
};
