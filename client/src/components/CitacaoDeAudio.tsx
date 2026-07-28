import { Link } from "wouter";
import { Play } from "lucide-react";

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
}: {
  citacao: Citacao;
  /** Dentro da ficha do próprio livro a capa é redundante — some. */
  compacto?: boolean;
}) {
  const livro = livroDaCitacao(citacao);
  if (!livro) return null;

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

/** O fim do trecho, exposto para quem precisa saber onde parar. */
export { fimDaCitacao };
