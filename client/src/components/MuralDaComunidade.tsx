import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookmarkPlus,
  CheckCircle2,
  Headphones,
  Lock,
  MessageCircle,
  Search as SearchIcon,
  Send,
  Star,
  Trash2,
  UsersRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { catalog, type Book } from "@/lib/books";
import { meusClubes, type Clube } from "@/lib/clubes";
import {
  MAX_POST,
  MURAL_EVENT,
  apagarPost,
  feedDoMural,
  publicarNoMural,
  type AlvoDoPost,
  type ItemDoMural,
} from "@/lib/mural";
import { PLAYBACK_EVENT, readPlaybackList } from "@/lib/playback";
import { initialOf, readProfile } from "@/lib/profile";

/**
 * O Mural — a caixa de publicar e o feed, o coração da Comunidade (28/07).
 *
 * **Todo post anda ancorado, mas o leque é o app inteiro.** A primeira versão
 * prendia o post ao que estava tocando, e o Matheus apontou os dois defeitos
 * no mesmo dia: o convite ("diga algo sobre o que você está ouvindo") fechava
 * usos legítimos — *"a pessoa pode estar pedindo uma recomendação"* — e o
 * anexo limitado aos livros recentes era pobre: *"ela poderia mencionar um
 * livro ou um clube"*. Agora a âncora é escolha: os recentes como atalho, a
 * busca no catálogo inteiro, ou um clube seu. O que não mudou é a trava — não
 * existe post sem âncora nenhuma.
 *
 * O feed mistura os tipos fechados de `lib/mural.ts`; comentário preso pela
 * trava de spoiler aparece **fechado**, dizendo por quê — a régua da sala vale
 * no corredor também.
 */

/** "Ficção" acha "Ficção Científica"; sem acento também acha. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** "há 2 dias" para datas ISO completas — reaproveita a régua da comunidade. */
function quando(iso: string): string {
  return relativeDate(iso.slice(0, 10));
}

