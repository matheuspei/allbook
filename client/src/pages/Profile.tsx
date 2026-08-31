import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Eye, Pencil, Settings, Share2, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarAmpliavel from "@/components/AvatarAmpliavel";
import SeloDeMedalha from "@/components/SeloDeMedalha";
import { useToast } from "@/hooks/use-toast";
import { useCabecalhoRecolhido } from "@/hooks/use-cabecalho-recolhido";
import { initialOf, meuSlug, readProfile, type Profile as UserProfile } from "@/lib/profile";
import { readRecommendations } from "@/lib/recommendations";
import { quantosAcompanho } from "@/lib/acompanhando";
import { meusClubes, type Clube } from "@/lib/clubes";
import { formatarDuracao } from "@/lib/listening";
import { lerDadosDeConquista, lerResumo, type ResumoDeAudicao } from "@/lib/stats";
import {
  achievementsFor,
  melhoresConquistas,
  type Achievement,
} from "@/lib/achievements";
import { playbackPercent, readPlaybackList, type Playback } from "@/lib/playback";
import { readMyComments } from "@/lib/myComments";
import { MURAL_EVENT } from "@/lib/mural";
import { POSTS_EVENT, postsDe, type Post } from "@/lib/posts";
import CartaoDePost from "@/components/comunidade/CartaoDePost";
import PortasDoPerfil from "@/components/PortasDoPerfil";
import Compositor from "@/components/comunidade/Compositor";
import { SETTINGS_EVENT, readSettings } from "@/lib/settings";
import FolhaDeEditarPerfil from "@/components/perfil/FolhaDeEditarPerfil";
import { SEGUIDORES_EVENT, meusSeguidores, pedidosPendentes } from "@/lib/seguidores";
import { type Book, livroPorId } from "@/lib/books";

/**
 * Perfil (`/profile`) — **a sua página**, a mesma que os outros veem.
 *
 * Reescrita em 28/07 (ROTEIRO 4.41). A tela anterior era vitrine e menu ao
 * mesmo tempo: "Minhas notas" e "Configurações" dividiam espaço com o que era
 * para os outros lerem, e dois mosaicos (Recomendo e dezesseis medalhas)
 * quebravam o ritmo de uma página de listas. A regra que ficou é **separar por
 * dono**: aqui mora só o que faz sentido um visitante ver — o que você ouve, o
 * que recomenda e por quê, o que você disse, seus selos, seus clubes. Todo o
 * resto foi para o painel `/you`, atrás da engrenagem.
 *
 * O "Ver como visitante" existe porque a página é uma promessa ("é isto que os
 * outros veem") e promessa se confere: ele esconde tudo que é só seu — lápis,
 * engrenagem, botões de edição.
 *
 * Enquanto não há servidor, ninguém abre esta página de fato — ela é construída
 * agora e **ligada** quando houver contas, como foi com a sala e o clube.
 */

/** "maio de 2026" — o mês do primeiro dia com audição no diário. */
function ouvindoDesde(resumo: ResumoDeAudicao): string | null {
  const dias = Object.keys(resumo.diario).sort();
  if (dias.length === 0) return null;
  const primeira = new Date(`${dias[0]}T12:00:00`);
  const texto = primeira.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0) + texto.slice(1);
}

