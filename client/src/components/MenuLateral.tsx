import { Link, useLocation } from "wouter";

type ItemMenu = {
  href: string;
  label: string;
};

type GrupoMenu = {
  titulo: string;
  itens: ItemMenu[];
};

const grupos: GrupoMenu[] = [
  {
    titulo: "Visão",
    itens: [
      { href: "/", label: "Visão do Mês" },
      { href: "/annual", label: "Panorama Anual" },
    ],
  },
  {
    titulo: "Operação",
    itens: [
      { href: "/transactions", label: "Lançamentos" },
      { href: "/recurrences", label: "Recorrências" },
    ],
  },
  {
    titulo: "Planejamento",
    itens: [
      { href: "/goals", label: "Metas" },
      { href: "/investments", label: "Investimentos / Reserva" },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [{ href: "/payment-methods", label: "Métodos de Pagamento" }],
  },
];

const estaAtivo = (location: string, href: string) => {
  if (href === "/") return location === "/";
  return location === href || location.startsWith(`${href}/`);
};

export default function MenuLateral() {
  const [location] = useLocation();

  return (
    <aside className="menu-lateral" aria-label="Menu principal">
      {grupos.map((grupo) => (
        <div
          className={grupo.itens.some((item) => estaAtivo(location, item.href)) ? "menu-grupo active" : "menu-grupo"}
          key={grupo.titulo}
        >
          <div className="menu-grupo-titulo">{grupo.titulo}</div>
          <nav className="menu-grupo-itens" aria-label={grupo.titulo}>
            {grupo.itens.map((item) => {
              const ativo = estaAtivo(location, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={ativo ? "menu-item active" : "menu-item"}
                  aria-current={ativo ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
