import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Plus } from "lucide-react";

import ClubesNaComunidade from "@/components/clube/ClubesNaComunidade";
import ConversasDeAgora from "@/components/ConversasDeAgora";
import MuralDaComunidade from "@/components/MuralDaComunidade";
import { useToast } from "@/hooks/use-toast";
import {
  ouvindoAgoraNaComunidade,
  suggestions,
  type AudicaoDeAgora,
  type Suggestion,
} from "@/lib/activity";
import { findMember } from "@/lib/community";
import { isFollowing, readFollowing, toggleFollow } from "@/lib/following";
import { readLibrary } from "@/lib/library";

/**
 * Comunidade (`/community`) — refeita em 28/07 (ROTEIRO 4.41).
 *
 * **O que mudou de peso:** a Comunidade deixou de ser um apêndice social e
 * virou a **fundação do clube** — sem um lugar onde se encontra gente, não há
 * a quem convidar, e o clube nasce vazio. Nas palavras do Matheus: "se você
 * não tiver uma comunidade com outras pessoas, não vai ter como criar o clube
 * de livros".
 *
 * A tela anterior era um feed de quem você segue — que no primeiro dia é
 * ninguém — com uma lista de sugestões por baixo. Esta abre com o que **já
 * existe** sem seguir ninguém, em ordem de utilidade:
 *
 * 1. **Ouvindo agora** — quem está dentro de qual livro, neste momento. É a
 *    única vitrine que só um app de audiolivro pode ter.
 * 2. **Conversas de agora** — os livros onde há conversa (da sala do livro,
 *    ROTEIRO 4.39 — o livro é o endereço, não a pessoa).
 * 3. **Combina com você** — gente com motivo medido ("está no mesmo livro",
 *    "recomenda 2 da sua lista"), com o Seguir ali mesmo.
 * 4. **Recomendado** — a recomendação com o porquê escrito, de quem você segue
 *    primeiro.
 * 5. **Clubes** — o compromisso, para quem quer mais que conversa.
 *
 * Os leitores continuam fictícios de propósito (esqueleto até haver servidor).
 */
export default function Community() {
  const { toast } = useToast();
  const [audicoes, setAudicoes] = useState<AudicaoDeAgora[]>([]);
  const [sugestoes, setSugestoes] = useState<Suggestion[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    recarregar();
  }, []);

  /** Relê tudo que depende de quem você segue — chamado após cada Seguir. */
  function recarregar() {
    setFollowing(readFollowing());
    setAudicoes(ouvindoAgoraNaComunidade());
    setSugestoes(suggestions(readLibrary().map((item) => item.id), 3));
  }

  function seguir(slug: string, primeiroNome: string) {
    const agora = toggleFollow(slug);
    recarregar();
    toast({
      title: agora ? `Seguindo ${primeiroNome}` : `Você deixou de seguir ${primeiroNome}`,
      description: agora
        ? "O que essa pessoa recomendar e comentar aparece aqui."
        : undefined,
    });
  }

  const seguindo = following
    .map((slug) => findMember(slug))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="community-page">
      {/* Aba do menu de baixo desde 28/07 (4.41): título de lugar, como a
          Biblioteca — não mais o cabeçalho com seta de tela interna. */}
      <header className="relative overflow-hidden px-5 pt-7 pb-5">
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
      </header>

      {/*
        O Mural primeiro: quem abre a aba cai na vida, não na vitrine (28/07).
        Ele absorveu o bloco "Recomendado pela sua roda" — recomendação virou
        um tipo do feed, e o mesmo conteúdo em dois blocos era redundância.
      */}
      <MuralDaComunidade />

      {/* 2 — Quem está dentro de qual livro, agora. */}
      {audicoes.length > 0 && (
        <section className="px-5 pt-5 pb-4 border-b border-white/10" data-testid="community-listening-now">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Ouvindo agora
          </h2>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {audicoes.map(({ member, book, chapter }) => (
              <Link
                key={member.slug}
                href={`/user/${member.slug}`}
                className="w-[84px] shrink-0 group"
                data-testid={`listening-${member.slug}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-28 w-[84px] rounded-lg object-cover"
                />
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.color} text-[8px] font-bold`}
                  >
                    {member.name.charAt(0)}
                  </span>
                  <span className="truncate text-[10px] text-white/60 transition-colors group-hover:text-white">
                    {member.name.split(" ")[0]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[9px] text-white/30">
                  cap. {chapter} · {book.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2 — Os livros onde há conversa (sala do livro, da janela A). */}
      <ConversasDeAgora />

      {/* 3 — Gente, sempre com o motivo medido na frente. */}
      {sugestoes.length > 0 && (
        <section className="px-5 pt-5 pb-2 border-b border-white/10" data-testid="community-suggestions">
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Combina com você
          </h2>

          <div>
            {sugestoes.map(({ member, reason }) => {
              const ja = isFollowing(member.slug);
              return (
                <div
                  key={member.slug}
                  className="flex items-center gap-3 border-b border-white/5 py-3 last:border-b-0"
                  data-testid={`suggestion-${member.slug}`}
                >
                  <Link
                    href={`/user/${member.slug}`}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-display font-bold`}
                  >
                    {member.name.charAt(0)}
                  </Link>

                  <Link href={`/user/${member.slug}`} className="min-w-0 flex-1 group">
                    <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-snug text-white/40">{reason}</p>
                  </Link>

                  <button
                    onClick={() => seguir(member.slug, member.name.split(" ")[0])}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      ja
                        ? "border border-white/15 text-white/60"
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

      {/*
        O bloco "Recomendado pela sua roda" morava aqui e foi ABSORVIDO pelo
        Mural no mesmo dia em que nasceu (28/07): recomendação virou um tipo do
        feed, e o mesmo conteúdo em dois blocos era redundância.
      */}

      {/* 4 — O compromisso: os clubes (da janela A). */}
      <ClubesNaComunidade />

      {/* Quem você segue, por último: é atalho de volta, não descoberta. */}
      {seguindo.length > 0 && (
        <section className="px-5 pt-5 pb-4" data-testid="following-row">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Seguindo
          </h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {seguindo.map((member) => (
              <Link
                key={member.slug}
                href={`/user/${member.slug}`}
                className="flex w-14 shrink-0 flex-col items-center gap-1.5"
                data-testid={`following-${member.slug}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-display font-bold`}
                >
                  {member.name.charAt(0)}
                </span>
                <span className="line-clamp-1 text-center text-[10px] leading-tight text-white/50">
                  {member.name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="px-5 pb-6 pt-2 text-[11px] leading-relaxed text-white/25">
        Estes leitores são um esqueleto: existem para dar o que ver enquanto o AllBook não tem
        contas nem servidor.
      </p>
    </div>
  );
}
