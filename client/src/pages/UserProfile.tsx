import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { BookHeart, Check, MessageSquareQuote, Plus, UserPlus, Users } from "lucide-react";

import AvatarAmpliavel from "@/components/AvatarAmpliavel";
import PageHeader from "@/components/PageHeader";
import SeloDeMedalha from "@/components/SeloDeMedalha";
import { ItemDoFeed } from "@/components/MuralDaComunidade";
import CartaoDePost from "@/components/comunidade/CartaoDePost";
import PortasDoPerfil from "@/components/PortasDoPerfil";
import { postsDe } from "@/lib/posts";
import { clubesDe, estreiaEmTexto, meusClubes, vagasRestantes, type Clube } from "@/lib/clubes";
import { convidar, podeConvidarPara, simularResposta } from "@/lib/convites";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { findMember, recommendationsOf } from "@/lib/community";
import { isFollowing, toggleFollow } from "@/lib/following";
import { getAchievementsByIds, melhoresConquistas } from "@/lib/achievements";
import { muralDe } from "@/lib/mural";

/**
 * Perfil público de outro leitor (`/user/:slug`).
 *
 * Na **mesma linguagem** da sua página (`Profile.tsx`, ROTEIRO 4.41): capa
 * desfocada no topo, selos das duas melhores medalhas em vez da fileira
 * inteira, números numa linha. Se a sua página e a de outra pessoa tivessem
 * caras diferentes, "uma página só" seria promessa quebrada — foi a régua da
 * 4.20 com as medalhas, e vale para a página inteira.
 *
 * Continua sem nada privado: a lista da pessoa, os downloads e os ajustes não
 * aparecem — aqui mora só o que ela produz.
 */