export default function MuralDaComunidade() {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemDoMural[]>([]);
  const [texto, setTexto] = useState("");
  const [alvo, setAlvo] = useState<AlvoDoPost | null>(null);
  const [buscandoLivro, setBuscandoLivro] = useState(false);
  const [termo, setTermo] = useState("");
  const perfil = useMemo(readProfile, []);

  // Os atalhos de âncora: os últimos livros do seu progresso e os seus clubes.
  const meusLivros = useMemo(() => {
    return readPlaybackList()
      .slice(0, 4)
      .map((item) => catalog.find((book) => book.id === item.bookId))
      .filter((book): book is Book => book !== undefined);
  }, []);
  const clubes = useMemo<Clube[]>(() => meusClubes(), []);

  // A busca no catálogo inteiro — "mencionar um livro" não se limita ao que
  // você já abriu. Substring sem acento, os 6 primeiros.
  const encontrados = useMemo(() => {
    const limpo = normalizar(termo.trim());
    if (limpo.length < 2) return [];
    return catalog
      .filter(
        (book) =>
          normalizar(book.title).includes(limpo) || normalizar(book.author).includes(limpo),
      )
      .slice(0, 6);
  }, [termo]);

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
    if (alvo === null && meusLivros.length > 0) setAlvo({ bookId: meusLivros[0].id });
  }, [meusLivros, alvo]);

  /** O livro escolhido fora dos atalhos, para o chip dele aparecer marcado. */
  const livroEscolhido =
    alvo && "bookId" in alvo ? catalog.find((book) => book.id === alvo.bookId) : undefined;
  const escolhidoForaDosAtalhos =
    livroEscolhido && !meusLivros.some((book) => book.id === livroEscolhido.id);

  function publicar() {
    if (alvo === null) return;
    publicarNoMural(texto, alvo);
    setTexto("");
    setBuscandoLivro(false);
    setTermo("");
    toast({ title: "Publicado no mural", description: "Seu recado ficou com a âncora junto." });
  }

  return (
    <section className="border-b border-white/10 px-5 pb-5 pt-5" data-testid="mural">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        Mural
      </h2>

      {/* A caixa de publicar. A âncora é obrigatória; a escolha é livre. */}
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
            placeholder="Fale com a comunidade — uma opinião, um pedido de indicação…"
            rows={2}
            className="min-h-[48px] w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
            data-testid="mural-input"
          />
        </div>

        {/* A âncora: seus livros recentes, um livro do catálogo, um clube. */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {escolhidoForaDosAtalhos && livroEscolhido && (
            <button
              onClick={() => setBuscandoLivro(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/60 bg-primary/15 px-2 py-1 text-[10px] text-primary"
              data-testid={`mural-book-${livroEscolhido.id}`}
            >
              <img src={livroEscolhido.cover} alt="" className="h-5 w-3.5 rounded-[2px] object-cover" />
              <span className="max-w-[110px] truncate">{livroEscolhido.title}</span>
            </button>
          )}

          {meusLivros.map((book) => (
            <button
              key={book.id}
              onClick={() => setAlvo({ bookId: book.id })}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] transition-colors ${
                alvo && "bookId" in alvo && alvo.bookId === book.id
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 text-white/40 hover:text-white/70"
              }`}
              data-testid={`mural-book-${book.id}`}
            >
              <img src={book.cover} alt="" className="h-5 w-3.5 rounded-[2px] object-cover" />
              <span className="max-w-[110px] truncate">{book.title}</span>
            </button>
          ))}

          {clubes.map((clube) => (
            <button
              key={clube.id}
              onClick={() => setAlvo({ clubeId: clube.id })}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] transition-colors ${
                alvo && "clubeId" in alvo && alvo.clubeId === clube.id
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 text-white/40 hover:text-white/70"
              }`}
              data-testid={`mural-clube-${clube.id}`}
            >
              <UsersRound className="h-3 w-3" />
              <span className="max-w-[110px] truncate">{clube.nome}</span>
            </button>
          ))}

          <button
            onClick={() => setBuscandoLivro((v) => !v)}
            className={`flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2 py-1 text-[10px] transition-colors ${
              buscandoLivro
                ? "border-white/30 text-white/70"
                : "border-white/15 text-white/40 hover:text-white/70"
            }`}
            data-testid="mural-search-toggle"
          >
            <SearchIcon className="h-3 w-3" />
            Outro livro
          </button>
        </div>

        {/* Mencionar qualquer livro do catálogo — não só o que você já abriu. */}
        {buscandoLivro && (
          <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2" data-testid="mural-search">
            <input
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar por título ou autor…"
              autoFocus
              className="w-full bg-transparent px-1 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none"
              data-testid="mural-search-input"
            />
            {encontrados.length > 0 && (
              <div className="mt-1 max-h-44 space-y-0.5 overflow-y-auto">
                {encontrados.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => {
                      setAlvo({ bookId: book.id });
                      setBuscandoLivro(false);
                      setTermo("");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-white/5"
                    data-testid={`mural-search-result-${book.id}`}
                  >
                    <img src={book.cover} alt="" className="h-8 w-6 rounded-[2px] object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-white/85">{book.title}</span>
                      <span className="block truncate text-[10px] text-white/35">{book.author}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {termo.trim().length >= 2 && encontrados.length === 0 && (
              <p className="px-1.5 py-1.5 text-[11px] text-white/30">
                Nada com esse nome no catálogo.
              </p>
            )}
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10px] text-white/25">
            {texto.length}/{MAX_POST}
          </span>
          <button
            onClick={publicar}
            disabled={texto.trim().length === 0 || alvo === null}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-black transition-opacity disabled:opacity-30"
            data-testid="mural-publish"
          >
            <Send className="h-3 w-3" />
            Publicar
          </button>
        </div>
      </div>

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
      // Post no clube fala "no clube"; nos livros, "sobre" — desde que a
      // âncora deixou de ser só o que está tocando, "ouvindo" mentiria.
      return {
        icone: <MessageCircle className="h-3 w-3" />,
        verbo: item.clube ? "disse, no clube" : "disse, sobre",
      };
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
          {item.tipo === "disse" && item.clube ? (
            <Link
              href={`/clube/${item.clube.id}`}
              className="font-medium transition-colors hover:text-primary"
            >
              {item.clube.nome}
            </Link>
          ) : (
            <Link
              href={`/book/${item.book.id}`}
              className="font-medium transition-colors hover:text-primary"
            >
              {item.book.title}
            </Link>
          )}
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

      {/* Post de clube: a capa é o livro da vez, mas a porta é o clube. */}
      <Link
        href={item.tipo === "disse" && item.clube ? `/clube/${item.clube.id}` : `/book/${item.book.id}`}
        className="shrink-0 self-start"
      >
        <img
          src={item.book.cover}
          alt={item.book.title}
          className="h-[52px] w-10 rounded object-cover"
        />
      </Link>
    </article>
  );
}
