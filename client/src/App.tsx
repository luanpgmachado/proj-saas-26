import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { LayoutAplicativo } from "./components/LayoutAplicativo";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Code-splitting por rota: reduz JS inicial e melhora TTI/FID em conexoes lentas.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const AnnualView = lazy(() => import("./pages/AnnualView"));
const Goals = lazy(() => import("./pages/Goals"));
const Investments = lazy(() => import("./pages/Investments"));
const Recurrences = lazy(() => import("./pages/Recurrences"));
const Categories = lazy(() => import("./pages/Categories"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

export default function App() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return (
      <Switch>
        <Route path="/criar-conta" component={CreateAccount} />
        <Route path="/esqueci-senha" component={ForgotPassword} />
        <Route path="/redefinir-senha" component={ResetPassword} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <LayoutAplicativo>
      <Suspense fallback={<div className="surface-card p-5 mt-8">Carregando...</div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/payment-methods" component={PaymentMethods} />
          <Route path="/annual" component={AnnualView} />
          <Route path="/goals" component={Goals} />
          <Route path="/investments" component={Investments} />
          <Route path="/recurrences" component={Recurrences} />
          <Route path="/categories" component={Categories} />
          {usuario.isAdmin ? <Route path="/admin/users" component={AdminUsers} /> : null}
        </Switch>
      </Suspense>
    </LayoutAplicativo>
  );
}
