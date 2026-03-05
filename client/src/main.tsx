import { createRoot } from "react-dom/client";
import App from "./App";
import DevMobileWrapper from "./components/DevMobileWrapper";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <DevMobileWrapper>
    <App />
  </DevMobileWrapper>
);
