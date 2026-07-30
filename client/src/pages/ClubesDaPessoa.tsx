import { Link, useParams } from "wouter";
import { CalendarClock, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog } from "@/lib/books";
import { clubesDe, diasAte, estreiaEmTexto, estaComecando, prazoEmTexto } from "@/lib/clubes";
import { findMember } from "@/lib/community";

/**
 * Os clubes de um leitor — terceira das páginas que os ícones do perfil
 * precisavam (§4.56, construído em 30/07).
 *
 * **Só existe para os outros, e isso é decisão, não esquecimento.** Os *seus*
 * clubes já têm casa: a tela `/clubes`, que além de listá-los deixa criar,
 * buscar e descobrir. Fazer uma segunda página com metade daquilo daria **duas
 * respostas para a mesma pergunta** — o defeito que a §4.57 mandou varrer do
 * menu da Comunidade. Por isso o ícone "Clubes" do seu perfil aponta para
 * `/clubes`, e o da página de outra pessoa vem para cá.
 *
 * **O que cada linha mostra é o que decide se você quer entrar:** o livro da
 * vez, quanta gente e o prazo. Nome de clube sozinho não diz nada.
 */
export default function ClubesDaPessoa() {
  const params = useParams<{ slug: string }>();
  const membro = findMember(params.slug ?? "");

  if (!membro) {
    return (
      <div className="min-h-screen bg-[#141414] pb-24 text-white">
        <PageHeader title="Leitor não encontrado" fallback="/community" />
      </div>
    );
  }

  const primeiroNome = membro.name.split(" ")[0];
  const clubes = clubesDe(membro.slug);

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="pagina-clubes-da-pessoa">
      <PageHeader title={`Clubes de ${primeiroNome}`} fallback={`/user/${membro.slug}`} />

      <div className="px-5 pt-4">
        {clubes.length === 0 ? (
          <p className="py-8 text-sm text-white/40">
            {primeiroNome} ainda não está em nenhum clube.
          </p>
        ) : (
          <div className="space-y-2.5">
            {clubes.map((clube) => {
              const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
              /* **A próxima etapa, não a primeira.** A primeira versão mostrava
                 `marcos[0]` e dizia "cap. 3 há 5 dias" — um prazo que já passou,
                 que é informação morta. O que interessa a quem olha de fora é
                 onde a turma está indo. */
              const proximo =
                clube.ciclo.marcos.find((marco) => diasAte(marco.prazo) >= 0) ??
                clube.ciclo.marcos[clube.ciclo.marcos.length - 1];
              return (
                <Link
                  key={clube.id}
                  href={`/clube/${clube.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
                  data-testid={`clube-da-pessoa-${clube.id}`}
                >
                  {livro && (
                    <img
                      src={livro.cover}
                      alt=""
                      className="h-[62px] w-[44px] shrink-0 rounded object-cover ring-1 ring-white/10"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{clube.nome}</p>
                    {livro && (
                      <p className="mt-0.5 truncate text-[11.5px] text-white/45">
                        lendo {livro.title}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-3 text-[11px] text-white/35">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {clube.membros.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {estaComecando(clube)
                          ? estreiaEmTexto(clube)
                          : proximo
                            ? `cap. ${proximo.chapter} ${prazoEmTexto(proximo.prazo)}`
                            : "em andamento"}
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
