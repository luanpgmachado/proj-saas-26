import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ValorContexto = {
  competenciaMensal: string; // YYYY-MM
  definirCompetenciaMensal: (competencia: string) => void;
  avancarCompetenciaMensal: (deltaMeses: number) => void;
};

const CHAVE_STORAGE = "ui.competenciaMensal";

const competenciaAtual = () => {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
};

const normalizarCompetencia = (valor: string): string | null => {
  const texto = String(valor ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(texto)) return null;
  const [anoTexto, mesTexto] = texto.split("-");
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  if (!Number.isFinite(ano) || !Number.isFinite(mes)) return null;
  if (ano < 1900 || ano > 9999) return null;
  if (mes < 1 || mes > 12) return null;
  return `${anoTexto}-${mesTexto}`;
};

const Contexto = createContext<ValorContexto | null>(null);

type Props = {
  children: ReactNode;
};

export function CompetenciaMensalProvider({ children }: Props) {
  const [competenciaMensal, setCompetenciaMensal] = useState(() => {
    const salvo = typeof window !== "undefined" ? window.localStorage.getItem(CHAVE_STORAGE) : null;
    return normalizarCompetencia(salvo ?? "") ?? competenciaAtual();
  });

  useEffect(() => {
    window.localStorage.setItem(CHAVE_STORAGE, competenciaMensal);
  }, [competenciaMensal]);

  const definirCompetenciaMensal = (competencia: string) => {
    const normalizada = normalizarCompetencia(competencia);
    if (!normalizada) return;
    setCompetenciaMensal(normalizada);
  };

  const avancarCompetenciaMensal = (deltaMeses: number) => {
    const [ano, mes] = competenciaMensal.split("-").map(Number);
    const data = new Date(ano, mes - 1 + deltaMeses, 1);
    setCompetenciaMensal(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`);
  };

  const valor = useMemo<ValorContexto>(
    () => ({ competenciaMensal, definirCompetenciaMensal, avancarCompetenciaMensal }),
    [competenciaMensal]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCompetenciaMensal() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useCompetenciaMensal deve ser usado dentro de CompetenciaMensalProvider.");
  return ctx;
}

