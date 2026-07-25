/**
 * Os livros que VOCÊ pediu — o diferencial do AllBook, do lado do usuário.
 *
 * **Por que isto existe.** A ideia central do app (ver ROTEIRO, "Modelo de
 * negócio") é que a pessoa possa escolher **qualquer** livro: se ele nunca
 * ganhou versão em áudio, o AllBook Studio produz a narração. Até aqui isso
 * existia só como visão escrita — **não havia lugar nenhum no app onde pedir**.
 * O catálogo era uma vitrine fechada: o que não estava nele simplesmente não
 * existia para quem usa.
 *
 * **O que é esqueleto e o que é de verdade, para ninguém se enganar depois:** o
 * pedido é guardado no `localStorage` deste aparelho, como a biblioteca e os
 * comentários. Ele **não sai daqui** — não há servidor para receber, nem fila,
 * nem estúdio ligado do outro lado. Por isso todo pedido nasce e permanece em
 * `recebido`: fingir que ele avançou para "em produção" seria mentir para o
 * dono do app. Os outros estados existem no tipo porque são o caminho que o
 * pedido vai percorrer quando houver servidor, e a tela mostra esse caminho
 * como trilha — o que vem, não o que já aconteceu.
 */

const STORAGE_KEY = "allbook_book_requests";

/**
 * O caminho de um pedido, do envio à narração pronta.
 *
 * `procurando` é a etapa que o Matheus descreveu como o ecossistema
 * automatizado: achar o texto do livro, cruzar as fontes, puxar capa e ficha.
 */
export type RequestStatus = "recebido" | "procurando" | "produzindo" | "pronto";

export interface BookRequest {
  id: string;
  /** O que a pessoa quer ouvir. Único campo obrigatório. */
  title: string;
  author?: string;
  /** Detalhe livre: edição preferida, idioma, "é o da capa azul". */
  note?: string;
  /**
   * A voz escolhida, pelo `slug` em `studio.ts`.
   *
   * **Vazio quer dizer "o estúdio escolhe"**, e esse é o padrão — não um campo
   * esquecido. Quem não conhece as vozes não deve ser obrigado a escolher uma
   * para poder pedir; quem conhece, escolhe. As duas coisas são decisões
   * legítimas, e por isso a ausência tem significado próprio.
   */
  voiceSlug?: string;
  /** ISO completo — ordena do mais novo para o mais velho. */
  date: string;
  status: RequestStatus;
}

export const MAX_REQUEST_TITLE = 120;
export const MAX_REQUEST_NOTE = 300;

/** As etapas na ordem, para a tela desenhar a trilha. */
export const REQUEST_STEPS: { status: RequestStatus; label: string; hint: string }[] = [
  { status: "recebido", label: "Recebido", hint: "Seu pedido está registrado." },
  { status: "procurando", label: "Procurando o texto", hint: "O AllBook localiza a obra e a ficha." },
  { status: "produzindo", label: "Em produção", hint: "Uma voz do estúdio grava o livro inteiro." },
  { status: "pronto", label: "Pronto", hint: "Em até 24 horas a narração entra no catálogo — e é sua." },
];

/**
 * A promessa de prazo, num lugar só.
 *
 * É a propaganda central do produto ("qualquer livro em 24 horas", palavras do
 * Matheus em 25/07) e aparece em mais de uma tela. Mora aqui para não haver duas
 * versões do prazo no app no dia em que ele mudar.
 */
export const REQUEST_PROMISE = "em até 24 horas";

export function readRequests(): BookRequest[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is BookRequest =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.date === "string" &&
        typeof item.status === "string",
    );
  } catch {
    return [];
  }
}

/** Do mais novo para o mais velho — o pedido de agora aparece em cima. */
export function myRequests(): BookRequest[] {
  return readRequests().sort((a, b) => b.date.localeCompare(a.date));
}

function save(list: BookRequest[]): BookRequest[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

/**
 * Registra um pedido. Devolve a lista nova para a tela já mostrar.
 *
 * Quando houver API, isto vira um POST e o resto da tela não muda — ela já lê
 * de uma função, não do `localStorage` direto.
 */
export function addRequest(entrada: {
  title: string;
  author?: string;
  note?: string;
  voiceSlug?: string;
}): BookRequest[] {
  const title = entrada.title.trim().slice(0, MAX_REQUEST_TITLE);
  if (!title) return readRequests();

  const pedido: BookRequest = {
    id: `req-${Date.now()}`,
    title,
    author: entrada.author?.trim() || undefined,
    note: entrada.note?.trim().slice(0, MAX_REQUEST_NOTE) || undefined,
    voiceSlug: entrada.voiceSlug || undefined,
    date: new Date().toISOString(),
    status: "recebido",
  };

  return save([...readRequests(), pedido]);
}

export function removeRequest(id: string): BookRequest[] {
  return save(readRequests().filter((item) => item.id !== id));
}

/**
 * Já pedi este título? Compara sem acento e sem caixa, porque quem pede duas
 * vezes normalmente digitou diferente ("Duna" e "duna"), não pediu dois livros.
 */
export function alreadyRequested(title: string): boolean {
  const alvo = normalizar(title);
  return readRequests().some((pedido) => normalizar(pedido.title) === alvo);
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
