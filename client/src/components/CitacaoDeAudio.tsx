import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Pause, Play } from "lucide-react";

import {
  fimDaCitacao,
  linkDaCitacao,
  livroDaCitacao,
  rotuloDaCitacao,
  type Citacao,
} from "@/lib/citacoes";
import { savePlaying } from "@/lib/playback";

/**
 * O cartão de um trecho citado — a peça que a sala e o feed usam igual.
 *
 * **Um cartão, dois lugares** (ROTEIRO 4.43). Ele nasce dentro da conversa do
 * livro, mas o destino que o Matheus descreveu é o feed da Comunidade: *"a gente
 * coloca essa parte do áudio de 40 segundos dentro desse feed também"*. Como a
 * Comunidade é da janela B, o cartão fica aqui pronto para ser importado —
 * escrever duas versões dele seria o erro que a §4.40 cobrou caro.
 *
 * **A capa entra porque a citação viaja.** Dentro da ficha do livro dá para
 * supor de que livro é o trecho; num feed, não — ali a citação chega no meio de
 * assuntos de outras pessoas. A capa e o título fazem o cartão se explicar
 * sozinho onde quer que ele apareça, e são também o **link para o livro**, que
 * era outro pedido do mesmo dia.
 *
 * **O botão leva ao player com fim marcado** (`?t=…&ate=…`): o player para no
 * fim do trecho em vez de seguir livro adentro. Era a condição que o Matheus pôs
 * — *"só poder reproduzir isso"*.
 */
export default function CitacaoDeAudio({
  citacao,
  compacto,
  grande,
}: {
  citacao: Citacao;
  /** Dentro da ficha do próprio livro a capa é redundante — some. */
  compacto?: boolean;
  /**
   * A versão com a **capa ao fundo** — para o feed, onde o trecho é o conteúdo
   * do cartão e não um anexo de um texto.
   *
   * Pedido do Matheus em 29/07, comparando com uma maquete antiga: *"esse áudio
   * está bem melhor do que o que a gente implementou, porque você consegue ver
   * o ícone maior da capa"*. Ele tem razão, e o motivo é o mesmo que sustenta a
   * §4.53: **é a capa que dá corpo visual**; miniatura de 48px é informação,
   * capa grande é presença.
   */
  grande?: boolean;
}) {
  const livro = livroDaCitacao(citacao);
  if (!livro) return null;

  if (grande) return <TrechoQueTocaAqui citacao={citacao} livro={livro} />;

  return (
    <Link
      href={linkDaCitacao(citacao)}
      onClick={() => savePlaying(true)}
      className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/[0.09]"
      data-testid="citacao-de-audio"
    >
      {!compacto && (
        <img
          src={livro.cover}
          alt={livro.title}
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      )}

      <span className="min-w-0 flex-1">
        {/*
          **Sem ícone aqui, de propósito.** Havia um par de aspas (`Quote`) antes
          do rótulo; a 10px ele virava dois riscos laranja soltos, e aspas dizem
          *citação de texto* quando isto é áudio. O Matheus apontou em 28/07:
          *"não dá para entender o que ele é exatamente, está meio solto"*. O
          rótulo já nomeia a coisa e a onda ao lado já diz "isto é som" — um
          terceiro sinal para o mesmo recado é o ruído que a §4.23 manda varrer.
        */}
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Trecho · {citacao.duracaoSec}s
        </span>
        {!compacto && (
          <span className="mt-0.5 block truncate text-[12.5px] font-semibold">{livro.title}</span>
        )}
        <span className="mt-0.5 block truncate text-[10.5px] text-white/40">
          {rotuloDaCitacao(citacao)}
        </span>
      </span>

      {/*
        A onda é desenhada, não medida — não há forma de onda para ler enquanto
        o áudio não existir. Ela é decoração honesta: diz "isto é som", que é o
        trabalho dela, e não finge representar este trecho em particular.
      */}
      <span className="flex h-8 shrink-0 items-end gap-[2px]" aria-hidden>
        {[5, 11, 7, 15, 9, 18, 12, 6, 14, 8].map((altura, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full bg-primary/45"
            style={{ height: altura }}
          />
        ))}
      </span>

      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-black">
        <Play className="h-4 w-4 fill-current" />
      </span>
    </Link>
  );
}

