import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Download, Play, Trash2, WifiOff } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { catalog, type Book } from "@/lib/books";

/**
 * Downloads (`/downloads`) — os livros marcados como baixados na tela de
 * Detalhes do Livro.
 *
 * O `localStorage` guarda só uma lista de ids (é o que `BookDetails.tsx` grava
 * em `allbook_downloads`); os dados do livro vêm do catálogo. Enquanto não
 * existe áudio real, "baixado" é só uma marca — nenhum arquivo é gravado.
 */

const STORAGE_KEY = "allbook_downloads";

function readDownloads(): Book[] {
  const ids: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(ids)) return [];

  // Os ids são gravados como texto pelo BookDetails, mas o catálogo usa número.
  return ids
    .map((id) => catalog.find((book) => String(book.id) === String(id)))
    .filter((book): book is Book => book !== undefined);
}

export default function Downloads() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    setBooks(readDownloads());
  }, []);

  function remove(book: Book) {
    const ids: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const kept = Array.isArray(ids) ? ids.filter((id) => String(id) !== String(book.id)) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));

    setBooks((current) => current.filter((item) => item.id !== book.id));
    toast({
      title: "Download removido",
      description: `${book.title} não está mais disponível offline.`,
    });
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="downloads-page">
      <PageHeader
        title="Downloads"
        fallback="/profile"
        action={
          books.length > 0 ? (
            <span className="text-xs text-white/40" data-testid="text-downloads-count">
              {books.length} {books.length === 1 ? "título" : "títulos"}
            </span>
          ) : undefined
        }
      />

      {books.length === 0 ? (
        <div className="px-8 py-24 text-center space-y-4" data-testid="downloads-empty">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
            <Download className="w-7 h-7 text-white/20" />
          </div>
          <h2 className="text-lg font-bold font-display">Nenhum download ainda</h2>
          <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
            Baixe um audiolivro para ouvir sem internet. O botão fica na tela de cada livro.
          </p>
          <Link
            href="/discover"
            className="inline-block mt-2 text-sm font-bold text-primary"
            data-testid="link-downloads-discover"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <>
          <p className="flex items-center gap-2 px-5 py-4 text-xs text-white/40 border-b border-white/5">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            Disponíveis para ouvir sem internet
          </p>

          <div className="px-5" data-testid="downloads-list">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 py-3 border-b border-white/5"
                data-testid={`download-item-${book.id}`}
              >
                <Link href={`/book/${book.id}`} className="shrink-0">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-12 h-16 rounded object-cover"
                  />
                </Link>

                <Link href={`/book/${book.id}`} className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-white/40 line-clamp-1 mt-0.5">{book.author}</p>
                  <p className="text-[11px] text-white/30 mt-1">{book.genre}</p>
                </Link>

                <Link
                  href={`/player/${book.id}`}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  aria-label={`Ouvir ${book.title}`}
                  data-testid={`button-play-download-${book.id}`}
                >
                  <Play className="w-5 h-5 fill-current" />
                </Link>

                <button
                  onClick={() => remove(book)}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors"
                  aria-label={`Remover download de ${book.title}`}
                  data-testid={`button-remove-download-${book.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
