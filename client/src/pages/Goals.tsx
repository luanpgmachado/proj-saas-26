import { useState, useEffect } from "react";
import { api } from "../lib/api";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
};

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    api.getGoals().then(setGoals).catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Metas Financeiras</h2>

      {goals.length === 0 ? (
        <div className="card">
          <p>Nenhuma meta cadastrada.</p>
        </div>
      ) : (
        goals.map((goal) => (
          <div className="card" key={goal.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>{goal.name}</h3>
              <span>{goal.progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="fill" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }} />
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span>{formatCurrency(goal.currentCents)} de {formatCurrency(goal.targetCents)}</span>
              <button>+ Aporte</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
