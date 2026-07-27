import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Users } from "lucide-react";

import { catalog } from "@/lib/books";
import {
  CLUBES_EVENT,
  capituloDaRoda,
  clubesParaDescobrir,
  dataCurta,
  meuCapitulo,
  meusClubes,
  type Clube,
} from "@/lib/clubes";

/**
 * O bloco de clubes dentro da Comunidade.
 *
 * Mostra **os seus** quando você tem algum — com o ritmo à mostra, que é o que
 * faz voltar — e, quando não tem, os dois melhores para descobrir. Nunca as
 * duas listas ao mesmo tempo: a Comunidade é uma tela de passagem, e duas
 * listas de clube aqui empurrariam a conversa dos livros para fora da tela.
 */
export default function ClubesNaComunidade() {
  const [meus, setMeus] = useState<Clube[]>(() => meusClubes());
  const [sugestoes, setSugestoes] = useState<Clube[]>(() => clubesParaDescobrir());

  useEffect(() => {
    const atualizar = () => {
      setMeus(meusClubes());
      setSugestoes(clubesParaDescobrir());
    };
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => window.removeEventListener(CLUBES_EVENT, atualizar);
  }, []);

  const mostrar = meus.length > 0 ? meus.slice(0, 2) : sugestoes.slice(0, 2);
  if (mostrar.length === 0) return null;

  return (
    <section className="border-b border-white/10 px-5 py-5" data-testid="clubes-na-comunidade">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {meus.length > 0 ? "Seus clubes" : "Clubes de leitura"}
        </h2>
        <Link href="/clubes" className="flex items-center text-[11px] font-semibold text-primary">
          Ver todos
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {mostrar.map((clube) => {
          const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
          const seu = meuCapitulo(clube);
          const roda = capituloDaRoda(clube);

          return (
            <Link
              key={clube.id}
              href={`/clube/${clube.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]"
              data-testid={`clube-atalho-${clube.id}`}
            >
              {livro && (
                <img
                  src={livro.cover}
                  alt={livro.title}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{clube.nome}</p>
                <p className="truncate text-[11px] text-white/40">
                  {meus.length > 0 ? (
                    seu === 0 ? (
                      <>A roda está no capítulo {roda} · encontro {dataCurta(clube.ciclo.encontro)}</>
                    ) : (
                      <>
                        Você: cap. {seu} · roda: cap. {roda}
                      </>
                    )
                  ) : (
                    <>
                      <Users className="mr-1 inline h-2.5 w-2.5" />
                      {clube.membros.length} membros · lendo {livro?.title}
                    </>
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
