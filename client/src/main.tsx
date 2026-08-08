import { createRoot } from "react-dom/client";
import App from "./App";
import DevMobileWrapper from "./components/DevMobileWrapper";
import "./index.css";

/**
 * Confere a sessão com o servidor e traz os dados da conta, **em toda abertura
 * do app** (§4.121).
 *
 * Fica aqui, e não numa tela, por um furo concreto: `lib/auth.ts` só é
 * importado por `Login.tsx` e `You.tsx`, então quem recarregasse a página na
 * Início nunca sincronizaria — a biblioteca da conta só apareceria depois de
 * passar por uma dessas duas telas, sem nada na tela explicando o porquê.
 *
 * O `import` sozinho basta: o módulo faz o trabalho ao ser carregado, e não
 * bloqueia a renderização (é assíncrono lá dentro). Sem sessão, ele não fala com
 * a rede nem mexe em nada.
 */
import "./lib/auth";

createRoot(document.getElementById("root")!).render(
  <DevMobileWrapper>
    <App />
  </DevMobileWrapper>
);
