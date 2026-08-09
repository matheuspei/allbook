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
 */
export const EH_A_MOLDURA = import.meta.env.DEV && window.self === window.top;
