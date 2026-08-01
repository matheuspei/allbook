import { useState } from "react";
import { X } from "lucide-react";

import CortadorDeTrecho from "@/components/CortadorDeTrecho";
import { useToast } from "@/hooks/use-toast";
import { livroDaCitacao } from "@/lib/citacoes";
import {
  MAX_NOTA_TRECHO,
  ajustarTrecho,
  anotarTrecho,
  esquecerTrecho,
  type TrechoGuardado,
} from "@/lib/trechosGuardados";

/**
 * Ajustar um trecho guardado — as pontas do corte e a sua nota, na mesma folha.
 *
 * **Por que o corte e a nota vêm juntos** (ROTEIRO 4.49). São as duas coisas que
 * se quer fazer *depois* de guardar, e no mesmo instante: "peguei um pouco antes
 * do que queria" e "guardei isto por causa da frase do médico". Duas folhas
 * separadas seriam dois caminhos para o mesmo momento.
 *
 * **Ela é o segundo tempo do "guardar num toque" (§4.46).** O toque no player
 * leva 40 segundos na hora, ouvindo, sem pedágio; aqui o corte vira exato, com
 * calma. O Matheus cobrou os dois lados em dias diferentes — primeiro que eram
 * três toques até guardar, depois que *"ali não dá essa opção"* de escolher a
 * parte. Guardar rápido **e** poder corrigir é o que atende aos dois.
 */
export default function EditarTrecho({
  trecho,
  onFechar,
}: {
  trecho: TrechoGuardado;
  onFechar: () => void;
}) {
  const { toast } = useToast();
  const livro = livroDaCitacao(trecho);
  const [inicio, setInicio] = useState(trecho.inicioSec);
  const [fim, setFim] = useState(trecho.inicioSec + trecho.duracaoSec);
  const [nota, setNota] = useState(trecho.nota ?? "");

  function salvar() {
    ajustarTrecho(trecho.id, inicio, fim - inicio);
    anotarTrecho(trecho.id, nota);
    toast({ title: "Trecho ajustado", description: `${fim - inicio} segundos guardados.` });
    onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-[170] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="editar-trecho"
    >
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold">Ajustar o trecho</h2>
            {livro && <p className="mt-0.5 truncate text-xs text-white/40">{livro.title}</p>}
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sem o botão de guardar interno: quem salva aqui é a folha, e um
            segundo "guardar" criaria uma cópia em vez de corrigir o original. */}
        <CortadorDeTrecho
          bookId={trecho.bookId}
          inicio={inicio}
          fim={fim}
          onChange={(novoInicio, novoFim) => {
            setInicio(novoInicio);
            setFim(novoFim);
          }}
          permitirGuardar={false}
        />

        <div className="mt-4">
          <label
            htmlFor="nota-do-trecho"
            className="text-[11px] font-semibold uppercase tracking-wide text-white/40"
          >
            Sua nota
          </label>
          <textarea
            id="nota-do-trecho"
            value={nota}
            onChange={(evento) => setNota(evento.target.value.slice(0, MAX_NOTA_TRECHO))}
            placeholder="Por que você guardou este pedaço?"
            rows={2}
            className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            data-testid="nota-do-trecho"
          />
          <div className="mt-1 flex items-center justify-between text-[10.5px] text-white/25">
            {/* Dito na hora, e não descoberto depois: a nota fica com você. */}
            <span>Só você vê. Não vai junto quando você anexa numa conversa.</span>
            <span className="shrink-0">
              {nota.length}/{MAX_NOTA_TRECHO}
            </span>
          </div>
        </div>

        <button
          onClick={salvar}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-black transition-colors hover:bg-primary/90"
          data-testid="salvar-trecho"
        >
          Salvar
        </button>

        <button
          onClick={() => {
            esquecerTrecho(trecho.id);
            toast({ title: "Trecho apagado" });
            onFechar();
          }}
          className="mt-2 w-full py-2 text-xs font-semibold text-white/35 transition-colors hover:text-red-300"
          data-testid="esquecer-daqui"
        >
          Apagar o trecho
        </button>
      </div>
    </div>
  );
}
