/**
 * As notificações que acontecem em uso — hoje, só a de "responderam você".
 *
 * A tela `/notifications` já tinha avisos de exemplo escritos à mão (lançamento,
 * oferta, sequência). Estes aqui são diferentes: **nascem de uma ação sua**.
 * Quando você responde alguém, o leitor do esqueleto responde de volta (ver
 * `replies.ts`) e isso vira uma linha aqui.
 *
 * **A honestidade da coisa:** num app de verdade, quem é avisado é a *outra*
 * pessoa quando você responde a ela. Aqui não há a outra pessoa — há o
 * esqueleto. Então a gente mostra o outro lado do mesmo ciclo: o leitor
 * fictício reage e *você* recebe o aviso, para dar de ver como vai funcionar.
 * Quando houver servidor, some a simulação e entra a notificação real.
 *
 * Mora no `localStorage`, como o resto do protótipo.
 */

import { readSettings } from "@/lib/settings";

const STORAGE_KEY = "allbook_notifications";

/**
 * Avisa que as notificações mudaram (nova, lida, todas lidas).
 *
 * O sino mora no TopNav, que é global e está sempre montado; a notificação
 * nasce lá no `CommentThread` e é lida na tela `/notifications` — componentes
 * distantes que o React não conecta sozinho. O mesmo padrão de evento no
 * `window` do `search.ts` e do `playback.ts`: quem mexe na lista dispara, o
 * sino escuta e recalcula o contador. Sem isto, a bolinha do sino só mudaria
 * ao recarregar a página.
 */
export const NOTIFICATIONS_EVENT = "allbook:notifications-changed";