export default function UserProfile() {
  const params = useParams<{ slug: string }>();
  const { toast } = useToast();
  const member = findMember(params.slug ?? "");
  const [following, setFollowing] = useState(false);
  const [convidando, setConvidando] = useState(false);

  useEffect(() => {
    setFollowing(isFollowing(params.slug ?? ""));
  }, [params.slug]);

  function onToggleFollow(name: string) {
    const now = toggleFollow(params.slug ?? "");
    setFollowing(now);
    toast({
      title: now ? `Seguindo ${name}` : `Você deixou de seguir ${name}`,
      description: now
        ? "O que essa pessoa recomendar e comentar aparece em Comunidade."
        : undefined,
    });
  }

  if (!member) {
    return (
      <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="user-profile-missing">
        <PageHeader title="Leitor não encontrado" fallback="/community" />
        <div className="px-8 py-20 text-center space-y-4">
          <p className="text-sm text-white/50">Não existe ninguém com esse endereço.</p>
          <Link href="/community" className="inline-block text-sm font-bold text-primary">
            Ver a comunidade
          </Link>
        </div>
      </div>
    );
  }

  const books = recommendationsOf(member);
  const postsDela = postsDe(member.slug);
  const meus = meusClubes();
  const clubesDela = clubesDe(member.slug);
  // A atividade na língua do mural: avaliações e comentários, com a trava.
  // Recomendações ficam de fora — têm a vitrine própria nesta página.
  const atividade = muralDe(member.slug, ["avaliou", "comentou"]);
  const primeiroNome = member.name.split(" ")[0];
  // Reputação, não coleção: os dois selos mais raros (a mesma regra da sua página).
  const selos = melhoresConquistas(getAchievementsByIds(member.achievementIds));
  // O que a pessoa está ouvindo agora — o mesmo bloco vivo da sua página.
  const ouvindo = member.ouvindoAgora
    ? catalog.find((book) => book.id === member.ouvindoAgora?.bookId)
    : undefined;
  // A capa do que ela está ouvindo dá o fundo do topo; sem nada tocando, a
  // recomendação mais recente — o retrato dela é o que ela anda fazendo.
  const capaDoTopo = ouvindo?.cover ?? books[0]?.book.cover;

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="user-profile-page">
      <PageHeader title={member.name} fallback="/community" />

      <header className="relative overflow-hidden" data-testid="user-header">
        <div className="absolute inset-0">
          {capaDoTopo ? (
            <>
              <img
                src={capaDoTopo}
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

        <div className="relative px-5 pt-8 pb-6">
          <div className="flex items-end gap-4">
            <AvatarAmpliavel
              nome={member.name}
              inicial={member.name.charAt(0)}
              fundoClasse={`bg-gradient-to-br ${member.color}`}
              legenda={`Na AllBook desde ${member.memberSince}`}
              className="shrink-0 rounded-full border-2 border-white/80"
            >
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center font-display font-bold text-xl shrink-0`}
              >
                {member.name.charAt(0)}
              </div>
            </AvatarAmpliavel>

            <div className="flex-1 min-w-0 pb-0.5">
              <h1 className="text-xl font-bold font-display tracking-tight" data-testid="text-user-name">
                {member.name}
              </h1>
              <p className="text-[11px] text-white/45 mt-0.5">Na AllBook desde {member.memberSince}</p>
              {selos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" data-testid="user-selos">
                  {selos.map((item) => (
                    <SeloDeMedalha key={item.id} icon={item.icon} label={item.label} tier={item.tier} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-white/60 leading-relaxed mt-4" data-testid="text-user-bio">
            {member.bio}
          </p>
        </div>
      </header>

      <div className="px-5 pb-1">
        {/* A mesma linha discreta de números da sua página. */}
        <div className="flex gap-8 pb-5 border-b border-white/10" data-testid="user-numbers">
          <div>
            <p className="font-display text-base font-bold leading-none">{member.hoursListened}h</p>
            <p className="mt-1 text-[10px] text-white/40">ouvidas</p>
          </div>
          {/* "Recomendações" saiu daqui pelo mesmo motivo da sua página: a porta
              logo abaixo mostra o mesmo número. */}
        </div>
      </div>

      {/*
        O botão que faltava. Seguir nasce aqui — depois de você ler o que a
        pessoa escreveu e ver o que ela indica — e não numa lista de nomes.
      */}
      <div className="px-5 mt-5 flex gap-2.5">
        <button
          onClick={() => onToggleFollow(primeiroNome)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            following
              ? "border border-white/15 text-white/70 hover:bg-white/5"
              : "bg-primary text-black hover:bg-primary/90"
          }`}
          data-testid="button-follow"
        >
          {following ? (
            <>
              <Check className="w-4 h-4" />
              Seguindo
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Seguir
            </>
          )}
        </button>

        {/*
          **Convidar para um clube, pela página da pessoa** — item 5 da ordem da
          §4.58, aprovado pelos dois em 29/07. É aqui que o convite faz sentido:
          você acabou de ler o que ela escreveu e ver o que ela ouve, e é disso
          que sai a vontade de chamá-la para uma turma.

          **Só aparece se você estiver em algum clube** — sem clube não há para
          onde convidar, e o botão seria a porta para uma sala vazia (§4.23). É a
          mesma regra do botão de clube no compositor (§4.60).
        */}
        {meus.length > 0 && (
          <button
            onClick={() => setConvidando(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5"
            data-testid="button-convidar"
          >
            <UserPlus className="h-4 w-4" />
            Convidar
          </button>
        )}
      </div>

      {/* As mesmas três portas da sua página (§4.56) — componente único, para as
          duas não divergirem com o tempo (a régua da §4.41). */}
      <PortasDoPerfil
        portas={[
          {
            icone: BookHeart,
            rotulo: books.length === 1 ? "recomendação" : "recomendações",
            total: books.length,
            href: `/user/${member.slug}/recomendacoes`,
            testid: "porta-recomendacoes",
          },
          {
            icone: MessageSquareQuote,
            rotulo: atividade.length === 1 ? "comentário" : "comentários",
            total: atividade.length,
            href: `/user/${member.slug}/comentarios`,
            testid: "porta-comentarios",
          },
          {
            icone: Users,
            rotulo: clubesDela.length === 1 ? "clube" : "clubes",
            total: clubesDela.length,
            href: `/user/${member.slug}/clubes`,
            testid: "porta-clubes",
          },
        ]}
      />

      {convidando && (
        <FolhaDeConvite
          slug={member.slug}
          nome={primeiroNome}
          clubes={meus}
          onFechar={() => setConvidando(false)}
        />
      )}

      {/* O mesmo bloco vivo da sua página — o dado já existia (`ouvindoAgora`)
          e o perfil não o mostrava (28/07). */}
      {ouvindo && member.ouvindoAgora && (
        <section className="px-5 py-5 border-t border-white/10" data-testid="section-user-now-playing">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Ouvindo agora
          </h2>
          <Link href={`/book/${ouvindo.id}`} className="flex items-center gap-3 group">
            <img
              src={ouvindo.cover}
              alt={ouvindo.title}
              className="h-[59px] w-11 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                {ouvindo.title}
              </p>
              <p className="mt-0.5 text-[11px] text-white/40">
                {ouvindo.author} · capítulo {member.ouvindoAgora.chapter}
              </p>
            </div>
          </Link>
        </section>
      )}

      {/*
        **Os posts dela vêm antes das recomendações** — a mesma decisão da §4.56
        aplicada à página dos outros, e pela mesma razão: quem abre o perfil de
        alguém quer ler o que a pessoa escreveu. Recomendação descreve o gosto
        dela; o post é ela falando.

        Some quando não há post nenhum: aqui não há caixa de escrever para
        oferecer no lugar (a página é de outra pessoa), e um título com um vazio
        embaixo é o que a §4.23 manda varrer.
      */}
      {postsDela.length > 0 && (
        <section className="px-5 py-5 border-t border-white/10" data-testid="section-user-posts">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Posts de {primeiroNome}
          </h2>
          <div className="space-y-3">
            {postsDela.slice(0, 5).map((post) => (
              <CartaoDePost key={post.id} post={post} semSeguir />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

/**
 * A folha de convite: **os seus clubes, e o porquê de cada não**.
 *
 * As três regras da §4.58 (já está na turma · clube lotado · o ciclo começou)
 * poderiam simplesmente esconder o clube da lista. **Não escondem, e isso é
 * decisão:** quem procura o clube que tem em mente e não o encontra acha que o
 * app perdeu alguma coisa. Mostrar cinza, com o motivo escrito ao lado, responde
 * a pergunta antes de ela ser feita — é a régua da §4.23 aplicada a um "não".
 */
function FolhaDeConvite({
  slug,
  nome,
  clubes,
  onFechar,
}: {
  slug: string;
  nome: string;
  clubes: Clube[];
  onFechar: () => void;
}) {
  const { toast } = useToast();
  const [enviados, setEnviados] = useState<string[]>([]);

  function enviar(clube: Clube) {
    if (!convidar(clube.id, slug)) return;
    setEnviados((atual) => [...atual, clube.id]);
    /* A resposta vem em 3 s (ver `convites.ts`): sem ela, convidar cairia no
       vazio e ninguém veria como o ciclo se fecha. */
    simularResposta(clube.id, slug);
    toast({
      title: `Convite enviado a ${nome}`,
      description: `Se aceitar, entra em "${clube.nome}" e você é avisado no sino.`,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="folha-de-convite"
    >
      <div
        className="max-h-[75vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />
        <h2 className="font-display text-lg font-bold">Convidar {nome}</h2>
        <p className="mt-0.5 text-xs text-white/40">
          Qualquer membro pode convidar — quem remove é o moderador.
        </p>

        <div className="mt-4 space-y-2">
          {clubes.map((clube) => {
            const jaEnviei = enviados.includes(clube.id);
            const { pode, motivo } = podeConvidarPara(clube.id, slug);
            const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
            const vagas = vagasRestantes(clube);

            return (
              <div
                key={clube.id}
                className={`flex items-center gap-3 rounded-xl border border-white/[0.07] p-3 ${
                  pode || jaEnviei ? "bg-white/[0.03]" : "bg-transparent opacity-45"
                }`}
                data-testid={`convite-clube-${clube.id}`}
              >
                {livro && (
                  <img
                    src={livro.cover}
                    alt=""
                    className="h-[52px] w-[38px] shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{clube.nome}</p>
                  <p className="mt-0.5 truncate text-[11px] text-white/40">
                    {estreiaEmTexto(clube)}
                    {vagas !== undefined && ` · ${vagas} ${vagas === 1 ? "vaga" : "vagas"}`}
                  </p>
                </div>

                {jaEnviei ? (
                  <span className="flex shrink-0 items-center gap-1 text-[11.5px] font-bold text-primary">
                    <Check className="h-3.5 w-3.5" />
                    enviado
                  </span>
                ) : pode ? (
                  <button
                    onClick={() => enviar(clube)}
                    className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-black"
                    data-testid={`enviar-convite-${clube.id}`}
                  >
                    Convidar
                  </button>
                ) : (
                  <span className="shrink-0 text-[11px] text-white/35">{motivo}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
