import { Link, useParams } from "wouter";
import { Headphones, Library as LibraryIcon } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { findMember, recommendationsOf } from "@/lib/community";

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
  const member = findMember(params.slug ?? "");

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
      </header>

      <section className="px-5 py-5 border-t border-white/10" data-testid="section-user-recommendations">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
          {member.name.split(" ")[0]} recomenda
        </h2>

        {books.length === 0 ? (
          <p className="text-sm text-white/40 py-6">Ainda não recomendou nada.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3" data-testid="user-recommendations-grid">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="group"
                data-testid={`user-recommendation-${book.id}`}
              >
                <div className="rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{book.author}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
