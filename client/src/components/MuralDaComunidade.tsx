import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookmarkPlus,
  CheckCircle2,
  Headphones,
  Lock,
  MessageCircle,
  Send,
  Star,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { catalog, type Book } from "@/lib/books";
import {
  MAX_POST,
  MURAL_EVENT,
  apagarPost,
  feedDoMural,
  publicarNoMural,
  type ItemDoMural,
} from "@/lib/mural";
import { PLAYBACK_EVENT, readPlaybackList } from "@/lib/playback";
import { initialOf, readProfile } from "@/lib/profile";

/**
 * O Mural — a caixa de publicar e o feed, o coração da Comunidade (28/07).
 *
 * **A caixa nunca aparece sem livro anexado**: o app prende o post ao livro em
 * reprodução (dá para trocar entre os seus livros recentes). Quem nunca ouviu
 * nada não tem o que anexar — e vê o convite para começar, não uma caixa de
 * texto solta. É a trava que impede o Mural de virar rede social genérica.
 *
 * O feed mistura os tipos fechados de `lib/mural.ts`; comentário preso pela
 * trava de spoiler aparece **fechado**, dizendo por quê — a régua da sala vale
 * no corredor também.
 */

/** "há 2 dias" para datas ISO completas — reaproveita a régua da comunidade. */
function quando(iso: string): string {
  return relativeDate(iso.slice(0, 10));
}

