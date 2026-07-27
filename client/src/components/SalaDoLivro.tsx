import { useEffect, useState } from "react";
import { Lock, MessageSquare } from "lucide-react";

import CommentComposer from "@/components/CommentComposer";
import CommentThread from "@/components/CommentThread";
import { commentsForBook } from "@/lib/comments";
import { PLAYBACK_EVENT } from "@/lib/playback";
import { comecouOLivro, posicaoNoLivro, separarSala } from "@/lib/sala";
import type { Reactions } from "@/lib/reactions";

/**
 * A sala do livro — a conversa de quem está ouvindo este livro.
 *
 * **O que ela tem que uma caixa de comentários não tem:** cada comentário pode
 * estar preso a um segundo do áudio, e o que está à frente de onde você chegou
 * não aparece. A trava não depende de ninguém declarar onde está — o player já
 * sabe. A regra inteira mora em `lib/sala.ts`; aqui só se desenha.
 *
 * **Três decisões de tela, todas com motivo:**
 *
 * 1. **O que está adiante aparece contado, não escondido.** "+3 mensagens à
 *    frente" mostra que a sala está viva sem entregar nada. Some por completo
 *    seria pior: quem chega num livro que ainda não começou veria uma sala
 *    morta — justo quem está decidindo se vai ouvir.
 * 2. **Comentário sem âncora aparece para todo mundo.** É a fala sobre o livro
 *    inteiro ("a narração é ótima"), que não estraga nada e é o que dá conteúdo
 *    à ficha de quem nunca abriu o livro.
 * 3. **A caixa de escrever vem antes da lista.** Foi o que resolveu o livro sem
 *    comentário semeado ficar mudo, e aqui vale igual.
 */
export default function SalaDoLivro({
  bookId,
  reactions,
  onReactionsChange,
}: {
  bookId: number;
  reactions: Reactions;
  onReactionsChange: (next: Reactions) => void;
}) {
  /*
   * A posição vive no estado (e não numa leitura direta a cada desenho) para a
   * sala se abrir **enquanto** a pessoa ouve: o player salva o progresso a cada
   * poucos segundos e avisa pelo mesmo evento que a barrinha escuta. Voltar do
   * player com dez minutos a mais já traz comentário novo liberado.
   */
  const [posicao, setPosicao] = useState(() => posicaoNoLivro(bookId));
  const [comecou, setComecou] = useState(() => comecouOLivro(bookId));

  useEffect(() => {
    const atualizar = () => {
      setPosicao(posicaoNoLivro(bookId));
      setComecou(comecouOLivro(bookId));
    };
    atualizar();
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    return () => window.removeEventListener(PLAYBACK_EVENT, atualizar);
  }, [bookId]);

  const todos = commentsForBook(bookId);
  const { visiveis, adiante } = separarSala(todos, posicao);

  return (
    <div className="space-y-3" data-testid="sala-do-livro">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Conversa</h2>
        {todos.length > 0 && (
          <span className="text-xs text-white/35">
            {todos.length} {todos.length === 1 ? "mensagem" : "mensagens"}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-white/40">
        O que alguém comenta em um ponto do áudio só aparece quando você chega lá.
      </p>

      <CommentComposer alvo={{ bookId }} />

      {visiveis.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          reactions={reactions}
          onReactionsChange={onReactionsChange}
        />
      ))}

      {adiante > 0 && <Adiante quantas={adiante} comecou={comecou} />}

      {todos.length === 0 && <SalaVazia />}
    </div>
  );
}

/**
 * As mensagens presas mais à frente.
 *
 * O texto muda conforme a pessoa **já começou** ou não: para quem está ouvindo,
 * é uma promessa ("aparecem conforme você avança"); para quem nunca abriu, é um
 * convite — e é o que impede a sala de parecer vazia na ficha de um livro novo.
 */
function Adiante({ quantas, comecou }: { quantas: number; comecou: boolean }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
      data-testid="sala-adiante"
    >
      <Lock className="h-4 w-4 shrink-0 text-white/30" />
      <p className="text-xs leading-relaxed text-white/45">
        <span className="font-semibold text-white/70">
          {quantas} {quantas === 1 ? "mensagem presa" : "mensagens presas"}
        </span>{" "}
        {comecou
          ? "em trechos à frente de onde você parou. Elas aparecem conforme você avança."
          : "em trechos deste livro. Comece a ouvir e elas vão se abrindo."}
      </p>
    </div>
  );
}

/**
 * Sala sem nenhuma mensagem — o caso da maioria dos livros do catálogo.
 *
 * Em vez de um "seja o primeiro" solto, três perguntas para destravar quem não
 * sabe o que escrever. São de propósito perguntas que **não dependem do final**:
 * servem a quem está no primeiro capítulo e não criam spoiler ao serem
 * respondidas.
 */
function SalaVazia() {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5"
      data-testid="sala-vazia"
    >
      <div className="flex items-center gap-2.5">
        <MessageSquare className="h-4 w-4 text-white/30" />
        <p className="text-sm font-semibold">Ninguém comentou este livro ainda</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/45">
        Comece a conversa. Se faltar assunto:
      </p>
      <ul className="mt-2.5 space-y-1.5 text-xs text-white/55">
        <li>· O que te fez escolher este livro?</li>
        <li>· A narração combina com a história?</li>
        <li>· Teve algum trecho que você repetiu?</li>
      </ul>
    </div>
  );
}
