import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SidebarProvider } from "./context/SidebarContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </LanguageProvider>
  </React.StrictMode>
);
