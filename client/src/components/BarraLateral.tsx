import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Tags,
  CreditCard,
  ChevronLeft,
  Wallet,
  Target,
  LineChart,
} from "lucide-react";
import { LinkNavegacao } from "./LinkNavegacao";

type ItemNav = {
  href: string;
  titulo: string;
  Icone: any;
};

const CHAVE_RECOLHIDA = "ui.sidebar.recolhida";

export function BarraLateral() {
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    const valor = localStorage.getItem(CHAVE_RECOLHIDA);
    if (valor === "1") setRecolhida(true);
  }, []);

  const alternar = () => {
    setRecolhida((atual) => {
      const proximo = !atual;
      localStorage.setItem(CHAVE_RECOLHIDA, proximo ? "1" : "0");
      return proximo;
    });
  };

  const navPrincipal: ItemNav[] = useMemo(
    () => [
      { href: "/", titulo: "Dashboard", Icone: LayoutDashboard },
      { href: "/transactions", titulo: "Lançamentos", Icone: Receipt },
      { href: "/recurrences", titulo: "Recorrências", Icone: Repeat },
      { href: "/annual", titulo: "Panorama Anual", Icone: LineChart },
      { href: "/goals", titulo: "Metas", Icone: Target },
      { href: "/investments", titulo: "Investimentos", Icone: Wallet },
    ],
    []
  );

  const navConfig: ItemNav[] = useMemo(
    () => [
      { href: "/categories", titulo: "Categorias", Icone: Tags },
      { href: "/payment-methods", titulo: "Métodos de Pagamento", Icone: CreditCard },
    ],
    []
  );

  return (
    <aside
      className={[
        "relative flex flex-col bg-sidebar h-screen sticky top-0 transition-smooth",
        recolhida ? "w-16" : "w-60",
      ].join(" ")}
      aria-label="Menu principal"
    >
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
        </div>
        {recolhida ? null : (
          <span className="font-semibold text-foreground text-sm tracking-tight">Finança Familiar</span>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
        <div>
          {recolhida ? null : (
            <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">
              Principal
            </p>
          )}
          <ul className="space-y-0.5">
            {navPrincipal.map((item) => (
              <li key={item.href}>
                <LinkNavegacao href={item.href} titulo={item.titulo} Icone={item.Icone} recolhida={recolhida} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          {recolhida ? null : (
            <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">
              Configurações
            </p>
          )}
          <ul className="space-y-0.5">
            {navConfig.map((item) => (
              <li key={item.href}>
                <LinkNavegacao href={item.href} titulo={item.titulo} Icone={item.Icone} recolhida={recolhida} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <button
        type="button"
        onClick={alternar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
        aria-label={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
      >
        <ChevronLeft className={["w-3.5 h-3.5 transition-smooth", recolhida ? "rotate-180" : ""].join(" ")} />
      </button>
    </aside>
  );
}

