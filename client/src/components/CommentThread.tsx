import { useState } from "react";
import { useLocation } from "wouter";
import { CornerDownRight, Star, ThumbsDown, ThumbsUp, Trash2, User } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { repliesTo, type Comment } from "@/lib/comments";
import { findMember } from "@/lib/community";
import { initialOf, readProfile } from "@/lib/profile";
import {
  addReply,
  myRepliesTo,
  removeReply,
  MAX_REPLY,
  type MyReply,
} from "@/lib/replies";
import {
  dislikeCount,
  likeCount,
  toggleReaction,
  type Reaction,
  type Reactions,
} from "@/lib/reactions";

/**
 * Um comentário e a conversa embaixo dele.
 *
 * Mora fora do `BookDetails` porque aquela tela já é grande demais, e porque a
 * conversa é uma coisa fechada em si: o comentário, as respostas dos outros, as
 * suas respostas e a caixa de escrever.
 *
 * **Um nível só de resposta.** Responder a uma resposta continua na mesma
 * conversa em vez de abrir outra casinha para dentro — no celular, o terceiro
 * nível já não cabe na tela.
 */
export default function CommentThread({
  comment,
  reactions,
  onReactionsChange,
}: {
  comment: Comment;
  reactions: Reactions;
  onReactionsChange: (next: Reactions) => void;
}) {
  const { toast } = useToast();
  const [respondendo, setRespondendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [minhas, setMinhas] = useState<MyReply[]>(() => myRepliesTo(comment.id));

  const respostas = repliesTo(comment.id);
  const total = respostas.length + minhas.length;

  function reagir(id: string, reaction: Reaction) {
    onReactionsChange(toggleReaction(id, reaction));
  }

  function enviar() {
    const limpo = texto.trim();
    if (!limpo) return;

    addReply(comment.id, comment.bookId, limpo);
    setMinhas(myRepliesTo(comment.id));
    setTexto("");
    setRespondendo(false);
  }

  function apagar(id: string) {
    removeReply(id);
    setMinhas(myRepliesTo(comment.id));
    toast({ title: "Resposta apagada" });
  }

  return (
    <div
      className="bg-white/5 p-4 rounded-xl border border-white/5"
      data-testid={`card-review-${comment.id}`}
    >
      <div className="flex justify-between items-center">
        <AutorDoComentario slug={comment.authorSlug} />
        {comment.rating !== undefined && (
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${
                  i < comment.rating! ? "fill-amber-500 text-amber-500" : "text-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-white/70 leading-relaxed italic mt-3">"{comment.text}"</p>

      <Reacoes
        id={comment.id}
        likes={comment.likes}
        dislikes={comment.dislikes}
        reaction={reactions[comment.id]}
        onReact={reagir}
        onReply={() => setRespondendo((atual) => !atual)}
        replyCount={total}
      />

      {total > 0 && (
        <div
          className="mt-3 pl-3 border-l border-white/10 space-y-3"
          data-testid={`replies-${comment.id}`}
        >
          {respostas.map((resposta) => (
            <div key={resposta.id}>
              <AutorDoComentario slug={resposta.authorSlug} small />
              <p className="text-xs text-white/60 leading-relaxed mt-1.5">{resposta.text}</p>
              <Reacoes
                id={resposta.id}
                likes={resposta.likes}
                dislikes={resposta.dislikes}
                reaction={reactions[resposta.id]}
                onReact={reagir}
                small
              />
            </div>
          ))}

          {minhas.map((resposta) => (
            <MinhaResposta key={resposta.id} resposta={resposta} onApagar={apagar} />
          ))}
        </div>
      )}

      {respondendo && (
        <div className="mt-3 pl-3 border-l border-white/10" data-testid={`reply-box-${comment.id}`}>
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value.slice(0, MAX_REPLY))}
            placeholder="Responder…"
            rows={3}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 resize-none"
            data-testid={`reply-input-${comment.id}`}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-white/25">
              {texto.length}/{MAX_REPLY}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setRespondendo(false);
                  setTexto("");
                }}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={texto.trim().length === 0}
                className="text-xs font-semibold text-primary disabled:text-white/20 transition-colors"
                data-testid={`reply-send-${comment.id}`}
              >
                Responder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Uma resposta sua: mesmo formato das outras, mais o botão de apagar. */
function MinhaResposta({
  resposta,
  onApagar,
}: {
  resposta: MyReply;
  onApagar: (id: string) => void;
}) {
  const profile = readProfile();

  return (
    <div data-testid={`my-reply-${resposta.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
            {initialOf(profile.name)}
          </span>
          <span className="text-xs font-bold">
            {profile.name} <span className="font-normal text-white/30">· você</span>
          </span>
        </div>
        <button
          onClick={() => onApagar(resposta.id)}
          className="text-white/25 hover:text-white/60 transition-colors p-1"
          aria-label="Apagar minha resposta"
          data-testid={`delete-reply-${resposta.id}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <p className="text-xs text-white/60 leading-relaxed mt-1.5">{resposta.text}</p>
    </div>
  );
}

/**
 * Curtir, descurtir e responder.
 *
 * As duas reações mostram número e as duas pesam igual na ordem dos
 * comentários — o porquê e o risco estão em `reactions.ts`.
 */
function Reacoes({
  id,
  likes,
  dislikes,
  reaction,
  onReact,
  onReply,
  replyCount,
  small,
}: {
  id: string;
  likes: number;
  dislikes: number;
  reaction: Reaction | undefined;
  onReact: (id: string, reaction: Reaction) => void;
  onReply?: () => void;
  replyCount?: number;
  small?: boolean;
}) {
  const size = small ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div className={`flex items-center gap-1 ${small ? "mt-1.5" : "pt-3"}`}>
      <button
        type="button"
        onClick={() => onReact(id, "like")}
        className={`flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md text-xs transition-colors ${
          reaction === "like" ? "text-amber-500" : "text-white/40 hover:text-white/70"
        }`}
        aria-pressed={reaction === "like"}
        aria-label="Curtir"
        data-testid={`button-like-${id}`}
      >
        <ThumbsUp className={size} strokeWidth={1.75} fill={reaction === "like" ? "currentColor" : "none"} />
        {likeCount(likes, reaction)}
      </button>

      <button
        type="button"
        onClick={() => onReact(id, "dislike")}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
          reaction === "dislike" ? "text-white/80" : "text-white/40 hover:text-white/70"
        }`}
        aria-pressed={reaction === "dislike"}
        aria-label="Descurtir"
        data-testid={`button-dislike-${id}`}
      >
        <ThumbsDown className={size} strokeWidth={1.75} fill={reaction === "dislike" ? "currentColor" : "none"} />
        {dislikeCount(dislikes, reaction)}
      </button>

      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white/40 hover:text-white/70 transition-colors"
          data-testid={`button-reply-${id}`}
        >
          <CornerDownRight className={size} strokeWidth={1.75} />
          {replyCount && replyCount > 0
            ? `${replyCount} ${replyCount === 1 ? "resposta" : "respostas"}`
            : "Responder"}
        </button>
      )}
    </div>
  );
}

/**
 * Quem escreveu. O nome leva ao perfil — é dali que sai o "seguir". Slug que
 * não existe mais aparece sem link, em vez de prometer uma tela vazia.
 */
function AutorDoComentario({ slug, small }: { slug: string; small?: boolean }) {
  const [, navegar] = useLocation();
  const membro = findMember(slug);

  const tamanho = small ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[11px]";
  const texto = small ? "text-xs" : "text-sm";

  const avatar = (
    <span
      className={`${tamanho} rounded-full flex items-center justify-center shrink-0 font-bold ${
        membro
          ? `bg-gradient-to-br ${membro.color} text-white`
          : "bg-gradient-to-br from-amber-500/30 to-orange-600/30 text-amber-500"
      }`}
    >
      {membro ? membro.name.charAt(0) : <User className="w-3 h-3" />}
    </span>
  );

  if (!membro) {
    return (
      <div className="flex items-center gap-2">
        {avatar}
        <span className={`${texto} font-bold`}>Leitor AllBook</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navegar(`/user/${membro.slug}`)}
      className="flex items-center gap-2 group"
      aria-label={`Ver o perfil de ${membro.name}`}
      data-testid={`link-reviewer-${membro.slug}`}
    >
      {avatar}
      <span className={`${texto} font-bold group-hover:text-primary transition-colors`}>
        {membro.name}
      </span>
    </button>
  );
}
