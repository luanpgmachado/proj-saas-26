import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import Header from "./components/Header";

// Code-splitting por rota: reduz JS inicial e melhora TTI/FID em conexoes lentas.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const AnnualView = lazy(() => import("./pages/AnnualView"));
const Goals = lazy(() => import("./pages/Goals"));
const Investments = lazy(() => import("./pages/Investments"));
const Recurrences = lazy(() => import("./pages/Recurrences"));

export default function App() {
  return (
    <div>
      <Header />
      <div className="container">
        <Suspense fallback={<div className="card">Carregando...</div>}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/payment-methods" component={PaymentMethods} />
            <Route path="/annual" component={AnnualView} />
            <Route path="/goals" component={Goals} />
            <Route path="/investments" component={Investments} />
            <Route path="/recurrences" component={Recurrences} />
          </Switch>
        </Suspense>
      </div>
    </div>
  );
}
