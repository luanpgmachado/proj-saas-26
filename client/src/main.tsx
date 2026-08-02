import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CompetenciaMensalProvider } from "./context/CompetenciaMensalContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <CompetenciaMensalProvider>
        <App />
      </CompetenciaMensalProvider>
    </AuthProvider>
  </React.StrictMode>
);
