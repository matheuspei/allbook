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

import { catalog, type Book } from "@/lib/books";

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
   *
   * **Vale só quando o estúdio grava** (26/07, ver ROTEIRO 4.26). Se o livro já
   * tem narração publicada, o AllBook traz a que existe e a voz não se aplica —
   * por isso a tela pergunta "quem narra, **se** o estúdio gravar", em vez de
   * guardar uma escolha que pode nunca valer.
   */
  voiceSlug?: string;
  /** ISO completo — ordena do mais novo para o mais velho. */
  date: string;
  status: RequestStatus;
}

export const MAX_REQUEST_TITLE = 120;
export const MAX_REQUEST_NOTE = 300;

/**
 * As etapas na ordem, para a tela desenhar a trilha.
 *
 * A segunda etapa é a que responde a pergunta que a pessoa não tinha como
 * responder: **já existe narração deste livro?** É ali que o pedido se divide em
 * "trazer a que existe" ou "gravar do zero" — e é por isso que a etapa está
 * escrita como pergunta, e não como "procurando o texto" (o nome antigo, que
 * escondia justamente a bifurcação).
 */
export const REQUEST_STEPS: { status: RequestStatus; label: string; hint: string }[] = [
  { status: "recebido", label: "Recebido", hint: "Seu pedido está registrado." },
  {
    status: "procurando",
    label: "Já existe narração?",
    hint: "O AllBook acha a obra e vê se ela já ganhou versão em áudio.",
  },
  {
    status: "produzindo",
    label: "Trazendo ou gravando",
    hint: "Se já existe, a narração original é preparada. Se não, uma voz do estúdio grava o livro inteiro.",
  },
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
 * Este livro **já está no AllBook**? Devolve o título do catálogo, ou `null`.
 *
 * É a primeira das três respostas possíveis a um pedido, e a única que o app
 * consegue dar **na hora**, sem servidor: o que está no catálogo, ele conhece.
 * Serve para não deixar ninguém pedir — e esperar 24 horas por — um livro que já
 * pode ouvir agora. As outras duas respostas ("já existe narração publicada lá
 * fora" e "ninguém narrou ainda") dependem de uma base de audiolivros que o
 * frontend não tem; elas ficam para a etapa `procurando` do pedido.
 *
 * Casa por igualdade do título sem acento, ou por pedaço com **5 letras ou
 * mais** contido no título. O piso de 5 existe para "o", "de" e "um" não
 * casarem com meio catálogo; e o casamento é só por título, nunca por autor —
 * pedir "Stephen King" não é pedir *O Iluminado*.
 */
export function alreadyInCatalog(title: string): Book | null {
  const alvo = normalizar(title);
  if (alvo.length < 3) return null;

  const igual = catalog.find((livro) => normalizar(livro.title) === alvo);
  if (igual) return igual;

  if (alvo.length < 5) return null;
  return catalog.find((livro) => normalizar(livro.title).includes(alvo)) ?? null;
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
