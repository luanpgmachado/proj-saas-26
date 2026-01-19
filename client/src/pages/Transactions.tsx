import { useState, useEffect } from "react";
import { api } from "../lib/api";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

export default function Transactions() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [filters, setFilters] = useState({ categoryId: "", methodId: "", type: "" });

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getPaymentMethods().then(setMethods).catch(console.error);
  }, []);

  useEffect(() => {
    const params: Record<string, string> = { month };
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.methodId) params.methodId = filters.methodId;
    if (filters.type) params.type = filters.type;
    api.getTransactions(params).then(setTransactions).catch(console.error);
  }, [month, filters]);

  const clearFilters = () => setFilters({ categoryId: "", methodId: "", type: "" });

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Lançamentos</h2>
      
      <div className="filters">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.methodId} onChange={(e) => setFilters({ ...filters, methodId: e.target.value })}>
          <option value="">Todos métodos</option>
          {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">Todos tipos</option>
          <option value="entry">Entrada</option>
          <option value="exit">Saída</option>
        </select>
        <button onClick={clearFilters}>Limpar filtros</button>
      </div>

      <div className="card">
        {transactions.length === 0 ? (
          <p>Nenhum lançamento encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Método</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td>{t.type === "entry" ? "Entrada" : "Saída"}</td>
                  <td>{categories.find((c) => c.id === t.categoryId)?.name || "-"}</td>
                  <td>{methods.find((m) => m.id === t.paymentMethodId)?.name || "-"}</td>
                  <td className="text-right">{formatCurrency(t.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
