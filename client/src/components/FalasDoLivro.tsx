import { Link } from "wouter";
import { ChevronRight, Headphones, MessageSquare } from "lucide-react";

import { CapaDoTopico } from "@/components/forum/Pecas";
import { livroPorId } from "@/lib/books";
import { commentsForBook } from "@/lib/comments";
import { topicosDoLivro } from "@/lib/grupos";

/**
 * **O que sobrou da conversa na ficha do livro** — três linhas, não uma lista.
 *
 * ---
 *
 * **Por que esta peça existe (04/08, ROTEIRO §4.87).** A ficha tinha a conversa
 * inteira embaixo das avaliações, e o Matheus apontou o defeito: *"a conversa no
 * livro, junto com os fóruns, pode se tornar muito parecida"*. Ele tinha razão, e
 * a razão era visível na tela — **uma lista de gente falando embaixo de outra
 * lista de gente falando**. Duas caixas do mesmo formato, no mesmo lugar.
 *
 * A decisão que ele aprovou foi **encolher, não apagar**: a conversa sai da ficha
 * e passa a viver onde só ela pode existir — **dentro do player, presa ao minuto
 * do áudio**. Aqui fica só o aviso de que ela existe, e a porta.
 *
 * **Três coisas que esta peça faz questão de não fazer:**
 *
 * 1. **Não mostra as falas.** Se mostrasse, voltaria a ser a lista que causou o
 *    problema — só que menor.
 * 2. **Não some quando o livro é mudo.** Livro sem fala nenhuma mostra o convite
 *    (“seja o primeiro”), senão quem quer falar não descobre que dá.
 * 3. **Não esconde o fórum.** Se existe debate sobre este livro num grupo, ele
 *    aparece aqui — com a capa que o próprio tópico já usa. É a ponte de volta:
 *    sem ela, quem está no livro nunca fica sabendo que tem gente discutindo o
 *    final ali ao lado.
 */
export default function FalasDoLivro({ bookId }: { bookId: number }) {
  const falas = commentsForBook(bookId);
  /* As presas a um segundo do áudio são a razão de a conversa viver no player —
     e o número que justifica o texto abaixo. Sem âncora nenhuma, o convite muda. */
  const ancoradas = falas.filter((item) => item.positionSec !== undefined).length;
  const debates = topicosDoLivro(bookId).slice(0, 2);

  return (
    <section className="space-y-3" data-testid="falas-do-livro">
      <h2 className="font-display text-lg font-bold">Conversa</h2>

      <Link
        href={`/book/${bookId}/conversa`}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
        data-testid="link-conversa-do-livro"
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {falas.length === 0
              ? "Ninguém falou deste livro ainda"
              : `${falas.length} ${falas.length === 1 ? "fala" : "falas"} sobre este livro`}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
            {falas.length === 0 ? (
              "Comece você — o que escrever ouvindo fica preso no minuto exato."
            ) : ancoradas > 0 ? (
              <>
                <Headphones className="mr-1 inline h-3 w-3 align-[-2px]" />
                {ancoradas} {ancoradas === 1 ? "presa" : "presas"} a um ponto do áudio — aparecem
                enquanto você ouve
              </>
            ) : (
              "aparecem enquanto você ouve, no minuto de cada uma"
            )}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
      </Link>

      {/* A ponte de volta: o debate deste livro que mora num grupo. Só aparece
          quando existe — bloco vazio prometendo comunidade é o defeito da §4.82. */}
      {debates.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-white/35">
            {debates.length === 1 ? "Um debate" : `${debates.length} debates`} sobre este livro nos
            grupos:
          </p>
          {debates.map((topico) => {
            const livro = topico.bookId ? livroPorId(topico.bookId) : undefined;
            return (
              <Link
                key={topico.id}
                href={`/forum/${topico.grupoId}/topico/${topico.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.05]"
                data-testid={`debate-do-livro-${topico.id}`}
              >
                <CapaDoTopico
                  imagem={topico.imagem}
                  capaDoLivro={livro?.cover}
                  semente={topico.id}
                  lado={30}
                  retrato
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold leading-snug">
                    {topico.titulo}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-white/35">
                    {topico.totalRespostas}{" "}
                    {topico.totalRespostas === 1 ? "resposta" : "respostas"} · lá o livro é falado
                    inteiro
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
