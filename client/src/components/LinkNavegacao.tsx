import { Link, useLocation } from "wouter";
import type { ComponentType } from "react";

type Props = {
  href: string;
  titulo: string;
  Icone: ComponentType<{ className?: string }>;
  recolhida: boolean;
};

export function LinkNavegacao({ href, titulo, Icone, recolhida }: Props) {
  const [location] = useLocation();
  const ativo = href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-smooth",
        ativo ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-secondary",
      ].join(" ")}
      aria-current={ativo ? "page" : undefined}
      title={recolhida ? titulo : undefined}
    >
      <Icone className="w-4 h-4 shrink-0" />
      {recolhida ? null : <span>{titulo}</span>}
    </Link>
  );
}

