import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Headphones, Lock, MessageSquare } from "lucide-react";

import { vitrineDeConversas } from "@/lib/activity";
import { catalog } from "@/lib/books";
import { findMember } from "@/lib/community";
import { PLAYBACK_EVENT } from "@/lib/playback";

/**
 * "As conversas da semana" — o topo da aba Conversas da Comunidade.
 *
 * **Duas peças viraram uma (28/07):** a junção das quatro propostas tinha um
 * "top da semana" numerado (da Revista) E cartazes-porta das salas (dos
 * Salões) — e os dois apontavam para as mesmas conversas. Na arrumação que o
 * Matheus pediu ("muita coisa solta"), fundiram: a lista numerada ganhou a
 * alma da porta — o selo 🔥 no mais quente, o "ouvindo" explicando por que
 * subiu, as caras de quem está falando.
 *
 * A ordem vem de `vitrineDeConversas` (o algoritmo que o Matheus ditou:
 * ouvindo → biblioteca → temas → papo novo), o toque cai NA conversa
 * (`/book/:id/conversa`), e a prévia respeita a trava de spoiler.
 */
export default function ConversasDeAgora() {
  const [salas, setSalas] = useState(() => vitrineDeConversas());

  useEffect(() => {
    // Ouvir muda o que está liberado E a ordem: voltar do player recalcula.
    const atualizar = () => setSalas(vitrineDeConversas());
    atualizar();
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    return () => window.removeEventListener(PLAYBACK_EVENT, atualizar);
  }, []);

  if (salas.length === 0) return null;

  return (
    <section className="border-b border-white/10 px-5 pb-5 pt-1" data-testid="conversas-de-agora">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        As conversas da semana
      </h2>

      <div className="space-y-2.5">
        {salas.map((sala, indice) => {
          const book = catalog.find((item) => item.id === sala.bookId);
          if (!book) return null;
          const presas = sala.total - sala.liberadas;
          // As caras de quem está falando — os autores da prévia liberada.
          // `Array.from` e não spread: o alvo do TS deste projeto não itera
          // Set direto (TS2802) — a mesma nota que `sala.ts` já carrega.
          const caras = Array.from(new Set(sala.previa.map((comment) => comment.authorSlug)))
            .map((slug) => findMember(slug))
            .filter((member): member is NonNullable<typeof member> => member !== undefined)
            .slice(0, 2);

          return (
            <Link
              key={sala.bookId}
              href={`/book/${sala.bookId}/conversa`}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
              data-testid={`sala-card-${sala.bookId}`}
            >
              <span className="w-5 shrink-0 text-center font-display text-base font-bold text-primary tabular-nums">
                {indice + 1}
              </span>
              <img
                src={book.cover}
                alt={book.title}
                className="h-[52px] w-10 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {book.title}
                  {indice === 0 && (
                    <span className="ml-2 rounded-full border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary">
                      🔥 quente
                    </span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-white/40">
                  {sala.estouOuvindo && (
                    <span className="flex items-center gap-1 font-medium text-primary/90">
                      <Headphones className="h-3 w-3" />
                      ouvindo
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {sala.total} {sala.total === 1 ? "mensagem" : "mensagens"}
                  </span>
                  {presas > 0 && (
                    <span className="flex items-center gap-1 text-white/30">
                      <Lock className="h-2.5 w-2.5" />
                      {presas}
                    </span>
                  )}
                </p>
              </div>
              {caras.length > 0 && (
                <div className="flex shrink-0">
                  {caras.map((member) => (
                    <span
                      key={member.slug}
                      title={member.name}
                      className={`-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#141414] bg-gradient-to-br ${member.color} text-[9px] font-bold first:ml-0`}
                    >
                      {member.name.charAt(0)}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
