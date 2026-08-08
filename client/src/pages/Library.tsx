import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowDownUp,
  BarChart3,
  Check,
  ChevronRight,
  Download,
  Headphones,
  LayoutGrid,
  MoreVertical,
  Play,
  Rows3,
  X,
} from "lucide-react";

import BookActionsMenu from "@/components/BookActionsMenu";
import { useCabecalhoRecolhido } from "@/hooks/use-cabecalho-recolhido";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  catalog,
  duracaoEstimada,
  getBooksByGenre,
  minutosEstimados,
  type Book,
  type Genre,
} from "@/lib/books";
import { LIBRARY_EVENT, libraryBooks, readDownloads, removeDownload } from "@/lib/library";
import {
  CONCLUIDO_PERCENT,
  PLAYBACK_EVENT,
  playbackEntries,
  remainingLabel,
  removeFromPlayback,
  type Playback,
} from "@/lib/playback";

/**
 * Biblioteca (`/library`) — o acervo pessoal.
 *
 * **O vocabulário, que estava confuso.** A mesma coisa tinha três nomes: o menu
 * de baixo dizia "Biblioteca", o título da tela dizia "Minha Lista" e a seção
 * de dentro dizia "Sua Biblioteca". Agora os dois nomes têm papéis distintos e
 * valem no app inteiro: **Biblioteca é o lugar** (a tela, o item do menu) e
 * **"Minha lista" é o que a pessoa salvou à mão** — um dos filtros daqui.
 *
 * **O que a Biblioteca reúne.** Não só os salvos: é a união de *tudo que é
 * seu* — o que está na Minha lista, o que está sendo ouvido (mesmo sem ter sido
 * salvo) e o que foi baixado. É essa união que dá sentido aos filtros.
 *
 * **Por que os filtros mudaram.** As abas antigas (Todos, Audiolivros,
 * Baixados, Listas) eram enfeite: o estado da aba era guardado e **nunca usado**
 * para filtrar nada — clicar não mudava um pixel. Além disso "Audiolivros" não
 * separa nada num app em que tudo é audiolivro, e "Listas" não existe no
 * produto. Os filtros de agora derivam de estado real (progresso, lista,
 * downloads), trazem a contagem junto e **somem quando estão zerados** — chip
 * que não leva a lugar nenhum ensina a desconfiar da tela.
 *
 * **Cabeçalho.** Saíram a seta de voltar (isto é aba fixa do menu de baixo, não
 * tela interna: não há "de onde" voltar) e o avatar, que aparecia **duplicado**
 * logo abaixo do avatar do `TopNav`.
 *
 * O que a tela mostra é calculado, nunca escrito à mão: a contagem, as horas do
 * acervo (`minutosEstimados`, a mesma conta da ficha do livro) e o progresso
 * vêm de `lib/library.ts` e `lib/playback.ts`. Foi por isso que o cartão de
 * troféu "3 semanas seguidas" saiu daqui — era número fixo no código, e com
 * degradê, contra a sobriedade que o resto do app seguiu.
 */

/**
 * A régua de "concluído" é uma só no app inteiro (`lib/playback.ts`) — quando
 * ela morava aqui também, baixar o limite num lugar deixava as duas telas
 * discordando sobre o mesmo livro.
 */
const CONCLUIDO = CONCLUIDO_PERCENT;

type FiltroKey = "tudo" | "ouvindo" | "lista" | "baixados" | "concluidos";
type OrdemKey = "recentes" | "titulo" | "autor" | "progresso";
type VisaoKey = "lista" | "grade";

interface ItemAcervo {
  book: Book;
  /** Salvo à mão na "Minha lista". */
  salvo: boolean;
  baixado: boolean;
  playback?: Playback;
  /** 0 quando nunca foi começado. */
  percent: number;
  /** ISO mais recente entre entrar na lista e ser ouvido — a ordem "recentes". */
  mexidoEm: string;
}

const FILTROS: { key: FiltroKey; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "ouvindo", label: "Ouvindo" },
  { key: "lista", label: "Minha lista" },
  { key: "baixados", label: "Baixados" },
  { key: "concluidos", label: "Concluídos" },
];

const ORDENS: { key: OrdemKey; label: string; curto: string }[] = [
  { key: "recentes", label: "Adicionados recentemente", curto: "Recentes" },
  { key: "titulo", label: "Título (A–Z)", curto: "Título" },
  { key: "autor", label: "Autor (A–Z)", curto: "Autor" },
  { key: "progresso", label: "Mais adiantados", curto: "Adiantados" },
];

