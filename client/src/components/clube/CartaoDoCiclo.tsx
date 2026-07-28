import { Link } from "wouter";
import { Calendar, Headphones, Lock } from "lucide-react";

import { catalog } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import {
  capituloCombinado,
  capituloDaRoda,
  dataCurta,
  estaComecando,
  estreiaEmTexto,
  marcoAtual,
  meuCapitulo,
  prazoEmTexto,
  type Clube,
} from "@/lib/clubes";
import { savePlaying } from "@/lib/playback";

/**
 * O cartão do ciclo: o livro do mês, o prazo e onde a turma está.
 *
 * **A régua compara você com a RODA, não com cada pessoa.** Mostrar "Fulano
 * está no capítulo 9, você no 4" é a pressão social que leva alguém a mentir o
 * progresso — e progresso mentido quebra a trava de spoiler, que é justamente
 * o que faz o clube funcionar aqui dentro (ROTEIRO 4.39). Por isso a barra tem
 * duas marcas apenas: a sua e a mediana do grupo.
 *
 * **O marco é a regra de spoiler do clube**, dita em uma linha: "até o capítulo
 * 6, prazo em 3 dias". É mais fácil de seguir do que marcar mensagem por
 * mensagem, e é o que os clubes de verdade combinam entre si.
 */
export default function CartaoDoCiclo({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  if (!livro) return null;

  const totalCapitulos = getChapters(clube.ciclo.bookId).length;
  const meu = meuCapitulo(clube);
  const roda = capituloDaRoda(clube);
  const marco = marcoAtual(clube);
  const combinado = capituloCombinado(clube);
  const comecando = estaComecando(clube);

  const pct = (valor: number) => `${Math.min(100, (valor / totalCapitulos) * 100)}%`;

  return (
    <section
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#241a10] to-[#181818] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.28)]"
      data-testid="cartao-do-ciclo"
    >
      <div className="flex gap-4 p-4">
        <img
          src={livro.cover}
          alt={livro.title}
          className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#f59e0b]">
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
                <b className="text-[#f59e0b]">{estreiaEmTexto(clube)}</b> · {dataCurta(clube.ciclo.inicio)}
              </>
            ) : (
              <>
                Encontro em {dataCurta(clube.ciclo.encontro)} · {prazoEmTexto(clube.ciclo.encontro)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* A régua: você contra a roda. */}
      <div className="px-4 pb-4">
        {comecando && (
          <p className="mb-3 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-relaxed text-white/60">
            Este clube ainda não começou — <b className="text-white/85">todo mundo entra no mesmo
            ponto</b>. Dá para ouvir antes, mas a conversa e os prazos começam em{" "}
            {dataCurta(clube.ciclo.inicio)}.
          </p>
        )}

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/55">
            Você: {meu === 0 ? "não começou" : `capítulo ${meu}`}
          </span>
          {/* "capítulo 0" não existe: num clube recém-criado ninguém começou
              ainda, e o número solto parecia defeito. */}
          <span className="text-white/55">
            {roda === 0 ? "A roda: ninguém começou" : `A roda: capítulo ${roda}`}
          </span>
        </div>

        <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: pct(meu) }}
          />
          <span
            className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-[#f59e0b]"
            style={{ left: pct(roda) }}
            aria-label={`A roda está no capítulo ${roda}`}
          />
        </div>

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
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-relaxed text-white/60">
            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-[#f59e0b]" />
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
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/90"
          data-testid="button-ouvir-ciclo"
        >
          <Headphones className="h-4 w-4" />
          {meu === 0 ? "Começar a ouvir" : "Continuar de onde parei"}
        </Link>
      </div>
    </section>
  );
}
