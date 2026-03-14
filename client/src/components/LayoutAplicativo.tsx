import type { ReactNode } from "react";
import { BarraLateral } from "./BarraLateral";

type Props = {
  children: ReactNode;
};

export function LayoutAplicativo({ children }: Props) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <BarraLateral />
      <main className="flex-1 overflow-x-hidden">
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-card focus-ring"
          href="#conteudo"
        >
          Pular para o conteúdo
        </a>
        <div id="conteudo" tabIndex={-1} className="max-w-6xl mx-auto px-6 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}

