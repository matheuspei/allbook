import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bookmark, Pencil, Play, Trash2 } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import {
  BOOKMARK_EVENT,
  bookmarksByBook,
  removeBookmark,
  setBookmarkNote,
  type LivroComMarcacoes,
} from "@/lib/bookmarks";
import { chapterAtSec, getChapters } from "@/lib/chapters";

/**
 * Minhas marcações (`/bookmarks`) — todos os trechos guardados, de todos os
 * livros.
 *
 * **Por que esta tela existe.** Até 26/07 a marcação só aparecia dentro do
 * player *daquele* livro. Quem marcasse trechos em cinco livros precisava abrir
 * cinco players para lembrar do que tinha guardado — e a pergunta do Matheus
 * ("como é que o usuário pode enxergar essas marcações?") não tinha resposta boa.
 * Aqui elas viram uma coisa só, relível.
 *
 * Tocar numa marcação abre o player **no segundo exato** (`?t=`), não no começo
 * do capítulo: o instante é o que a marcação guarda.
 */

function formatarTempo(segundos: number): string {
  const total = Math.floor(Math.abs(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Bookmarks() {
  const [, setLocation] = useLocation();
  const [livros, setLivros] = useState<LivroComMarcacoes[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  useEffect(() => {
    const atualizar = () => setLivros(bookmarksByBook());
    atualizar();
    window.addEventListener(BOOKMARK_EVENT, atualizar);
    return () => window.removeEventListener(BOOKMARK_EVENT, atualizar);
  }, []);

  const total = livros.reduce((soma, item) => soma + item.marcacoes.length, 0);

  function salvarNota(id: string) {
    setBookmarkNote(id, rascunho.trim());
    setEditando(null);
    setRascunho("");
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-white" data-testid="bookmarks-page">
      {/* "Minhas notas" em toda a interface: é a palavra que o Matheus usa, e a
          certa desde que "Marcar" passou a abrir a caixa de escrita. */}
      <PageHeader title="Minhas notas" fallback="/profile" />

      {/*
        **Só notas aqui** (ROTEIRO 4.48). Por um dia esta tela teve uma segunda
        aba com os trechos de áudio; o Matheus desconfiou da mistura e tinha
        razão. A nota é privada e se organiza por livro; o trecho existe para ser
        mostrado e circula solto. Foram para `/trechos`, com endereço próprio.
      */}
      <main className="px-5 pt-2">
        {total === 0 ? (
          <div className="pt-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.06]">
              <Bookmark className="h-7 w-7 text-white/40" />
            </div>
            <h2 className="mt-5 font-display text-lg font-bold tracking-tight">
              Você ainda não marcou nenhum ponto
            </h2>
            <p className="mx-auto mt-2 max-w-[300px] text-sm leading-relaxed text-white/45">
              Enquanto ouve, toque em <span className="font-semibold text-white/70">Marcar</span> na
              barra do tocador para guardar o ponto. As notas de todos os livros aparecem aqui.
            </p>
            <Link
              href="/library"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/90"
              data-testid="link-to-library"
            >
              Ir para a Biblioteca
            </Link>
          </div>
        ) : (
          <>
            <p className="pb-4 text-sm text-white/45">
              {/* "nota", e não "trecho": desde 28/07 trecho é o pedaço de
                  áudio de até 40s que se corta para mostrar a alguém (ROTEIRO
                  4.47). Usar a mesma palavra para as duas coisas, nesta tela que
                  agora mostra as duas, era confusão garantida. E "nota", não
                  "marcação": era a mesma coisa com dois nomes (§4.96). */}
              {total} {total === 1 ? "nota" : "notas"} em {livros.length}{" "}
              {livros.length === 1 ? "título" : "títulos"}
            </p>

            <div className="space-y-6">
              {livros.map(({ book, marcacoes, comNota }) => {
                const capitulos = getChapters(book.id);
                return (
                  <section key={book.id} data-testid={`bookmark-group-${book.id}`}>
                    {/* O cabeçalho do grupo é o livro — e leva à ficha dele. */}
                    <Link
                      href={`/book/${book.id}`}
                      className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="h-14 w-10 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-base font-bold tracking-tight">
                          {book.title}
                        </h2>
                        <p className="truncate text-xs text-white/45">
                          {marcacoes.length}{" "}
                          {marcacoes.length === 1 ? "nota" : "notas"}
                          {comNota > 0 && ` · ${comNota} com nota`}
                        </p>
                      </div>
                    </Link>

                    <div className="mt-1.5 space-y-1.5">
                      {marcacoes.map((marcacao) => {
                        const capitulo =
                          capitulos.find(
                            (ch) => ch.id === (marcacao.chapter || chapterAtSec(book.id, marcacao.positionSec))
                          )?.title ?? `Capítulo ${marcacao.chapter}`;

                        return (
                          <div
                            key={marcacao.id}
                            className="rounded-xl bg-white/[0.04] transition-colors hover:bg-white/[0.07]"
                            data-testid={`bookmark-${marcacao.id}`}
                          >
                            <div className="flex items-center gap-3 px-3 py-3">
                              <button
                                onClick={() =>
                                  setLocation(`/player/${book.id}?t=${marcacao.positionSec}`)
                                }
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                aria-label={`Ouvir a partir de ${formatarTempo(marcacao.positionSec)}`}
                                data-testid={`bookmark-play-${marcacao.id}`}
                              >
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                                  <Play className="h-4 w-4 fill-current" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="block font-mono text-sm font-semibold">
                                    {formatarTempo(marcacao.positionSec)}
                                  </span>
                                  <span className="block truncate text-xs text-white/45">
                                    {capitulo}
                                  </span>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setEditando(marcacao.id);
                                  setRascunho(marcacao.note);
                                }}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label={marcacao.note ? "Editar nota" : "Escrever nota"}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => removeBookmark(marcacao.id)}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
                                aria-label="Apagar a nota"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {editando === marcacao.id ? (
                              <div className="px-3 pb-3">
                                <textarea
                                  value={rascunho}
                                  onChange={(evento) => setRascunho(evento.target.value)}
                                  placeholder="O que você quer lembrar deste trecho?"
                                  rows={3}
                                  autoFocus
                                  className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
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
                                    className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-black transition-colors hover:bg-primary/90"
                                  >
                                    Salvar nota
                                  </button>
                                </div>
                              </div>
                            ) : (
                              marcacao.note && (
                                <button
                                  onClick={() => {
                                    setEditando(marcacao.id);
                                    setRascunho(marcacao.note);
                                  }}
                                  className="block w-full px-3 pb-3 text-left"
                                >
                                  <p className="border-l-2 border-primary/60 pl-3 text-xs leading-relaxed text-white/70">
                                    {marcacao.note}
                                  </p>
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
