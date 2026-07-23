import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MessageSquare, Sparkles } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import {
  activityFeed,
  relativeDate,
  suggestions,
  type ActivityEvent,
  type Suggestion,
} from "@/lib/activity";
import { findMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";

/**
 * Comunidade (`/community`).
 *
 * **O que ela deixou de ser:** um diretório de nomes. A primeira versão pedia
 * que você escolhesse uma pessoa *antes* de ter motivo para se importar com
 * ela — e numa lista de estranhos não há motivo nenhum.
 *
 * **O que ela é:** o que andaram fazendo as pessoas que você segue. Dois tipos
 * de acontecimento e só: recomendou um livro, comentou num livro. Cada linha
 * termina numa capa, porque o destino do app é sempre o audiolivro — a
 * comunidade é o caminho, não o lugar onde se fica. Nada disso aparece no
 * Início: o social é secundário aqui, e se chega a ele pelo Perfil.
 *
 * Sem seguir ninguém, mostra **sugestões com motivo visível** no lugar do
 * antigo índice alfabético.
 */
export default function Community() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [sugestoes, setSugestoes] = useState<Suggestion[]>([]);

  useEffect(() => {
    // Relê ao voltar de um perfil, onde a pessoa pode ter seguido alguém.
    setFollowing(readFollowing());
    setEvents(activityFeed());

    const library = JSON.parse(localStorage.getItem("allbook_library") || "[]");
    const ids: number[] = Array.isArray(library)
      ? library.map((item: { id?: string | number }) => Number(item?.id)).filter(Boolean)
      : [];
    setSugestoes(suggestions(ids));
  }, []);

  const seguindo = following
    .map((slug) => findMember(slug))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="community-page">
      <PageHeader title="Comunidade" fallback="/profile" />

      {seguindo.length > 0 && (
        <section className="px-5 pt-5 pb-4 border-b border-white/10" data-testid="following-row">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">
            Seguindo
          </h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {seguindo.map((member) => (
              <Link
                key={member.slug}
                href={`/user/${member.slug}`}
                className="flex flex-col items-center gap-1.5 w-14 shrink-0"
                data-testid={`following-${member.slug}`}
              >
                <span
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center font-display font-bold`}
                >
                  {member.name.charAt(0)}
                </span>
                <span className="text-[10px] text-white/50 text-center leading-tight line-clamp-1">
                  {member.name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 ? (
        <main className="px-5 py-2" data-testid="activity-list">
          {events.map((event) => (
            <EventoDaComunidade key={event.id} event={event} />
          ))}
        </main>
      ) : (
        <SemAtividade seguindoAlguem={seguindo.length > 0} sugestoes={sugestoes} />
      )}
    </div>
  );
}

/** Uma linha da atividade: quem, o quê, e a capa que leva ao livro. */
function EventoDaComunidade({ event }: { event: ActivityEvent }) {
  const { member, book } = event;

  return (
    <article className="flex gap-3 py-4 border-b border-white/5" data-testid={`event-${event.id}`}>
      <Link
        href={`/user/${member.slug}`}
        className={`w-9 h-9 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-xs font-bold shrink-0 self-start`}
        aria-label={`Ver o perfil de ${member.name}`}
      >
        {member.name.charAt(0)}
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <Link
            href={`/user/${member.slug}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {member.name}
          </Link>{" "}
          <span className="text-white/50">
            {event.recommended && event.comment
              ? "recomendou e comentou"
              : event.recommended
                ? "recomendou"
                : "comentou em"}
          </span>{" "}
          <Link
            href={`/book/${book.id}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {book.title}
          </Link>
        </p>

        {event.comment && (
          <p className="text-xs text-white/60 leading-relaxed mt-1.5 line-clamp-3 italic">
            "{event.comment.text}"
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
          <span>{relativeDate(event.date)}</span>
          {event.recommended && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              recomendado
            </span>
          )}
        </div>
      </div>

      <Link href={`/book/${book.id}`} className="shrink-0" data-testid={`event-cover-${book.id}`}>
        <img src={book.cover} alt={book.title} className="w-11 h-[59px] rounded object-cover" />
      </Link>
    </article>
  );
}

/**
 * Quando não há atividade. São duas situações diferentes, e a diferença
 * importa: ou você ainda não segue ninguém, ou segue gente que não fez nada.
 */
function SemAtividade({
  seguindoAlguem,
  sugestoes,
}: {
  seguindoAlguem: boolean;
  sugestoes: Suggestion[];
}) {
  return (
    <main className="px-5 py-6" data-testid="community-empty">
      <div className="flex items-start gap-3 pb-6">
        <MessageSquare className="w-5 h-5 text-white/25 shrink-0 mt-0.5" strokeWidth={1.75} />
        <p className="text-sm text-white/50 leading-relaxed">
          {seguindoAlguem
            ? "Quem você segue ainda não recomendou nem comentou nada."
            : "Siga alguém para acompanhar o que essa pessoa recomenda e comenta. O botão fica no perfil dela — dá para chegar lá pelo nome em qualquer comentário de livro."}
        </p>
      </div>

      {sugestoes.length > 0 && (
        <section data-testid="community-suggestions">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
            Quem talvez combine com você
          </h2>

          <div>
            {sugestoes.map(({ member, reason, books }) => (
              <Link
                key={member.slug}
                href={`/user/${member.slug}`}
                className="flex items-center gap-3 py-3.5 border-b border-white/5 group"
                data-testid={`suggestion-${member.slug}`}
              >
                <span
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center font-display font-bold shrink-0`}
                >
                  {member.name.charAt(0)}
                </span>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {member.name}
                  </h3>
                  {/* O motivo é o que faltava na versão antiga: sem ele, é só um nome. */}
                  <p className="text-[11px] text-white/40 mt-0.5">{reason}</p>
                </div>

                <div className="flex gap-1 shrink-0">
                  {books.slice(0, 3).map((book) => (
                    <img
                      key={book.id}
                      src={book.cover}
                      alt=""
                      className="w-7 h-[38px] rounded-sm object-cover"
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="pt-6 text-[11px] text-white/25 leading-relaxed">
        Estes leitores são um esqueleto: existem para dar o que ver enquanto o AllBook
        não tem contas nem servidor.
      </p>
    </main>
  );
}
