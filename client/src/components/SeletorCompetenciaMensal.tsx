import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useCompetenciaMensal } from "../context/CompetenciaMensalContext";

type Props = {
  recolhida: boolean;
};

const competenciaCurta = (competencia: string) => {
  const [ano, mes] = competencia.split("-").map(Number);
  const doisDigitos = String(mes || 1).padStart(2, "0");
  return `${doisDigitos}/${ano}`;
};

export function SeletorCompetenciaMensal({ recolhida }: Props) {
  const { competenciaMensal, definirCompetenciaMensal, avancarCompetenciaMensal } = useCompetenciaMensal();

  if (recolhida) {
    return (
      <div className="w-full flex justify-center">
        <label
          className="relative w-10 h-10 rounded-xl border border-input bg-surface shadow-card-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background cursor-pointer"
          title={`Competência ativa: ${competenciaCurta(competenciaMensal)}`}
        >
          <span className="sr-only">Competência mensal ativa</span>
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <input
            type="month"
            value={competenciaMensal}
            onChange={(e) => definirCompetenciaMensal(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Competência mensal ativa"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-2.5 rounded-md bg-surface border border-input">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Competência</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 w-full min-w-0">
        <button
          type="button"
          className="w-8 h-8 shrink-0 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
          onClick={() => avancarCompetenciaMensal(-1)}
          aria-label="Competência anterior"
        >
          <ChevronLeft className="w-4 h-4 mx-auto" />
        </button>
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Competência mensal ativa</span>
          <div className="h-8.5 w-full px-2 rounded-md bg-surface border border-input text-[13px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background tabular-nums flex items-center justify-center text-foreground">
            {competenciaCurta(competenciaMensal)}
          </div>
          <input
            type="month"
            value={competenciaMensal}
            onChange={(e) => definirCompetenciaMensal(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Competência mensal ativa"
          />
        </label>
        <button
          type="button"
          className="w-8 h-8 shrink-0 rounded-md hover:bg-secondary text-muted-foreground transition-smooth focus-ring"
          onClick={() => avancarCompetenciaMensal(1)}
          aria-label="Próxima competência"
        >
          <ChevronRight className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
}
