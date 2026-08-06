import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Users } from "lucide-react";

import {
  CLUBES_EVENT,
  capituloDaRoda,
  clubesDoLivro,
  dataCurta,
  estaComecando,
  estreiaEmTexto,
  souMembro,
  type Clube,
} from "@/lib/clubes";

/**
 * "Este livro é o ciclo do Clube do Mistério" — a faixa na ficha do livro.
 *
 * É a porta de entrada mais natural que existe para um clube: a pessoa já está
 * olhando exatamente aquele título, por vontade própria. Convidar aqui custa
 * uma linha e não atrapalha quem não quer — quem já é membro vê o atalho para o
 * mural em vez do convite.
 *
 * Some quando nenhum clube está lendo o livro, que é o caso da maioria: faixa
 * vazia seria ruído em 56 das 59 fichas.
 */
export default function FaixaDoClubeNoLivro({ bookId }: { bookId: number }) {
  const [clubes, setClubes] = useState<Clube[]>(() => clubesDoLivro(bookId));

  useEffect(() => {
    const atualizar = () => setClubes(clubesDoLivro(bookId));
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => window.removeEventListener(CLUBES_EVENT, atualizar);
  }, [bookId]);

  if (clubes.length === 0) return null;
  const clube = clubes[0];
  const membro = souMembro(clube);

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#241a10] to-card p-3.5 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)] transition-colors hover:from-[#2b1f12]"
      data-testid="faixa-do-clube"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Users className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">
          {estaComecando(clube)
            ? `${clube.nome} vai ouvir este livro`
            : membro
              ? "Seu clube está lendo este livro"
              : `Este é o livro do ${clube.nome}`}
        </span>
        <span className="block truncate text-[11px] text-white/45">
          {estaComecando(clube) ? (
            <>
              <b className="text-primary">{estreiaEmTexto(clube)}</b> ·{" "}
              {dataCurta(clube.ciclo.inicio)} · {clube.membros.length} inscritos, todos do começo
            </>
          ) : (
            <>
              {clube.membros.length} pessoas ouvindo junto · a roda está no capítulo{" "}
              {capituloDaRoda(clube)} · encontro em {dataCurta(clube.ciclo.encontro)}
            </>
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
    </Link>
  );
}
