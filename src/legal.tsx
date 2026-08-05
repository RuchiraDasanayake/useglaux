import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/marcellus/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-500.css";
import "@fontsource/schibsted-grotesk/latin-700.css";
import "@fontsource/spline-sans-mono/latin-400.css";
import "@fontsource/spline-sans-mono/latin-500.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";
import "./styles/legal.css";
import LegalApp from "./legal/LegalApp";
import { PRIVACY, TERMS } from "./legal/documents";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root was not found.");

const documentType = document.documentElement.dataset.document;
const legalDocument = documentType === "privacy" ? PRIVACY : TERMS;

createRoot(container).render(
  <StrictMode>
    <LegalApp document={legalDocument} />
  </StrictMode>,
);
