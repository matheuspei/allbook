import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, HelpCircle, Plus } from "lucide-react";

import ClubesNaComunidade from "@/components/clube/ClubesNaComunidade";
import ConversasDeAgora from "@/components/ConversasDeAgora";
import CartaoDePost from "@/components/comunidade/CartaoDePost";
import CartaoDeSugestoes from "@/components/comunidade/CartaoDeSugestoes";
import LinhaDeAtividade from "@/components/comunidade/LinhaDeAtividade";
import { ConviteDeClube, ConviteDeForum, TrechosQuentes } from "@/components/comunidade/CartaoDeConvite";
import Compositor from "@/components/comunidade/Compositor";
import { POSTS_EVENT, todosOsPosts } from "@/lib/posts";
import { montarFeed, type ItemDoFeed, type Lente } from "@/lib/feedDaComunidade";
import { MURAL_EVENT } from "@/lib/mural";
import { useToast } from "@/hooks/use-toast";
import { ouvindoAgoraNaComunidade, type AudicaoDeAgora } from "@/lib/activity";
import { readFollowing } from "@/lib/following";
import { GRUPOS_EVENT, criarGrupo, resumoDosGrupos } from "@/lib/grupos";

/**
 * Comunidade (`/community`) — **duas abas** desde 30/07.
 *
 * - **Feed** — o que as pessoas escreveram, nas duas lentes (Todos · Seguindo),
 *   com os cartões de clube e de fórum intercalados.
 * - **Fóruns** — o assunto: as conversas da semana, os fóruns (Orkut: fórum →
 *   tópico → respostas, com CRIAR) e os clubes.
 *
 * **A aba "Pessoas" morreu em 30/07**, e não por espaço: é a decisão 7 da
 * §4.58. Ela tinha três blocos e cada um teve um destino —
 *
 * - **"Combina com você"** virou **cartão ocasional dentro do Seguindo**, para
 *   não ser parede de perfis (é o que falhou onze vezes, §4.53);
 * - **"Ouvindo agora"** mudou de lugar, também para o Seguindo: é **atividade**,
 *   e a regra que separa as lentes diz que atividade só existe ali;
 * - **"Todo mundo"** e a **fileira "Seguindo"** morreram. Gente se descobre pelo
 *   que ela escreve — cada post traz o botão de seguir —, e não numa lista
 *   telefônica. *(Se fizer falta, o lugar de uma lista de pessoas é a Busca, não
 *   uma aba da Comunidade.)*
 */

type Aba = "agora" | "grupos";

const LENTES: { key: Lente; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "seguindo", label: "Seguindo" },
];

const ABAS: { key: Aba; label: string }[] = [
  // "Fóruns" diz o que a aba é sem confundir com o clube de leitura — a troca
  // de 28/07 (ROTEIRO 4.44).
  { key: "agora", label: "Feed" },
  { key: "grupos", label: "Fóruns" },
];

