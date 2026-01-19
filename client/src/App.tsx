import { Route, Switch } from "wouter";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import PaymentMethods from "./pages/PaymentMethods";
import AnnualView from "./pages/AnnualView";
import Goals from "./pages/Goals";
import Investments from "./pages/Investments";

export default function App() {
  return (
    <div>
      <Header />
      <div className="container">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/payment-methods" component={PaymentMethods} />
          <Route path="/annual" component={AnnualView} />
          <Route path="/goals" component={Goals} />
          <Route path="/investments" component={Investments} />
        </Switch>
      </div>
    </div>
  );
}
