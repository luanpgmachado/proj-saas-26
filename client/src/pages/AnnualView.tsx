import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { CabecalhoConteudo } from "../components/CabecalhoConteudo";
import { ChevronLeft, ChevronRight } from "lucide-react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

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
      <CabecalhoConteudo
        titulo="Panorama Anual"
        subtitulo="Tabela anual de entradas, saídas e saldo"
        seletorDireita={
          <div className="surface-card-sm px-2 py-1.5 flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
              onClick={() => setYear(String(parseInt(year) - 1))}
              aria-label="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4 mx-auto" />
            </button>
            <span className="text-sm font-medium tabular-nums min-w-[80px] text-center">{year}</span>
            <button
              type="button"
              className="w-8 h-8 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
              onClick={() => setYear(String(parseInt(year) + 1))}
              aria-label="Próximo ano"
            >
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          </div>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left font-medium px-5 py-3">Mês</th>
                <th className="text-right font-medium px-5 py-3">Entradas</th>
                <th className="text-right font-medium px-5 py-3">Saídas</th>
                <th className="text-right font-medium px-5 py-3">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, idx) => (
                <tr
                  key={row.month}
                  className={["hover:bg-muted/30 transition-smooth", idx < summary.length ? "border-b border-border" : ""].join(" ")}
                >
                  <td className="px-5 py-3.5 text-muted-foreground">{monthNames[idx] ?? row.month}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium text-success">
                    {formatCurrency(row.entriesCents)}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium text-destructive">
                    {formatCurrency(row.exitsCents)}
                  </td>
                  <td
                    className={[
                      "px-5 py-3.5 text-right tabular-nums font-semibold",
                      row.balanceCents >= 0 ? "text-foreground" : "text-destructive",
                    ].join(" ")}
                  >
                    {formatCurrency(row.balanceCents)}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30">
                <td className="px-5 py-3.5 font-semibold">Total</td>
                <td className="px-5 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(totalEntries)}</td>
                <td className="px-5 py-3.5 text-right tabular-nums font-semibold">{formatCurrency(totalExits)}</td>
                <td
                  className={[
                    "px-5 py-3.5 text-right tabular-nums font-semibold",
                    totalBalance >= 0 ? "text-foreground" : "text-destructive",
                  ].join(" ")}
                >
                  {formatCurrency(totalBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

