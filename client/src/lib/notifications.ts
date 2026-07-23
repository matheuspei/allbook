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
  /** O livro onde a conversa está, para o toque levar de volta a ela. */
  bookId: number;
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
          typeof item.bookId === "number" &&
          typeof item.text === "string" &&
          typeof item.date === "string",
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function unreadNotificationCount(): number {
  return readNotifications().filter((item) => !item.read).length;
}

export function addNotification(entry: {
  fromSlug: string;
  bookId: number;
  text: string;
}): ReplyNotification[] {
  const notification: ReplyNotification = {
    id: `n-${Date.now()}`,
    fromSlug: entry.fromSlug,
    bookId: entry.bookId,
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
