import { Link } from "wouter";
import { avatarDeLeitor } from "@/lib/community";
import { MessageCircle, Sparkles } from "lucide-react";

import { relativeDate, type ActivityEvent } from "@/lib/activity";

/**
 * **O que alguém fez** — recomendou um livro, comentou nele — na lente Seguindo.
 *
 * ---
 *
 * **Por que é uma linha, e não um cartão.**
 *
 * A §4.53 registra que **onze** maquetes de Comunidade falharam porque o feed
 * era feito disto: "fulano avaliou", "fulano está ouvindo". Texto sem corpo. A
 * saída foi dar objeto ao post — e seria contraditório trazer a atividade de
 * volta com o mesmo peso visual do post, que é o que a virada corrigiu.
 *
 * Então a atividade **existe, mas em outro degrau**: uma linha baixa, com a capa
 * pequena à direita, que se lê de passagem. O Matheus manteve a atividade
 * viva de propósito (§4.58, decisão 2: *Seguindo = o que elas fizeram*), e a
 * hierarquia é o que faz as duas coisas conviverem sem a segunda engolir a
 * primeira.
 *
 * **A capa é o alvo do toque, e leva ao livro** — o destino do AllBook é sempre
 * o audiolivro; a comunidade é o caminho, não o lugar onde se fica.
 */
export default function LinhaDeAtividade({ evento }: { evento: ActivityEvent }) {
  const { member, book, recommended, comment } = evento;

  return (
    <article
      className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
      data-testid={`atividade-${evento.id}`}
    >
      <Link href={`/user/${member.slug}`} className="shrink-0">
        <span
          className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${member.color} text-[12px] font-bold`} {...avatarDeLeitor(member.slug)}
        >
          {member.name.charAt(0)}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] leading-snug text-white/55">
          <Link
            href={`/user/${member.slug}`}
            className="font-semibold text-white/85 underline-offset-2 hover:underline"
          >
            {member.name}
          </Link>{" "}
          {/* Os dois acontecimentos vêm juntos quando são do mesmo livro: na
              cabeça de quem lê é um só (ver o cabeçalho de `activity.ts`). */}
          {recommended && comment
            ? "recomendou e comentou"
            : recommended
              ? "recomendou"
              : "comentou em"}{" "}
          <Link
            href={`/book/${book.id}`}
            className="font-semibold text-white/85 underline-offset-2 hover:underline"
          >
            {book.title}
          </Link>
          <span className="text-white/30"> · {relativeDate(evento.date)}</span>
        </p>

        {comment && (
          /* O que ela escreveu, entre aspas e curto: é a única parte com voz
             própria, e sem ela a linha vira "aconteceu algo" — o cru da §4.53. */
          <Link
            href={`/book/${book.id}/conversa`}
            className="mt-1.5 flex items-start gap-1.5 text-[12px] italic leading-relaxed text-white/45 transition-colors hover:text-white/70"
          >
            <MessageCircle className="mt-[3px] h-3 w-3 shrink-0" />
            <span className="line-clamp-2">“{comment.text}”</span>
          </Link>
        )}

        {recommended && !comment && (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-primary/70">
            <Sparkles className="h-3 w-3" />
            está na lista de recomendados dela
          </p>
        )}
      </div>

      <Link href={`/book/${book.id}`} className="shrink-0">
        <img
          src={book.cover}
          alt={book.title}
          className="h-[62px] w-[42px] rounded-md object-cover ring-1 ring-white/10 transition-transform hover:scale-105"
        />
      </Link>
    </article>
  );
}
