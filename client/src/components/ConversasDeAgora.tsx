import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Lock, MessageSquare } from "lucide-react";

import { catalog } from "@/lib/books";
import { findMember } from "@/lib/community";
import { PLAYBACK_EVENT } from "@/lib/playback";
import { livrosComConversa } from "@/lib/sala";

/**
 * "Onde a conversa está acontecendo" — o topo da Comunidade.
 *
 * **A troca de eixo que isto faz:** a Comunidade mostrava *gente* (siga alguém
 * para ver o que ela anda dizendo), e quem não seguia ninguém encontrava uma
 * lista de estranhos. Agora ela mostra **livros com conversa**: você entra
 * porque o assunto interessa, não porque conhece quem está falando. Seguir
 * continua existindo, logo abaixo — deixou de ser a porta e virou um extra.
 *
 * **A trava vale aqui também.** A prévia só traz o que você já pode ler naquele
 * livro, e nunca um comentário marcado como spoiler: numa vitrine ninguém
 * escolheu abrir nada. Quando há mensagem presa, o cartão diz **quantas** — é o
 * que transforma "não tenho o que ver" em "tem coisa esperando por mim ali".
 */
export default function ConversasDeAgora() {
  const [salas, setSalas] = useState(() => livrosComConversa());

  useEffect(() => {
    // Ouvir muda o que está liberado: voltar do player recalcula sozinho.
    const atualizar = () => setSalas(livrosComConversa());
    atualizar();
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    return () => window.removeEventListener(PLAYBACK_EVENT, atualizar);
  }, []);

  if (salas.length === 0) return null;

  return (
    <section className="border-b border-white/10 px-5 pb-5 pt-5" data-testid="conversas-de-agora">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        Onde a conversa está
      </h2>

      <div className="space-y-3">
        {salas.map((sala) => {
          const book = catalog.find((item) => item.id === sala.bookId);
          if (!book) return null;
          const presas = sala.total - sala.liberadas;

          return (
            <Link
              key={sala.bookId}
              /* Direto NA conversa, não na ficha (28/07): o cartão promete
                 conversa, e antes entregava a sinopse — a pessoa tinha que
                 rolar a ficha até achar a sala. A ficha continua a um toque,
                 pelo cabeçalho da própria página da conversa. */
              href={`/book/${sala.bookId}/conversa`}
              className="block rounded-xl border border-white/5 bg-white/[0.04] p-3.5 transition-colors hover:bg-white/[0.07]"
              data-testid={`sala-card-${sala.bookId}`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{book.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {sala.total} {sala.total === 1 ? "mensagem" : "mensagens"}
                    </span>
                    {presas > 0 && (
                      <span className="flex items-center gap-1 text-white/30">
                        <Lock className="h-2.5 w-2.5" />
                        {presas} {presas === 1 ? "presa" : "presas"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {sala.previa.length > 0 && (
                <div className="mt-2.5 space-y-1.5 border-l-2 border-white/10 pl-3">
                  {sala.previa.map((comment) => (
                    <p key={comment.id} className="text-xs leading-relaxed text-white/50">
                      <span className="font-semibold text-white/70">
                        {findMember(comment.authorSlug)?.name ?? "Alguém"}:
                      </span>{" "}
                      {comment.text.length > 90
                        ? `${comment.text.slice(0, 90).trimEnd()}…`
                        : comment.text}
                    </p>
                  ))}
                </div>
              )}

              {sala.previa.length === 0 && presas > 0 && (
                <p className="mt-2.5 border-l-2 border-white/10 pl-3 text-xs leading-relaxed text-white/35">
                  Tudo o que disseram aqui está preso em trechos que você ainda não ouviu.
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
