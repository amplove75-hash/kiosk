import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import "./styles/kiosk.css";
import "./kiosks/cafe/cafe.css";
import "./scanner/scanner.css";
import "./kiosks/mart/mart.css";
import "./settings";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
