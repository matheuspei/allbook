import { Link } from "wouter";
import { avatarDeLeitor } from "@/lib/community";
import { Check, Plus } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { isFollowing, toggleFollow } from "@/lib/following";
import { type Suggestion } from "@/lib/activity";

/**
 * "Combina com você" — **um cartão dentro do Seguindo**, não um bloco fixo.
 *
 * ---
 *
 * **A mudança de lugar é a decisão 7 da §4.58**, e o receio que a motivou é do
 * Matheus e é o mesmo meu: como bloco fixo no alto de uma aba de gente, isto
 * vira **parede de perfis** — que é exatamente o que falhou onze vezes (§4.53).
 * Como cartão ocasional, ele aparece depois de você já ter lido o que as pessoas
 * fizeram: sugestão em resposta a um contexto, não vitrine na entrada.
 *
 * **Cada sugestão carrega o motivo medido** (*"está ouvindo o mesmo livro, 2
 * capítulos à sua frente"*), porque o defeito da primeira Comunidade era ser um
 * índice alfabético — não havia razão para clicar num nome e não noutro. O
 * motivo vem de `activity.ts`, que o calcula do seu progresso e da sua lista.
 *
 * **As capas embaixo de cada pessoa não são enfeite:** num app de audiolivro,
 * quem alguém é se responde pelo que essa pessoa ouve. É a mesma razão pela qual
 * o cartão de autor se preenche com as capas dele (§4.63).
 */
export default function CartaoDeSugestoes({ sugestoes }: { sugestoes: Suggestion[] }) {
  const { toast } = useToast();
  /* Estado local para o botão responder na hora: a lista inteira do feed não
     precisa ser remontada só porque você seguiu alguém daqui. */
  const [seguidos, setSeguidos] = useState<string[]>([]);

  function seguir(slug: string, primeiroNome: string) {
    const agora = toggleFollow(slug);
    setSeguidos((atual) =>
      agora ? [...atual, slug] : atual.filter((item) => item !== slug),
    );
    toast({
      title: agora ? `Seguindo ${primeiroNome}` : `Você deixou de seguir ${primeiroNome}`,
      description: agora ? "O que essa pessoa fizer passa a aparecer aqui." : undefined,
    });
  }

  return (
    <section
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 pt-3"
      data-testid="cartao-sugestoes"
    >
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
        Combina com você
      </p>

      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
        {sugestoes.map(({ member, reason, books }) => {
          const ja = seguidos.includes(member.slug) || isFollowing(member.slug);
          return (
            <div
              key={member.slug}
              className="w-[136px] shrink-0 rounded-xl bg-white/[0.04] p-3 text-center"
              data-testid={`sugestao-${member.slug}`}
            >
              <Link href={`/user/${member.slug}`} className="group block">
                <span
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-display text-base font-bold`} {...avatarDeLeitor(member.slug)}
                >
                  {member.name.charAt(0)}
                </span>
                <span className="mt-2 block truncate text-[12px] font-bold transition-colors group-hover:text-primary">
                  {member.name}
                </span>
                <span className="mt-1 block min-h-[42px] text-[10px] leading-snug text-white/40">
                  {reason}
                </span>
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
                className={`mt-2 flex w-full items-center justify-center gap-1 rounded-full py-1.5 text-[10.5px] font-bold transition-colors ${
                  ja
                    ? "border border-white/15 text-white/50"
                    : "bg-primary text-black hover:bg-primary/90"
                }`}
                data-testid={`sugestao-seguir-${member.slug}`}
              >
                {ja ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {ja ? "Seguindo" : "Seguir"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
