import { useMemo, useState } from "react";
import { BookOpen, HelpCircle, Search, Send, UsersRound, X } from "lucide-react";

import AnexarTrecho from "@/components/AnexarTrecho";
import CampoComMencao from "@/components/comunidade/CampoComMencao";
import { useToast } from "@/hooks/use-toast";
import { catalog, type Book } from "@/lib/books";
import { clubePorId, meusClubes } from "@/lib/clubes";
import { readPlaybackList } from "@/lib/playback";
import { initialOf, readProfile } from "@/lib/profile";
import { MAX_POST, publicarPost, type Mencao, type ObjetoDoPost } from "@/lib/posts";

/**
 * A caixa de escrever um post — **o compositor** (ROTEIRO §4.58, item 2 da ordem
 * de construção).
 *
 * *("Compositor" era jargão meu; o Matheus pediu para explicar. É esta caixa: o
 * lugar onde você escreve e anexa antes de publicar.)*
 *
 * **Fica no topo do feed, e nasce fechada.** Uma linha só, com o seu avatar e o
 * convite; toca e ela abre no lugar. As duas alternativas foram descartadas com
 * motivo: **botão flutuante** tapa conteúdo (§4.58 já dizia "sem botão
 * flutuante"), e a caixa **sempre aberta** empurraria o primeiro post para baixo
 * da dobra — quem entra na Comunidade quer ler antes de escrever.
 *
 * **A fileira de anexos é o coração da decisão.** O post carrega **um** objeto do
 * AllBook (§4.58): livro, trecho ou clube. Os três botões ficam à mão para que
 * **texto puro continue sendo a exceção** — permitido, nunca o padrão. Escolhido
 * um, os outros dois somem: um objeto por post, nunca dois.
 *
 * **A trava antiga caiu, de propósito.** O mural exigia âncora em todo post
 * (`lib/mural.ts`: *"não existe caixa de texto sem capa ao lado"*). A §4.58
 * derrubou isso — *"terminei meu quinto livro do ano"* é post legítimo e não tem
 * objeto nenhum. O que sobrou da trava é o desenho: o anexo é o caminho fácil.
 */
