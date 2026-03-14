import type { ComponentType } from "react";

type TipoVariacao = "positiva" | "negativa" | "neutra";

type Props = {
  titulo: string;
  valor: string;
  variacao?: string;
  tipoVariacao?: TipoVariacao;
  Icone: ComponentType<{ className?: string }>;
  classIcone?: string;
};

export function CartaoMetrica({
  titulo,
  valor,
  variacao,
  tipoVariacao = "neutra",
  Icone,
  classIcone,
}: Props) {
  const corVariacao =
    tipoVariacao === "positiva"
      ? "text-success"
      : tipoVariacao === "negativa"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{valor}</p>
          {variacao ? <p className={["text-xs mt-1", corVariacao].join(" ")}>{variacao}</p> : null}
        </div>
        <div className={["w-9 h-9 rounded-lg flex items-center justify-center shrink-0", classIcone ?? "bg-muted text-muted-foreground"].join(" ")}>
          <Icone className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

