import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight, Plus } from "lucide-react";

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
import { community, findMember } from "@/lib/community";
import { isFollowing, readFollowing, toggleFollow } from "@/lib/following";
import { readLibrary } from "@/lib/library";
import { RODAS_EVENT, resumoDasRodas } from "@/lib/rodasDeConversa";

/**
 * Comunidade (`/community`) — reorganizada em três abas internas (28/07).
 *
 * A junção das quatro propostas empilhava nove blocos numa rolagem só, e o
 * Matheus apontou: *"muita coisa, muita coisa solta — organizar melhor"*. A
 * resposta é a divisão por assunto, nas pílulas que a Biblioteca já usa:
 *
 * - **Agora** — o vivo: quem está ouvindo (fita de capas) e o Mural.
 * - **Conversas** — o assunto: as conversas da semana (fusão do "top da
 *   semana" com as portas — apontavam para as mesmas salas), as Rodas
 *   (Orkut: roda → tópico → respostas) e os clubes.
 * - **Gente** — as pessoas: pódio da semana, combina com você, seguindo.
 *
 * Cada aba tem 2–3 blocos. Nenhuma função morreu na reorganização; a fileira
 * "Seguindo" encolheu para uma linha porque era a mais redundante (quem você
 * segue já aparece no mural e nas páginas).
 */

type Aba = "agora" | "conversas" | "gente";

const ABAS: { key: Aba; label: string }[] = [
  { key: "agora", label: "Agora" },
  { key: "conversas", label: "Conversas" },
  { key: "gente", label: "Gente" },
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
      {aba === "conversas" && <AbaConversas />}
      {aba === "gente" && <AbaGente />}
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

      <MuralDaComunidade />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Conversas — o assunto: salas da semana, Rodas, clubes
 * ------------------------------------------------------------------ */

function AbaConversas() {
  const [rodas, setRodas] = useState(() => resumoDasRodas());

  useEffect(() => {
    const atualizar = () => setRodas(resumoDasRodas());
    atualizar();
    window.addEventListener(RODAS_EVENT, atualizar);
    return () => window.removeEventListener(RODAS_EVENT, atualizar);
  }, []);

  return (
    <div data-testid="community-conversas">
      {/* A fusão: o "top da semana" e as portas eram as mesmas salas. */}
      <ConversasDeAgora />

      <section className="px-5 pt-5 pb-4 border-b border-white/10" data-testid="community-rodas">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Rodas de conversa
        </h2>

        <div className="space-y-2.5">
          {rodas.map(({ roda, totalTopicos, totalPessoas, participo }) => (
            <Link
              key={roda.id}
              href={`/roda/${roda.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
              data-testid={`roda-card-${roda.id}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10 text-xl">
                {roda.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {roda.nome}
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

function AbaGente() {
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

  // O pódio: os três que mais ouviram — celebração, não ranking de pressão.
  const podio = [...community].sort((a, b) => b.hoursListened - a.hoursListened).slice(0, 3);
  const medalhas = ["🥇", "🥈", "🥉"];

  const seguindo = following
    .map((slug) => findMember(slug))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  return (
    <div data-testid="community-gente">
      <section className="px-5 pt-1 pb-4 border-b border-white/10" data-testid="community-podium">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          O pódio da semana
        </h2>
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-amber-500/[0.02] px-4 py-3">
          {podio.map((member, indice) => (
            <Link
              key={member.slug}
              href={`/user/${member.slug}`}
              className="flex flex-1 items-center gap-2 group"
              data-testid={`podium-${member.slug}`}
            >
              <span className="text-base">{medalhas[indice]}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.color} text-xs font-bold`}
              >
                {member.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold leading-tight transition-colors group-hover:text-primary">
                  {member.name.split(" ")[0]}
                </span>
                <span className="block text-[9px] text-white/35">{member.hoursListened}h</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

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