export default function Compositor({ aoPublicar }: { aoPublicar?: () => void }) {
  const { toast } = useToast();
  const perfil = useMemo(readProfile, []);

  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [mencoes, setMencoes] = useState<Mencao[]>([]);
  const [objeto, setObjeto] = useState<ObjetoDoPost | undefined>();
  const [pergunta, setPergunta] = useState(false);
  const [escolhendo, setEscolhendo] = useState<"livro" | "clube" | null>(null);

  const clubes = useMemo(() => meusClubes(), [aberto]);

  function limpar() {
    setTexto("");
    setMencoes([]);
    setObjeto(undefined);
    setPergunta(false);
    setEscolhendo(null);
    setAberto(false);
  }

  function publicar() {
    const post = publicarPost({ texto, objeto, pergunta, mencoes });
    if (!post) return;
    limpar();
    toast({
      title: pergunta ? "Pergunta publicada" : "Publicado",
      description: "Seu post está no topo do feed.",
    });
    aoPublicar?.();
  }

  const podePublicar = texto.trim().length > 0 || objeto !== undefined;

  if (!aberto) {
    return (
      <button
        /* O foco é do `autoFocus` do campo, que só existe depois de abrir. */
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.06]"
        data-testid="abrir-compositor"
      >
        <Avatar perfil={perfil} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-white/35">
          O que você está ouvindo?
        </span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Send className="h-3.5 w-3.5" />
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl border border-white/12 bg-white/[0.045] p-3.5"
      data-testid="compositor"
    >
      <div className="flex items-start gap-3">
        <Avatar perfil={perfil} />
        <CampoComMencao
          texto={texto}
          mencoes={mencoes}
          onMudar={(novoTexto, novasMencoes) => {
            setTexto(novoTexto);
            setMencoes(novasMencoes);
          }}
          placeholder="Fale com a comunidade. Digite @ para citar um livro, um autor ou um narrador."
          autoFocus
        />
      </div>

      {/* O que está anexado — ou os botões para anexar. Nunca os dois. */}
      <div className="mt-2">
        {objeto?.tipo === "trecho" ? (
          /* O mesmo `AnexarTrecho` que o clube e o fórum usam: ele já mostra o
             cartão do trecho com o X para tirar. Uma peça, muitos campos. */
          <AnexarTrecho
            citacao={objeto.citacao}
            onEscolher={(citacao) =>
              setObjeto(citacao ? { tipo: "trecho", citacao } : undefined)
            }
          />
        ) : objeto?.tipo === "livro" ? (
          <AnexoDeLivro bookId={objeto.bookId} onTirar={() => setObjeto(undefined)} />
        ) : objeto?.tipo === "clube" ? (
          <AnexoDeClube clubeId={objeto.clubeId} onTirar={() => setObjeto(undefined)} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <BotaoDeAnexo
              icone={<BookOpen className="h-3 w-3" />}
              rotulo="Livro"
              onClick={() => setEscolhendo("livro")}
              testid="anexar-livro"
            />
            {/* Sem citação: o próprio `AnexarTrecho` desenha o botão "Trecho". */}
            <AnexarTrecho
              onEscolher={(citacao) =>
                setObjeto(citacao ? { tipo: "trecho", citacao } : undefined)
              }
            />
            {/*
              **O botão de clube só existe se você estiver em algum.** Não é
              esquecimento: uma folha vazia dizendo "você não tem clubes" seria o
              beco sem saída que a §4.23 manda varrer, e um botão desabilitado é
              pior — parece defeito. Quem não tem clube descobre os clubes na aba
              Fóruns, que é onde eles moram.
            */}
            {clubes.length > 0 && (
              <BotaoDeAnexo
                icone={<UsersRound className="h-3 w-3" />}
                rotulo="Clube"
                onClick={() => setEscolhendo("clube")}
                testid="anexar-clube"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-2.5">
        {/*
          **"Pergunta" é um tipo de post, não uma aba** (§4.58): aba dividiria a
          comunidade em duas plateias. O que ela tinha de bom — juntar as que
          ninguém respondeu — virou o filtro que fica ao lado do feed.
        */}
        <button
          onClick={() => setPergunta((valor) => !valor)}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
            pergunta
              ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
              : "text-white/40 hover:text-white/75"
          }`}
          aria-pressed={pergunta}
          data-testid="compositor-pergunta"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Pergunta
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          {/* O contador só aparece perto do fim: número sempre visível vira
              cobrança, e ninguém precisa saber que sobram 240 caracteres. */}
          {texto.length > MAX_POST * 0.8 && (
            <span
              className={`font-mono text-[11px] ${
                texto.length >= MAX_POST ? "text-red-400" : "text-white/35"
              }`}
              data-testid="compositor-contador"
            >
              {MAX_POST - texto.length}
            </span>
          )}
          <button
            onClick={limpar}
            className="rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
            data-testid="compositor-cancelar"
          >
            Cancelar
          </button>
          <button
            onClick={publicar}
            disabled={!podePublicar}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-bold text-black transition-opacity disabled:opacity-30"
            data-testid="compositor-publicar"
          >
            <Send className="h-3 w-3" />
            Publicar
          </button>
        </div>
      </div>

      {escolhendo === "livro" && (
        <FolhaDeLivros
          onFechar={() => setEscolhendo(null)}
          onEscolher={(book) => {
            setObjeto({ tipo: "livro", bookId: book.id });
            setEscolhendo(null);
          }}
        />
      )}

      {escolhendo === "clube" && (
        <FolhaDeClubes
          onFechar={() => setEscolhendo(null)}
          onEscolher={(id) => {
            setObjeto({ tipo: "clube", clubeId: id });
            setEscolhendo(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Peças
 * ------------------------------------------------------------------ */

function Avatar({ perfil }: { perfil: { name: string; photo?: string } }) {
  if (perfil.photo) {
    return (
      <img src={perfil.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-600 font-display text-sm font-bold">
      {initialOf(perfil.name)}
    </span>
  );
}

function BotaoDeAnexo({
  icone,
  rotulo,
  onClick,
  testid,
}: {
  icone: React.ReactNode;
  rotulo: string;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-semibold text-white/55 ring-1 ring-inset ring-white/8 transition-colors hover:text-white/85"
      data-testid={testid}
    >
      {icone}
      {rotulo}
    </button>
  );
}

function AnexoDeLivro({ bookId, onTirar }: { bookId: number; onTirar: () => void }) {
  const livro = catalog.find((item) => item.id === bookId);
  if (!livro) return null;

  return (
    <div className="relative" data-testid="anexo-de-livro">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 pr-9 ring-1 ring-inset ring-white/8">
        <img src={livro.cover} alt="" className="h-16 w-11 shrink-0 rounded-md object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
            Livro
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-semibold">{livro.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-white/40">{livro.author}</span>
        </span>
      </div>
      <BotaoDeTirar onClick={onTirar} rotulo="Tirar o livro" />
    </div>
  );
}

function AnexoDeClube({ clubeId, onTirar }: { clubeId: string; onTirar: () => void }) {
  const clube = clubePorId(clubeId);
  if (!clube) return null;
  const daVez = catalog.find((item) => item.id === clube.ciclo.bookId);

  return (
    <div className="relative" data-testid="anexo-de-clube">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 pr-9 ring-1 ring-inset ring-white/8">
        {daVez && (
          <img src={daVez.cover} alt="" className="h-16 w-11 shrink-0 rounded-md object-cover" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
            Clube de leitura
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-semibold">{clube.nome}</span>
          {daVez && (
            <span className="mt-0.5 block truncate text-[11px] text-white/40">
              lendo {daVez.title}
            </span>
          )}
        </span>
      </div>
      <BotaoDeTirar onClick={onTirar} rotulo="Tirar o clube" />
    </div>
  );
}

function BotaoDeTirar({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#2a2a2a] text-white/60 ring-1 ring-white/15 transition-colors hover:text-white"
      aria-label={rotulo}
      data-testid="tirar-anexo"
    >
      <X className="h-3 w-3" />
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * As folhas de escolha
 * ------------------------------------------------------------------ */

function Folha({
  titulo,
  subtitulo,
  onFechar,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div
        className="max-h-[80vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-white/40">{subtitulo}</p>}
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Escolher o livro: **os seus primeiro, o catálogo inteiro depois**.
 *
 * Quem escreve sobre livro escreve quase sempre sobre o que está ouvindo — daí os
 * atalhos no topo, sem busca nenhuma. Mas a busca alcança o catálogo todo, porque
 * citar não é o mesmo que ter ouvido.
 */
function FolhaDeLivros({
  onFechar,
  onEscolher,
}: {
  onFechar: () => void;
  onEscolher: (book: Book) => void;
}) {
  const [termo, setTermo] = useState("");

  const meus = useMemo(() => {
    return readPlaybackList()
      .slice(0, 6)
      .map((item) => catalog.find((book) => book.id === item.bookId))
      .filter((book): book is Book => book !== undefined);
  }, []);

  const achados = useMemo(() => {
    const busca = semAcento(termo.trim());
    if (busca.length < 2) return [];
    return catalog
      .filter(
        (book) =>
          semAcento(book.title).includes(busca) ||
          semAcento(book.author).includes(busca) ||
          semAcento(book.narrator).includes(busca),
      )
      .slice(0, 12);
  }, [termo]);

  const lista = termo.trim().length >= 2 ? achados : meus;

  return (
    <Folha
      titulo="Citar um livro"
      subtitulo={termo.trim().length >= 2 ? undefined : "Os que você ouviu por último"}
      onFechar={onFechar}
    >
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-inset ring-white/8">
        <Search className="h-4 w-4 shrink-0 text-white/30" />
        <input
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          placeholder="Título, autor ou narrador…"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/25 focus:outline-none"
          data-testid="buscar-livro"
        />
      </div>

      {lista.length === 0 ? (
        <p className="py-4 text-center text-[12.5px] text-white/30">
          {termo.trim().length >= 2
            ? "Nada com esse nome no catálogo."
            : "Você ainda não abriu nenhum livro — busque pelo título."}
        </p>
      ) : (
        <div className="space-y-0.5">
          {lista.map((book) => (
            <button
              key={book.id}
              onClick={() => onEscolher(book)}
              className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
              data-testid={`escolher-livro-${book.id}`}
            >
              <img src={book.cover} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{book.title}</span>
                <span className="block truncate text-[11px] text-white/40">{book.author}</span>
                <span className="block truncate text-[10.5px] text-white/25">
                  narra {book.narrator}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Folha>
  );
}

function FolhaDeClubes({
  onFechar,
  onEscolher,
}: {
  onFechar: () => void;
  onEscolher: (id: string) => void;
}) {
  const clubes = useMemo(() => meusClubes(), []);

  return (
    <Folha titulo="Citar um clube" subtitulo="Os clubes de que você participa" onFechar={onFechar}>
      <div className="space-y-0.5">
        {clubes.map((clube) => {
          const daVez = catalog.find((item) => item.id === clube.ciclo.bookId);
          return (
            <button
              key={clube.id}
              onClick={() => onEscolher(clube.id)}
              className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
              data-testid={`escolher-clube-${clube.id}`}
            >
              {daVez ? (
                <img src={daVez.cover} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="grid h-14 w-10 shrink-0 place-items-center rounded-md bg-white/[0.07]">
                  <UsersRound className="h-4 w-4 text-white/40" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{clube.nome}</span>
                <span className="block truncate text-[11px] text-white/40">
                  {clube.membros.length}{" "}
                  {clube.membros.length === 1 ? "pessoa" : "pessoas"}
                  {daVez && ` · lendo ${daVez.title}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Folha>
  );
}

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