/**
 * O trecho que **toca aqui dentro**, sem sair do feed.
 *
 * Pedido do Matheus em 29/07, e ele está certo: *"quando você clica no player,
 * ele te leva para o áudio do livro; não faz sentido nenhum — ele tem que ser
 * reproduzido aqui dentro, é para isso que ele existe"*. Um trecho de 40
 * segundos que exige trocar de tela para ouvir não é um trecho, é um link.
 *
 * ⚠️ **A limitação honesta: o AllBook ainda não tem áudio.** Não existe arquivo
 * nenhum — o player do livro também não toca som, ele avança um relógio (ver
 * `AudioPlayer`). Então o que este componente faz é **o comportamento certo sem
 * o som**: toca/pausa, a onda se acende conforme avança, o tempo corre e **para
 * sozinho no fim do trecho**. Quando o áudio existir, entra um `<audio>` no
 * lugar do relógio e nada mais nesta tela muda.
 *
 * **A capa continua sendo porta para o livro** — só o play deixou de navegar.
 * Quem quer ouvir, ouve aqui; quem quer o livro, toca na capa.
 */
function TrechoQueTocaAqui({ citacao, livro }: { citacao: Citacao; livro: { id: number; cover: string; title: string; author: string } }) {
  const [tocando, setTocando] = useState(false);
  const [decorrido, setDecorrido] = useState(0);

  useEffect(() => {
    if (!tocando) return;
    const relogio = setInterval(() => {
      setDecorrido((atual) => {
        if (atual + 1 >= citacao.duracaoSec) {
          setTocando(false);
          return 0; // volta ao início: trecho curto se ouve de novo, não se rebobina
        }
        return atual + 1;
      });
    }, 1000);
    return () => clearInterval(relogio);
  }, [tocando, citacao.duracaoSec]);

  const fracao = decorrido / citacao.duracaoSec;
  const restante = Math.max(0, citacao.duracaoSec - decorrido);

  return (
    <div
      className="overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/8"
      data-testid="citacao-de-audio"
    >
      <Link href={`/book/${livro.id}`} className="relative block h-32">
        <img src={livro.cover} alt={livro.title} className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block truncate font-display text-[15px] font-bold">{livro.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-white/55">{livro.author}</span>
        </span>
      </Link>

      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={() => setTocando((valor) => !valor)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-black transition-transform active:scale-95"
          aria-label={tocando ? "Pausar o trecho" : "Ouvir o trecho"}
          data-testid="tocar-trecho-aqui"
        >
          {tocando ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </button>

        {/*
          A onda é desenhada, não medida — não há forma de onda para ler
          enquanto o áudio não existir. O que ela faz de verdade é mostrar
          **onde você está**: as barras já ouvidas acendem.
        */}
        <span className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden>
          {Array.from({ length: 30 }, (_, i) => (
            <span
              key={i}
              className={`w-[3px] shrink-0 rounded-full transition-colors ${
                i / 30 < fracao ? "bg-primary" : "bg-primary/25"
              }`}
              style={{ height: 5 + ((i * 37) % 22) }}
            />
          ))}
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-mono text-[11.5px] font-bold text-primary">
            {tocando || decorrido > 0 ? `-${restante}s` : `${citacao.duracaoSec}s`}
          </span>
          <span className="block text-[10px] text-white/35">{rotuloDaCitacao(citacao)}</span>
        </span>
      </div>
    </div>
  );
}

/** O fim do trecho, exposto para quem precisa saber onde parar. */
export { fimDaCitacao };