export default function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(readProfile);
  const [recommendations, setRecommendations] = useState<{ book: Book; note: string }[]>(readRecommendations);
  const [resumo, setResumo] = useState<ResumoDeAudicao | null>(null);
  const [tocando, setTocando] = useState<Playback | null>(null);
  /** Quantos comentários você já deixou — o número da porta "O que eu disse". */
  const [totalComentarios, setTotalComentarios] = useState(0);
  /** Os seus posts, em cartão — a peça que faltava no perfil (§4.56). */
  const [postsNoPerfil, setMeusPostsNoPerfil] = useState<Post[]>([]);
  const [clubes, setClubes] = useState<Clube[]>([]);
  /** Prévia honesta: esconde tudo que só o dono vê. */
  const [visitante, setVisitante] = useState(false);
  /**
   * A folha do lápis (§4.95) — **e ela tem endereço** (`/profile?editar`).
   *
   * Nasceu como estado solto (`useState(false)`), e o Matheus achou o defeito
   * usando (04/08): *"quando eu clico em minhas recomendações e coloco em
   * voltar, ele volta para a aba do meu perfil e não para onde estava o
   * lapisinho"*. Ele tem razão: o voltar do app é o histórico do navegador
   * (`PageHeader`), e um estado solto não existe no histórico — a página
   * renascia com a folha morta.
   *
   * Abrir a folha agora **empurra uma entrada** no histórico; quem navega para
   * as recomendações e volta cai em `/profile?editar`, e a folha reabre. É a
   * mesma razão pela qual o voltar deixou de ter destino fixo: o que o botão
   * promete é "de volta para onde eu estava", e onde ele estava era a folha.
   */
  const [editando, setEditando] = useState(
    () => new URLSearchParams(window.location.search).has("editar"),
  );

  function abrirFolha() {
    window.history.pushState({ folha: true }, "", "/profile?editar");
    setEditando(true);
  }

  function fecharFolha() {
    /* Fechar desfaz o empurrão — senão o botão voltar do navegador reabriria a
       folha que a pessoa acabou de fechar. Quem chegou pela URL direta não tem
       entrada para desfazer: aí só se troca o endereço, sem sair da página. */
    if (window.history.state?.folha) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", "/profile");
      setEditando(false);
    }
  }
  /** Os interruptores de privacidade do painel — a vitrine obedece. */
  const [privacidade, setPrivacidade] = useState(() => readSettings());
  const [totalSeguidores, setTotalSeguidores] = useState(0);
  const [pedidos, setPedidos] = useState(0);

  useEffect(() => {
    // Relê ao voltar das telas de edição.
    setProfile(readProfile());
    setRecommendations(readRecommendations());
    setResumo(lerResumo());
    setTocando(readPlaybackList()[0] ?? null);
    // Relê os interruptores ao voltar do painel — é lá que eles moram.
    setPrivacidade(readSettings());
    recarregarPosts();
    setClubes(meusClubes());

    /* Publicou, compartilhou ou apagou com a página aberta? A seção relê. Dois
       avisos, dois armazenamentos: o mural antigo e os posts da Comunidade nova. */
    window.addEventListener(MURAL_EVENT, recarregarPosts);
    window.addEventListener(POSTS_EVENT, recarregarPosts);
    /* A folha do lápis fica **por cima** desta página (§4.95): o interruptor que
       você toca ali tem de apagar a porta aqui atrás na hora, e não só ao
       fechar. */
    const relerAjustes = () => setPrivacidade(readSettings());
    window.addEventListener(SETTINGS_EVENT, relerAjustes);
    /* O voltar do navegador manda na folha: `?editar` no endereço = aberta.
       É o que faz fechar com o gesto de voltar do celular funcionar. */
    const sincronizarFolha = () =>
      setEditando(new URLSearchParams(window.location.search).has("editar"));
    window.addEventListener("popstate", sincronizarFolha);
    return () => {
      window.removeEventListener(MURAL_EVENT, recarregarPosts);
      window.removeEventListener(POSTS_EVENT, recarregarPosts);
      window.removeEventListener(SETTINGS_EVENT, relerAjustes);
      window.removeEventListener("popstate", sincronizarFolha);
    };
  }, []);

  /* Seguidores e pedidos: leem na montagem e a cada mudança, porque aceitar ou
     remover acontece em outra tela e o número aqui não pode ficar velho. */
  useEffect(() => {
    const atualizar = () => {
      setTotalSeguidores(meusSeguidores().length);
      setPedidos(pedidosPendentes(readSettings().contaPrivada).length);
    };
    atualizar();
    window.addEventListener(SEGUIDORES_EVENT, atualizar);
    return () => window.removeEventListener(SEGUIDORES_EVENT, atualizar);
  }, []);

  function recarregarPosts() {
    setMeusPostsNoPerfil(postsDe());
    setTotalComentarios(readMyComments().length);
  }

  const selos = resumo
    ? melhoresConquistas(
        achievementsFor(lerDadosDeConquista(resumo)).filter((item) => item.unlocked),
      )
    : [];

  // A faixa da prévia sobe para o lugar do TopNav quando ele se recolhe (§4.106).
  const recolhido = useCabecalhoRecolhido();

  // O interruptor desliga a vitrine inteira do "ouvindo": o bloco E o fundo
  // do topo — a capa desfocada também entrega o que está tocando.
  const livroTocando =
    privacidade.mostrarOuvindoAgora && tocando
      ? livroPorId(tocando.bookId)
      : undefined;
  const desde = resumo ? ouvindoDesde(resumo) : null;

  /**
   * Compartilha o **link da sua página** (§4.97), com as recomendações no
   * texto. Até 04/08 ia só o endereço genérico do app, com a justificativa
   * "sem servidor um link do perfil mentiria" — o argumento que o Matheus já
   * derrubou duas vezes, e que livro, clube e trecho nunca seguiram: todos
   * compartilham link. O endereço é `/user/<meuSlug()>`, que a rota reconhece
   * como você. Foi a resposta dele ao `@` (§4.95): *"a pessoa pode compartilhar
   * um link do perfil dela? Isso já resolveria essa questão"*.
   */
  async function compartilhar() {
    const indicacoes = recommendations
      .slice(0, 3)
      .map(({ book }) => `${book.title} (${book.author})`)
      .join(", ");
    const texto = indicacoes
      ? `No AllBook eu recomendo: ${indicacoes}.`
      : "Estou ouvindo audiolivros em português no AllBook.";
    const url = `${window.location.origin}/user/${meuSlug()}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AllBook", text: texto, url });
        return;
      } catch {
        // Fechar a folha de compartilhamento não é erro.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      toast({ title: "Copiado", description: "Cole onde quiser para mostrar suas indicações." });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "Seu navegador bloqueou a área de transferência.",
      });
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="profile-page">
      {/* A faixa da prévia: sem ela, o modo visitante seria uma tela igual com
          coisas faltando — pareceria defeito, não recurso. */}
      {visitante && (
        <div
          className={`sticky z-40 flex items-center justify-between gap-3 bg-primary/15 border-b border-primary/25 px-5 py-2.5 backdrop-blur-md transition-[top] duration-300 ${
            recolhido ? "top-0" : "top-14"
          }`}
          data-testid="visitor-banner"
        >
          <p className="text-xs text-white/80">
            <Eye className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
            É assim que outra pessoa vê a sua página.
          </p>
          <button
            onClick={() => setVisitante(false)}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
            data-testid="button-exit-visitor"
          >
            <X className="h-3.5 w-3.5" />
            Sair da prévia
          </button>
        </div>
      )}

      {/* O topo com presença: a arte do que você está ouvindo vira o fundo.
          Sem nada tocando, fica o brilho sóbrio da marca. */}
      <header className="relative overflow-hidden" data-testid="profile-header">
        <div className="absolute inset-0">
          {livroTocando ? (
            <>
              <img
                src={livroTocando.cover}
                alt=""
                aria-hidden
                className="h-full w-full scale-125 object-cover opacity-45 blur-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-primary/25 via-primary/[0.06] to-transparent" />
          )}
        </div>

        {!visitante && (
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1">
            {/*
              **O lápis abre a folha, e não a tela de nome e bio** (§4.95).
              Ele editava um terço do que prometia; agora abre o índice do que é
              o seu perfil — quem você é, o que aparece e o que dá para escrever.
              A folha sobe por cima da página, que continua atrás: editar o
              perfil é olhar para ele.
            */}
            <button
              onClick={abrirFolha}
              aria-label="Editar perfil"
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              data-testid="button-edit-profile"
            >
              <Pencil className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>
            <Link
              href="/you"
              aria-label="Seu painel"
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              data-testid="button-you"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </Link>
          </div>
        )}

        <div className="relative px-5 pb-6 pt-10">
          <div className="flex items-end gap-4">
            <AvatarAmpliavel
              nome={profile.name}
              foto={profile.photo || undefined}
              inicial={initialOf(profile.name)}
              legenda={desde ? `Ouvindo desde ${desde}` : "você"}
              fundoClasse="bg-card"
              className="shrink-0 rounded-full border-2 border-white/80"
            >
              <Avatar className="h-16 w-16">
                {profile.photo && (
                  <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-card font-display text-xl font-semibold text-white">
                  {initialOf(profile.name)}
                </AvatarFallback>
              </Avatar>
            </AvatarAmpliavel>

            <div className="min-w-0 flex-1 pb-0.5">
              <h1
                className="truncate font-display text-xl font-bold tracking-tight"
                data-testid="text-profile-name"
              >
                {profile.name}
              </h1>
              {desde && <p className="mt-0.5 text-[11px] text-white/45">Ouvindo desde {desde}</p>}
              {selos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" data-testid="profile-selos">
                  {selos.map((item: Achievement) => (
                    <SeloDeMedalha key={item.id} icon={item.icon} label={item.label} tier={item.tier} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm leading-relaxed text-white/60" data-testid="text-profile-bio">
              {profile.bio}
            </p>
          )}

          {!visitante && (
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setVisitante(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                data-testid="button-view-as-visitor"
              >
                <Eye className="h-4 w-4" />
                Ver como visitante
              </button>
              <button
                onClick={compartilhar}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                data-testid="button-share-profile"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Os números descrevem você, não são o assunto: uma linha, sem caixas.
          O detalhe continua em Estatísticas, pelo painel. */}
      {resumo && (
        <section
          className="flex gap-8 border-b border-white/10 px-5 pb-5"
          data-testid="profile-numbers"
        >
          <div>
            <p className="font-display text-base font-bold leading-none">
              {formatarDuracao(resumo.segundos)}
            </p>
            <p className="mt-1 text-[10px] text-white/40">ouvidas</p>
          </div>
          <div>
            <p className="font-display text-base font-bold leading-none">{resumo.titulosComecados}</p>
            <p className="mt-1 text-[10px] text-white/40">títulos</p>
          </div>
          {/* **"Recomendações" saiu daqui** em 30/07: a porta logo abaixo mostra o
              mesmo número, e o mesmo dado duas vezes na mesma tela é a
              redundância que a régua da casa proíbe. Ficaram os dois que só
              existem aqui — o quanto você ouviu e quantos títulos — mais
              seguidores, que é o único número desta linha que leva a algum
              lugar. */}

          {/*
            **Seguidores moram aqui** (ROTEIRO 4.55). Estavam atrás do painel, na
            seção de privacidade, e o Matheus apontou: *"você deveria ver,
            clicando no seu perfil, quem são as pessoas que te seguem — não faz
            sentido nenhum"*. Está certo: seguidor é assunto de perfil, como em
            qualquer app onde isso existe. Entra na mesma linha dos números,
            porque é um número — e é o único deles que leva a algum lugar.
          */}
          {!visitante && (
            <Link href="/seguidores" className="group" data-testid="profile-seguidores">
              <p className="font-display text-base font-bold leading-none transition-colors group-hover:text-primary">
                {totalSeguidores}
              </p>
              <p className="mt-1 text-[10px] text-white/40">
                {totalSeguidores === 1 ? "seguidor" : "seguidores"}
                {pedidos > 0 && <span className="ml-1 font-semibold text-primary">+{pedidos}</span>}
              </p>
            </Link>
          )}
        </section>
      )}

      {/*
        **As três portas** (§4.56, construídas em 30/07). Recomendações,
        comentários e clubes saíam da rolagem para virar ícones no topo, cada um
        abrindo a sua página — e as páginas nasceram junto, para nenhum ícone
        existir sem destino (§4.23).

        **Clubes aponta para `/clubes`**, e não para uma página nova: os seus
        clubes já têm casa, onde além de vê-los dá para criar e descobrir. Duas
        respostas para a mesma pergunta é o defeito que a §4.57 varreu do menu da
        Comunidade.
      */}
      {/*
        ⚠️ **Os interruptores passaram a valer aqui** (§4.95). Até 01/08,
        `mostrarMeusComentarios` e `mostrarMeusClubes` eram gravados e **nenhum
        código os lia** — dois botões que mentiam havia três dias. Achei
        conferindo, ao mover os interruptores para a folha do lápis: mudar de
        lugar um botão morto é dar-lhe destaque sem lhe dar função.

        **Escondida some para quem visita e fica apagada para você**, com o olho
        cortado. Sumir para você também tiraria o seu caminho para os seus
        próprios comentários — e você não saberia que a escondeu.
      */}
      <PortasDoPerfil
        portas={[
          {
            rotulo: recommendations.length === 1 ? "recomendação" : "recomendações",
            total: recommendations.length,
            href: "/recomendacoes",
            testid: "porta-recomendacoes",
          },
          {
            rotulo: totalComentarios === 1 ? "comentário" : "comentários",
            total: totalComentarios,
            href: "/comentarios",
            testid: "porta-comentarios",
            escondida: !privacidade.mostrarMeusComentarios,
          },
          {
            rotulo: clubes.length === 1 ? "clube" : "clubes",
            total: clubes.length,
            href: "/clubes",
            testid: "porta-clubes",
            escondida: !privacidade.mostrarMeusClubes,
          },
          /* A quarta porta, de 31/07 (§4.84): autores, narradores, editoras e o
             Studio que você segue. Fica ao lado das outras porque é a mesma
             pergunta — "o que é meu neste app?" —, e é por ela que se chega
             rápido a quem você acompanha, que era metade do pedido. */
          {
            rotulo: "seguindo",
            total: quantosAcompanho(),
            href: "/acompanhando",
            testid: "porta-acompanhando",
            escondida: !privacidade.mostrarQuemAcompanho,
          },
        ].filter((porta) => !(visitante && porta.escondida))}
      />

      {livroTocando && tocando && (
        <section className="border-b border-white/10 px-5 py-5" data-testid="profile-now-playing">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Ouvindo agora
          </h2>
          <Link href={`/book/${livroTocando.id}`} className="flex items-center gap-3 group">
            <img
              src={livroTocando.cover}
              alt={livroTocando.title}
              className="h-[59px] w-11 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                {livroTocando.title}
              </p>
              <p className="mt-0.5 text-[11px] text-white/40">
                {livroTocando.author} · capítulo {tocando.chapter}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${playbackPercent(tocando)}%` }}
                />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/*
        **Os posts vêm antes de tudo** — item 6 da ordem da §4.58, decidido na
        §4.56 com estas palavras do Matheus: *"os posts que a pessoa escreveu têm
        que estar aqui no perfil, e não estão hoje. Isso é um erro gravíssimo."*
        Ele tem razão pelo que o perfil é: quem abre a página de alguém quer ler o
        que a pessoa escreveu. Recomendação, clube e comentário descrevem; o post
        **é** a pessoa falando.

        **E dá para publicar daqui**, sem passar pela Comunidade — o outro pedido
        da §4.56. O post nasce no perfil e vai para o feed geral do mesmo jeito:
        o que se escreve é público (regra assimétrica da §4.53), e ter dois
        lugares de escrever com resultados diferentes seria a armadilha.
      */}
      <section className="border-b border-white/10 px-5 py-5" data-testid="section-profile-posts">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {visitante ? "Posts" : "Meus posts"}
        </h2>

        {!visitante && <Compositor />}

        {postsNoPerfil.length > 0 ? (
          <div className={`space-y-3 ${visitante ? "" : "mt-3"}`}>
            {postsNoPerfil.slice(0, 5).map((post) => (
              <CartaoDePost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* Sem post nenhum a seção **não some**: sumir esconderia justamente o
             lugar de começar. Some só na prévia de visitante, onde uma caixa de
             escrever não faz sentido. */
          !visitante && (
            <p className="mt-3 text-[12px] leading-relaxed text-white/35">
              O que você escrever aqui aparece na sua página e no feed da Comunidade.
            </p>
          )
        )}
      </section>

      {editando && <FolhaDeEditarPerfil onFechar={fecharFolha} />}
    </div>
  );
}
