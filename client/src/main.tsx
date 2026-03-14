import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CompetenciaMensalProvider } from "./context/CompetenciaMensalContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CompetenciaMensalProvider>
      <App />
    </CompetenciaMensalProvider>
  </React.StrictMode>
);
