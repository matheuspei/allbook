import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { AberturaOnda, AberturaVarredura, AberturaMarcador } from "@/components/Aberturas";

/**
 * Tela de comparação das três aberturas (`/abertura-teste`) — **temporária**.
 *
 * Existe só para o Matheus assistir às três lado a lado e escolher. Quando ele
 * escolher, esta tela, a rota e as duas perdedoras somem, e a vencedora vira a
 * abertura de verdade do app.
 *
 * O botão "repetir" remonta o componente trocando a `key` — é o jeito mais
 * simples de rebobinar uma animação do framer sem controlar tempo à mão.
 */

const PROPOSTAS = [
  {
    id: "onda",
    nome: "A — A onda vira palavra",
    ideia:
      "Barras de equalizador tocam e colapsam; o logotipo nasce delas. É a que mais fala do produto: som virando livro.",
    Componente: AberturaOnda,
  },
  {
    id: "varredura",
    nome: "B — A varredura de luz",
    ideia:
      "O logotipo já está lá, apagado. Uma faixa de luz o atravessa e ele acende por onde ela passa. A mais próxima da Netflix, e a mais discreta.",
    Componente: AberturaVarredura,
  },
  {
    id: "marcador",
    nome: "C — O marcador de página",
    ideia:
      "Um marcador desce, pousa, e a palavra se abre a partir dele. Fala de livro — e o marcador é o mesmo símbolo da Biblioteca no menu de baixo.",
    Componente: AberturaMarcador,
  },
];

export default function AberturaTeste() {
  // Uma "geração" por proposta: mudar o número remonta só aquele quadro.
  const [geracao, setGeracao] = useState<Record<string, number>>({});
  const repetir = (id: string) =>
    setGeracao((atual) => ({ ...atual, [id]: (atual[id] ?? 0) + 1 }));

  return (
    <div className="min-h-screen bg-[#141414] px-4 pb-24 pt-4 text-white">
      <h1 className="font-display text-2xl font-bold tracking-tight">Abertura do app</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-white/45">
        Três propostas para a vinheta visual do AllBook. Toque em repetir para assistir de novo.
        Escolha uma — as outras duas somem.
      </p>

      <div className="mt-6 space-y-8">
        {PROPOSTAS.map(({ id, nome, ideia, Componente }) => (
          <section key={id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold tracking-tight">{nome}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-white/45">{ideia}</p>
              </div>

              <button
                type="button"
                onClick={() => repetir(id)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/20 active:scale-95"
                data-testid={`repetir-${id}`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Repetir
              </button>
            </div>

            <div className="mt-3 aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Componente key={geracao[id] ?? 0} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