export default function Community() {
  const [aba, setAba] = useState<Aba>("agora");
  const [, setLocation] = useLocation();

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

        {/* As duas abas — o mesmo desenho de pílulas dos filtros da Biblioteca.
            **"Fóruns" deixou de ser uma aba desta tela e virou destino** (31/07,
            §4.74): as comunidades agora são o Orkut, com layout próprio e tela
            cheia. Mantê-las aqui dentro seria mostrar meia comunidade numa moldura
            que não é a delas. */}
        <div className="relative mt-4 flex gap-2" data-testid="community-tabs">
          {ABAS.map((item) => (
            <button
              key={item.key}
              onClick={() => (item.key === "grupos" ? setLocation("/forum") : setAba(item.key))}
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

      {aba === "agora" && <FeedDePosts />}
      {aba === "grupos" && <AbaGrupos />}
    </div>
  );
}

/**
 * A fita de quem está no meio de um livro **agora** — só de quem você segue.
 *
 * **Mudou de lugar em 30/07** (§4.58, decisão 7): morava no alto da Comunidade,
 * com a comunidade inteira, e passou a viver dentro da lente Seguindo. O motivo é
 * a regra que separa as duas lentes — isto é **atividade**, e atividade responde
 * à pergunta *o que andaram fazendo as pessoas que eu escolhi*.
 *
 * **O que se perde, e fica anotado:** era a primeira coisa que se via na
 * Comunidade, e é a única vitrine que só um app de audiolivro tem. Atrás de uma
 * lente, quem nunca tocar em "Seguindo" não a verá. Se fizer falta, a saída é uma
 * versão compacta no alto do Feed — não desfazer a regra.
 */
function OuvindoAgora({ seguindo }: { seguindo: string[] }) {
  const [audicoes, setAudicoes] = useState<AudicaoDeAgora[]>([]);

  useEffect(() => {
    setAudicoes(ouvindoAgoraNaComunidade().filter((item) => seguindo.includes(item.member.slug)));
  }, [seguindo]);

  if (audicoes.length === 0) return null;

  return (
    <section className="mt-3" data-testid="community-listening-now">
      <h2 className="mb-2.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        Ouvindo agora
      </h2>

      {/* A fita de capas: livros no lugar de rostos, moldura de "ao vivo". */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
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
  );
}

/**
 * O feed — a Comunidade nova (ROTEIRO §4.53–§4.58).
 *
 * **O que já está de pé:** o cartão nas quatro formas, o **compositor** no topo,
 * as duas lentes, curtir, comentar, editar, apagar, **compartilhar** e os
 * **cartões de clube e de fórum intercalados** — com isso o item 3 da ordem da
 * §4.58 fecha.
 *
 * Ordem cronológica pura, sem algoritmo — decisão registrada na §4.58. Quem
 * monta a lista (e onde os cartões de convite entram) é `lib/feedDaComunidade`.
 */
function FeedDePosts() {
  const [itens, setItens] = useState<ItemDoFeed[]>([]);
  const [lente, setLente] = useState<Lente>("todos");
  const [seguindo, setSeguindo] = useState<string[]>([]);
  const [perguntas, setPerguntas] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      const quemEuSigo = readFollowing();
      setSeguindo(quemEuSigo);
      setItens(montarFeed(lente, quemEuSigo));
      setPerguntas(todosOsPosts().filter((post) => post.pergunta).length);
    };
    atualizar();
    /* Dois eventos, pelos dois formatos de post seu: o novo (`allbook_posts`) e
       os herdados do mural (ver `CHAVE_POSTS`). O compartilhar não precisa de um
       terceiro — ele **é** um post, e dispara o mesmo aviso. */
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
    /*
      **A lente entra nas dependências**, e isso é o que faz trocar de lente
      remontar a lista: sem ela, o efeito guardaria para sempre a lente do
      primeiro desenho, e "Seguindo" mostraria o feed inteiro.
    */
  }, [lente]);

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

      {/*
        **As duas lentes.** Ficam **aqui**, embaixo do compositor, e não nas abas
        do alto: as de cima dizem *que parte da Comunidade* (Feed · Fóruns ·
        Pessoas), e estas dizem *de quem*. Misturar os dois critérios numa fileira
        só é o que a régua da casa proíbe — uma fileira de pílulas carrega um
        critério, não dois.
      */}
      <div className="mt-3 flex gap-2" data-testid="feed-lentes">
        {LENTES.map((item) => (
          <button
            key={item.key}
            onClick={() => setLente(item.key)}
            className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
              lente === item.key
                ? "bg-white text-black"
                : "border border-white/15 text-white/50 hover:text-white/80"
            }`}
            data-testid={`feed-lente-${item.key}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* A fita de "ouvindo agora" mora **dentro do Seguindo** desde 30/07 — é
          atividade, e atividade só existe nesta lente (§4.58, decisão 7). */}
      {lente === "seguindo" && <OuvindoAgora seguindo={seguindo} />}

      <div className="mt-3 space-y-3">
        {itens.map((item) => {
          if (item.tipo === "post") return <CartaoDePost key={item.chave} post={item.post} />;
          if (item.tipo === "atividade")
            return <LinhaDeAtividade key={item.chave} evento={item.evento} />;
          if (item.tipo === "sugestoes")
            return <CartaoDeSugestoes key={item.chave} sugestoes={item.sugestoes} />;
          if (item.tipo === "trechos")
            return <TrechosQuentes key={item.chave} trechos={item.trechos} />;
          if (item.tipo === "clube")
            return (
              <ConviteDeClube key={item.chave} clube={item.clube} comecando={item.comecando} />
            );
          return <ConviteDeForum key={item.chave} grupo={item.grupo} topico={item.topico} />;
        })}
      </div>

      {/*
        **Estado vazio do "Seguindo", com saída.** Quem não segue ninguém veria uma
        lista vazia e não saberia por quê. A saída **é o cartão "Combina com
        você"**, que o montador coloca aqui mesmo — desde que a aba Pessoas morreu
        (§4.58, decisão 7), ele é o lugar de começar a seguir gente. O texto abaixo
        só explica o vazio; quem resolve é o cartão (§4.23: nada de tela morta).
      */}
      {lente === "seguindo" && itens.filter((item) => item.tipo !== "sugestoes").length === 0 && (
        <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="text-[13px] leading-relaxed text-white/55">
            {seguindo.length === 0
              ? "Você ainda não segue ninguém — é por isso que aqui está vazio. Comece pelas sugestões acima, ou siga quem escreveu algo que você gostou no feed."
              : "Quem você segue não publicou nada ainda."}
          </p>
          <button
            onClick={() => setLente("todos")}
            className="mt-3 text-[12px] font-bold text-primary"
            data-testid="voltar-feed-todos"
          >
            Ver o feed inteiro
          </button>
        </div>
      )}
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
