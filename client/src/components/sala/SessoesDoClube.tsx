import { Link } from "wouter";
import { catalog } from "@/lib/books";
import { avatarDeLeitor, findMember } from "@/lib/community";
import { type Clube } from "@/lib/clubes";
import { salasDoClube, situacaoDaSala } from "@/lib/salaAoVivo";

/**
 * **As sessões de escuta deste clube** (ROTEIRO §4.81).
 *
 * ---
 *
 * ⚠️ **Sessão não é rodada, e a tela precisa dizer isso.**
 *
 * O clube passou a ter dois jeitos de ser, e os dois convivem:
 *
 * - a **rodada** do ciclo — sem hora, responde quando der (§4.39);
 * - a **sessão de escuta** — com hora, todo mundo no mesmo segundo (§4.81).
 *
 * A §4.79 já tinha rejeitado dar ao clube um "evento" próprio justamente porque
 * nasceriam **duas coisas com o mesmo nome** e os avisos passariam a falar de
 * duas realidades. A decisão do Matheus de permitir sessão ao vivo não desfaz
 * aquilo — ela só exige que os nomes fiquem distintos. Daí o rodapé, que não é
 * enfeite: sem ele, "rodada" e "sessão" viram a mesma coisa na cabeça de quem lê.
 *
 * **Marcar é opcional** — foi o argumento dele que derrubou a minha objeção.
 * Clube que não quer sessão nenhuma simplesmente não marca, e esta seção some.
 */
export default function SessoesDoClube({ clube }: { clube: Clube }) {
  /*
   * **Só o que está acontecendo agora.** As sessões *marcadas* vivem na agenda
   * do clube ("Encontros marcados"), junto com os eventos de comunidade — ter
   * duas listas de coisa-com-hora na mesma página foi um defeito real, achado
   * testando, e está explicado no `EncontrosDoClube` em `pages/Clube.tsx`.
   *
   * Aqui fica o que **não é agenda**: a sala no ar, que existe enquanto dura.
   */
  const agora = salasDoClube(clube.id).filter((sala) => sala.porta !== "marcada");
  if (agora.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="sessoes-do-clube">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Ouvindo agora</h2>
        <span className="text-xs text-white/35">sessão de escuta ao vivo</span>
      </div>

      {agora.map((sala) => {
        const situacao = situacaoDaSala(sala);
        const anfitriao = findMember(sala.anfitriao);
        const book = catalog.find((item) => item.id === sala.bookId);

        return (
          <Link
            key={sala.id}
            href={`/sala/${sala.id}`}
            className="block rounded-2xl bg-red-500/[0.08] p-3.5 ring-1 ring-inset ring-red-500/25 transition-colors hover:bg-red-500/[0.13]"
            data-testid={`sessao-agora-${sala.id}`}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.12em] text-red-300">
                ACONTECENDO AGORA
              </span>
            </div>

            <div className="flex gap-3">
              {book && (
                <img src={book.cover} alt="" className="h-[52px] w-[52px] rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold leading-snug">
                  {anfitriao?.name ?? "Você"} está ouvindo com{" "}
                  {Math.max(0, sala.presentes.length - 1)}{" "}
                  {sala.presentes.length - 1 === 1 ? "pessoa" : "pessoas"}
                </div>
                <div className="mt-1 text-[11px] text-white/40">
                  cap. {situacao.capitulo} · entrar te leva ao ponto deles
                </div>
                <div className="mt-2 flex">
                  {sala.presentes.slice(0, 5).map((slug, i) => {
                    const membro = findMember(slug);
                    return (
                      <span
                        key={slug}
                        className={`flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-[#141414] bg-gradient-to-br text-[8px] font-bold text-black ${
                          membro?.color ?? "from-primary to-amber-500"
                        } ${i > 0 ? "-ml-1.5" : ""}`}
                        {...avatarDeLeitor(slug)}
                      >
                        {(membro?.name ?? "V").charAt(0)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      <p className="text-[10.5px] leading-relaxed text-white/25">
        Entrar te põe no mesmo segundo que a turma. A <b className="text-white/45">rodada</b> do
        clube continua sem hora — você responde quando der.
      </p>
    </section>
  );
}
