import { useEffect, useState } from "react";
import { Check, Vote } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { comecarCiclo, prazoEmTexto, souDono, type Clube } from "@/lib/clubes";
import {
  apuracao,
  encerrarVotacao,
  meuVoto,
  RODADAS_EVENT,
  vencedor,
  votacaoDoClube,
  votar,
  type Votacao,
} from "@/lib/rodadas";

/**
 * A votação do próximo livro — o que dá **continuidade** ao clube.
 *
 * Sem isso o clube morre no fim do primeiro livro: acaba o ciclo, ninguém sabe
 * o que vem depois, e o grupo se dissolve. Com a votação, o fim de um ciclo é o
 * começo do outro — e o livro que sai vai para a **estante do clube**, que é a
 * memória do que aquela turma leu junto.
 *
 * **Três opções, nunca mais.** Lista longa dispersa o voto e ninguém decide;
 * duas viram disputa. Três é o número que se lê de uma vez no celular.
 *
 * **O voto é aberto em número, fechado em nome:** você vê quantos votos cada
 * livro tem, não quem votou em quê. É a mesma escolha da régua de progresso —
 * o clube mostra o grupo, não expõe o indivíduo.
 */
export default function VotacaoDoClube({ clube }: { clube: Clube }) {
  const { toast } = useToast();
  const [votacao, setVotacao] = useState<Votacao | undefined>(() => votacaoDoClube(clube.id));

  useEffect(() => {
    const atualizar = () => setVotacao(votacaoDoClube(clube.id));
    atualizar();
    window.addEventListener(RODADAS_EVENT, atualizar);
    return () => window.removeEventListener(RODADAS_EVENT, atualizar);
  }, [clube.id]);

  if (!votacao) return null;

  const meu = meuVoto(clube.id);
  const resultado = apuracao(votacao);
  const totalDeVotos = resultado.reduce((soma, item) => soma + item.votos, 0);
  const souModerador = souDono(clube);

  return (
    <section className="space-y-3" data-testid="votacao-do-clube">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Próximo livro</h2>
        <span className="text-xs text-white/35">{prazoEmTexto(votacao.fecha)}</span>
      </div>

      <div className="space-y-2">
        {resultado.map((opcao) => {
          const livro = catalog.find((item) => item.id === opcao.bookId);
          if (!livro) return null;
          const escolhido = meu === opcao.bookId;
          const proporcao = totalDeVotos > 0 ? (opcao.votos / totalDeVotos) * 100 : 0;

          return (
            <button
              key={opcao.bookId}
              type="button"
              onClick={() => {
                votar(clube.id, opcao.bookId);
                toast({ title: `Você votou em "${livro.title}"` });
              }}
              className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition-colors ${
                escolhido
                  ? "border-primary/40 bg-primary/[0.08]"
                  : "border-white/5 bg-white/[0.04] hover:bg-white/[0.07]"
              }`}
              data-testid={`voto-${opcao.bookId}`}
            >
              {/* A barra de proporção mora atrás do conteúdo, bem fraca: informa
                  sem virar gráfico e sem atrapalhar a leitura do título. */}
              <span
                className="absolute inset-y-0 left-0 bg-white/[0.05]"
                style={{ width: `${proporcao}%` }}
                aria-hidden
              />
              <span className="relative flex items-center gap-3">
                <img
                  src={livro.cover}
                  alt={livro.title}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{livro.title}</span>
                  <span className="block truncate text-[11px] text-white/40">{livro.author}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-white/50">
                  {escolhido && <Check className="h-3.5 w-3.5 text-primary" />}
                  {opcao.votos} {opcao.votos === 1 ? "voto" : "votos"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {meu === undefined && (
        <p className="flex items-center gap-2 text-[11px] text-white/35">
          <Vote className="h-3 w-3" />
          Toque num livro para votar. Dá para mudar o voto até a votação fechar.
        </p>
      )}

      {souModerador && (
        <button
          onClick={() => {
            const escolhido = vencedor(votacao);
            const livro = catalog.find((item) => item.id === escolhido);
            comecarCiclo(clube.id, escolhido);
            encerrarVotacao(clube.id);
            toast({
              title: "Novo ciclo começou",
              description: `"${livro?.title}" é o livro da vez. O anterior foi para a estante do clube.`,
            });
          }}
          className="w-full rounded-xl bg-white/[0.06] py-2.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10"
          data-testid="encerrar-votacao"
        >
          Encerrar votação e começar o ciclo
        </button>
      )}
    </section>
  );
}
