import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Check, Headphones, Library as LibraryIcon, Plus, Star } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { commentsByAuthor, bookOf } from "@/lib/comments";
import { findMember, recommendationsOf } from "@/lib/community";
import { isFollowing, toggleFollow } from "@/lib/following";
import { getAchievementsByIds } from "@/lib/achievements";

/**
 * Perfil público de outro leitor (`/user/:slug`).
 *
 * É de propósito mais enxuto que o perfil próprio: mostra quem a pessoa é e o
 * que ela recomenda — não a lista privada dela, nem os downloads, nem os
 * ajustes de conta. A separação entre "Minha lista" e "Recomendo" só faz
 * sentido se o que é privado continuar privado aqui.
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

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="user-profile-page">
      <PageHeader title={member.name} fallback="/community" />

      <header className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center font-display font-bold text-xl shrink-0`}
          >
            {member.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-display tracking-tight" data-testid="text-user-name">
              {member.name}
            </h1>
            <p className="text-[11px] text-white/30 mt-1">Na AllBook desde {member.memberSince}</p>
          </div>
        </div>

        <p className="text-sm text-white/60 leading-relaxed mt-4" data-testid="text-user-bio">
          {member.bio}
        </p>

        <div className="flex items-center gap-5 mt-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            {member.hoursListened}h ouvidas
          </span>
          <span className="flex items-center gap-1.5">
            <LibraryIcon className="w-3.5 h-3.5" />
            {books.length} {books.length === 1 ? "recomendação" : "recomendações"}
          </span>
        </div>

        {member.achievementIds.length > 0 && (
          <div className="flex items-center gap-1.5 mt-4 flex-wrap" data-testid="user-trophies">
            {getAchievementsByIds(member.achievementIds).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  title={item.label}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-md shadow-primary/40 ring-1 ring-primary/40"
                >
                  <Icon className="w-4 h-4 text-white drop-shadow" strokeWidth={2} />
                </div>
              );
            })}
          </div>
        )}

        {/*
          O botão que faltava. Seguir nasce aqui — depois de você ler o que a
          pessoa escreveu e ver o que ela indica — e não numa lista de nomes.
        */}
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
      </header>

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
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                      <span className="flex items-center gap-0.5 text-[10px] text-white/40 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        {comment.rating}
                      </span>
                    </div>
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
