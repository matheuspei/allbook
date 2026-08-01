import { Plus, RotateCcw, X } from "lucide-react";

import { getChapters } from "@/lib/chapters";
import { dataCurta, marcosSugeridos, type Marco } from "@/lib/clubes";

/**
 * O ritmo do ciclo, marco a marco — e **editável**.
 *
 * **Por que existe** (ROTEIRO 4.42): o Matheus apontou que o moderador *"não tem
 * autonomia"* justamente no que mais importa para tocar um clube — *"na questão
 * dos capítulos, quando ele coloca um livro, ele poderia também editar quando é
 * que cada um começa e acaba"*. Até aqui os marcos eram calculados por uma
 * fórmula (capítulos ÷ semanas) e ninguém podia encostar: o app decidia o ritmo
 * e o dono do clube aceitava.
 *
 * **A sugestão continua, mas como ponto de partida.** Um clube novo já abre com
 * marcos razoáveis — quem quer só criar e sair não precisa mexer em nada —, e o
 * botão "refazer a sugestão" volta para eles a qualquer momento. Autonomia não é
 * obrigar a preencher; é poder mudar.
 *
 * **O capítulo tem de subir a cada marco.** "Até o 6 no dia 10, até o 4 no dia
 * 17" não é ritmo, é erro de digitação — o campo trava no capítulo do marco
 * anterior para não deixar o clube nascer com um combinado que não se cumpre.
 */
export default function EditorDeMarcos({
  bookId,
  inicio,
  fim,
  marcos,
  onChange,
}: {
  bookId: number;
  /** Data de estreia — nenhum marco pode cair antes dela. */
  inicio: string;
  /** Data do encontro — o último marco vai até aqui. */
  fim: string;
  marcos: Marco[];
  onChange: (marcos: Marco[]) => void;
}) {
  const totalCapitulos = getChapters(bookId).length;

  function trocar(indice: number, campo: "chapter" | "prazo", valor: string) {
    const copia = marcos.map((marco) => ({ ...marco }));

    if (campo === "chapter") {
      const anterior = indice > 0 ? copia[indice - 1].chapter : 1;
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return;
      copia[indice].chapter = Math.min(totalCapitulos, Math.max(anterior, Math.round(numero)));
    } else {
      copia[indice].prazo = valor;
    }

    onChange(copia);
  }

  function acrescentar() {
    const ultimo = marcos[marcos.length - 1];
    const novo: Marco = {
      id: marcos.length + 1,
      chapter: Math.min(totalCapitulos, (ultimo?.chapter ?? 0) + 1),
      prazo: ultimo?.prazo ?? fim,
    };
    onChange([...marcos, novo].map((marco, i) => ({ ...marco, id: i + 1 })));
  }

  function tirar(indice: number) {
    onChange(marcos.filter((_, i) => i !== indice).map((marco, i) => ({ ...marco, id: i + 1 })));
  }

  return (
    <div className="rounded-xl bg-white/[0.03] p-3" data-testid="editor-de-marcos">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
          O ritmo · {marcos.length} {marcos.length === 1 ? "etapa" : "etapas"}
        </p>
        <button
          type="button"
          onClick={() => onChange(marcosSugeridos(bookId, inicio, fim))}
          className="flex items-center gap-1.5 text-[10.5px] font-semibold text-white/40 transition-colors hover:text-white/80"
          data-testid="refazer-marcos"
        >
          <RotateCcw className="h-3 w-3" />
          Refazer sugestão
        </button>
      </div>

      <div className="space-y-1.5">
        {marcos.map((marco, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-[11px] text-white/25">{indice + 1}.</span>

            <span className="shrink-0 text-[11.5px] text-white/45">até o cap.</span>
            <input
              type="number"
              inputMode="numeric"
              min={indice > 0 ? marcos[indice - 1].chapter : 1}
              max={totalCapitulos}
              value={marco.chapter}
              onChange={(e) => trocar(indice, "chapter", e.target.value)}
              className="w-14 rounded-lg bg-white/[0.06] px-2 py-1.5 text-center text-[13px] font-semibold outline-none ring-1 ring-inset ring-white/8 focus:ring-primary/50"
              data-testid={`marco-cap-${indice}`}
            />

            <span className="shrink-0 text-[11.5px] text-white/45">em</span>
            <input
              type="date"
              min={inicio}
              value={marco.prazo}
              onChange={(e) => trocar(indice, "prazo", e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-white/[0.06] px-2 py-1.5 text-[12px] outline-none ring-1 ring-inset ring-white/8 [color-scheme:dark] focus:ring-primary/50"
              data-testid={`marco-prazo-${indice}`}
            />

            {marcos.length > 1 && (
              <button
                type="button"
                onClick={() => tirar(indice)}
                className="shrink-0 rounded-lg p-1 text-white/25 transition-colors hover:bg-white/8 hover:text-white/70"
                aria-label={`Tirar a etapa ${indice + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {marcos.length < totalCapitulos && (
        <button
          type="button"
          onClick={acrescentar}
          className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-primary"
          data-testid="acrescentar-marco"
        >
          <Plus className="h-3.5 w-3.5" />
          Mais uma etapa
        </button>
      )}

      {/*
        O aviso só aparece quando o combinado deixa o final de fora. É o erro que
        mais estraga um clube: a turma chega ao encontro sem ter ouvido o desfecho,
        que é justamente o que todo mundo quer discutir junto.
      */}
      {marcos.length > 0 && marcos[marcos.length - 1].chapter < totalCapitulos && (
        <p className="mt-2.5 rounded-lg bg-[#f59e0b]/10 px-3 py-2 text-[11px] leading-relaxed text-[#f59e0b]/90">
          A última etapa para no capítulo {marcos[marcos.length - 1].chapter} de {totalCapitulos} —
          a turma chega ao encontro sem ter ouvido o final.
        </p>
      )}

      <p className="mt-2 text-[10.5px] leading-relaxed text-white/25">
        O encontro é em {dataCurta(fim)}. Cada etapa é o que a turma combina de não passar até
        aquela data.
      </p>
    </div>
  );
}
