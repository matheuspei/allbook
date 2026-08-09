/**
 * Esta página é a **moldura de prévia**, e não o app?
 *
 * Em desenvolvimento o app aparece dentro de uma moldura de telefone que é um
 * `<iframe>` de verdade (ver `components/DevMobileWrapper.tsx` para o porquê).
 * Isso faz a mesma URL carregar **duas vezes**: a página de cima, que desenha só
 * a moldura, e a de dentro do iframe, onde o app roda.
 *
 * Módulo que tenha efeito ao ser carregado — falar com o servidor, instalar
 * ouvinte, escrever no `localStorage` — precisa saber em qual dos dois está,
 * senão faz tudo em dobro. É o caso do `lib/auth.ts`.
 *
 * Fica aqui, e não no componente, para que `lib/` não passe a depender de um
 * `.tsx` de desenvolvimento. Em produção é sempre `false` — e como a conta é uma
 * constante de `import.meta.env.DEV`, o empacotador apaga o ramo morto.
 *
 * ⚠️ **E só para quem acessa da própria máquina.** Quando o servidor de
 * desenvolvimento é exposto por um túnel para mostrar o app a alguém de longe
 * (09/08), quem abre o link é uma pessoa, não um programador: ela via a barra
 * de aparelhos e o app preso num desenho de telefone dentro do próprio telefone.
 * De fora, o app aparece inteiro na tela, como um app.
 */
const ACESSO_LOCAL = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(window.location.hostname);

export const EH_A_MOLDURA = import.meta.env.DEV && ACESSO_LOCAL && window.self === window.top;
