import { useState, useEffect } from "react";
import { api } from "../lib/api";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function AnnualView() {
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    api.getAnnualSummary(year).then(setSummary).catch(console.error);
  }, [year]);

  const totalEntries = summary.reduce((acc, s) => acc + s.entriesCents, 0);
  const totalExits = summary.reduce((acc, s) => acc + s.exitsCents, 0);
  const totalBalance = totalEntries - totalExits;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Panorama Anual</h2>
        <div className="month-selector">
          <button onClick={() => setYear(String(parseInt(year) - 1))}>&lt;</button>
          <span style={{ fontWeight: 600, fontSize: 18 }}>{year}</span>
          <button onClick={() => setYear(String(parseInt(year) + 1))}>&gt;</button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th className="text-right">Entradas</th>
              <th className="text-right">Saídas</th>
              <th className="text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, idx) => (
              <tr key={row.month}>
                <td>{monthNames[idx]}</td>
                <td className="text-right">{formatCurrency(row.entriesCents)}</td>
                <td className="text-right">{formatCurrency(row.exitsCents)}</td>
                <td className={`text-right ${row.balanceCents >= 0 ? "positive" : "negative"}`}>
                  {formatCurrency(row.balanceCents)}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: "#f5f5f5" }}>
              <td>Total</td>
              <td className="text-right">{formatCurrency(totalEntries)}</td>
              <td className="text-right">{formatCurrency(totalExits)}</td>
              <td className={`text-right ${totalBalance >= 0 ? "positive" : "negative"}`}>
                {formatCurrency(totalBalance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