const VISAO_KEY = "allbook_library_view";
const ORDEM_KEY = "allbook_library_sort";

/** Lê uma preferência do storage aceitando só os valores conhecidos. */
function lerPreferencia<T extends string>(chave: string, validos: readonly T[], padrao: T): T {
  try {
    const valor = localStorage.getItem(chave) as T | null;
    return valor && validos.includes(valor) ? valor : padrao;
  } catch {
    return padrao;
  }
}

function gravarPreferencia(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Storage cheio ou bloqueado: perder a preferência não justifica quebrar a tela.
  }
}

/**
 * Junta as três fontes num acervo só, sem repetir livro: a Minha lista, o que
 * está em progresso e os downloads. Um livro pode estar nas três.
 */
function montarAcervo(): ItemAcervo[] {
  const itens = new Map<number, ItemAcervo>();

  function registrar(book: Book, quando: string): ItemAcervo {
    const atual = itens.get(book.id);
    if (atual) {
      if (quando > atual.mexidoEm) atual.mexidoEm = quando;
      return atual;
    }
    const novo: ItemAcervo = { book, salvo: false, baixado: false, percent: 0, mexidoEm: quando };
    itens.set(book.id, novo);
    return novo;
  }

  for (const { book, addedAt } of libraryBooks()) {
    registrar(book, addedAt).salvo = true;
  }

  for (const { book, playback, percent } of playbackEntries()) {
    const item = registrar(book, playback.updatedAt);
    item.playback = playback;
    item.percent = percent;
  }

  for (const id of readDownloads()) {
    const book = catalog.find((livro) => livro.id === id);
    // Download não guarda data. Cadeia vazia ordena por último, o que é
    // justamente onde um livro só baixado deve ficar em "recentes".
    if (book) registrar(book, "").baixado = true;
  }

  // `Array.from` em vez de espalhar o Map: o alvo do TypeScript aqui é ES5,
  // que não sabe iterar um Map com "...".
  return Array.from(itens.values());
}

function estaOuvindo(item: ItemAcervo): boolean {
  return item.percent > 0 && item.percent < CONCLUIDO;
}

function passaNoFiltro(item: ItemAcervo, filtro: FiltroKey): boolean {
  switch (filtro) {
    case "ouvindo":
      return estaOuvindo(item);
    case "lista":
      return item.salvo;
    case "baixados":
      return item.baixado;
    case "concluidos":
      return item.percent >= CONCLUIDO;
    default:
      return true;
  }
}

function ordenar(itens: ItemAcervo[], ordem: OrdemKey): ItemAcervo[] {
  const copia = [...itens];
  switch (ordem) {
    case "titulo":
      return copia.sort((a, b) => a.book.title.localeCompare(b.book.title, "pt-BR"));
    case "autor":
      return copia.sort((a, b) => a.book.author.localeCompare(b.book.author, "pt-BR"));
    case "progresso":
      return copia.sort((a, b) => b.percent - a.percent);
    default:
      return copia.sort((a, b) => b.mexidoEm.localeCompare(a.mexidoEm));
  }
}

