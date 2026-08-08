import { useEffect, useState } from "react";
import { Bookmark, Pencil, Play, Trash2 } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  BOOKMARK_EVENT,
  bookmarksFor,
  removeBookmark,
  setBookmarkNote,
  type Bookmark as Marcacao,
} from "@/lib/bookmarks";

/**
 * O painel de marcações e notas do tocador.
 *
 * **O que existia antes:** o item "Marcações e notas" no menu de "…" abria um
 * aviso escrito "suas marcações e notas deste título aparecerão aqui" — e não
 * havia nenhum "aqui". Este componente é o lugar que faltava.
 *
 * Cada linha faz as três coisas que uma marcação pede: **ir para o ponto**
 * (toque na linha), **escrever a nota** (o lápis) e **apagar**. A nota é
 * opcional de propósito: marcar tem de ser um toque só, e escrever é para
 * quando a pessoa quiser.
 */
export default function MarcacoesDoLivro({
  aberto,
  onClose,
  bookId,
  titulo,
  tituloDoCapitulo,
  formatarTempo,
  onIr,
}: {
  aberto: boolean;
  onClose: () => void;
  bookId: number;
  titulo: string;
  /** Como escrever "Capítulo 3" — quem chama sabe o nome de cada capítulo. */
  tituloDoCapitulo: (chapter: number) => string;
  formatarTempo: (segundos: number) => string;
  /** Levar o áudio para o ponto marcado e fechar o painel. */
  onIr: (positionSec: number) => void;
}) {
  const [marcacoes, setMarcacoes] = useState<Marcacao[]>([]);
  /** Qual marcação está com a nota aberta para edição. */
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  /*
   * A lista é lida ao abrir e a cada evento de escrita. Ler no `useEffect` (e
   * não no corpo do componente) é o que mantém o painel certo quando a pessoa
   * salva uma marcação nova com ele já aberto.
   */
  useEffect(() => {
    if (!aberto) return;
    const atualizar = () => setMarcacoes(bookmarksFor(bookId));
    atualizar();
    window.addEventListener(BOOKMARK_EVENT, atualizar);
    return () => window.removeEventListener(BOOKMARK_EVENT, atualizar);
  }, [aberto, bookId]);

  function abrirNota(marcacao: Marcacao) {
    setEditando(marcacao.id);
    setRascunho(marcacao.note);
  }

  function salvarNota(id: string) {
    setBookmarkNote(id, rascunho.trim());
    setEditando(null);
    setRascunho("");
  }

  return (
    <Drawer open={aberto} onOpenChange={(estado) => !estado && onClose()}>
      <DrawerContent className="mx-auto max-h-[80vh] max-w-[480px] border-white/10 bg-card text-white">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display tracking-tight text-white">
            Minhas notas deste livro
          </DrawerTitle>
          <DrawerDescription className="text-white/50">
            {marcacoes.length === 0
              ? titulo
              : `${titulo} • ${marcacoes.length} ${marcacoes.length === 1 ? "nota" : "notas"}`}
          </DrawerDescription>
        </DrawerHeader>

        {marcacoes.length === 0 ? (
          /*
           * Vazio com instrução, não vazio mudo: a pessoa chegou aqui pelo menu
           * e precisa saber *como* criar a primeira — o botão está na outra
           * ponta da tela, fácil de não notar.
           */
          <div className="px-6 pb-10 pt-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]">
              <Bookmark className="h-6 w-6 text-white/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-white">Nenhuma nota neste título</p>
            <p className="mx-auto mt-1.5 max-w-[280px] text-xs leading-relaxed text-white/45">
              Toque em <span className="font-semibold text-white/70">Marcar</span>, na barra de
              baixo do tocador, para guardar o ponto em que você está. Depois é só voltar aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto px-3 pb-8">
            {marcacoes.map((marcacao) => (
              <div
                key={marcacao.id}
                className="rounded-xl bg-white/[0.04] transition-colors hover:bg-white/[0.07]"
                data-testid={`bookmark-item-${marcacao.id}`}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <button
                    onClick={() => onIr(marcacao.positionSec)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={`Ir para ${formatarTempo(marcacao.positionSec)}`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-sm font-semibold text-white">
                        {formatarTempo(marcacao.positionSec)}
                      </span>
                      <span className="block truncate text-xs text-white/45">
                        {tituloDoCapitulo(marcacao.chapter)}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => abrirNota(marcacao)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={marcacao.note ? "Editar nota" : "Escrever nota"}
                    data-testid={`bookmark-note-${marcacao.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeBookmark(marcacao.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
                    aria-label="Apagar a nota"
                    data-testid={`bookmark-remove-${marcacao.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {editando === marcacao.id ? (
                  <div className="px-3 pb-3">
                    <textarea
                      value={rascunho}
                      onChange={(evento) => setRascunho(evento.target.value)}
                      placeholder="O que você quer lembrar deste ponto?"
                      rows={3}
                      autoFocus
                      className="w-full resize-none rounded-lg border border-white/10 bg-background/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditando(null)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => salvarNota(marcacao.id)}
                        className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                        data-testid="bookmark-save-note"
                      >
                        Salvar nota
                      </button>
                    </div>
                  </div>
                ) : (
                  marcacao.note && (
                    /* A nota fica atrás de um filete laranja — a mesma marca de
                       citação que as peças de compartilhar usam. */
                    <button
                      onClick={() => abrirNota(marcacao)}
                      className="block w-full px-3 pb-3 text-left"
                    >
                      <p className="border-l-2 border-primary/60 pl-3 text-xs leading-relaxed text-white/70">
                        {marcacao.note}
                      </p>
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
