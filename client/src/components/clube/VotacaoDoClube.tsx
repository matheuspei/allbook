import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Vote } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { comecarCiclo, prazoEmTexto, souDono, type Clube } from "@/lib/clubes";
import {
  apuracao,
  empatadosNoTopo,
  encerrarVotacao,
  meuLivroDerrotado,
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
 * **De 2 a 5 opções, com 3 sugerido** (§4.58). O argumento contra listas longas
 * continua valendo e vale registrar porque é contraintuitivo: *com 5 opções e 8
 * pessoas, o vencedor sai com 3 votos* — cinco pessoas ficam com um livro que
 * não escolheram. O 5 só passou a caber porque quem perde ganhou saída: ao
 * fechar, quem votou no derrotado é convidado a **fundar o clube daquele livro**.
 *
 * **Empate quem desfaz é o dono.** Sortear seria mais "justo" no papel e pior na
 * prática — ninguém entende de onde veio o resultado, e o clube tem moderador
 * justamente para o que a regra não fecha.
 *
 * **O voto é aberto em número, fechado em nome:** você vê quantos votos cada
 * livro tem, não quem votou em quê. É a mesma escolha da régua de progresso —
 * o clube mostra o grupo, não expõe o indivíduo.
 */
export default function VotacaoDoClube({ clube }: { clube: Clube }) {
  const { toast } = useToast();
  const [votacao, setVotacao] = useState<Votacao | undefined>(() => votacaoDoClube(clube.id));
  /** O livro escolhido pelo dono quando dá empate. */
  const [desempate, setDesempate] = useState<number | undefined>();
  /** O seu livro derrotado, para o convite de fundar um clube dele. */
  const [derrotado, setDerrotado] = useState<{ bookId: number; quantos: number } | undefined>();

  useEffect(() => {
    const atualizar = () => setVotacao(votacaoDoClube(clube.id));
    atualizar();
    window.addEventListener(RODADAS_EVENT, atualizar);
    return () => window.removeEventListener(RODADAS_EVENT, atualizar);
  }, [clube.id]);

  /* O convite de fundar clube sobrevive ao fim da votação — é justamente
     **depois** dela que ele faz sentido. */
  if (!votacao) {
    return derrotado ? (
      <ConviteDeFundarClube
        bookId={derrotado.bookId}
        quantos={derrotado.quantos}
        onFechar={() => setDerrotado(undefined)}
      />
    ) : null;
  }

  const meu = meuVoto(clube.id);
  const resultado = apuracao(votacao);
  const totalDeVotos = resultado.reduce((soma, item) => soma + item.votos, 0);
  const souModerador = souDono(clube);
  const empatados = empatadosNoTopo(votacao);

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
        <>
          {/* **O empate aparece antes do botão**, com os nomes: sem isso o dono
              encerraria sem saber que estava escolhendo, e a turma veria um
              vencedor saído do nada. */}
          {empatados.length > 1 && (
            <div
              className="rounded-xl border border-primary/25 bg-primary/[0.07] p-3"
              data-testid="empate-na-votacao"
            >
              <p className="text-[11.5px] leading-relaxed text-white/70">
                <b className="text-primary">Empate.</b> Você desempata — toque no que vai valer.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {empatados.map((bookId) => {
                  const livro = catalog.find((item) => item.id === bookId);
                  return (
                    <button
                      key={bookId}
                      onClick={() => setDesempate(bookId)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        desempate === bookId
                          ? "bg-primary text-black"
                          : "border border-white/15 text-white/60 hover:text-white"
                      }`}
                      data-testid={`desempate-${bookId}`}
                    >
                      {livro?.title ?? "livro"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              const escolhido = desempate ?? vencedor(votacao);
              const livro = catalog.find((item) => item.id === escolhido);
              /* O derrotado é lido **antes** de encerrar: depois disso a votação
                 some e o seu voto já não pode ser comparado com nada. */
              const perdido = meuLivroDerrotado(votacao, escolhido);
              comecarCiclo(clube.id, escolhido);
              encerrarVotacao(clube.id);
              setDerrotado(perdido);
              toast({
                title: "Novo ciclo começou",
                description: `"${livro?.title}" é o livro da vez. O anterior foi para a estante do clube.`,
              });
            }}
            disabled={empatados.length > 1 && desempate === undefined}
            className="w-full rounded-xl bg-white/[0.06] py-2.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
            data-testid="encerrar-votacao"
          >
            Encerrar votação e começar o ciclo
          </button>
        </>
      )}
    </section>
  );
}

/**
 * "3 pessoas também queriam X — criar um clube desse livro?"
 *
 * **A peça nasceu de uma pergunta do Matheus** (§4.58): *"como essa pessoa vai
 * para o outro clube?"*. Quem votou no livro derrotado ficava com o livro que não
 * escolheu e nenhuma saída — e a saída óbvia (mover a pessoa para outro clube)
 * foi **rejeitada**, porque mover gente sem que ela peça é decidir por ela.
 *
 * O que ficou faz o clube **se multiplicar sozinho**: o grupo que queria outro
 * livro funda o próprio, com o formulário já preenchido. E é o que compensa o
 * custo de permitir 5 opções na votação.
 */
export function ConviteDeFundarClube({
  bookId,
  quantos,
  onFechar,
}: {
  bookId: number;
  quantos: number;
  onFechar: () => void;
}) {
  const livro = catalog.find((item) => item.id === bookId);
  if (!livro) return null;

  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.07] p-3"
      data-testid="fundar-clube-do-derrotado"
    >
      <img src={livro.cover} alt="" className="h-[54px] w-[38px] shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-white/75">
          {quantos > 1 ? `${quantos} pessoas também queriam` : "Você queria"}{" "}
          <b className="text-white">{livro.title}</b>. Que tal abrir um clube dele?
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link
            href={`/clubes/novo?livro=${livro.id}`}
            className="text-[11.5px] font-bold text-primary"
            data-testid="criar-clube-do-derrotado"
          >
            Criar o clube
          </Link>
          <button
            onClick={onFechar}
            className="text-[11.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
