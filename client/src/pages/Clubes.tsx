import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Calendar, MessageSquare, Plus, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import ClubesComecando from "@/components/clube/ClubesComecando";
import { catalog } from "@/lib/books";
import {
  CLUBES_EVENT,
  capituloDaRoda,
  clubesParaDescobrir,
  corDoMembro,
  dataCurta,
  meuCapitulo,
  meusClubes,
  nomeDoMembro,
  prazoEmTexto,
  type Clube,
} from "@/lib/clubes";
import { MURAL_EVENT, totalDoMural } from "@/lib/muralDoClube";

/**
 * A lista de clubes: os seus primeiro, os que dá para descobrir depois.
 *
 * **Seus clubes vêm com o ritmo à mostra** — capítulo seu contra o da roda, e
 * quando é o encontro. É a informação que faz voltar: quem está atrasado vê que
 * está, sem ninguém precisar cobrar.
 *
 * A ordem de descoberta prioriza o **gênero que você mais ouve** (ver
 * `clubesParaDescobrir`): entrar num clube é assumir prazo com estranhos, e o
 * mínimo é que o livro interesse.
 */
export default function Clubes() {
  const [meus, setMeus] = useState<Clube[]>(() => meusClubes());
  const [descobrir, setDescobrir] = useState<Clube[]>(() => clubesParaDescobrir());

  useEffect(() => {
    const atualizar = () => {
      setMeus(meusClubes());
      setDescobrir(clubesParaDescobrir());
    };
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(CLUBES_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="clubes-page">
      <PageHeader title="Clubes de leitura" fallback="/community" />

      <div className="space-y-6 px-5 pt-4">
        <p className="text-xs leading-relaxed text-white/45">
          Um clube é uma turma que combina de ouvir o mesmo livro no mesmo período — com prazo,
          conversa e um encontro no fim. O combinado de spoiler vale para todo mundo.
        </p>

        {meus.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Seus clubes
            </h2>
            {meus.map((clube) => (
              <CartaoDeClube key={clube.id} clube={clube} meu />
            ))}
          </section>
        )}

        {/* As estreias vêm antes do "para descobrir": entrar num clube que já
            está no capítulo 6 é constrangedor; num que estreia sexta, não. */}
        <ClubesComecando verTodos={false} limite={4} />

        <Link
          href="/clubes/novo"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3.5 text-sm font-semibold text-white/60 transition-colors hover:border-white/30 hover:text-white"
          data-testid="button-novo-clube"
        >
          <Plus className="h-4 w-4" />
          Criar um clube
        </Link>

        {descobrir.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Para descobrir
            </h2>
            {descobrir.map((clube) => (
              <CartaoDeClube key={clube.id} clube={clube} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function CartaoDeClube({ clube, meu }: { clube: Clube; meu?: boolean }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  const mensagens = totalDoMural(clube.id);
  const seu = meuCapitulo(clube);
  const roda = capituloDaRoda(clube);

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="block rounded-xl border border-white/5 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
      data-testid={`clube-card-${clube.id}`}
    >
      <div className="flex gap-3">
        {livro && (
          <img
            src={livro.cover}
            alt={livro.title}
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold">{clube.nome}</p>
          <p className="truncate text-xs text-white/45">
            {livro ? `Lendo ${livro.title}` : "Sem livro no ciclo"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {clube.membros.length}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {mensagens}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dataCurta(clube.ciclo.encontro)}
            </span>
          </div>
        </div>
      </div>

      {meu ? (
        <p className="mt-3 rounded-lg bg-black/25 px-3 py-2 text-[11px] text-white/55">
          {seu === 0 ? (
            <>Você ainda não começou — a roda está no capítulo {roda}.</>
          ) : seu >= roda ? (
            <>
              Você está no capítulo {seu}, {seu === roda ? "no ritmo da roda" : "à frente da roda"}.
            </>
          ) : (
            <>
              Você está no capítulo {seu}; a roda, no {roda}. Encontro{" "}
              {prazoEmTexto(clube.ciclo.encontro)}.
            </>
          )}
        </p>
      ) : (
        <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-white/40">
          {clube.descricao} · moderado por {nomeDoMembro(clube.donoSlug)}
        </p>
      )}
    </Link>
  );
}
