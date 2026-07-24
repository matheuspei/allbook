import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { initialOf, readProfile } from "@/lib/profile";
import {
  addComment,
  removeComment,
  myCommentsFor,
  MAX_COMMENT,
  type CommentTarget,
  type MyComment,
} from "@/lib/myComments";

/**
 * Escrever um comentário de primeiro nível — e ver/apagar os seus.
 *
 * **Por que existe:** antes NÃO dava para comentar. `comments.ts` só tinha o
 * esqueleto fixo de leitores fictícios, sem caixa de escrever, então livro sem
 * comentário semeado (a maioria) ficava mudo, com um "ninguém comentou ainda" e
 * nenhum jeito de mudar isso. Agora qualquer livro recebe comentário, guardado no
 * `localStorage` (via `myComments.ts`), com o seu nome de perfil como autor.
 *
 * **Serve aos três alvos** — livro, pessoa (autor/narrador) e editora —, porque a
 * caixa é a mesma em qualquer um deles: identidade, campo, contador e botão. Um
 * componente por tela de perfil só criaria três caixas para divergirem depois.
 * Quem chama passa o alvo e o texto de convite.
 *
 * **Sem estrela e sem curtir/responder no próprio comentário, de propósito:** a
 * tela decidiu não mostrar nota colada no nome de quem comenta (viraria "placar do
 * usuário" — ver `comments.ts` e `CommentThread`), e reagir ou responder ao
 * próprio comentário não faz sentido no esqueleto.
 */
export default function CommentComposer({
  alvo,
  placeholder = "Deixe seu comentário sobre este livro…",
}: {
  alvo: CommentTarget;
  /** O convite dentro do campo. Muda com o alvo: livro, pessoa ou editora. */
  placeholder?: string;
}) {
  const { toast } = useToast();
  const perfil = readProfile();
  const [texto, setTexto] = useState("");
  const [meus, setMeus] = useState<MyComment[]>(() => myCommentsFor(alvo));

  function publicar() {
    const limpo = texto.trim();
    if (!limpo) return;
    addComment(alvo, limpo);
    setMeus(myCommentsFor(alvo));
    setTexto("");
    toast({ title: "Comentário publicado" });
  }

  function apagar(id: string) {
    removeComment(id);
    setMeus(myCommentsFor(alvo));
    toast({ title: "Comentário apagado" });
  }

  const inicial = initialOf(perfil.name);

  const identidade = (
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
        {inicial}
      </span>
      <span className="text-sm font-bold">
        {perfil.name} <span className="font-normal text-white/30">· você</span>
      </span>
    </div>
  );

  return (
    <>
      <div
        className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3"
        data-testid="comment-composer"
      >
        {identidade}

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX_COMMENT))}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 resize-none"
          data-testid="comment-input"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/25">
            {texto.length}/{MAX_COMMENT}
          </span>
          <button
            onClick={publicar}
            disabled={texto.trim().length === 0}
            className="text-sm font-semibold text-primary disabled:text-white/20 transition-colors"
            data-testid="comment-send"
          >
            Comentar
          </button>
        </div>
      </div>

      {meus.map((c) => (
        <div
          key={c.id}
          className="bg-white/5 p-4 rounded-xl border border-white/5"
          data-testid={`my-comment-${c.id}`}
        >
          <div className="flex items-center justify-between">
            {identidade}
            <button
              onClick={() => apagar(c.id)}
              className="text-white/25 hover:text-white/60 transition-colors p-1"
              aria-label="Apagar meu comentário"
              data-testid={`delete-comment-${c.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm text-white/70 leading-relaxed italic mt-3">"{c.text}"</p>
        </div>
      ))}
    </>
  );
}
