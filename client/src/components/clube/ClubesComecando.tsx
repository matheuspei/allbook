import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CalendarPlus, ChevronRight, Users } from "lucide-react";

import { catalog } from "@/lib/books";
import {
  CLUBES_EVENT,
  clubesComecando,
  dataCurta,
  estreiaEmTexto,
  nomeDoMembro,
  souMembro,
  type Clube,
} from "@/lib/clubes";

/**
 * "Começando em breve" — a vitrine dos clubes que ainda vão estrear.
 *
 * **É a resposta a um problema real de entrada:** entrar num clube que já está
 * no capítulo 6 é constrangedor (ou você maratona para alcançar, ou lê mensagem
 * coberta). Um clube que estreia daqui a três dias começa com todo mundo no
 * mesmo lugar — e é isso que faz alguém topar. Pedido do Matheus em 27/07:
 * *"as pessoas poderiam ver que está tendo um clube de tal livro e que vai
 * começar tal dia"*.
 *
 * O mesmo bloco serve à tela de clubes e à aba **Catálogo**, que é onde a
 * pessoa está justamente escolhendo o que ouvir. Na Início, não: a decisão de
 * 21/07 mantém a Início só para o audiolivro.
 */
export default function ClubesComecando({
  limite = 3,
  titulo = "Começando em breve",
  verTodos = true,
}: {
  limite?: number;
  titulo?: string;
  /** Mostra o atalho para a tela de clubes (desnecessário dentro dela). */
  verTodos?: boolean;
}) {
  const [clubes, setClubes] = useState<Clube[]>(() => clubesComecando());

  useEffect(() => {
    const atualizar = () => setClubes(clubesComecando());
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => window.removeEventListener(CLUBES_EVENT, atualizar);
  }, []);

  if (clubes.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="clubes-comecando">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          <CalendarPlus className="h-3 w-3 text-[#f59e0b]" />
          {titulo}
        </h2>
        {verTodos && (
          <Link href="/clubes" className="flex items-center text-[11px] font-semibold text-primary">
            Ver todos
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="space-y-2.5">
        {clubes.slice(0, limite).map((clube) => {
          const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
          const dentro = souMembro(clube);

          return (
            <Link
              key={clube.id}
              href={`/clube/${clube.id}`}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#241a10] to-[#1a1a1a] p-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)] transition-colors hover:from-[#2b1f12]"
              data-testid={`clube-estreia-${clube.id}`}
            >
              {livro && (
                <img
                  src={livro.cover}
                  alt={livro.title}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f59e0b]">
                  {estreiaEmTexto(clube)} · {dataCurta(clube.ciclo.inicio)}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold">{clube.nome}</p>
                <p className="truncate text-[11px] text-white/45">
                  {livro ? `Vai ouvir ${livro.title}` : ""} ·{" "}
                  <Users className="inline h-2.5 w-2.5" /> {clube.membros.length} inscritos
                </p>
                <p className="mt-0.5 truncate text-[10.5px] text-white/30">
                  {dentro ? "Você já está dentro" : `Aberto por ${nomeDoMembro(clube.donoSlug)}`}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
