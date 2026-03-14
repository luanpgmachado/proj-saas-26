import type { ReactNode } from "react";

type Props = {
  titulo: string;
  subtitulo?: string;
  seletorDireita?: ReactNode;
  acaoDireita?: ReactNode;
};

export function CabecalhoConteudo({ titulo, subtitulo, seletorDireita, acaoDireita }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between py-8">
      <div>
        <h2 className="text-2xl font-semibold">{titulo}</h2>
        {subtitulo ? <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p> : null}
      </div>
      <div className="flex items-center gap-3 sm:pt-1">
        {seletorDireita}
        {acaoDireita}
      </div>
    </div>
  );
}

