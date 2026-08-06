import { useState } from "react";
import { Radio } from "lucide-react";
import { avatarDeLeitor, findMember } from "@/lib/community";
import { EU } from "@/lib/clubes";
import { formatarPosicao } from "@/lib/sala";
import { rastroNoTrecho } from "@/lib/salaAoVivo";

/** Ligado ou desligado fica guardado: quem desligou não quer ver de novo amanhã. */
const CHAVE = "allbook_rastro_ligado";

function lerLigado(): boolean {
  return localStorage.getItem(CHAVE) !== "nao";
}

/**
 * **O que se disse nas sessões ao vivo, neste ponto do livro.**
 *
 * ---
 *
 * **Por que isto é uma camada separada, e não mais comentários na lista.**
 *
 * Quando o Matheus decidiu guardar a conversa das sessões (§4.81), o medo dele
 * era conversa solta virando lixo. O argumento que resolveu foi dele mesmo:
 * *"são coisas diferentes: uma coisa é o chat ao vivo, outra é a aba de discussão
 * do que foi falado no capítulo"*.
 *
 * Só que o argumento **se perde na tela** se as falas caírem na mesma lista dos
 * comentários — ali "kkkkk" e uma resenha de três linhas ficam com o mesmo peso,
 * e a separação que ele defendeu deixa de existir. Por isso o rastro:
 *
 * - vem **marcado** ("na sessão de terça"), com a origem sempre visível;
 * - fica **num bloco próprio**, depois dos comentários;
 * - e **desliga**, para quem quiser ouvir sem a plateia de ontem.
 *
 * ⚠️ **A trava de spoiler vale aqui.** `rastroNoTrecho` só devolve fala de trecho
 * por onde a pessoa já passou — foi essa peça, que já existia, que permitiu
 * guardar a conversa em vez de apagá-la.
 */
export default function RastroDaSessao({
  bookId,
  posicaoSec,
}: {
  bookId: number;
  posicaoSec: number;
}) {
  const [ligado, setLigado] = useState(lerLigado);
  const rastro = rastroNoTrecho(bookId, posicaoSec);

  /* Sem sessão nenhuma neste trecho, o bloco não existe — nada de caixa vazia. */
  if (rastro.length === 0) return null;

  function alternar() {
    const novo = !ligado;
    setLigado(novo);
    localStorage.setItem(CHAVE, novo ? "sim" : "nao");
  }

  return (
    <div className="mt-5 rounded-2xl bg-sky-400/[0.06] p-3.5 ring-1 ring-inset ring-sky-400/20" data-testid="rastro-da-sessao">
      <div className="flex items-center gap-2">
        <Radio className="h-3.5 w-3.5 shrink-0 text-sky-300" />
        <h3 className="flex-1 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-sky-300">
          Da sessão ao vivo
        </h3>
        <button
          onClick={alternar}
          className="text-[10.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
          data-testid="button-alternar-rastro"
        >
          {ligado ? "esconder" : `mostrar (${rastro.length})`}
        </button>
      </div>

      {ligado ? (
        <div className="mt-3 space-y-2.5">
          {rastro.map(({ fala, sala }) => {
            const membro = findMember(fala.autor);
            const souEu = fala.autor === EU;
            const nome = souEu ? "Você" : membro?.name ?? fala.autor;

            return (
              <div key={fala.id} className="flex items-start gap-2">
                <span
                  className={`flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-black ${
                    membro?.color ?? "from-primary to-primary/60"
                  }`}
                  {...avatarDeLeitor(souEu ? undefined : fala.autor)}
                >
                  {nome.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white/75">
                    {nome}
                    {fala.autor === sala.anfitriao && (
                      <span className="ml-1.5 text-[9px] font-extrabold tracking-[0.08em] text-primary">
                        ANFITRIÃO
                      </span>
                    )}
                  </div>
                  <div className="mt-px text-[12px] leading-snug text-white/55">{fala.texto}</div>
                  <div className="mt-0.5 text-[9.5px] tabular-nums text-white/25">
                    ao vivo · {formatarPosicao(fala.posicaoSec)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-white/30">
          O que a turma falou aqui está escondido. Isto é conversa de sessão ao vivo — separada
          dos comentários do livro de propósito.
        </p>
      )}
    </div>
  );
}
