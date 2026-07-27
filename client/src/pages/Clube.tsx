import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, Shield, UserPlus, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import CartaoDoCiclo from "@/components/clube/CartaoDoCiclo";
import MuralDoClube from "@/components/clube/MuralDoClube";
import RodadaDoClube from "@/components/clube/RodadaDoClube";
import VotacaoDoClube from "@/components/clube/VotacaoDoClube";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import {
  CLUBES_EVENT,
  clubePorId,
  corDoMembro,
  entrarNoClube,
  nomeDoMembro,
  sairDoClube,
  souDono,
  souMembro,
  type Clube as ClubeTipo,
} from "@/lib/clubes";

/**
 * A tela de um clube.
 *
 * A ordem dos blocos é a ordem do que a pessoa quer saber ao abrir: **o que
 * estamos lendo e até onde** (o ciclo), **o que está sendo perguntado agora**
 * (a rodada), **o que a turma está dizendo** (o mural), **o que vem depois** (a
 * votação) e **o que já lemos juntos** (a estante). Configuração e saída ficam
 * no fim, onde não atrapalham.
 *
 * Quem **não** é membro vê a mesma tela em modo vitrine, com o convite no topo:
 * clube fechado que não deixa espiar nada não convence ninguém a entrar.
 */
export default function Clube({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [, navegar] = useLocation();
  const [clube, setClube] = useState<ClubeTipo | undefined>(() => clubePorId(params.id));

  useEffect(() => {
    const atualizar = () => setClube(clubePorId(params.id));
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => window.removeEventListener(CLUBES_EVENT, atualizar);
  }, [params.id]);

  if (!clube) {
    return (
      <div className="min-h-screen bg-[#141414] px-6 pb-24 text-white">
        <PageHeader title="Clube" fallback="/clubes" />
        <div className="flex flex-col items-center justify-center gap-3 pt-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5">
            <Users className="h-8 w-8 text-white/20" />
          </div>
          <p className="font-display text-lg font-bold">Este clube não existe mais</p>
          <Link href="/clubes" className="mt-1 text-sm font-semibold text-primary">
            Ver os clubes
          </Link>
        </div>
      </div>
    );
  }

  const membro = souMembro(clube);
  const dono = souDono(clube);

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="clube-page">
      <PageHeader title={clube.nome} fallback="/clubes" />

      <div className="space-y-6 px-5 pt-4">
        <header className="space-y-3">
          <p className="text-sm leading-relaxed text-white/55">{clube.descricao}</p>

          <div className="flex items-center gap-3">
            <div className="flex">
              {clube.membros.slice(0, 5).map((slug, indice) => (
                <span
                  key={slug}
                  className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${corDoMembro(
                    slug,
                  )} font-display text-[11px] font-bold ring-2 ring-[#141414] ${
                    indice > 0 ? "-ml-2" : ""
                  }`}
                  title={nomeDoMembro(slug)}
                >
                  {nomeDoMembro(slug).charAt(0)}
                </span>
              ))}
            </div>
            <span className="text-xs text-white/40">
              {clube.membros.length} {clube.membros.length === 1 ? "membro" : "membros"} · moderado
              por {nomeDoMembro(clube.donoSlug)}
            </span>
          </div>

          {dono && (
            <p
              className="flex items-center gap-2 rounded-lg bg-primary/[0.08] px-3 py-2 text-[11px] leading-relaxed text-white/60"
              data-testid="selo-moderador"
            >
              <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <b className="text-white/85">Você modera este clube.</b> Pode abrir rodadas, cobrir
                spoiler de quem esqueceu de marcar, esconder mensagem e encerrar o ciclo.
              </span>
            </p>
          )}

          {!membro && (
            <button
              onClick={() => {
                entrarNoClube(clube.id);
                toast({
                  title: `Você entrou no ${clube.nome}`,
                  description: "O combinado da roda passa a valer para você.",
                });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black transition-colors hover:bg-primary/90"
              data-testid="button-entrar-clube"
            >
              <UserPlus className="h-4 w-4" />
              Entrar no clube
            </button>
          )}
        </header>

        <CartaoDoCiclo clube={clube} />

        {membro ? (
          <>
            <RodadaDoClube clube={clube} />
            <MuralDoClube clube={clube} />
            <VotacaoDoClube clube={clube} />
          </>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs leading-relaxed text-white/45">
            Entre no clube para ver o mural, responder às rodadas e votar no próximo livro. O
            combinado de spoiler passa a valer para você — é ele que deixa a conversa segura para
            quem está atrasado.
          </p>
        )}

        {clube.estante.length > 0 && <EstanteDoClube clube={clube} />}

        {membro && (
          <button
            onClick={() => {
              sairDoClube(clube.id);
              toast({ title: `Você saiu do ${clube.nome}` });
              navegar("/clubes");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/40 transition-colors hover:text-white/70"
            data-testid="button-sair-clube"
          >
            <LogOut className="h-3.5 w-3.5" />
            {dono ? "Apagar este clube" : "Sair do clube"}
          </button>
        )}

        {/*
          A honestidade que o app pratica em toda parte (ROTEIRO 4.23): os outros
          membros são os leitores fictícios de `community.ts`. Encenar um grupo
          cheio de gente real seria o tipo de teatro que já foi varrido daqui.
        */}
        <p className="pb-2 text-center text-[10.5px] leading-relaxed text-white/25">
          Os outros membros são leitores fictícios, como o resto da comunidade — o clube funciona
          de verdade, com gente de verdade, quando houver contas e servidor.
        </p>
      </div>
    </div>
  );
}

/** O que a turma já leu junto — a memória do clube. */
function EstanteDoClube({ clube }: { clube: ClubeTipo }) {
  return (
    <section className="space-y-3" data-testid="estante-do-clube">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">A estante do clube</h2>
        <span className="text-xs text-white/35">{clube.estante.length} lidos</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {clube.estante.map((item) => {
          const livro = catalog.find((book) => book.id === item.bookId);
          if (!livro) return null;
          return (
            <Link
              key={`${item.bookId}-${item.terminadoEm}`}
              href={`/book/${item.bookId}`}
              className="w-24 shrink-0"
            >
              <img
                src={livro.cover}
                alt={livro.title}
                className="h-24 w-24 rounded-lg object-cover"
              />
              <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight">
                {livro.title}
              </p>
              <p className="text-[10px] text-white/30">
                <BookOpen className="mr-1 inline h-2.5 w-2.5" />
                {item.terminadoEm.slice(8)}/{item.terminadoEm.slice(5, 7)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
