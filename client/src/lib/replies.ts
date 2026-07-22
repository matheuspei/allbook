/**
 * As respostas que vivem no `localStorage` — as suas, e as que os leitores do
 * esqueleto mandam de volta para você.
 *
 * Ficam separadas de `comments.ts` porque são de naturezas diferentes: lá está
 * o esqueleto fixo de leitores fictícios, que é código; aqui está o que *você*
 * escreveu (e o que responderam a você), que é dado e muda em uso. Misturar os
 * dois faria sua conversa sumir na próxima vez que alguém editasse a lista fixa.
 *
 * Quando houver servidor, isto vira POST e GET — a tela que mostra a conversa
 * não muda, porque ela já junta esta fonte com a fixa.
 */

import { community, findMember } from "@/lib/community";

const STORAGE_KEY = "allbook_replies";

export interface MyReply {
  id: string;
  /** O comentário de primeiro nível ao qual esta resposta pertence. */
  parentId: string;
  bookId: number;
  text: string;
  /** ISO completo: a hora ordena as respostas de um mesmo dia. */
  date: string;
  /**
   * Quem escreveu, quando **não** foi você: o `slug` de um leitor do esqueleto.
   * Vazio = a resposta é sua. É o que distingue a resposta que você pode apagar
   * da que veio de outra pessoa.
   */
  fromSlug?: string;
  /**
   * A quem esta resposta se dirige, para o "@Fulano". Como a conversa é plana
   * (um nível só), responder a uma resposta guarda aqui o nome de quem foi
   * respondido — sem isso, dentro de um fio com várias vozes, não dá para saber
   * quem está falando com quem.
   */
  replyToName?: string;
}

/** Quanto cabe numa resposta. Curto de propósito: conversa, não ensaio. */
export const MAX_REPLY = 500;

export function readMyReplies(): MyReply[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is MyReply =>
        item &&
        typeof item.id === "string" &&
        typeof item.parentId === "string" &&
        typeof item.text === "string" &&
        typeof item.date === "string",
    );
  } catch {
    return [];
  }
}

/** As respostas guardadas de um comentário, da mais antiga para a mais nova. */
export function myRepliesTo(parentId: string): MyReply[] {
  return readMyReplies()
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function save(list: MyReply[]): MyReply[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

/**
 * Você responde. Devolve a lista nova para a tela já mostrar. `replyToName`
 * marca a resposta a uma resposta (o "@Fulano").
 */
export function addReply(
  parentId: string,
  bookId: number,
  text: string,
  replyToName?: string,
): MyReply[] {
  const clean = text.trim().slice(0, MAX_REPLY);
  if (!clean) return readMyReplies();

  const reply: MyReply = {
    id: `my-${Date.now()}`,
    parentId,
    bookId,
    text: clean,
    date: new Date().toISOString(),
    replyToName,
  };

  return save([...readMyReplies(), reply]);
}

/**
 * Guarda uma resposta **recebida** de um leitor. Usada pela simulação: quando
 * você responde alguém do esqueleto, essa pessoa responde de volta aqui mesmo.
 */
export function addIncomingReply(reply: {
  parentId: string;
  bookId: number;
  fromSlug: string;
  text: string;
  replyToName: string;
}): MyReply[] {
  const entry: MyReply = {
    id: `in-${Date.now()}`,
    parentId: reply.parentId,
    bookId: reply.bookId,
    text: reply.text,
    date: new Date().toISOString(),
    fromSlug: reply.fromSlug,
    replyToName: reply.replyToName,
  };

  return save([...readMyReplies(), entry]);
}

/**
 * Apaga uma resposta sua.
 *
 * Só as suas (`fromSlug` vazio): não existe apagar o que outra pessoa escreveu,
 * e não deve existir — quem escreveu é dono do que escreveu.
 */
export function removeReply(id: string): MyReply[] {
  const list = readMyReplies();
  const alvo = list.find((item) => item.id === id);
  if (!alvo || alvo.fromSlug) return list; // não é sua: nada a apagar
  return save(list.filter((item) => item.id !== id));
}

/**
 * Uma frase de resposta plausível de um leitor, para a simulação do "responderam
 * você". Curtas e com opinião — inclusive discordando, que é o que dá conversa.
 * **Não é IA escrevendo em tempo real:** é um punhado de falas fixas, escolhidas
 * ao acaso, para o esqueleto reagir sem soar como um robô educado.
 */
const CANNED_REPLIES = [
  "Boa, não tinha pensado por esse lado.",
  "Faz sentido, mas ainda prefiro a minha leitura.",
  "Concordo em parte. O meio se arrasta, o final salva.",
  "Discordo — pra mim a narração é o ponto fraco, não a história.",
  "Isso! Foi exatamente o que senti ouvindo.",
  "Interessante. Vou reouvir prestando atenção nesse ponto.",
];

/**
 * Escolhe quem responde de volta e o que diz. Quem responde é a pessoa a quem
 * você se dirigiu; se não der para saber, um leitor qualquer do esqueleto.
 */
export function simulatedReplyBack(
  toSlug: string,
  yourName: string,
): { fromSlug: string; text: string; replyToName: string } {
  const autor =
    findMember(toSlug) ?? community[Math.floor(Math.random() * community.length)];
  const text = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
  return { fromSlug: autor.slug, text, replyToName: yourName };
}
