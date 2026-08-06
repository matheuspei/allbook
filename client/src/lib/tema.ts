/**
 * O tema do app — "Estúdio" (escuro) ou "Tinta" (claro).
 *
 * Decisão dele em 06/08 (ROTEIRO §4.112): na folha do redesenho ele escolheu a
 * direção **Estúdio** e pediu, de acréscimo, que a pessoa pudesse **trocar para
 * a direção Tinta** nas configurações. O escuro continua sendo o padrão — é a
 * identidade da casa e é como o app abre na primeira vez.
 *
 * Como funciona, em uma frase: a classe `.dark` no `<html>` liga o bloco escuro
 * do `index.css`; sem ela, valem as cores do `:root`, que são as do tema claro.
 *
 * ⚠️ **Quem aplica o tema na abertura NÃO é este arquivo** — é um script inline
 * no `client/index.html`, que roda antes da primeira pintura para o tema claro
 * não piscar de escuro a cada carregamento. Este módulo cuida do resto: ler,
 * trocar e avisar as telas abertas. A chave do `localStorage` é a mesma nos
 * dois lugares (`allbook_tema`) — mudou aqui, muda lá.
 */

const STORAGE_KEY = "allbook_tema";

export type Tema = "escuro" | "claro";

/** A cor da barra do navegador em cada tema (o `<meta name="theme-color">`). */
const COR_DA_BARRA: Record<Tema, string> = {
  escuro: "#121110",
  claro: "#F4EFE6",
};

/**
 * Evento disparado quando o tema muda **nesta aba**. O `storage` do navegador
 * só avisa as OUTRAS abas, então sem isto a própria tela que trocou o tema não
 * se redesenharia — o mesmo arranjo de `notifications.ts` e `seguidores.ts`.
 */
export const TEMA_EVENT = "allbook:tema";

export function readTema(): Tema {
  try {
    return localStorage.getItem(STORAGE_KEY) === "claro" ? "claro" : "escuro";
  } catch {
    return "escuro";
  }
}

/** Põe (ou tira) a classe `.dark` e acerta a cor da barra do navegador. */
export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle("dark", tema === "escuro");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COR_DA_BARRA[tema]);
}

/** Troca o tema: grava, aplica na hora e avisa quem estiver ouvindo. */
export function setTema(tema: Tema) {
  try {
    localStorage.setItem(STORAGE_KEY, tema);
  } catch {
    /* navegador sem localStorage: o tema vale só até fechar a aba */
  }
  aplicarTema(tema);
  window.dispatchEvent(new Event(TEMA_EVENT));
}

/** Os dois temas, na ordem em que aparecem na tela de ajustes. */
export const TEMAS: { id: Tema; nome: string; descricao: string }[] = [
  {
    id: "escuro",
    nome: "Estúdio",
    descricao: "Grafite quente e vermelho de gravação. O padrão do AllBook.",
  },
  {
    id: "claro",
    nome: "Tinta",
    descricao: "Papel creme e vermelho de editora, para ouvir de dia.",
  },
];
