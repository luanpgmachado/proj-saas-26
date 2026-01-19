import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function PaymentMethods() {
  const [methods, setMethods] = useState<any[]>([]);

  useEffect(() => {
    api.getPaymentMethods().then(setMethods).catch(console.error);
  }, []);

  const nonCards = methods.filter((m) => !m.isCard);
  const cards = methods.filter((m) => m.isCard);

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Métodos de Pagamento</h2>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Métodos Gerais</h3>
        {nonCards.length === 0 ? (
          <p>Nenhum método cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Pago no mês</th>
              </tr>
            </thead>
            <tbody>
              {nonCards.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.type}</td>
                  <td>{m.paidInMonth ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Cartões de Crédito</h3>
        {cards.length === 0 ? (
          <p>Nenhum cartão cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fechamento</th>
                <th>Vencimento</th>
                <th>Pago no mês</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>Dia {m.closingDay}</td>
                  <td>Dia {m.dueDay}</td>
                  <td>{m.paidInMonth ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
