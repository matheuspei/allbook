import { ArrowRight, Radio } from "lucide-react";
import { formatarPosicao } from "@/lib/sala";
import { chapterAtSec } from "@/lib/chapters";
import { findMember } from "@/lib/community";
import { EU } from "@/lib/clubes";
import { ondeATurmaParou } from "@/lib/salaAoVivo";

/**
 * **Continuar de onde a turma parou** — a função que o Matheus chamou de melhor
 * de todas (§4.81).
 *
 * > *"Eu gosto bastante da ideia C, principalmente do fato de você continuar de
 * > onde parou, mesmo se a pessoa não puder ter ouvido."*
 *
 * É o que faz a sessão ao vivo **não excluir quem não pôde estar lá**. A sala
 * acabou, mas ela deixou um ponto e um rastro: quem faltou salta para o ponto da
 * turma e ouve dali, com as falas de cada minuto aparecendo no caminho.
 *
 * **Só aparece para quem está atrás.** Quem já passou daquele ponto não tem o que
 * "continuar" — mostrar a faixa ali seria oferecer um retrocesso, e isso é o
 * oposto do que ela promete.
 */
export default function ContinuarDaTurma({
  bookId,
  posicaoAtualSec,
  onIr,
}: {
  bookId: number;
  posicaoAtualSec: number;
  onIr: (posicaoSec: number) => void;
}) {
  const parada = ondeATurmaParou(bookId);
  if (!parada) return null;

  /* Um minuto de folga: quem está a 20 segundos do ponto já está "lá", e a
     faixa viraria um empurrão para frente sem valor nenhum. */
  if (posicaoAtualSec >= parada.posicaoSec - 60) return null;

  const anfitriao =
    parada.sala.anfitriao === EU ? null : findMember(parada.sala.anfitriao);
  const quantos = parada.sala.falas.length;

  return (
    <button
      onClick={() => onIr(parada.posicaoSec)}
      className="flex w-full shrink-0 items-center gap-2.5 rounded-xl bg-sky-400/[0.07] px-3.5 py-2.5 text-left ring-1 ring-inset ring-sky-400/25 transition-colors hover:bg-sky-400/[0.12]"
      data-testid="continuar-da-turma"
    >
      <Radio className="h-4 w-4 shrink-0 text-sky-300" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold leading-tight">
          A turma parou no cap. {chapterAtSec(bookId, parada.posicaoSec)}
        </span>
        <span className="mt-0.5 block truncate text-[10.5px] text-white/40">
          {anfitriao ? `sessão de ${anfitriao.name}` : "sua sessão"} ·{" "}
          {formatarPosicao(parada.posicaoSec)}
          {quantos > 0 && ` · ${quantos} ${quantos === 1 ? "fala" : "falas"} no caminho`}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-sky-400/15 px-2.5 py-1 text-[10.5px] font-bold text-sky-200">
        continuar de lá
        <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}
