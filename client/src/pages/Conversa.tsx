import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import SalaDoLivro from "@/components/SalaDoLivro";
import { livroPorId } from "@/lib/books";
import { readReactions, type Reactions } from "@/lib/reactions";

/**
 * A conversa de um livro, com endereço próprio (`/book/:id/conversa`).
 *
 * Nasceu de um aperto do Matheus em 28/07: o cartão "Onde a conversa está" da
 * Comunidade **prometia conversa e entregava a ficha** — a pessoa clicava na
 * fala da Ana Paula e caía na sinopse, tendo que rolar até achar a sala. Porta
 * não pode mentir: quem clica numa conversa cai **na conversa**.
 *
 * A tela é de propósito um invólucro fino: o miolo é o mesmo `SalaDoLivro` da
 * ficha (uma sala só, os mesmos comentários, a mesma trava de spoiler — se a
 * conversa mudasse de conteúdo conforme a porta, deixaria de ser *a* sala do
 * livro). Aqui só se acrescenta o cabeçalho compacto que diz de qual livro é a
 * sala, com o caminho de volta para a ficha.
 *
 * Um endereço próprio também é o que permite, adiante, a notificação
 * "responderam você" e o clube apontarem direto para cá.
 */
export default function Conversa() {
  const params = useParams<{ id: string }>();
  const bookId = Number(params.id);
  const book = livroPorId(bookId);

  // O mesmo padrão da ficha: as curtidas moram no estado da tela para a lista
  // redesenhar na hora, e são lidas do armazenamento na abertura.
  const [reactions, setReactions] = useState<Reactions>({});

  useEffect(() => {
    setReactions(readReactions());
  }, [bookId]);

  if (!book) {
    return (
      <div className="min-h-screen pb-24 bg-background text-white" data-testid="conversa-missing">
        <PageHeader title="Conversa" fallback="/community" />
        <div className="px-8 py-20 text-center space-y-4">
          <p className="text-sm text-white/50">Não existe livro com esse endereço.</p>
          <Link href="/community" className="inline-block text-sm font-bold text-primary">
            Voltar ao Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="conversa-page">
      <PageHeader title="Conversa" fallback="/community" />

      {/* De qual livro é esta sala — e a porta para a ficha, que agora é o
          caminho secundário, não o obrigatório. */}
      <Link
        href={`/book/${book.id}`}
        className="flex items-center gap-3 border-b border-white/10 px-5 py-4 transition-colors hover:bg-white/[0.03]"
        data-testid="conversa-book-header"
      >
        <img
          src={book.cover}
          alt={book.title}
          className="h-16 w-12 shrink-0 rounded object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold font-display tracking-tight">{book.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/40">
            {book.author} · narra {book.narrator}
          </p>
          <p className="mt-1 text-[10px] text-white/30">Ver a ficha do livro</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
      </Link>

      <main className="px-5 py-5">
        <SalaDoLivro bookId={book.id} reactions={reactions} onReactionsChange={setReactions} />
      </main>
    </div>
  );
}
