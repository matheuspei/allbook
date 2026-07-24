import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

import PersonAvatar from "@/components/PersonAvatar";
import CommentComposer from "@/components/CommentComposer";
import { authorOf, type Comment } from "@/lib/comments";
import type { CommentTarget } from "@/lib/myComments";
import {
  dislikeCount,
  likeCount,
  readReactions,
  toggleReaction,
  type Reaction,
  type Reactions,
} from "@/lib/reactions";

/**
 * O bloco "O que dizem" de um perfil — editora, autor ou narrador.
 *
 * **Por que é um componente e não código dentro de cada tela.** O perfil de
 * pessoa já tinha esse bloco, e o de editora precisava do mesmo: cabeçalho,
 * caixa de escrever, lista com curtir e descurtir. Copiar seria criar dois
 * blocos para divergirem no primeiro ajuste — e o projeto já pagou esse preço
 * quando o comentário morava dentro do `BookDetails`.
 *
 * **A caixa de escrever é a novidade.** Antes o perfil só *mostrava* o que os
 * leitores fictícios tinham dito; não havia onde responder. Agora qualquer
 * perfil recebe comentário seu, guardado no `localStorage` (`myComments.ts`),
 * exatamente como na tela do livro.
 *
 * **Sem estrelas, de propósito** — o motivo está em `Comment.rating`: nota de
 * pessoa ou de editora vira placar público sobre quem trabalha, e a nota que de
 * fato ajuda a escolher (a da narração) pertence ao par livro+narrador.
 */
export default function ProfileComments({
  comentarios,
  alvo,
  placeholder,
  vazio,
  etiqueta,
  testid = "section-profile-comments",
}: {
  /** Os comentários do esqueleto (fixos, de `comments.ts`). */
  comentarios: Comment[];
  /** Onde o SEU comentário será guardado. */
  alvo: CommentTarget;
  /** O convite dentro do campo de escrever. */
  placeholder: string;
  /** O que dizer quando ninguém comentou ainda. */
  vazio: string;
  /** Selo opcional no canto do comentário, ex.: "sobre a narração". */
  etiqueta?: (comentario: Comment) => string | undefined;
  testid?: string;
}) {
  const [reactions, setReactions] = useState<Reactions>({});

  // Só no navegador, depois de montar: `localStorage` não existe no servidor.
  useEffect(() => {
    setReactions(readReactions());
  }, []);

  function reagir(id: string, reaction: Reaction) {
    setReactions({ ...toggleReaction(id, reaction) });
  }

  return (
    <section className="space-y-3 px-4 pt-7" data-testid={testid}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
        <MessageSquare className="h-4 w-4 text-primary" />
        O que dizem
        {comentarios.length > 0 && (
          <span className="ml-auto text-xs font-normal text-white/40">
            {comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}
          </span>
        )}
      </h2>

      <div className="space-y-3">
        <CommentComposer alvo={alvo} placeholder={placeholder} />

        {comentarios.length === 0 ? (
          <p className="py-2 text-sm text-white/40" data-testid="text-no-profile-comments">
            {vazio}
          </p>
        ) : (
          comentarios.map((comentario) => {
            const autor = authorOf(comentario);
            const minha = reactions[comentario.id];
            const selo = etiqueta?.(comentario);

            return (
              <article
                key={comentario.id}
                className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4"
                data-testid={`card-profile-comment-${comentario.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  {autor ? (
                    <Link
                      href={`/user/${autor.slug}`}
                      className="flex items-center gap-2 text-sm font-bold text-white hover:text-primary"
                      data-testid={`link-comment-author-${comentario.id}`}
                    >
                      <PersonAvatar name={autor.name} size="sm" />
                      {autor.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-white/60">Leitor do AllBook</span>
                  )}

                  {selo && (
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50 ring-1 ring-white/10">
                      {selo}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-white/70 italic">"{comentario.text}"</p>

                <div className="flex items-center gap-1">
                  <BotaoDeReacao
                    icone={ThumbsUp}
                    ativo={minha === "like"}
                    numero={likeCount(comentario.likes, minha)}
                    aoClicar={() => reagir(comentario.id, "like")}
                    rotulo="Curtir"
                    testid={`button-like-${comentario.id}`}
                  />
                  <BotaoDeReacao
                    icone={ThumbsDown}
                    ativo={minha === "dislike"}
                    numero={dislikeCount(comentario.dislikes, minha)}
                    aoClicar={() => reagir(comentario.id, "dislike")}
                    rotulo="Descurtir"
                    testid={`button-dislike-${comentario.id}`}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function BotaoDeReacao({
  icone: Icone,
  ativo,
  numero,
  aoClicar,
  rotulo,
  testid,
}: {
  icone: React.ComponentType<{ className?: string }>;
  ativo: boolean;
  numero: number;
  aoClicar: () => void;
  rotulo: string;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={rotulo}
      aria-pressed={ativo}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
        ativo ? "bg-primary/15 text-primary" : "text-white/40 hover:bg-white/5 hover:text-white/70"
      }`}
      data-testid={testid}
    >
      <Icone className="h-3.5 w-3.5" />
      {numero}
    </button>
  );
}
