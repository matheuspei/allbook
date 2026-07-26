import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { setBookmarkNote, type Bookmark } from "@/lib/bookmarks";

/**
 * A caixa de anotação que abre **junto** com a marcação.
 *
 * **De onde veio (26/07).** Tocar em "Marcar" guardava o ponto em silêncio, e
 * escrever exigia ir depois à lista e caçar a marcação para editar. O Matheus
 * apontou o buraco: *"a ideia de marcar não era, na verdade, marcar, mas
 * anotar"* — sem a nota, o app guarda um relógio, não um pensamento.
 *
 * **Por que salvar antes de abrir isto, e não só ao confirmar.** Marcar precisa
 * continuar valendo por um toque: quem ouve caminhando ou lavando louça toca e
 * segue a vida. Se a nota fosse condição para guardar, fechar a caixa perderia o
 * ponto — o oposto do que o botão promete. Aqui a marcação **já está salva**
 * quando esta folha aparece; a nota é o que se acrescenta, não o que valida.
 * Por isso o botão de sair diz "Agora não", e não "Cancelar": não há nada a
 * cancelar.
 */
export default function AnotarMarcacao({
  marcacao,
  tituloDoCapitulo,
  formatarTempo,
  onFechar,
}: {
  /** A marcação recém-criada. `null` fecha a folha. */
  marcacao: Bookmark | null;
  tituloDoCapitulo: (chapter: number) => string;
  formatarTempo: (segundos: number) => string;
  onFechar: () => void;
}) {
  const [texto, setTexto] = useState("");

  // Ponto repetido traz a nota que já existia, para a pessoa completar em vez
  // de escrever por cima do que tinha escrito antes.
  useEffect(() => {
    setTexto(marcacao?.note ?? "");
  }, [marcacao?.id, marcacao?.note]);

  function salvar() {
    if (!marcacao) return;
    setBookmarkNote(marcacao.id, texto.trim());
    onFechar();
  }

  return (
    <Drawer open={marcacao !== null} onOpenChange={(estado) => !estado && onFechar()}>
      <DrawerContent className="mx-auto max-w-[480px] border-white/10 bg-[#1a1a1a] text-white">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 font-display tracking-tight text-white">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-black">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            Trecho guardado
          </DrawerTitle>
          <DrawerDescription className="text-white/50">
            {marcacao && (
              <>
                <span className="font-mono text-white/70">
                  {formatarTempo(marcacao.positionSec)}
                </span>{" "}
                · {tituloDoCapitulo(marcacao.chapter)}
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-8">
          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="O que você quer lembrar deste trecho?"
            rows={4}
            autoFocus
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            data-testid="note-input"
          />

          <div className="mt-3 flex gap-2">
            <button
              onClick={onFechar}
              className="h-11 flex-1 rounded-xl border border-white/10 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              data-testid="note-skip"
            >
              Agora não
            </button>
            <button
              onClick={salvar}
              disabled={texto.trim().length === 0}
              className="h-11 flex-[1.4] rounded-xl bg-white text-sm font-bold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
              data-testid="note-save"
            >
              Salvar nota
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-white/35">
            O ponto já está guardado — a nota é opcional.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
