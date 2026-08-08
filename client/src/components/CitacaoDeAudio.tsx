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
import { slugify } from "@/lib/books";

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
  const relogio = useRelogioDoTrecho(citacao.duracaoSec);
  if (!livro) return null;

  if (grande) return <TrechoQueTocaAqui citacao={citacao} livro={livro} />;

  /*
   * **O play toca aqui, e o resto continua link** (ROTEIRO §4.92).
   *
   * Este cartão era um `<Link>` inteiro: tocar em qualquer lugar dele — inclusive
   * no botão redondo de play — levava embora, para o player do livro. O trecho
   * grande já tocava no lugar desde 29/07; o pequeno ficou registrado como "a
   * construir" na §4.60 e ficou. A §4.72 achou de novo, e o Matheus escolheu esta
   * saída na folha: **um pixel, um dono** — a capa e o texto abrem o livro, o play
   * ouve os 40 segundos sem sair da tela.
   *
   * Vale nos quatro lugares onde este cartão pequeno aparece: o compositor, a
   * folha "Seus trechos", o mural do clube e a resposta do fórum.
   */
  return (
    <div
      className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/8"
      data-testid="citacao-de-audio"
    >
      {!compacto && (
        <Link href={`/book/${livro.id}`} className="shrink-0">
          <img
            src={livro.cover}
            alt={livro.title}
            className="h-12 w-12 rounded-lg object-cover"
          />
        </Link>
      )}

      <Link
        href={linkDaCitacao(citacao)}
        onClick={() => savePlaying(true)}
        className="min-w-0 flex-1"
        data-testid="trecho-abrir-no-player"
      >
        {/*
          **Sem ícone aqui, de propósito.** Havia um par de aspas (`Quote`) antes
          do rótulo; a 10px ele virava dois riscos laranja soltos, e aspas dizem
          *citação de texto* quando isto é áudio. O Matheus apontou em 28/07:
          *"não dá para entender o que ele é exatamente, está meio solto"*. O
          rótulo já nomeia a coisa e a onda ao lado já diz "isto é som" — um
          terceiro sinal para o mesmo recado é o ruído que a §4.23 manda varrer.
        */}
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Trecho ·{" "}
          {relogio.tocando || relogio.decorrido > 0
            ? `-${relogio.restante}s`
            : `${citacao.duracaoSec}s`}
        </span>
        {!compacto && (
          <span className="mt-0.5 block truncate text-[12.5px] font-semibold">{livro.title}</span>
        )}
        <span className="mt-0.5 block truncate text-[10.5px] text-white/40">
          {rotuloDaCitacao(citacao)}
        </span>
      </Link>

      {/*
        A onda é desenhada, não medida — não há forma de onda para ler enquanto
        o áudio não existir. Mas as barras já ouvidas **acendem**, e é isso que a
        faz dizer *onde você está* em vez de só "isto é som".
      */}
      <span className="flex h-8 shrink-0 items-end gap-[2px]" aria-hidden>
        {[5, 11, 7, 15, 9, 18, 12, 6, 14, 8].map((altura, i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full transition-colors ${
              i / 10 < relogio.fracao ? "bg-primary" : "bg-primary/40"
            }`}
            style={{ height: altura }}
          />
        ))}
      </span>

      <button
        onClick={relogio.alternar}
        aria-label={relogio.tocando ? "Pausar o trecho" : "Ouvir o trecho"}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
        data-testid="tocar-trecho-compacto"
      >
        {relogio.tocando ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current" />
        )}
      </button>
    </div>
  );
}

/**
 * **O relógio que faz as vezes do áudio**, enquanto áudio não existe.
 *
 * ⚠️ A limitação é honesta e vale repetir: o AllBook **não tem arquivo de som**.
 * O player do livro também não toca — ele avança um relógio. Isto faz o
 * comportamento certo sem o som: toca, pausa, a onda acende conforme avança e
 * **para sozinho no fim do trecho**, voltando ao início (trecho curto se ouve de
 * novo, não se rebobina). Quando o áudio existir, entra um `<audio>` no lugar do
 * `setInterval` e nada nas telas muda.
 *
 * Está extraído porque as **duas** formas do cartão precisam dele — era a cópia
 * que faltava para o pequeno tocar igual ao grande.
 */
function useRelogioDoTrecho(duracaoSec: number) {
  const [tocando, setTocando] = useState(false);
  const [decorrido, setDecorrido] = useState(0);

  useEffect(() => {
    if (!tocando) return;
    const relogio = setInterval(() => {
      setDecorrido((atual) => {
        if (atual + 1 >= duracaoSec) {
          setTocando(false);
          return 0;
        }
        return atual + 1;
      });
    }, 1000);
    return () => clearInterval(relogio);
  }, [tocando, duracaoSec]);

  return {
    tocando,
    decorrido,
    fracao: decorrido / duracaoSec,
    restante: Math.max(0, duracaoSec - decorrido),
    alternar: () => setTocando((valor) => !valor),
  };
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
function TrechoQueTocaAqui({ citacao, livro }: { citacao: Citacao; livro: { id: number; cover: string; title: string; author: string; narrator: string } }) {
  /* O mesmo relógio do cartão pequeno — uma cópia só, desde §4.92. */
  const { tocando, decorrido, fracao, restante, alternar } = useRelogioDoTrecho(
    citacao.duracaoSec,
  );

  return (
    <div
      className="overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/8"
      data-testid="citacao-de-audio"
    >
      {/*
        **Capa inteira, e o fundo é ela mesma desfocada** — o formato unificado
        dos três cartões do feed (29/07). A versão anterior recortava a capa numa
        faixa: capa de livro é retrato, e cortar come a arte. O Matheus cobrou
        que eu tinha consertado isso só no cartão de livro; se o corte é ruim num,
        é ruim nos três.

        **Cada parte leva ao seu lugar**: a capa e o título abrem a ficha; o autor
        e o narrador abrem a página deles (`/person/:slug`). Antes o bloco inteiro
        era um link só, e o nome do narrador — que neste app é motivo de escolha
        de livro — ficava sendo texto morto.
      */}
      {/* `sobre-midia`: o fundo é a capa borrada sob um véu preto — escuro nos
          dois temas, então o texto daqui para dentro é branco nos dois. */}
      <div className="sobre-midia relative flex items-center gap-3.5 p-3.5">
        <div aria-hidden className="absolute inset-0">
          <img src={livro.cover} alt="" className="h-full w-full scale-125 object-cover blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/55 to-black/80" />
        </div>

        <Link href={`/book/${livro.id}`} className="relative shrink-0">
          <img
            src={livro.cover}
            alt={livro.title}
            className="h-[120px] w-20 rounded-lg object-cover shadow-lg shadow-black/50 ring-1 ring-white/10"
          />
        </Link>

        <div className="relative min-w-0 flex-1">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary">
            Trecho · {citacao.duracaoSec}s
          </span>
          <Link href={`/book/${livro.id}`} className="mt-1 block">
            <span className="line-clamp-2 font-display text-[15px] font-bold leading-tight hover:text-primary">
              {livro.title}
            </span>
          </Link>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
            <Link
              href={`/person/${slugify(livro.author)}`}
              className="underline-offset-2 hover:text-white hover:underline"
              data-testid="trecho-autor"
            >
              {livro.author}
            </Link>
            <br />
            narra{" "}
            <Link
              href={`/person/${slugify(livro.narrator)}`}
              className="underline-offset-2 hover:text-white hover:underline"
              data-testid="trecho-narrador"
            >
              {livro.narrator}
            </Link>
          </p>
        </div>
      </div>

      {/*
        A faixa do player é ESCURA nos dois temas (`sobre-midia` + preto), e isso
        é decisão dele em 08/08: sobre o papel creme, o vermelho do play e da
        onda pareciam lavados — *"o símbolo vermelho se confunde com a cor creme,
        deveria ser mais vivo, como quando está no tema escuro"*. Não era cor
        errada (medimos: o botão estava no vermelho certo), era **contraste
        simultâneo** — a mesma cor sobre fundo claro perde brilho. Com o fundo
        escuro, `sobre-midia` ainda devolve o `#FF4438` do Estúdio aqui dentro.
      */}
      <div className="sobre-midia flex items-center gap-3 border-t border-white/10 bg-black/85 px-3 py-2.5">
        <button
          onClick={alternar}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
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

        {/* O carimbo do momento vira porta para o player naquele ponto: quem
            quer ouvir só o trecho usa o play aqui; quem quer continuar dali
            para a frente toca no horário. Duas vontades, dois alvos. */}
        <Link
          href={linkDaCitacao(citacao)}
          onClick={() => savePlaying(true)}
          className="shrink-0 text-right"
          data-testid="trecho-abrir-no-player"
        >
          <span className="block font-mono text-[11.5px] font-bold text-primary">
            {tocando || decorrido > 0 ? `-${restante}s` : `${citacao.duracaoSec}s`}
          </span>
          <span className="block text-[10px] text-white/35 underline-offset-2 hover:underline">
            {rotuloDaCitacao(citacao)}
          </span>
        </Link>
      </div>
    </div>
  );
}

/** O fim do trecho, exposto para quem precisa saber onde parar. */
export { fimDaCitacao };