export default function MuralDaComunidade() {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemDoMural[]>([]);
  const [texto, setTexto] = useState("");
  const [livroDoPost, setLivroDoPost] = useState<number | null>(null);
  const perfil = useMemo(readProfile, []);

  // Os livros que você pode anexar: os últimos do seu progresso.
  const meusLivros = useMemo(() => {
    return readPlaybackList()
      .slice(0, 5)
      .map((item) => catalog.find((book) => book.id === item.bookId))
      .filter((book): book is Book => book !== undefined);
  }, []);

  useEffect(() => {
    const atualizar = () => setItens(feedDoMural());
    atualizar();
    window.addEventListener(MURAL_EVENT, atualizar);
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    return () => {
      window.removeEventListener(MURAL_EVENT, atualizar);
      window.removeEventListener(PLAYBACK_EVENT, atualizar);
    };
  }, []);

  useEffect(() => {
    if (livroDoPost === null && meusLivros.length > 0) setLivroDoPost(meusLivros[0].id);
  }, [meusLivros, livroDoPost]);

  function publicar() {
    if (livroDoPost === null) return;
    publicarNoMural(texto, livroDoPost);
    setTexto("");
    toast({ title: "Publicado no mural", description: "Seu recado ficou com a capa do livro junto." });
  }

  return (
    <section className="border-b border-white/10 px-5 pb-5 pt-5" data-testid="mural">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        Mural
      </h2>

      {/* A caixa de publicar — só existe com livro para anexar. */}
      {meusLivros.length > 0 && livroDoPost !== null ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5" data-testid="mural-composer">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              {perfil.photo && <AvatarImage src={perfil.photo} alt={perfil.name} className="object-cover" />}
              <AvatarFallback className="bg-[#1e1e1e] text-xs font-semibold text-white">
                {initialOf(perfil.name)}
              </AvatarFallback>
            </Avatar>
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value.slice(0, MAX_POST))}
              placeholder="Diga algo sobre o que você está ouvindo…"
              rows={2}
              className="min-h-[48px] w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
              data-testid="mural-input"
            />
          </div>

          {/* O livro anexado: sempre um, nunca nenhum. */}
          <div className="mt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {meusLivros.map((book) => (
              <button
                key={book.id}
                onClick={() => setLivroDoPost(book.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] transition-colors ${
                  livroDoPost === book.id
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 text-white/40 hover:text-white/70"
                }`}
                data-testid={`mural-book-${book.id}`}
              >
                <img src={book.cover} alt="" className="h-5 w-3.5 rounded-[2px] object-cover" />
                <span className="max-w-[110px] truncate">{book.title}</span>
              </button>
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-white/25">
              {texto.length}/{MAX_POST}
            </span>
            <button
              onClick={publicar}
              disabled={texto.trim().length === 0}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-black transition-opacity disabled:opacity-30"
              data-testid="mural-publish"
            >
              <Send className="h-3 w-3" />
              Publicar
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 p-3.5 text-xs leading-relaxed text-white/35" data-testid="mural-composer-empty">
          Comece a ouvir um livro para publicar no mural — aqui, todo recado
          anda com a capa do que você está ouvindo.
        </p>
      )}

      {/* O feed. */}
      <div className="mt-1">
        {itens.map((item) => (
          <ItemDoFeed key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

/** O verbo e o ícone de cada tipo — o vocabulário fechado do mural. */
function verboDoItem(item: ItemDoMural): { icone: React.ReactNode; verbo: string } {
  switch (item.tipo) {
    case "disse":
      return { icone: <MessageCircle className="h-3 w-3" />, verbo: "disse, ouvindo" };
    case "recomendou":
      return { icone: <BookmarkPlus className="h-3 w-3" />, verbo: "recomendou" };
    case "comentou":
      return { icone: <MessageCircle className="h-3 w-3" />, verbo: "comentou em" };
    case "avaliou":
      return { icone: <Star className="h-3 w-3" />, verbo: "avaliou" };
    case "ouvindo":
      return { icone: <Headphones className="h-3 w-3" />, verbo: "está ouvindo" };
    case "terminou":
      return { icone: <CheckCircle2 className="h-3 w-3" />, verbo: "terminou" };
  }
}

/**
 * Um acontecimento do mural, desenhado. Exportado porque o perfil de um
 * leitor mostra a atividade dele com ESTA mesma peça — o mesmo acontecimento
 * não pode ter uma cara no feed e outra no perfil (régua da 4.20).
 */
export function ItemDoFeed({ item }: { item: ItemDoMural }) {
  const { toast } = useToast();
  const { icone, verbo } = verboDoItem(item);
  const perfil = useMemo(readProfile, []);

  const nome = item.autor.souEu ? "Você" : item.autor.nome;
  const linkDoAutor = item.autor.souEu ? "/profile" : `/user/${item.autor.slug}`;

  return (
    <article className="flex gap-3 border-b border-white/5 py-3.5 last:border-b-0" data-testid={`mural-item-${item.id}`}>
      <Link href={linkDoAutor} className="shrink-0 self-start" aria-label={`Ver ${nome}`}>
        {item.autor.souEu ? (
          <Avatar className="h-9 w-9">
            {perfil.photo && <AvatarImage src={perfil.photo} alt={nome} className="object-cover" />}
            <AvatarFallback className="bg-[#1e1e1e] text-xs font-bold text-white">
              {initialOf(perfil.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${item.autor.cor} text-xs font-bold`}
          >
            {item.autor.nome.charAt(0)}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <Link href={linkDoAutor} className="font-semibold transition-colors hover:text-primary">
            {nome}
          </Link>{" "}
          <span className="inline-flex items-center gap-1 text-white/45">
            {icone}
            {verbo}
          </span>{" "}
          <Link
            href={`/book/${item.book.id}`}
            className="font-medium transition-colors hover:text-primary"
          >
            {item.book.title}
          </Link>
          {item.tipo === "ouvindo" && (
            <span className="text-white/35"> · cap. {item.chapter}</span>
          )}
          {item.tipo === "avaliou" && (
            <span className="ml-1 inline-flex items-center gap-0.5 align-[-1px] text-[#f59e0b]">
              {item.nota.toFixed(1)} <Star className="h-3 w-3 fill-[#f59e0b]" />
            </span>
          )}
        </p>

        {/* O corpo, quando há: post, motivo da recomendação, comentário. */}
        {item.tipo === "disse" && (
          <p className="mt-1 text-sm leading-relaxed text-white/75">{item.texto}</p>
        )}
        {item.tipo === "recomendou" && item.note && (
          <p className="mt-1 text-xs italic leading-relaxed text-white/55">“{item.note}”</p>
        )}
        {item.tipo === "avaliou" && item.texto && (
          <p className="mt-1 line-clamp-2 text-xs italic leading-relaxed text-white/55">
            “{item.texto}”
          </p>
        )}
        {item.tipo === "comentou" &&
          (item.estado === "livre" ? (
            <p className="mt-1 line-clamp-2 text-xs italic leading-relaxed text-white/55">
              “{item.texto}”
            </p>
          ) : (
            // A trava viaja com o comentário: nem no corredor o texto vaza.
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/30">
              <Lock className="h-3 w-3" />
              {item.estado === "adiante"
                ? "Num trecho à frente de onde você está — continue ouvindo para ler."
                : "Marcado como spoiler — abra a conversa do livro para revelar."}
            </p>
          ))}

        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/25">
          <span>{item.tipo === "ouvindo" ? "agora" : quando(item.date)}</span>
          {item.tipo === "comentou" && (
            <Link
              href={`/book/${item.book.id}/conversa`}
              className="font-medium text-white/35 transition-colors hover:text-primary"
            >
              Abrir a conversa
            </Link>
          )}
          {item.tipo === "disse" && item.meuPostId && (
            <button
              onClick={() => {
                apagarPost(item.meuPostId!);
                toast({ title: "Post apagado" });
              }}
              className="flex items-center gap-1 text-white/25 transition-colors hover:text-white/60"
              aria-label="Apagar este post"
              data-testid={`mural-delete-${item.meuPostId}`}
            >
              <Trash2 className="h-3 w-3" />
              Apagar
            </button>
          )}
        </div>
      </div>

      <Link href={`/book/${item.book.id}`} className="shrink-0 self-start">
        <img
          src={item.book.cover}
          alt={item.book.title}
          className="h-[52px] w-10 rounded object-cover"
        />
      </Link>
    </article>
  );
}