function emitChange(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

export interface ReplyNotification {
  id: string;
  /** Quem respondeu — `slug` de um leitor em `community.ts`. */
  fromSlug: string;
  /**
   * O livro onde a conversa está, para o toque levar de volta a ela.
   *
   * **Opcional desde 30/07**, quando o comentário de post entrou: post pode não
   * ter livro nenhum, e o destino dele é o post. Um dos dois campos existe sempre
   * — `bookId` para a conversa do livro, `postId` para o feed.
   */
  bookId?: number;
  /** O post comentado, para o toque abrir `/post/:id`. */
  postId?: string;
  /**
   * O clube, quando o aviso é de convite (aceito, recusado ou entrada).
   *
   * Entrou em 30/07 com os convites (§4.58, item 5). É o terceiro destino
   * possível — e a validação abaixo aceita os três, porque um aviso sem destino
   * é um aviso que não leva a lugar nenhum.
   */
  clubeId?: string;
  /**
   * A comunidade do fórum, quando o aviso é a resposta a um **convite de
   * evento** (31/07). É o quarto destino: o toque abre `/forum/:id`, onde o
   * evento mora com a contagem de quem vai.
   */
  forumId?: string;
  /**
   * A **sala de escuta ao vivo** (31/07, §4.81) — o quinto destino.
   *
   * O toque abre `/sala/:id`. Entrou porque a sala nascia muda: ninguém ficava
   * sabendo que uma tinha aberto, nem que fora chamado para uma, nem que a
   * sessão marcada ia começar. Uma sala que ninguém sabe que existe é uma sala
   * vazia — o cenário que o desenho inteiro tenta evitar.
   */
  salaId?: string;
  /** O trecho da resposta, mostrado no aviso. */
  text: string;
  /** ISO. */
  date: string;
  read: boolean;
}

export function readNotifications(): ReplyNotification[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .filter(
        (item): item is ReplyNotification =>
          item &&
          typeof item.fromSlug === "string" &&
          typeof item.text === "string" &&
          typeof item.date === "string" &&
          // Um destino, sempre: livro, post, clube, comunidade ou sala ao vivo.
          (typeof item.bookId === "number" ||
            typeof item.postId === "string" ||
            typeof item.clubeId === "string" ||
            typeof item.forumId === "string" ||
            typeof item.salaId === "string"),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

/**
 * Avisos de sistema (lançamento, oferta, sequência…). São mock e vivem em
 * `Notifications.tsx`, mas o estado de "lida" mora aqui, no `localStorage`, para
 * o sino do TopNav poder contá-los também — antes ele só via as respostas e
 * ficava limpo mesmo com avisos de sistema por ler. Os ids abaixo são os que
 * nascem NÃO-lidos; precisam bater com `avisosDoSistema()` em `Notifications.tsx`.
 */
const SYSTEM_READ_KEY = "allbook_system_read";
export const SYSTEM_UNREAD_IDS = ["s1", "s2", "s3"];

function readSystemRead(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(SYSTEM_READ_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Um aviso de sistema está lido? Os que nascem lidos contam sempre como lidos. */
export function isSystemRead(id: string): boolean {
  return !SYSTEM_UNREAD_IDS.includes(id) || readSystemRead().includes(id);
}

export function markSystemRead(id: string): void {
  const atual = readSystemRead();
  if (SYSTEM_UNREAD_IDS.includes(id) && !atual.includes(id)) {
    localStorage.setItem(SYSTEM_READ_KEY, JSON.stringify([...atual, id]));
    emitChange();
  }
}

export function markAllSystemRead(): void {
  localStorage.setItem(SYSTEM_READ_KEY, JSON.stringify(SYSTEM_UNREAD_IDS));
  emitChange();
}

function unreadSystemCount(): number {
  const lidos = readSystemRead();
  return SYSTEM_UNREAD_IDS.filter((id) => !lidos.includes(id)).length;
}

/**
 * **Os avisos que você quer ver** — o mesmo `readNotifications`, respeitando o
 * interruptor "comentários no que eu escrevi" (§4.92).
 *
 * ⚠️ **Ele só cala comentário**, e a distinção importa: um aviso com `postId` ou
 * `bookId` é alguém falando no que você escreveu, e é isso que o interruptor
 * governa. Convite de clube, resposta a convite de evento e **sala ao vivo**
 * continuam passando — são coisas que pedem uma decisão sua ou que expiram em
 * uma hora, e calá-las junto seria transformar um ajuste de barulho num
 * apagador de recado.
 */
export function avisosQueQueroVer(): ReplyNotification[] {
  const todos = readNotifications();
  if (readSettings().avisarComentarios) return todos;
  return todos.filter((aviso) => aviso.bookId === undefined && aviso.postId === undefined);
}

export function unreadNotificationCount(): number {
  /* `avisosQueQueroVer`, e não `readNotifications`: com o aviso de comentário
     desligado, o sino não pode continuar contando o que a tela não mostra. */
  const respostas = avisosQueQueroVer().filter((item) => !item.read).length;
  return respostas + unreadSystemCount();
}

export function addNotification(entry: {
  fromSlug: string;
  /** Um dos cinco: livro, post, clube, comunidade do fórum ou sala ao vivo. */
  bookId?: number;
  postId?: string;
  clubeId?: string;
  forumId?: string;
  salaId?: string;
  text: string;
}): ReplyNotification[] {
  const notification: ReplyNotification = {
    id: `n-${Date.now()}`,
    fromSlug: entry.fromSlug,
    ...(entry.bookId !== undefined ? { bookId: entry.bookId } : {}),
    ...(entry.postId !== undefined ? { postId: entry.postId } : {}),
    ...(entry.clubeId !== undefined ? { clubeId: entry.clubeId } : {}),
    ...(entry.forumId !== undefined ? { forumId: entry.forumId } : {}),
    ...(entry.salaId !== undefined ? { salaId: entry.salaId } : {}),
    text: entry.text,
    date: new Date().toISOString(),
    read: false,
  };

  const next = [notification, ...readNotifications()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitChange();
  return next;
}

export function markNotificationRead(id: string): ReplyNotification[] {
  const next = readNotifications().map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitChange();
  return next;
}

export function markAllNotificationsRead(): ReplyNotification[] {
  const next = readNotifications().map((item) => ({ ...item, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitChange();
  return next;
}
