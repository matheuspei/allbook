import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { community, recommendationsOf } from "@/lib/community";

/**
 * Comunidade (`/community`) — a porta de entrada para os perfis dos outros
 * leitores. Por ora são pessoas fictícias, o que está dito na própria tela
 * para ninguém confundir com gente de verdade.
 */
export default function Community() {
  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="community-page">
      <PageHeader title="Comunidade" fallback="/profile" />

      <p className="px-5 pt-4 pb-2 text-xs text-white/40 leading-relaxed">
        Leitores e o que cada um recomenda. Toque para ver o perfil.
      </p>

      <main className="px-5" data-testid="community-list">
        {community.map((member) => {
          const books = recommendationsOf(member);

          return (
            <Link
              key={member.slug}
              href={`/user/${member.slug}`}
              className="flex items-center gap-3 py-4 border-b border-white/5 group"
              data-testid={`community-member-${member.slug}`}
            >
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center font-display font-bold shrink-0`}
              >
                {member.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {member.name}
                </h2>
                <p className="text-xs text-white/40 line-clamp-1 mt-0.5">{member.bio}</p>
                <p className="text-[11px] text-white/25 mt-1">
                  {books.length} {books.length === 1 ? "recomendação" : "recomendações"} ·{" "}
                  {member.hoursListened}h ouvidas
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
            </Link>
          );
        })}
      </main>

      <p className="px-5 py-6 text-[11px] text-white/25 leading-relaxed">
        Estes leitores são fictícios, criados para dar o que ver enquanto o AllBook
        não tem contas nem servidor.
      </p>
    </div>
  );
}