export default function Library() {
  const [, setLocation] = useLocation();
  const [acervo, setAcervo] = useState<ItemAcervo[]>([]);
  const [filtro, setFiltro] = useState<FiltroKey>("tudo");
  const [ordem, setOrdem] = useState<OrdemKey>(() =>
    lerPreferencia(ORDEM_KEY, ORDENS.map((o) => o.key), "recentes")
  );
  const [visao, setVisao] = useState<VisaoKey>(() =>
    lerPreferencia(VISAO_KEY, ["lista", "grade"] as const, "lista")
  );

  /**
   * O acervo é remontado quando a lista, os downloads ou o progresso mudam —
   * inclusive quando a mudança vem do menu "…" de um item desta mesma tela,
   * que tem estado próprio e não teria como avisar de outro jeito.
   */
  useEffect(() => {
    const sincronizar = () => setAcervo(montarAcervo());
    sincronizar();
    window.addEventListener(LIBRARY_EVENT, sincronizar);
    window.addEventListener(PLAYBACK_EVENT, sincronizar);
    return () => {
      window.removeEventListener(LIBRARY_EVENT, sincronizar);
      window.removeEventListener(PLAYBACK_EVENT, sincronizar);
    };
  }, []);

  const contagens = useMemo(() => {
    const conta = (key: FiltroKey) => acervo.filter((item) => passaNoFiltro(item, key)).length;
    return {
      tudo: acervo.length,
      ouvindo: conta("ouvindo"),
      lista: conta("lista"),
      baixados: conta("baixados"),
      concluidos: conta("concluidos"),
    } satisfies Record<FiltroKey, number>;
  }, [acervo]);

  /** "12 títulos · 3 em andamento · 41h de audição" — tudo calculado. */
  const resumo = useMemo(() => {
    if (acervo.length === 0) return "Ainda sem nada guardado";

    const partes = [`${acervo.length} ${acervo.length === 1 ? "título" : "títulos"}`];
    if (contagens.ouvindo > 0) partes.push(`${contagens.ouvindo} em andamento`);

    const minutos = acervo.reduce((soma, item) => soma + minutosEstimados(item.book.pages), 0);
    if (minutos >= 60) partes.push(`${Math.round(minutos / 60)}h de audição`);

    return partes.join(" · ");
  }, [acervo, contagens.ouvindo]);

  /**
   * O livro para retomar: o mais recente entre os que estão em andamento. Só
   * aparece em "Tudo" — nos outros filtros ele seria uma repetição da lista.
   */
  const destaque = useMemo(() => {
    return acervo
      .filter((item) => estaOuvindo(item) && item.playback)
      .sort((a, b) => b.mexidoEm.localeCompare(a.mexidoEm))[0];
  }, [acervo]);

  const mostrarDestaque = filtro === "tudo" && destaque !== undefined;

  const itens = useMemo(() => {
    const filtrados = acervo.filter((item) => passaNoFiltro(item, filtro));
    const semDestaque = mostrarDestaque
      ? filtrados.filter((item) => item.book.id !== destaque.book.id)
      : filtrados;
    return ordenar(semDestaque, ordem);
  }, [acervo, filtro, ordem, mostrarDestaque, destaque]);

  /**
   * "Sugestões para você" — outros livros dos gêneros que você já guarda, sem
   * repetir o que está no acervo, dos mais bem avaliados para baixo. Acervo
   * vazio cai nos melhores do catálogo inteiro. É real, sem backend.
   */
  const generosDoAcervo = useMemo(() => {
    const contagem = new Map<Genre, number>();
    for (const item of acervo) {
      contagem.set(item.book.genre, (contagem.get(item.book.genre) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genero]) => genero);
  }, [acervo]);

  const sugestoes = useMemo(() => {
    const jaTem = new Set(acervo.map((item) => item.book.id));
    const candidatos = generosDoAcervo.length
      ? generosDoAcervo.flatMap((genero) => getBooksByGenre(genero))
      : catalog;
    return candidatos
      .filter((livro) => !jaTem.has(livro.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);
  }, [acervo, generosDoAcervo]);

  const motivoDasSugestoes = generosDoAcervo.length
    ? `Porque você guarda ${generosDoAcervo.slice(0, 2).join(" e ")}`
    : "Os mais bem avaliados do catálogo";

  const tituloDoAcervo =
    filtro === "tudo" ? "Seu acervo" : FILTROS.find((f) => f.key === filtro)!.label;

  // Os chips sobem para o lugar do TopNav quando ele se recolhe (§4.106).
  const recolhido = useCabecalhoRecolhido();

  function trocarOrdem(nova: OrdemKey) {
    setOrdem(nova);
    gravarPreferencia(ORDEM_KEY, nova);
  }

  function trocarVisao(nova: VisaoKey) {
    setVisao(nova);
    gravarPreferencia(VISAO_KEY, nova);
  }

  /** As ações que só fazem sentido aqui, acrescentadas ao menu "…" do livro. */
  function acoesDoItem(item: ItemAcervo) {
    const extras = [];
    if (item.playback) {
      extras.push({
        icone: X,
        rotulo: "Tirar de Continuar ouvindo",
        aoClicar: () => removeFromPlayback(item.book.id),
      });
    }
    if (item.baixado) {
      extras.push({
        icone: Download,
        rotulo: "Remover download",
        aoClicar: () => removeDownload(item.book.id),
      });
    }
    return extras;
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="library-page">
      {/* Brilho da marca no topo — o mesmo respiro do Perfil e da Descobrir. */}
      <header className="relative overflow-hidden px-5 pt-7 pb-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <h1
          className="relative font-display text-3xl font-bold tracking-tight"
          data-testid="text-library-title"
        >
          Biblioteca
        </h1>
        <p className="relative mt-1.5 text-sm text-white/45" data-testid="text-library-summary">
          {resumo}
        </p>
      </header>

      {/* Filtros reais. O deslocamento acompanha a altura do TopNav (56px) —
          e sobe para 0 quando ele se recolhe ao rolar (§4.106). */}
      {/* Fundo fechado (§4.104): a 95% as capas transpareciam atrás dos chips. */}
      <div
        className={`sticky z-30 border-b border-white/5 bg-background transition-[top] duration-300 ${
          recolhido ? "top-0" : "top-14"
        }`}
      >
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-5 py-3">
          {FILTROS.filter((f) => f.key === "tudo" || contagens[f.key] > 0).map((f) => {
            const ativo = filtro === f.key;
            return (
              <button
                key={f.key}
                onClick={(evento) => {
                  setFiltro(f.key);
                  // A fileira rola de lado; sem isto o último chip ficava
                  // escolhido e pela metade, encostado na borda da tela.
                  evento.currentTarget.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                  });
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  ativo ? "bg-white text-background" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12]"
                }`}
                data-testid={`tab-${f.key}`}
              >
                {f.label}
                <span className={ativo ? "text-background/45" : "text-white/35"}>{contagens[f.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="space-y-9 py-6">
        {mostrarDestaque && (
          <section className="px-5" data-testid="section-continue-listening">
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              Continue de onde parou
            </h2>
            <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Link href={`/book/${destaque.book.id}`} className="shrink-0">
                <div className="h-28 w-20 overflow-hidden rounded-lg border border-white/10 shadow-lg shadow-black/50">
                  <img
                    src={destaque.book.cover}
                    alt={destaque.book.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
              {/*
                O botão de retomar é redondo e fica fora da coluna de texto. Com
                ele em linha, escrito "Retomar", sobrava tão pouca largura que
                "4h 15m restantes" saía cortado no celular.
              */}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold leading-tight tracking-tight line-clamp-2">
                    {destaque.book.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-white/45">{destaque.book.author}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/12">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${destaque.percent}%` }}
                    />
                  </div>
                  <p className="truncate text-[11px] text-white/40">
                    Capítulo {destaque.playback!.chapter} · {remainingLabel(destaque.playback!)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLocation(`/player/${destaque.book.id}`)}
                className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full bg-white text-background shadow-lg shadow-black/30 transition-transform hover:scale-105"
                aria-label={`Continuar ${destaque.book.title}`}
                data-testid={`button-resume-${destaque.book.id}`}
              >
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </button>
            </div>
          </section>
        )}

        <section data-testid="section-library">
          <div className="mb-4 flex items-end justify-between gap-3 px-5">
            <h2 className="font-display text-xl font-bold tracking-tight">{tituloDoAcervo}</h2>

            {/* Ordenar e trocar de visão só aparecem quando há o que ordenar. */}
            <div className={`flex items-center gap-1.5 ${itens.length === 0 ? "hidden" : ""}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-white/55 transition-colors hover:bg-white/5 hover:text-white/80"
                    aria-label="Ordenar"
                    data-testid="button-sort"
                  >
                    <ArrowDownUp className="h-3.5 w-3.5" />
                    {/* O critério em uso no lugar de um "Ordenar" seco: sem
                        isto, só abrindo o menu se descobria a ordem atual. */}
                    {ORDENS.find((o) => o.key === ordem)?.curto ?? "Ordenar"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-white/10 bg-card text-white"
                >
                  {ORDENS.map((o) => (
                    <DropdownMenuItem
                      key={o.key}
                      onClick={() => trocarOrdem(o.key)}
                      className="gap-2 text-[13px] focus:bg-white/10 focus:text-white"
                      data-testid={`sort-${o.key}`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 ${ordem === o.key ? "opacity-100" : "opacity-0"}`}
                      />
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex rounded-lg bg-white/[0.07] p-0.5">
                {([
                  { key: "lista" as const, icone: Rows3, rotulo: "Ver em lista" },
                  { key: "grade" as const, icone: LayoutGrid, rotulo: "Ver em grade" },
                ]).map(({ key, icone: Icone, rotulo }) => (
                  <button
                    key={key}
                    onClick={() => trocarVisao(key)}
                    className={`rounded-md p-1.5 transition-colors ${
                      visao === key ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
                    }`}
                    aria-label={rotulo}
                    aria-pressed={visao === key}
                    data-testid={`button-view-${key}`}
                  >
                    <Icone className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {itens.length === 0 && (
            <div className="px-5">
              {acervo.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                    <Headphones className="h-7 w-7 text-white/25" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                    Sua biblioteca começa vazia
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-white/45">
                    O que você salvar, ouvir ou baixar aparece aqui — e continua
                    de onde parou em qualquer aparelho.
                  </p>
                  <Link href="/search">
                    <button
                      className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-white/90"
                      data-testid="button-explore"
                    >
                      Explorar o catálogo
                    </button>
                  </Link>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-white/40">
                  Nada em “{tituloDoAcervo}” por enquanto.
                </p>
              )}
            </div>
          )}

          {itens.length > 0 && visao === "lista" && (
            <div className="divide-y divide-white/5 border-y border-white/5">
              {itens.map((item) => {
                const duracao = duracaoEstimada(item.book.pages);
                const concluido = item.percent >= CONCLUIDO;
                return (
                  <div
                    key={item.book.id}
                    className="flex items-center gap-3.5 px-5 py-3"
                    data-testid={`card-library-${item.book.id}`}
                  >
                    <Link href={`/book/${item.book.id}`} className="shrink-0">
                      <div className="h-[68px] w-12 overflow-hidden rounded-md border border-white/10">
                        <img
                          src={item.book.cover}
                          alt={item.book.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </Link>

                    <Link href={`/book/${item.book.id}`} className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{item.book.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-white/45">{item.book.author}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/35">
                        <span className="truncate">{item.book.genre}</span>
                        {duracao && (
                          <>
                            <span className="text-white/15">·</span>
                            <span className="shrink-0">{duracao}</span>
                          </>
                        )}
                        {item.baixado && (
                          <Download className="h-3 w-3 shrink-0 text-white/40" aria-label="Baixado" />
                        )}
                      </div>
                      {item.percent > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-[3px] w-24 overflow-hidden rounded-full bg-white/12">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40">
                            {concluido ? "Concluído" : `${Math.round(item.percent)}%`}
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="flex shrink-0 items-center">
                      <button
                        onClick={() => setLocation(`/player/${item.book.id}`)}
                        className="rounded-full p-2 transition-colors hover:bg-white/10"
                        aria-label={`Ouvir ${item.book.title}`}
                        data-testid={`button-play-${item.book.id}`}
                      >
                        <Play className="h-[18px] w-[18px] fill-white text-white" />
                      </button>
                      <BookActionsMenu
                        bookId={item.book.id}
                        legenda={item.book.author}
                        acoesExtras={acoesDoItem(item)}
                      >
                        <button
                          className="rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label={`Mais opções de ${item.book.title}`}
                          data-testid={`button-more-${item.book.id}`}
                        >
                          <MoreVertical className="h-[18px] w-[18px]" />
                        </button>
                      </BookActionsMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {itens.length > 0 && visao === "grade" && (
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5">
              {itens.map((item) => (
                <div key={item.book.id} data-testid={`card-library-${item.book.id}`}>
                  <Link href={`/book/${item.book.id}`}>
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 shadow-lg shadow-black/40">
                      <img
                        src={item.book.cover}
                        alt={item.book.title}
                        className="h-full w-full object-cover"
                      />
                      {item.baixado && (
                        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
                          <Download className="h-2.5 w-2.5 text-white/80" aria-label="Baixado" />
                        </div>
                      )}
                      {item.percent > 0 && (
                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/50">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                  <h3 className="mt-2 text-[13px] font-medium leading-snug line-clamp-2">
                    {item.book.title}
                  </h3>
                  <p className="truncate text-[11px] text-white/40">{item.book.author}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="px-5" data-testid="section-stats-link">
          <Link href="/statistics">
            <div className="flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3.5 transition-colors hover:bg-white/[0.07]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Suas estatísticas</p>
                <p className="truncate text-xs text-white/40">
                  Horas ouvidas, sequência e conquistas
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
            </div>
          </Link>
        </section>

        {sugestoes.length > 0 && (
          <section data-testid="section-suggestions">
            <div className="mb-3 px-5">
              <h2 className="font-display text-xl font-bold tracking-tight">Sugestões para você</h2>
              <p className="mt-0.5 text-xs text-white/40">{motivoDasSugestoes}</p>
            </div>
            {/*
              `scroll-pl-5` junto com o `px-5`: sem ele o encaixe (snap) alinha o
              primeiro card ao início da área de rolagem e **come o respiro da
              esquerda** — a capa encostava na borda da tela.
            */}
            <div className="scrollbar-hide flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-2">
              {sugestoes.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="group min-w-[124px] max-w-[124px] snap-start"
                  data-testid={`card-suggestion-${book.id}`}
                >
                  <div className="mb-2 aspect-[3/4] overflow-hidden rounded-lg border border-white/10 shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-[1.03]">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="text-[13px] font-medium leading-snug line-clamp-2">{book.title}</h3>
                  <p className="mt-0.5 truncate text-[11px] text-white/40">{book.author}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
