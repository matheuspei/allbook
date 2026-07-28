import { useEffect, useState } from "react";
import { Check, Vote } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { souDono, type Clube } from "@/lib/clubes";
import {
  PAUTAS_EVENT,
  apuracaoDaPauta,
  meuVotoNaPauta,
  pautaAberta,
  votarNaPauta,
} from "@/lib/pautas";
import { janelaEmTexto } from "@/lib/rodadas";

/**
 * A pauta, do lado de quem vota.
 *
 * **Só existe quando há uma pauta aberta** (ROTEIRO 4.40) — e essa é a regra que
 * a reformulação da tela do clube seguiu inteira: o que é por tempo determinado
 * aparece **quando é a hora** e some depois, em vez de virar uma seção permanente
 * que passa a maior parte do ano vazia. A tela do clube estava com cinco seções
 * empilhadas, várias sem nada dentro; era metade da queixa de layout.
 *
 * **Número aberto, nome fechado.** Você vê quantos votos cada opção teve, nunca
 * quem votou em quê — a mesma regra da régua de progresso e da votação do próximo
 * livro. Numa turma pequena, voto com nome não é voto, é declaração pública.
 *
 * **Dá para mudar o voto até a pauta fechar**, porque a discussão continua no
 * mural: quem votou antes de ler o argumento do outro tem de poder mudar de
 * ideia, senão a conversa não serve para nada.
 */
export default function PautaNoClube({ clube }: { clube: Clube }) {
  const { toast } = useToast();
  const [, redesenhar] = useState(0);

  useEffect(() => {
    const atualizar = () => redesenhar((n) => n + 1);
    window.addEventListener(PAUTAS_EVENT, atualizar);
    return () => window.removeEventListener(PAUTAS_EVENT, atualizar);
  }, []);

  const pauta = pautaAberta(clube.id);
  if (!pauta) return null;

  const apuracao = apuracaoDaPauta(pauta, clube);
  const total = apuracao.reduce((soma, item) => soma + item.votos, 0);
  const meu = meuVotoNaPauta(pauta.id);

  return (
    <section
      className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4"
      data-testid="pauta-no-clube"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        <Vote className="h-3 w-3" />
        Em votação · {janelaEmTexto(pauta.fecha)}
      </p>
      <h2 className="mt-2 font-display text-[15px] font-bold leading-snug">{pauta.pergunta}</h2>

      <div className="mt-3 space-y-1.5">
        {apuracao.map((item) => {
          const escolhida = meu === item.indice;
          return (
            <button
              key={item.indice}
              onClick={() => {
                votarNaPauta(pauta.id, item.indice);
                toast({
                  title: escolhida ? "Voto mantido" : `Você votou em "${item.opcao}"`,
                  description: "Dá para mudar até a votação fechar.",
                });
              }}
              className={`relative w-full overflow-hidden rounded-lg text-left transition-colors ${
                escolhida ? "bg-primary/15 ring-1 ring-inset ring-primary/45" : "bg-white/[0.05] hover:bg-white/10"
              }`}
              data-testid={`votar-opcao-${item.indice}`}
            >
              <span
                className="absolute inset-y-0 left-0 bg-primary/20"
                style={{ width: total > 0 ? `${(item.votos / total) * 100}%` : "0%" }}
              />
              <span className="relative flex items-center gap-2 px-3 py-2.5">
                {escolhida && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                <span className="min-w-0 flex-1 truncate text-[13px]">{item.opcao}</span>
                <span className="shrink-0 text-[11px] font-semibold text-white/55">{item.votos}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 text-[10.5px] leading-relaxed text-white/35">
        {total} de {clube.membros.length} {clube.membros.length === 1 ? "voto" : "votaram"} · você vê
        o número, nunca quem votou em quê.
        {souDono(clube) && " Encerrar antes do prazo fica em Gerenciar."}
      </p>
    </section>
  );
}
