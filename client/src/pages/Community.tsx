import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight, HelpCircle, Plus } from "lucide-react";

import ClubesNaComunidade from "@/components/clube/ClubesNaComunidade";
import ConversasDeAgora from "@/components/ConversasDeAgora";
import CartaoDePost from "@/components/comunidade/CartaoDePost";
import Compositor from "@/components/comunidade/Compositor";
import { POSTS_EVENT, todosOsPosts, type Post } from "@/lib/posts";
import { MURAL_EVENT } from "@/lib/mural";
import { useToast } from "@/hooks/use-toast";
import {
  ouvindoAgoraNaComunidade,
  suggestions,
  type AudicaoDeAgora,
  type Suggestion,
} from "@/lib/activity";
import { community, findMember } from "@/lib/community";
import { isFollowing, readFollowing, toggleFollow } from "@/lib/following";
import { readLibrary } from "@/lib/library";
import { GRUPOS_EVENT, criarGrupo, resumoDosGrupos } from "@/lib/grupos";
import { catalog } from "@/lib/books";

/**
 * Comunidade (`/community`) — reorganizada em três abas internas (28/07).
 *
 * A junção das quatro propostas empilhava nove blocos numa rolagem só, e o
 * Matheus apontou: *"muita coisa, muita coisa solta — organizar melhor"*. A
 * resposta é a divisão por assunto, nas pílulas que a Biblioteca já usa:
 *
 * - **Mural** — o vivo: quem está ouvindo (fita de capas) e o Mural.
 * - **Fóruns** — o assunto: as conversas da semana (fusão do "top da
 *   semana" com as portas — apontavam para as mesmas salas), os fóruns
 *   (Orkut: fórum → tópico → respostas, com CRIAR) e os clubes.
 * - **Pessoas** — combina com você, a lista de todo mundo, seguindo.
 *   (O pódio nasceu e morreu no mesmo dia — "não está legal", disse ele.)
 *
 * Cada aba tem 2–3 blocos. Nenhuma função morreu na reorganização; a fileira
 * "Seguindo" encolheu para uma linha porque era a mais redundante (quem você
 * segue já aparece no mural e nas páginas).
 */

type Aba = "agora" | "grupos" | "pessoas";

const ABAS: { key: Aba; label: string }[] = [
  // "Mural" nomeia o coração; "Fóruns" diz o que a aba é sem confundir com o
  // clube de leitura — a troca de 28/07 (ROTEIRO 4.44).
  // hoje (28/07 — "Conversas" e "Rodas de conversa" caíram por pedido).
  { key: "agora", label: "Feed" },
  { key: "grupos", label: "Fóruns" },
  { key: "pessoas", label: "Pessoas" },
];

