import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="header">
      <div className="header-inner">
        <h1>Financa Familiar</h1>
        <nav className="nav">
          <Link href="/" className={location === "/" ? "active" : ""}>
            Visao do Mes
          </Link>
          <Link href="/transactions" className={location === "/transactions" ? "active" : ""}>
            Lancamentos
          </Link>
          <Link href="/payment-methods" className={location === "/payment-methods" ? "active" : ""}>
            Metodos
          </Link>
          <Link href="/annual" className={location === "/annual" ? "active" : ""}>
            Panorama Anual
          </Link>
          <Link href="/goals" className={location === "/goals" ? "active" : ""}>
            Metas
          </Link>
          <Link href="/investments" className={location === "/investments" ? "active" : ""}>
            Investimentos
          </Link>
          <Link href="/recurrences" className={location === "/recurrences" ? "active" : ""}>
            Recorrencias
          </Link>
        </nav>
      </div>
    </header>
  );
}
