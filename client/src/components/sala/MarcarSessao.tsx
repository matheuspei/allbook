import { useState } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { catalog } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import { dataCurta, hojeIso, somarDiasIso, type Clube } from "@/lib/clubes";
import { abrirSala } from "@/lib/salaAoVivo";
import { useToast } from "@/hooks/use-toast";

/**
 * **Marcar uma sessão de escuta, a partir do clube** (ROTEIRO §4.81).
 *
 * ---
 *
 * **Por que existe.** A primeira versão da sala só nascia no **player**: para
 * marcar uma sessão do clube era preciso abrir o livro, achar o menu e escolher
 * o clube — o caminho mais longo possível para a coisa mais óbvia. O Matheus
 * cobrou na auditoria: a ideia dele era *"poder fazer um clube do livro com hora
 * marcada"*, e isso começa **dentro do clube**.
 *
 * Aqui o livro **já é o do ciclo** e o clube **já é este** — sobra decidir
 * quando e até onde. Dois campos em vez de cinco.
 *
 * **Quem marca:** qualquer membro. É a mesma regra do convite do fórum (§4.79) —
 * *quem participa convida* —, e um clube em que só o moderador pode propor
 * encontro é um clube que se encontra pouco.
 */
export default function MarcarSessao({
  clube,
  onFechar,
}: {
  clube: Clube;
  onFechar: () => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const book = catalog.find((item) => item.id === clube.ciclo.bookId);
  const capitulos = getChapters(clube.ciclo.bookId);

  const [data, setData] = useState(() => somarDiasIso(hojeIso(), 1));
  const [hora, setHora] = useState("21:00");
  const [ate, setAte] = useState(() => Math.min(4, capitulos.length));

  function marcar() {
    const sala = abrirSala({
      bookId: clube.ciclo.bookId,
      porta: "marcada",
      posicaoSec: 0,
      clubeId: clube.id,
      data,
      hora,
      titulo: `Até o cap. ${ate}, ao vivo`,
    });
    onFechar();
    toast({
      title: "Sessão marcada",
      description: `${dataCurta(data)} às ${hora} — a turma é avisada e confirma presença.`,
    });
    navigate(`/clube/${clube.id}`);
    return sala;
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="folha-marcar-sessao"
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Marcar uma sessão</h2>
            <p className="mt-0.5 text-xs text-white/40">
              A turma ouve junto, no mesmo segundo
            </p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {book && (
          <div className="mb-5 flex items-center gap-3">
            <img src={book.cover} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{book.title}</div>
              <div className="mt-0.5 text-[11px] text-white/35">
                o livro do ciclo de {clube.nome}
              </div>
            </div>
          </div>
        )}

        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          Quando
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={data}
            min={hojeIso()}
            onChange={(e) => setData(e.target.value)}
            className="flex-1 rounded-xl bg-white/[0.06] px-3.5 py-3 text-sm outline-none ring-1 ring-inset ring-white/8 focus:ring-primary/50"
            data-testid="sessao-data"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-28 rounded-xl bg-white/[0.06] px-3.5 py-3 text-center text-sm outline-none ring-1 ring-inset ring-white/8 focus:ring-primary/50"
            data-testid="sessao-hora"
          />
        </div>

        <label className="mb-2 mt-5 block text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          Até onde vamos
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={capitulos.length}
            value={ate}
            onChange={(e) => setAte(Number(e.target.value))}
            className="flex-1 accent-[#FF6A00]"
            data-testid="sessao-ate"
          />
          <span className="w-24 shrink-0 text-right text-[12.5px] font-semibold tabular-nums">
            cap. {ate}
            <span className="text-white/30"> de {capitulos.length}</span>
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/35">
          É só o combinado do que a turma pretende ouvir na sessão — quem manda no áudio na hora é
          quem abrir a sala.
        </p>

        <button
          onClick={marcar}
          className="mt-6 w-full rounded-xl bg-primary py-3.5 font-display text-[14px] font-bold text-black"
          data-testid="button-marcar-sessao"
        >
          Marcar para {dataCurta(data)} às {hora}
        </button>

        <p className="mt-3 text-center text-[10.5px] leading-relaxed text-white/25">
          A rodada do clube continua sem hora. Isto é um encontro a mais, para quem puder vir.
        </p>
      </div>
    </div>
  );
}
