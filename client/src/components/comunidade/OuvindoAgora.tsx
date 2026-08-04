import { useEffect, useState } from "react";
import { Link } from "wouter";

import { avatarDeLeitor } from "@/lib/community";
import { ouvindoAgoraNaComunidade, type AudicaoDeAgora } from "@/lib/activity";

/**
 * A fileira "Ouvindo agora" do topo da Comunidade — lente Todos.
 *
 * **Decisão do Matheus (04/08, §4.98):** quando a aba Pessoas morreu, esta
 * vitrine ficou escondida atrás da lente Seguindo, e ela é a única coisa que só
 * um app de audiolivro tem para mostrar. Ele escolheu, na folha da fila, a
 * volta como fileira compacta no alto — **rosto + capinha**: o rosto abre a
 * pessoa, a capa abre o livro (um pixel, um dono — §4.93).
 *
 * Não é a mesma peça da lente Seguindo: lá é a fita de capas de **quem você
 * segue** (atividade, e atividade mora naquela lente — §4.58). Aqui é a casa
 * inteira, o que existe antes de você seguir qualquer pessoa.
 */
export default function OuvindoAgora() {
  const [audicoes, setAudicoes] = useState<AudicaoDeAgora[]>([]);

  useEffect(() => {
    setAudicoes(ouvindoAgoraNaComunidade());
  }, []);

  if (audicoes.length === 0) return null;

  return (
    <section className="mt-3" data-testid="ouvindo-agora-todos">
      <h2 className="mb-2.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        Ouvindo agora
      </h2>

      <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-1">
        {audicoes.map(({ member, book }) => (
          <div key={member.slug} className="w-[64px] shrink-0" data-testid={`ouvindo-${member.slug}`}>
            <div className="relative mx-auto h-[52px] w-[52px]">
              <Link
                href={`/user/${member.slug}`}
                aria-label={`Abrir o perfil de ${member.name}`}
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-display text-lg font-bold`}
                {...avatarDeLeitor(member.slug)}
              >
                {member.name.charAt(0)}
              </Link>
              <Link
                href={`/book/${book.id}`}
                aria-label={`Abrir ${book.title}`}
                className="absolute -bottom-1 -right-1.5 block h-[34px] w-[24px] overflow-hidden rounded-[4px] border-2 border-[#141414]"
              >
                <img src={book.cover} alt="" className="h-full w-full object-cover" />
              </Link>
            </div>
            <Link href={`/user/${member.slug}`} tabIndex={-1} className="mt-2 block truncate text-center text-[10px] text-white/55 transition-colors hover:text-white">
              {member.name.split(" ")[0]}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
