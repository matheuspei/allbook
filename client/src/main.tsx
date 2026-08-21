import { createRoot } from "react-dom/client";
import { carregarCatalogo } from "./lib/books";
import { EH_A_MOLDURA } from "./lib/dev-moldura";
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

/**
 * O catálogo vem do banco, e é esperado **antes de as telas serem sequer
 * carregadas** (21/08).
 *
 * 🚨 **Por que o `App` entra por `import()` e não por `import` normal.** Esta é
 * a armadilha que custou uma rodada de teste: um `import` estático é avaliado
 * **antes da primeira linha deste arquivo rodar**. Como várias telas calculam
 * coisas no nível do módulo — `Home.tsx` tem `const heroBooks =
 * destaquesDaCapa()` e `const continueListening = getBooksByIds([1, 7, 4])` —,
 * elas leriam o catálogo ainda vazio e guardariam listas vazias para sempre.
 * Foi exatamente o que aconteceu: o app abriu, as fileiras de baixo apareceram
 * (essas são calculadas no render) e o billboard do topo ficou um retângulo
 * preto, sem erro nenhum no console.
 *
 * Com o `import()` dinâmico depois do `await`, todo módulo de tela é avaliado
 * com o catálogo já cheio, e nenhuma tela precisou mudar.
 *
 * ⚠️ Na **moldura de prévia** (o frame de fora, que só desenha o telefone) o
 * catálogo não é pedido — a mesma URL carrega duas vezes, e sem esta guarda o
 * app baixaria o catálogo inteiro em dobro a cada abertura.
 */
async function abrir() {
  if (!EH_A_MOLDURA) await carregarCatalogo();

  const [{ default: App }, { default: DevMobileWrapper }] = await Promise.all([
    import("./App"),
    import("./components/DevMobileWrapper"),
  ]);

  createRoot(document.getElementById("root")!).render(
    <DevMobileWrapper>
      <App />
    </DevMobileWrapper>
  );
}

void abrir();