export default function Community() {
  const [aba, setAba] = useState<Aba>("agora");

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="community-page">
      <header className="relative overflow-hidden px-5 pt-7 pb-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <h1
          className="relative font-display text-3xl font-bold tracking-tight"
          data-testid="text-community-title"
        >
          Comunidade
        </h1>
        <p className="relative mt-1.5 text-sm text-white/45">
          Quem está ouvindo, conversando e recomendando
        </p>

        {/* As três abas — o mesmo desenho de pílulas dos filtros da Biblioteca. */}
        <div className="relative mt-4 flex gap-2" data-testid="community-tabs">
          {ABAS.map((item) => (
            <button
              key={item.key}
              onClick={() => setAba(item.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                aba === item.key
                  ? "bg-white text-black"
                  : "border border-white/15 text-white/50 hover:text-white/80"
              }`}
              data-testid={`community-tab-${item.key}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {aba === "agora" && <AbaAgora />}
      {aba === "grupos" && <AbaGrupos />}
      {aba === "pessoas" && <AbaPessoas />}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Agora — o vivo: a fita de quem ouve, e o Mural
 * ------------------------------------------------------------------ */

function AbaAgora() {
  const [audicoes, setAudicoes] = useState<AudicaoDeAgora[]>([]);

  useEffect(() => {
    setAudicoes(ouvindoAgoraNaComunidade());
  }, []);

  return (
    <div data-testid="community-agora">
      {audicoes.length > 0 && (
        <section className="pt-1 pb-4 border-b border-white/10" data-testid="community-listening-now">
          <h2 className="mb-3 flex items-center gap-2 px-5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Ouvindo agora
          </h2>

          {/* A fita de capas: livros no lugar de rostos, moldura de "ao vivo". */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
            {audicoes.map(({ member, book, chapter }) => (
              <Link
                key={member.slug}
                href={`/user/${member.slug}`}
                className="w-[80px] shrink-0 group"
                data-testid={`listening-${member.slug}`}
              >
                <div className="relative h-[106px] w-[80px] overflow-hidden rounded-xl border-2 border-primary/55">
                  <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                  <span
                    className={`absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br ${member.color} text-[8px] font-bold`}
                  >
                    {member.name.charAt(0)}
                  </span>
                  <span className="absolute bottom-1.5 right-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[8px]">
                    cap. {chapter}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-center text-[10px] text-white/55 transition-colors group-hover:text-white">
                  {member.name.split(" ")[0]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <FeedDePosts />
    </div>
  );
}

/**
 * O feed — a Comunidade nova (ROTEIRO §4.53–§4.58).
 *
 * **O que já está de pé:** o cartão nas quatro formas, o **compositor** no topo,
 * curtir, editar e apagar. **Ainda falta** (item 3 da ordem da §4.58): as duas
 * lentes Feed · Seguindo, comentar, compartilhar, e os cartões de clube e fórum
 * intercalados.
 *
 * Ordem cronológica pura, sem algoritmo — decisão registrada na §4.58.
 */
function FeedDePosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const atualizar = () => setPosts(todosOsPosts());
    atualizar();
    /* Dois eventos porque há dois formatos de post seu: o novo
       (`allbook_posts`) e os herdados do mural. Ver `CHAVE_POSTS`. */
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, []);

  const perguntas = posts.filter((post) => post.pergunta).length;

  return (
    <div className="px-5 pt-4" data-testid="feed-de-posts">
      <Compositor />

      {/*
        **Uma porta para `/perguntas`, e não um filtro no lugar** (30/07). Havia
        aqui um par "Tudo · Perguntas" que filtrava a lista sem sair da tela; o
        Matheus pediu **uma página** — *"levaria para uma página onde só mostraria
        perguntas"* —, e ele tem razão por um motivo que eu não tinha visto: o
        filtro mudava a lista **embaixo da pessoa**, sem endereço nem título, e o
        selo dentro do cartão não conseguia apontar para ele. Com a página, o selo
        e esta linha levam ao mesmo lugar: **um mecanismo, não dois**.

        **Some quando não há pergunta nenhuma** — porta para sala vazia é o beco
        sem saída que a §4.23 manda varrer.
      */}
      {perguntas > 0 && (
        <Link
          href="/perguntas"
          className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:bg-white/[0.07]"
          data-testid="link-perguntas"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 text-[12.5px] text-white/70">
            <strong className="font-semibold text-white">{perguntas}</strong>{" "}
            {perguntas === 1 ? "pergunta esperando" : "perguntas esperando"} uma opinião
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
        </Link>
      )}

      <div className="mt-3 space-y-3">
        {posts.map((post) => (
          <CartaoDePost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Fóruns — o assunto: salas da semana, fóruns, clubes
 * ------------------------------------------------------------------ */

function AbaGrupos() {
  const { toast } = useToast();
  const [grupos, setGrupos] = useState(() => resumoDosGrupos());
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    const atualizar = () => setGrupos(resumoDosGrupos());
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  /** Cria o grupo e limpa o formulário — quem cria já entra participando. */
  function publicarGrupo() {
    const novo = criarGrupo(nome, emoji, descricao);
    if (novo) {
      setNome("");
      setEmoji("");
      setDescricao("");
      setCriando(false);
      toast({ title: `Fórum "${novo.nome}" criado`, description: "Você já participa — crie o primeiro tópico." });
    }
  }

  return (
    <div data-testid="community-grupos">
      {/* A fusão: o "top da semana" e as portas eram as mesmas salas. */}
      <ConversasDeAgora />

      <section className="px-5 pt-5 pb-4 border-b border-white/10" data-testid="community-grupos-lista">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Fóruns
          </h2>
          {/* O que faltava (28/07): criar grupo é de quem usa, não só do app. */}
          <button
            onClick={() => setCriando((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
            data-testid="button-create-group"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar fórum
          </button>
        </div>

        {criando && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5" data-testid="group-composer">
            <div className="flex gap-2">
              <input
                value={emoji}
                onChange={(event) => setEmoji(event.target.value.slice(0, 4))}
                placeholder="💬"
                className="w-12 rounded-lg border border-white/10 bg-transparent py-2 text-center text-base focus:outline-none focus:border-primary/50"
                aria-label="Ícone do fórum (um emoji)"
                data-testid="group-emoji"
              />
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value.slice(0, 40))}
                placeholder="Nome do fórum…"
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                data-testid="group-name"
              />
            </div>
            <input
              value={descricao}
              onChange={(event) => setDescricao(event.target.value.slice(0, 160))}
              placeholder="Sobre o que é? (opcional)"
              className="mt-2 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs focus:outline-none focus:border-primary/50"
              data-testid="group-description"
            />
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={publicarGrupo}
                disabled={nome.trim().length === 0}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-30"
                data-testid="group-publish"
              >
                Criar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {grupos.map(({ grupo, totalTopicos, totalPessoas, participo }) => (
            <Link
              key={grupo.id}
              href={`/forum/${grupo.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
              data-testid={`grupo-card-${grupo.id}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 text-xl">
                {grupo.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {grupo.nome}
                  {participo && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wide text-primary">
                      você participa
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {totalPessoas} pessoas · {totalTopicos}{" "}
                  {totalTopicos === 1 ? "tópico" : "tópicos"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
            </Link>
          ))}
        </div>
      </section>

      {/* O compromisso: os clubes (da janela A), intactos. */}
      <ClubesNaComunidade />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Gente — pódio, afinidade e quem você segue
 * ------------------------------------------------------------------ */

function AbaPessoas() {
  const { toast } = useToast();
  const [sugestoes, setSugestoes] = useState<Suggestion[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    recarregar();
  }, []);

  function recarregar() {
    setFollowing(readFollowing());
    setSugestoes(suggestions(readLibrary().map((item) => item.id), 4));
  }

  function seguir(slug: string, primeiroNome: string) {
    const agora = toggleFollow(slug);
    recarregar();
    toast({
      title: agora ? `Seguindo ${primeiroNome}` : `Você deixou de seguir ${primeiroNome}`,
      description: agora ? "O mural passa a priorizar quem você segue." : undefined,
    });
  }

  const seguindo = following
    .map((slug) => findMember(slug))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  /*
   * O pódio da semana morava aqui e MORREU em 28/07, no mesmo dia em que
   * nasceu — o Matheus: "não está legal, tem que ser totalmente reformulado".
   * No lugar: a lista completa de "Todo mundo", rica de contexto (bio, o que
   * a pessoa está ouvindo, seguir ali) — gente como gente, não como ranking.
   */

  return (
    <div data-testid="community-pessoas">
      {sugestoes.length > 0 && (
        <section className="pt-5 pb-4 border-b border-white/10" data-testid="community-suggestions">
          <h2 className="mb-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Combina com você
          </h2>

          {/* Carrossel de cartões: vitrine de gente, não lista telefônica. */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
            {sugestoes.map(({ member, reason, books }) => {
              const ja = isFollowing(member.slug);
              return (
                <div
                  key={member.slug}
                  className="w-[132px] shrink-0 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center"
                  data-testid={`suggestion-${member.slug}`}
                >
                  <Link href={`/user/${member.slug}`} className="block group">
                    <span
                      className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-display text-base font-bold`}
                    >
                      {member.name.charAt(0)}
                    </span>
                    <p className="mt-2 truncate text-xs font-bold transition-colors group-hover:text-primary">
                      {member.name}
                    </p>
                    <p className="mt-1 min-h-[42px] text-[10px] leading-snug text-white/40">
                      {reason}
                    </p>
                  </Link>
                  {books.length > 0 && (
                    <div className="mt-1 flex justify-center">
                      {books.slice(0, 3).map((book) => (
                        <img
                          key={book.id}
                          src={book.cover}
                          alt=""
                          className="-ml-1 h-[22px] w-4 rounded-[2px] border border-black object-cover first:ml-0"
                        />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => seguir(member.slug, member.name.split(" ")[0])}
                    className={`mt-2 flex w-full items-center justify-center gap-1 rounded-full py-1.5 text-[10px] font-bold transition-colors ${
                      ja
                        ? "border border-white/15 text-white/50"
                        : "bg-primary text-black hover:bg-primary/90"
                    }`}
                    data-testid={`follow-${member.slug}`}
                  >
                    {ja ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {ja ? "Seguindo" : "Seguir"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Todo mundo, com contexto: bio, o que está ouvindo, e o Seguir ali.
          É o que substituiu o pódio — gente como gente, não como ranking. */}
      <section className="px-5 pt-5 pb-2 border-b border-white/10" data-testid="community-everyone">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Todo mundo
        </h2>
        {community.map((member) => {
          const ja = isFollowing(member.slug);
          const ouvindo = member.ouvindoAgora
            ? catalog.find((book) => book.id === member.ouvindoAgora?.bookId)
            : undefined;
          return (
            <div
              key={member.slug}
              className="flex items-center gap-3 border-b border-white/5 py-3 last:border-b-0"
              data-testid={`everyone-${member.slug}`}
            >
              <Link
                href={`/user/${member.slug}`}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-display font-bold`}
              >
                {member.name.charAt(0)}
              </Link>
              <Link href={`/user/${member.slug}`} className="min-w-0 flex-1 group">
                <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                  {member.name}
                </p>
                <p className="truncate text-[11px] text-white/40">{member.bio}</p>
                {ouvindo && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-green-400/80">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                    ouvindo {ouvindo.title}
                  </p>
                )}
              </Link>
              <button
                onClick={() => seguir(member.slug, member.name.split(" ")[0])}
                className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  ja
                    ? "border border-white/15 text-white/50"
                    : "bg-primary text-black hover:bg-primary/90"
                }`}
                data-testid={`everyone-follow-${member.slug}`}
              >
                {ja ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {ja ? "Seguindo" : "Seguir"}
              </button>
            </div>
          );
        })}
      </section>

      {/* Uma linha, não um bloco: era a parte mais redundante da tela antiga. */}
      {seguindo.length > 0 && (
        <section className="px-5 pt-5 pb-4" data-testid="following-row">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Seguindo
          </h2>
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
            {seguindo.map((member) => (
              <Link
                key={member.slug}
                href={`/user/${member.slug}`}
                title={member.name}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.color} text-sm font-bold transition-transform hover:scale-105`}
                data-testid={`following-${member.slug}`}
              >
                {member.name.charAt(0)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="px-5 pb-6 pt-3 text-[11px] leading-relaxed text-white/25">
        Estes leitores são um esqueleto: existem para dar o que ver enquanto o AllBook não tem
        contas nem servidor.
      </p>
    </div>
  );
}
