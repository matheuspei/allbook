import { Link, useParams } from "wouter";
import { Pencil } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { findMember, recommendationsOf } from "@/lib/community";
import { readRecommendations } from "@/lib/recommendations";

/**
 * "Eu recomendo", em página inteira — **a sua e a de qualquer leitor**.
 *
 * ---
 *
 * **Por que passou a existir** (30/07). A §4.56 decidiu que o perfil gira em
 * torno dos posts e que recomendações, comentários e clubes **saem da rolagem e
 * viram ícones no topo**, cada um abrindo a sua página. Os ícones não puderam ser
 * construídos junto com os posts porque **as páginas não existiam** — e ícone sem
 * destino é botão morto, o que a §4.23 manda varrer. Esta é uma das três.
 *
 * **Uma página serve os dois lados**, e isso não é economia de código: a régua da
 * casa desde a §4.41 é que a sua página e a de outra pessoa falem a mesma língua.
 * Duas telas separadas divergem com o tempo — foi assim que o perfil dos membros
 * ficou sem as novidades em 28/07.
 *
 * **O "Editar" só aparece na sua**, e leva à tela que já existia
 * (`/profile/recommendations`). Ela continua sendo o lugar de montar a lista;
 * esta aqui é o lugar de **ler** — e é a que um visitante vê.
 */
export default function Recomendacoes() {
  const params = useParams<{ slug?: string }>();
  const membro = params.slug ? findMember(params.slug) : undefined;
  const ehMinha = !params.slug;

  if (params.slug && !membro) {
    return (
      <div className="min-h-screen bg-[#141414] pb-24 text-white">
        <PageHeader title="Leitor não encontrado" fallback="/community" />
      </div>
    );
  }

  const lista = membro ? recommendationsOf(membro) : readRecommendations();
  const titulo = membro ? `${membro.name.split(" ")[0]} recomenda` : "Eu recomendo";

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="pagina-recomendacoes">
      <PageHeader title={titulo} fallback={membro ? `/user/${membro.slug}` : "/profile"} />

      <div className="px-5 pt-4">
        {ehMinha && (
          <Link
            href="/profile/recommendations"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            data-testid="editar-recomendacoes"
          >
            <Pencil className="h-3.5 w-3.5" />
            {lista.length > 0 ? "Editar a lista" : "Montar a lista"}
          </Link>
        )}

        {lista.length === 0 ? (
          <p className="py-8 text-sm leading-relaxed text-white/40">
            {ehMinha
              ? "Você ainda não recomendou nada. A lista é o que um visitante vê primeiro na sua página."
              : "Ainda não recomendou nada."}
          </p>
        ) : (
          <div className="space-y-4">
            {lista.map(({ book, note }) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="group flex gap-3.5"
                data-testid={`recomendacao-${book.id}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-[86px] w-[62px] shrink-0 rounded-md object-cover shadow-md shadow-black/40 ring-1 ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[14.5px] font-bold leading-tight transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-white/40">{book.author}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">narra {book.narrator}</p>
                  {note && (
                    <p className="mt-1.5 text-[12px] italic leading-snug text-white/60">“{note}”</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
