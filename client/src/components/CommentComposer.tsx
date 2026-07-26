import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";

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
import { myRatingOf, RATINGS_EVENT, type MinhaAvaliacao } from "@/lib/ratings";

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
 * **A sua nota aparece no seu comentário** (26/07, a pedido do Matheus, no
 * formato da Amazon): quem lê "achei fraco" precisa ver quantas estrelas isso
 * valeu. Ela sai de `ratings.ts` — ou seja, é a nota **atual**, não uma cópia
 * congelada no momento em que você escreveu: avaliação e comentário são a mesma
 * opinião, e mudar a nota tem de mudar o que o comentário mostra. Só em livro;
 * em perfil de pessoa e de editora não há nota (ver `comments.ts`).
 *
 * **Sem curtir/responder no próprio comentário, de propósito:** reagir ou
 * responder a si mesmo não faz sentido no esqueleto.
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

  // A sua nota deste livro, para estampar no seu comentário. Reage ao evento de
  // avaliação: mudar as estrelas ali em cima muda estas aqui na hora, sem F5.
  const [minhaNota, setMinhaNota] = useState<MinhaAvaliacao | null>(() =>
    alvo.bookId !== undefined ? myRatingOf(alvo.bookId) : null,
  );
  useEffect(() => {
    if (alvo.bookId === undefined) return;
    const atualizar = () => setMinhaNota(myRatingOf(alvo.bookId!));
    atualizar();
    window.addEventListener(RATINGS_EVENT, atualizar);
    return () => window.removeEventListener(RATINGS_EVENT, atualizar);
  }, [alvo.bookId]);

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
          <MinhasEstrelas nota={minhaNota} />
          <p className="text-sm text-white/70 leading-relaxed italic mt-1">"{c.text}"</p>
        </div>
      ))}
    </>
  );
}

/**
 * As suas estrelas dentro do seu comentário.
 *
 * **Mostra as duas dimensões separadas** — história e narração —, e não uma
 * média: as duas são independentes em `ratings.ts` (dá para avaliar só uma), e
 * uma média esconderia justamente o caso mais interessante, o do livro bom com
 * narração morna. Some por inteiro se você ainda não avaliou nada: comentar não
 * obriga a dar nota.
 */
function MinhasEstrelas({ nota }: { nota: MinhaAvaliacao | null }) {
  if (!nota || (nota.historia === undefined && nota.narracao === undefined)) return null;

  const linhas = [
    { rotulo: "História", valor: nota.historia },
    { rotulo: "Narração", valor: nota.narracao },
  ].filter((linha): linha is { rotulo: string; valor: number } => linha.valor !== undefined);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="my-comment-rating">
      {linhas.map((linha) => (
        <span
          key={linha.rotulo}
          className="flex items-center gap-1"
          aria-label={`${linha.rotulo}: ${linha.valor} de 5 estrelas`}
        >
          {[1, 2, 3, 4, 5].map((valor) => (
            <Star
              key={valor}
              className={`h-3.5 w-3.5 ${
                valor <= linha.valor ? "fill-[#f59e0b] text-[#f59e0b]" : "text-white/15"
              }`}
            />
          ))}
          <span className="ml-0.5 text-[10px] uppercase tracking-wider text-white/35">
            {linha.rotulo}
          </span>
        </span>
      ))}
    </div>
  );
}
