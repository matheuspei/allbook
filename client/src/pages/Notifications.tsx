import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Flame, Gift, Mic, Sparkles, Tag } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { getBooksByIds } from "@/lib/books";

/**
 * Notificações (`/notifications`).
 *
 * Sem backend, os avisos são de exemplo — mas apontam para livros que existem
 * de verdade no catálogo, para os links funcionarem. Quando a API existir,
 * `initialItems` vira uma chamada com TanStack Query.
 */

type Notification = {
  id: number;
  icon: typeof Bell;
  title: string;
  body: string;
  time: string;
  bookId?: number;
  unread: boolean;
};

// Confere se os livros citados existem antes de montar os avisos.
const [duna, habitos, iluminado, psicologia] = getBooksByIds([7, 102, 105, 101]);

const initialItems: Notification[] = [
  {
    id: 1,
    icon: Sparkles,
    title: "Novo na AllBook",
    body: `${duna?.title ?? "Duna"} chegou ao catálogo, narrado na íntegra.`,
    time: "há 2 horas",
    bookId: duna?.id,
    unread: true,
  },
  {
    id: 2,
    icon: Flame,
    title: "Sua sequência continua",
    body: "3 semanas seguidas ouvindo. Faltam 15 minutos para manter a de hoje.",
    time: "há 5 horas",
    unread: true,
  },
  {
    id: 3,
    icon: Mic,
    title: "Novo narrador",
    body: `${iluminado?.title ?? "O Iluminado"} ganhou uma nova narração.`,
    time: "ontem",
    bookId: iluminado?.id,
    unread: true,
  },
  {
    id: 4,
    icon: Tag,
    title: "Livro da sua lista em oferta",
    body: `${psicologia?.title ?? "A Psicologia Financeira"} está com 40% de desconto esta semana.`,
    time: "há 2 dias",
    bookId: psicologia?.id,
    unread: false,
  },
  {
    id: 5,
    icon: Gift,
    title: "Um mês grátis para indicar",
    body: "Convide alguém e vocês dois ganham 30 dias de Premium.",
    time: "há 4 dias",
    unread: false,
  },
  {
    id: 6,
    icon: Bell,
    title: "Você parou no capítulo 4",
    body: `Continue ${habitos?.title ?? "Hábitos Atômicos"} de onde parou.`,
    time: "há 1 semana",
    bookId: habitos?.id,
    unread: false,
  },
];

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<Notification[]>(initialItems);

  const unreadCount = items.filter((item) => item.unread).length;

  function open(item: Notification) {
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry))
    );
    if (item.bookId) setLocation(`/book/${item.bookId}`);
  }

  function markAllRead() {
    setItems((current) => current.map((entry) => ({ ...entry, unread: false })));
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="notifications-page">
      <PageHeader
        title="Notificações"
        fallback="/profile"
        action={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-white/50 hover:text-white transition-colors shrink-0"
              data-testid="button-mark-all-read"
            >
              Marcar todas
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="px-8 py-24 text-center space-y-4" data-testid="notifications-empty">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
            <Bell className="w-7 h-7 text-white/20" />
          </div>
          <h2 className="text-lg font-bold font-display">Nada por aqui</h2>
          <p className="text-sm text-white/40">Seus avisos aparecem nesta tela.</p>
        </div>
      ) : (
        <div className="px-5" data-testid="notifications-list">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => open(item)}
                className="w-full flex items-start gap-3 py-4 border-b border-white/5 text-left hover:bg-white/[0.03] transition-colors"
                data-testid={`notification-${item.id}`}
              >
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white/50" strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm line-clamp-1 ${
                        item.unread ? "font-semibold text-white" : "font-medium text-white/70"
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-label="Não lida" />
                    )}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed mt-1">{item.body}</p>
                  <p className="text-[11px] text-white/25 mt-1.5">{item.time}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
