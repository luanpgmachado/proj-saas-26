import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="header">
      <h1>Finança Familiar</h1>
      <nav className="nav">
        <Link href="/" className={location === "/" ? "active" : ""}>Visão do Mês</Link>
        <Link href="/transactions" className={location === "/transactions" ? "active" : ""}>Lançamentos</Link>
        <Link href="/payment-methods" className={location === "/payment-methods" ? "active" : ""}>Métodos</Link>
        <Link href="/annual" className={location === "/annual" ? "active" : ""}>Panorama Anual</Link>
        <Link href="/goals" className={location === "/goals" ? "active" : ""}>Metas</Link>
        <Link href="/investments" className={location === "/investments" ? "active" : ""}>Investimentos</Link>
      </nav>
    </header>
  );
}
