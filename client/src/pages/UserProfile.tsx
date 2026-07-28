import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Check, Plus } from "lucide-react";

import AvatarAmpliavel from "@/components/AvatarAmpliavel";
import PageHeader from "@/components/PageHeader";
import SeloDeMedalha from "@/components/SeloDeMedalha";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { commentsByAuthor, bookOf } from "@/lib/comments";
import { findMember, recommendationsOf } from "@/lib/community";
import { isFollowing, toggleFollow } from "@/lib/following";
import { getAchievementsByIds, melhoresConquistas } from "@/lib/achievements";

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
  const comentarios = commentsByAuthor(member.slug);
  const primeiroNome = member.name.split(" ")[0];
  // Reputação, não coleção: os dois selos mais raros (a mesma regra da sua página).
  const selos = melhoresConquistas(getAchievementsByIds(member.achievementIds));
  // A capa mais recente que a pessoa indicou dá o fundo do topo — o retrato
  // dela é o que ela anda recomendando.
  const capaDoTopo = books[0]?.book.cover;

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
          <div>
            <p className="font-display text-base font-bold leading-none">{books.length}</p>
            <p className="mt-1 text-[10px] text-white/40">
              {books.length === 1 ? "recomendação" : "recomendações"}
            </p>
          </div>
        </div>
      </div>

      {/*
        O botão que faltava. Seguir nasce aqui — depois de você ler o que a
        pessoa escreveu e ver o que ela indica — e não numa lista de nomes.
      */}
      <div className="px-5">
        <button
          onClick={() => onToggleFollow(primeiroNome)}
          className={`mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
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
      </div>

      <section className="px-5 py-5 border-t border-white/10" data-testid="section-user-recommendations">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
          {primeiroNome} recomenda
        </h2>

        {books.length === 0 ? (
          <p className="text-sm text-white/40 py-6">Ainda não recomendou nada.</p>
        ) : (
          <div className="space-y-3" data-testid="user-recommendations-grid">
            {books.map(({ book, note }) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="flex gap-3 group"
                data-testid={`user-recommendation-${book.id}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-11 h-[59px] rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{book.author}</p>
                  {note && (
                    <p className="text-[11px] text-white/55 leading-snug mt-1 italic">
                      “{note}”
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/*
        O que a pessoa andou comentando. Só existe porque o comentário deixou de
        morar dentro do livro: agora ele tem dono, e dá para perguntar "o que
        fulano escreveu" em vez de só "o que disseram deste livro".
      */}
      <section className="px-5 py-5 border-t border-white/10" data-testid="section-user-comments">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
          Comentários de {primeiroNome}
        </h2>

        {comentarios.length === 0 ? (
          <p className="text-sm text-white/40 py-6">Ainda não comentou em nenhum livro.</p>
        ) : (
          <div className="space-y-4" data-testid="user-comments-list">
            {comentarios.map((comment) => {
              const book = bookOf(comment);
              if (!book) return null;

              return (
                <Link
                  key={comment.id}
                  href={`/book/${book.id}`}
                  className="flex gap-3 group"
                  data-testid={`user-comment-${comment.id}`}
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-11 h-[59px] rounded object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed mt-1 line-clamp-3">
                      {comment.text}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">{relativeDate(comment.date)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
