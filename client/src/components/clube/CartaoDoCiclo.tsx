import { Link } from "wouter";
import { Calendar, Headphones, Lock } from "lucide-react";

import { catalog } from "@/lib/books";
import {
  capituloCombinado,
  dataCurta,
  estaComecando,
  estreiaEmTexto,
  marcoAtual,
  meuCapitulo,
  prazoEmTexto,
  type Clube,
} from "@/lib/clubes";
import { LinhaDoCiclo } from "@/components/clube/LinhaDoCiclo";
import { savePlaying } from "@/lib/playback";

/**
 * O cartão do ciclo: o livro do mês, o prazo e onde a turma está.
 *
 * **A régua você×roda virou a linha do ciclo** (§4.101, folha
 * `_linha-do-ciclo-C.html`): a barra agora mostra os marcos do combinado e a
 * faixa da turma, em `LinhaDoCiclo`. A regra da §4.39 segue valendo lá: a
 * comparação é agregada, sem nomear ninguém — apontar "Fulano está no 9" é a
 * pressão que leva a mentir progresso, e progresso mentido quebra a trava de
 * spoiler, que é o que faz o clube funcionar.
 *
 * **O marco é a regra de spoiler do clube**, dita em uma linha: "até o capítulo
 * 6, prazo em 3 dias". É mais fácil de seguir do que marcar mensagem por
 * mensagem, e é o que os clubes de verdade combinam entre si.
 */
export default function CartaoDoCiclo({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  if (!livro) return null;

  const meu = meuCapitulo(clube);
  const marco = marcoAtual(clube);
  const combinado = capituloCombinado(clube);
  const comecando = estaComecando(clube);

  return (
    <section
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-card shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.28)]"
      data-testid="cartao-do-ciclo"
    >
      <div className="flex gap-4 p-4">
        <img
          src={livro.cover}
          alt={livro.title}
          className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-primary">
            Livro do ciclo
          </p>
          <h2 className="mt-1 truncate font-display text-lg font-bold leading-tight">
            {livro.title}
          </h2>
          <p className="truncate text-xs text-white/45">{livro.author}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/55">
            <Calendar className="h-3 w-3" />
            {comecando ? (
              <>
                <b className="text-primary">{estreiaEmTexto(clube)}</b> · {dataCurta(clube.ciclo.inicio)}
              </>
            ) : (
              <>
                Encontro em {dataCurta(clube.ciclo.encontro)} · {prazoEmTexto(clube.ciclo.encontro)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* A linha do ciclo: os marcos, você e a faixa da turma (§4.101). */}
      <div className="px-4 pb-4">
        {comecando && (
          <p className="mb-3 rounded-lg bg-background/60 px-3 py-2 text-[11px] leading-relaxed text-white/60">
            Este clube ainda não começou — <b className="text-white/85">todo mundo entra no mesmo
            ponto</b>. Dá para ouvir antes, mas a conversa e os prazos começam em{" "}
            {dataCurta(clube.ciclo.inicio)}.
          </p>
        )}

        <LinhaDoCiclo clube={clube} />

        {/*
          **O texto foi corrigido em 28/07 porque mentia** (ROTEIRO 4.40). Ele
          dizia "mensagem que fala além disso chega coberta", dando a entender que
          o **combinado** decidia o que aparece. Não decide: `MuralDoClube` cobre
          pelo capítulo em que **você** está. Estando no 3 com o combinado no 7,
          mensagens de capítulo 5 e 6 — dentro do combinado! — chegavam cobertas,
          e a tela dizia o contrário.

          As duas regras são diferentes e agora estão escritas como são: o
          combinado é **até onde escrever**, um acordo do grupo; o que você já
          ouviu é **até onde ler**, e é individual porque só ela protege de
          verdade quem ficou para trás. Se a leitura seguisse o combinado, quem
          está no 3 levaria spoiler do 6 com o app dizendo que está tudo certo.
        */}
        {marco && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-background/60 px-3 py-2 text-[11px] leading-relaxed text-white/60">
            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              Combinado da roda: <b className="text-white/85">não passar do capítulo {combinado}</b>{" "}
              nas mensagens, prazo {prazoEmTexto(marco.prazo)}.{" "}
              {meu > 0 ? (
                <>
                  Você lê o que fala até onde ouviu (cap. {meu}); o resto chega coberto e abre
                  sozinho conforme você avança.
                </>
              ) : (
                <>Você lê cada mensagem quando chegar ao trecho de que ela fala.</>
              )}
            </span>
          </p>
        )}

        <Link
          href={`/player/${livro.id}`}
          onClick={() => savePlaying(true)}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-background transition-colors hover:bg-white/90"
          data-testid="button-ouvir-ciclo"
        >
          <Headphones className="h-4 w-4" />
          {meu === 0 ? "Começar a ouvir" : "Continuar de onde parei"}
        </Link>
      </div>
    </section>
  );
}
