import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, Share2, Shield, UserPlus, Users } from "lucide-react";

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
  dataCurta,
  entrarNoClube,
  estaComecando,
  linkDoClube,
  nomeDoMembro,
  sairDoClube,
  souDono,
  souMembro,
  type Clube as ClubeTipo,
} from "@/lib/clubes";

/**
 * Copiar texto com plano B.
 *
 * `navigator.clipboard` é o caminho bom, mas recusa em situações comuns (aba
 * sem foco, permissão negada, página fora de contexto seguro). O `textarea`
 * escondido com `execCommand("copy")` é obsoleto e funciona em todas elas —
 * fica como rede, não como primeira escolha.
 */
async function copiarParaAreaDeTransferencia(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const campo = document.createElement("textarea");
      campo.value = texto;
      campo.setAttribute("readonly", "");
      campo.style.position = "fixed";
      campo.style.opacity = "0";
      document.body.appendChild(campo);
      campo.select();
      const deuCerto = document.execCommand("copy");
      document.body.removeChild(campo);
      return deuCerto;
    } catch {
      return false;
    }
  }
}

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

  /**
   * Convidar: a folha nativa do celular quando existe, copiar o link quando
   * não. É o mesmo caminho que o compartilhar do livro já usa — inclusive o
   * fallback, porque no computador `navigator.share` não existe.
   */
  /* Arrow e não `function`: declaração de função é içada para o topo, e o
     TypeScript deixa de enxergar que `clube` já foi checado acima. */
  const convidar = async () => {
    const link = linkDoClube(clube.id);
    const texto = estaComecando(clube)
      ? `Vou entrar no ${clube.nome} no AllBook — começa em ${dataCurta(clube.ciclo.inicio)}. Vem?`
      : `Estou no ${clube.nome} no AllBook. Vem ouvir junto?`;

    if (navigator.share) {
      try {
        await navigator.share({ title: clube.nome, text: texto, url: link });
      } catch {
        // Fechar a folha nativa cai aqui: é desistência, não erro.
      }
      return;
    }

    /*
     * **O convite nunca pode ficar sem retorno.** A primeira versão chamava
     * `clipboard.writeText` dentro de um `try` mudo — e quando o navegador
     * recusa a cópia (aba sem foco, permissão negada, `http` sem `localhost`)
     * o botão simplesmente não fazia nada, que é o defeito que este app já
     * varreu em outros cantos. Agora há um plano B (o `textarea` de sempre) e,
     * se nem ele funcionar, o link aparece no aviso para copiar à mão.
     */
    const copiou = await copiarParaAreaDeTransferencia(`${texto} ${link}`);
    toast(
      copiou
        ? { title: "Convite copiado", description: "Agora é só colar onde quiser." }
        : { title: "O link do clube é este", description: link },
    );
  };

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

          <div className="flex gap-2">
            {!membro && (
              <button
                onClick={() => {
                  entrarNoClube(clube.id);
                  toast({
                    title: `Você entrou no ${clube.nome}`,
                    description: estaComecando(clube)
                      ? `A conversa começa em ${dataCurta(clube.ciclo.inicio)} — todo mundo do mesmo ponto.`
                      : "O combinado da roda passa a valer para você.",
                  });
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black transition-colors hover:bg-primary/90"
                data-testid="button-entrar-clube"
              >
                <UserPlus className="h-4 w-4" />
                {estaComecando(clube) ? "Quero entrar na estreia" : "Entrar no clube"}
              </button>
            )}

            {/*
              Convidar é **compartilhar o endereço** — e isso funciona de
              verdade hoje: quem abrir o link cai aqui, vê o livro, o ritmo e o
              combinado, e tem o botão de entrar. Um "convidar por e-mail" sem
              contas seria botão que finge (ROTEIRO 4.23).
            */}
            <button
              onClick={convidar}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors ${
                membro
                  ? "w-full bg-white/[0.08] text-white hover:bg-white/15"
                  : "px-4 bg-white/[0.08] text-white hover:bg-white/15"
              }`}
              data-testid="button-convidar-clube"
            >
              <Share2 className="h-4 w-4" />
              {membro ? "Convidar alguém para o clube" : "Convidar"}
            </button>
          </div>
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
