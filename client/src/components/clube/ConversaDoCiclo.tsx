import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ConversaDoTrecho from "@/components/ConversaDoTrecho";
import { chapterStartSec, getChapters } from "@/lib/chapters";
import { comentariosNoTrecho, posicaoNoLivro } from "@/lib/sala";
import { commentsForBook } from "@/lib/comments";
import { rastroNoTrecho } from "@/lib/salaAoVivo";
import { type Clube } from "@/lib/clubes";

/**
 * **A conversa do livro, trecho a trecho — dentro do clube** (ROTEIRO §4.81).
 *
 * ---
 *
 * **Por que existe: uma premissa do Matheus que o app não cumpria.**
 *
 * Ao defender que o chat ao vivo não vira lixo, ele disse: *"dentro do clube de
 * leituras você já tem aqueles tópicos para discutir o que foi falado ali… uma
 * coisa é o chat ao vivo, outra é a aba de discussão do que foi falado no
 * capítulo"*. O argumento é bom — **e dependia de um lugar que não existia**. O
 * clube tinha mural (conversa solta), rodada, votação e estante; a conversa por
 * trecho existia só no livro, fora do clube.
 *
 * Aqui ela entra **pelos marcos do ciclo**, que é como aquela turma já divide o
 * livro. Cada marco abre a mesma `ConversaDoTrecho` do player — **não é uma
 * segunda conversa**, é a mesma, por outra porta. Escrever um segundo sistema de
 * mensagens para o clube foi o erro que a §4.40 já corrigiu uma vez.
 *
 * **Só aparece quando o ciclo tem marcos** e para quem é membro.
 */
export default function ConversaDoCiclo({ clube }: { clube: Clube }) {
  const [aberto, setAberto] = useState<number | null>(null);

  const bookId = clube.ciclo.bookId;
  const capitulos = getChapters(bookId);
  const marcos = clube.ciclo.marcos;
  if (marcos.length === 0) return null;

  const ondeEstou = posicaoNoLivro(bookId);

  return (
    <section className="space-y-3" data-testid="conversa-do-ciclo">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">A conversa, trecho a trecho</h2>
        <span className="text-xs text-white/35">o que foi dito em cada parte</span>
      </div>

      <div className="space-y-2">
        {marcos.map((marco, i) => {
          const capInicial = i === 0 ? 1 : marcos[i - 1].chapter + 1;
          /* O fim do trecho, em segundos: o começo do capítulo seguinte, ou o
             fim do livro no último marco. */
          const fimSec =
            marco.chapter >= capitulos.length
              ? capitulos.reduce((soma, cap) => soma + cap.durationSec, 0)
              : chapterStartSec(bookId, marco.chapter + 1);
          const inicioSec = chapterStartSec(bookId, capInicial);
          const janela = Math.max(1, fimSec - inicioSec);

          const falas = comentariosNoTrecho(commentsForBook(bookId), fimSec, janela).length;
          const daSessao = rastroNoTrecho(bookId, fimSec, janela).length;

          /* Trecho à frente de onde você chegou fica fechado — a mesma trava de
             spoiler do resto da casa, e é ela que permite esta lista existir sem
             entregar nada. */
          const liberado = ondeEstou >= inicioSec;

          return (
            <button
              key={marco.id}
              onClick={() => liberado && setAberto(fimSec - 1)}
              disabled={!liberado}
              className={`flex w-full items-center gap-3 rounded-xl border border-white/8 px-3.5 py-3 text-left transition-colors ${
                liberado ? "bg-white/[0.03] hover:bg-white/[0.07]" : "bg-white/[0.015] opacity-45"
              }`}
              data-testid={`trecho-do-ciclo-${marco.id}`}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-white/30" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">
                  {capInicial === marco.chapter
                    ? `Capítulo ${marco.chapter}`
                    : `Capítulos ${capInicial} a ${marco.chapter}`}
                </span>
                <span className="mt-0.5 block text-[10.5px] text-white/35">
                  {!liberado
                    ? "abre quando você chegar aqui"
                    : falas + daSessao === 0
                      ? "ninguém falou deste trecho ainda"
                      : [
                          falas > 0 && `${falas} ${falas === 1 ? "comentário" : "comentários"}`,
                          daSessao > 0 && `${daSessao} da sessão ao vivo`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[10.5px] leading-relaxed text-white/25">
        É a mesma conversa do livro, aberta pelo trecho que a turma combinou. O{" "}
        <b className="text-white/45">chat da sessão ao vivo</b> é outra coisa, e aparece separado
        dentro de cada trecho.
      </p>

      {aberto !== null && (
        <ConversaDoTrecho bookId={bookId} posicaoSec={aberto} onFechar={() => setAberto(null)} />
      )}
    </section>
  );
}
