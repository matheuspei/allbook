import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Eye, Pencil, Plus, Settings, Share2, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarAmpliavel from "@/components/AvatarAmpliavel";
import SeloDeMedalha from "@/components/SeloDeMedalha";
import { useToast } from "@/hooks/use-toast";
import { initialOf, readProfile, type Profile as UserProfile } from "@/lib/profile";
import { readRecommendations } from "@/lib/recommendations";
import { meusClubes, souDono, type Clube } from "@/lib/clubes";
import { formatarDuracao } from "@/lib/listening";
import { lerDadosDeConquista, lerResumo, type ResumoDeAudicao } from "@/lib/stats";
import {
  achievementsFor,
  melhoresConquistas,
  type Achievement,
} from "@/lib/achievements";
import { playbackPercent, readPlaybackList, type Playback } from "@/lib/playback";
import { readMyComments } from "@/lib/myComments";
import { MURAL_EVENT, readMeusPosts } from "@/lib/mural";
import { readSettings } from "@/lib/settings";
import { catalog, type Book } from "@/lib/books";

/** Uma fala sua — comentário num livro ou post do mural, no mesmo formato. */
interface FalaMinha {
  id: string;
  bookId: number;
  texto: string;
  date: string;
}

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
  const [falas, setFalas] = useState<FalaMinha[]>([]);
  const [clubes, setClubes] = useState<Clube[]>([]);
  /** Prévia honesta: esconde tudo que só o dono vê. */
  const [visitante, setVisitante] = useState(false);
  /** Os interruptores de privacidade do painel — a vitrine obedece. */
  const [privacidade, setPrivacidade] = useState(() => readSettings());

  useEffect(() => {
    // Relê ao voltar das telas de edição.
    setProfile(readProfile());
    setRecommendations(readRecommendations());
    setResumo(lerResumo());
    setTocando(readPlaybackList()[0] ?? null);
    // Relê os interruptores ao voltar do painel — é lá que eles moram.
    setPrivacidade(readSettings());
    // "O que eu disse" junta as suas duas vozes: comentários nos livros e
    // posts do mural (28/07) — para quem te visita, é tudo fala sua. Só o que
    // tem livro: comentário de pessoa/editora não tem capa para mostrar aqui.
    recarregarFalas();
    setClubes(meusClubes());

    // Publicou ou apagou um post no mural com a página aberta? A seção relê.
    window.addEventListener(MURAL_EVENT, recarregarFalas);
    return () => window.removeEventListener(MURAL_EVENT, recarregarFalas);
  }, []);

  function recarregarFalas() {
    const dosComentarios: FalaMinha[] = readMyComments()
      .filter((item) => item.bookId !== undefined)
      .map((item) => ({ id: item.id, bookId: item.bookId!, texto: item.text, date: item.date }));
    const dosPosts: FalaMinha[] = readMeusPosts().map((item) => ({
      id: item.id,
      bookId: item.bookId,
      texto: item.texto,
      date: item.date,
    }));
    setFalas(
      [...dosComentarios, ...dosPosts]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3),
    );
  }

  const selos = resumo
    ? melhoresConquistas(
        achievementsFor(lerDadosDeConquista(resumo)).filter((item) => item.unlocked),
      )
    : [];

  // O interruptor desliga a vitrine inteira do "ouvindo": o bloco E o fundo
  // do topo — a capa desfocada também entrega o que está tocando.
  const livroTocando =
    privacidade.mostrarOuvindoAgora && tocando
      ? catalog.find((b) => b.id === tocando.bookId)
      : undefined;
  const desde = resumo ? ouvindoDesde(resumo) : null;

  /**
   * Compartilha o que a página tem de verdade — as suas recomendações. Sem
   * servidor não existe um link do seu perfil que abra para outra pessoa, e
   * compartilhar um endereço que mente é pior que não ter botão.
   */
  async function compartilhar() {
    const indicacoes = recommendations
      .slice(0, 3)
      .map(({ book }) => `${book.title} (${book.author})`)
      .join(", ");
    const texto = indicacoes
      ? `No AllBook eu recomendo: ${indicacoes}.`
      : "Estou ouvindo audiolivros em português no AllBook.";
    const url = window.location.origin;

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
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="profile-page">
      {/* A faixa da prévia: sem ela, o modo visitante seria uma tela igual com
          coisas faltando — pareceria defeito, não recurso. */}
      {visitante && (
        <div
          className="sticky top-14 z-40 flex items-center justify-between gap-3 bg-primary/15 border-b border-primary/25 px-5 py-2.5 backdrop-blur-md"
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
              <div className="absolute inset-0 bg-gradient-to-b from-[#141414]/30 via-[#141414]/60 to-[#141414]" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-primary/25 via-primary/[0.06] to-transparent" />
          )}
        </div>

        {!visitante && (
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1">
            <Link
              href="/profile/edit"
              aria-label="Editar perfil"
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              data-testid="button-edit-profile"
            >
              <Pencil className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </Link>
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
              fundoClasse="bg-[#1e1e1e]"
              className="shrink-0 rounded-full border-2 border-white/80"
            >
              <Avatar className="h-16 w-16">
                {profile.photo && (
                  <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-[#1e1e1e] font-display text-xl font-semibold text-white">
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
          <div>
            <p className="font-display text-base font-bold leading-none">{recommendations.length}</p>
            <p className="mt-1 text-[10px] text-white/40">
              {recommendations.length === 1 ? "recomendação" : "recomendações"}
            </p>
          </div>
        </section>
      )}

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

      <section className="border-b border-white/10 px-5 py-5" data-testid="section-profile-recommendations">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Eu recomendo
          </h2>
          {!visitante && (
            <Link
              href="/profile/recommendations"
              className="shrink-0 text-xs font-medium text-primary"
              data-testid="link-edit-recommendations"
            >
              {recommendations.length > 0 ? "Editar" : "Montar lista"}
            </Link>
          )}
        </div>

        {recommendations.length === 0 ? (
          <Link
            href="/profile/recommendations"
            className="flex items-center gap-3 py-3 text-left"
            data-testid="empty-recommendations"
          >
            <div className="flex h-[59px] w-11 shrink-0 items-center justify-center rounded border border-dashed border-white/15">
              <Plus className="h-4 w-4 text-white/25" />
            </div>
            <p className="text-xs leading-relaxed text-white/40">
              Escolha os livros que você indicaria para alguém.
              <br />
              É o que um visitante vê primeiro na sua página.
            </p>
          </Link>
        ) : (
          <div className="space-y-4" data-testid="recommendations-row">
            {recommendations.map(({ book, note }) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="flex gap-3 group"
                data-testid={`recommendation-${book.id}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-[59px] w-11 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium leading-tight transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-white/40">{book.author}</p>
                  {note && (
                    <p className="mt-1 text-[11px] italic leading-snug text-white/55">“{note}”</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {falas.length > 0 && (
        <section className="border-b border-white/10 px-5 py-5" data-testid="section-profile-comments">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            O que eu disse
          </h2>
          <div className="space-y-4">
            {falas.map((item) => {
              const livro = catalog.find((b) => b.id === item.bookId);
              if (!livro) return null;
              return (
                <Link
                  key={item.id}
                  href={`/book/${livro.id}`}
                  className="flex gap-3 group"
                  data-testid={`profile-comment-${item.id}`}
                >
                  <img
                    src={livro.cover}
                    alt={livro.title}
                    className="h-[45px] w-[34px] shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/40 transition-colors group-hover:text-primary">
                      {livro.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/70">
                      “{item.texto}”
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {privacidade.mostrarMeusClubes && clubes.length > 0 && (
        <section className="border-b border-white/10 px-5 py-5" data-testid="section-profile-clubs">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Meus clubes
          </h2>
          <div className="space-y-3">
            {clubes.map((clube) => {
              const livroDoClube = catalog.find((b) => b.id === clube.ciclo.bookId);
              return (
                <Link
                  key={clube.id}
                  href={`/clube/${clube.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:bg-white/5"
                  data-testid={`profile-club-${clube.id}`}
                >
                  {livroDoClube && (
                    <img
                      src={livroDoClube.cover}
                      alt=""
                      className="h-[50px] w-[38px] shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{clube.nome}</p>
                    <p className="mt-0.5 text-[10px] text-white/40">
                      {souDono(clube) ? "Moderador · " : ""}
                      {clube.membros.length} {clube.membros.length === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
