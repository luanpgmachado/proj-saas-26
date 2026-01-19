import { useState, useEffect } from "react";
import { api } from "../lib/api";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

export default function Investments() {
  const [reserve, setReserve] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => {
    api.getReserve().then(setReserve).catch(() => setReserve(null));
    api.getInvestments().then(setInvestments).catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Reserva e Investimentos</h2>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Reserva de Emergência</h3>
        {reserve ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(reserve.currentCents)}</span>
            <button>+ Aporte</button>
          </div>
        ) : (
          <p>Nenhuma reserva configurada.</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Investimentos</h3>
        {investments.length === 0 ? (
          <p>Nenhum investimento cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th className="text-right">Valor Atual</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.name}</td>
                  <td className="text-right">{formatCurrency(inv.currentCents)}</td>
                  <td className="text-right"><button>+ Aporte</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
