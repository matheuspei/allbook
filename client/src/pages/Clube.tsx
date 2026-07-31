import { useEffect, useState } from "react";
import { avatarDeLeitor } from "@/lib/community";
import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, Share2, Shield, UserPlus, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import CartaoDoCiclo from "@/components/clube/CartaoDoCiclo";
import MuralDoClube from "@/components/clube/MuralDoClube";
import PautaNoClube from "@/components/clube/PautaNoClube";
import RodadaDoClube from "@/components/clube/RodadaDoClube";
import VotacaoDoClube from "@/components/clube/VotacaoDoClube";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import {
  CLUBES_EVENT,
  clubeCheio,
  entrarNaFila,
  filaDoClube,
  minhaPosicaoNaFila,
  sairDaFila,
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
  vagasRestantes,
  type Clube as ClubeTipo,
} from "@/lib/clubes";
import { forumNaTela } from "@/lib/forum";
import { eventosDoClube } from "@/lib/forumConteudo";

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
 * **Reformulada em 28/07** (ROTEIRO 4.40). O Matheus disse que o layout não
 * agradava, e a apuração deu razão a ele com um motivo concreto: eram **cinco
 * seções empilhadas e permanentes** — ciclo, rodada, mural, votação, estante —,
 * e várias passavam a maior parte do tempo vazias. Um clube sem rodada aberta
 * mostrava uma caixa de "abrir rodada" **antes** da conversa; um clube novo
 * mostrava uma régua dizendo "ninguém começou ainda".
 *
 * **A regra nova, e ela vale para a tela inteira: o que é por tempo determinado
 * aparece quando é a hora e some depois.** Rodada e pauta entraram como blocos
 * condicionais; a estante só aparece quando há livro nela. O que sobra é o que
 * sempre tem o que dizer: o ciclo e a conversa.
 *
 * **A moderação saiu daqui** para `/clube/:id/gerenciar`. Moderar não é uso
 * diário — é o que se faz quando algo precisa mudar —, e empilhar os poderes
 * junto da conversa era parte do que fazia esta tela parecer um formulário.
 *
 * Quem **não** é membro vê a mesma tela em modo vitrine, com o convite no topo:
 * clube fechado que não deixa espiar nada não convence ninguém a entrar.
 */
export default function Clube({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [, navegar] = useLocation();
  const [clube, setClube] = useState<ClubeTipo | undefined>(() => clubePorId(params.id));
  /** Muda quando você entra ou sai da fila — força a leitura de novo. */
  const [versao, setVersao] = useState(0);

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
  const cheio = clubeCheio(clube);
  const vagas = vagasRestantes(clube);
  /* `versao` entra na conta só para o React refazer o cálculo depois de entrar
     ou sair da fila — o dado mora no localStorage, não no estado. */
  const fila = versao >= 0 ? filaDoClube(clube.id) : [];
  const posicao = minhaPosicaoNaFila(clube.id);

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
                  }`} {...avatarDeLeitor(
                    slug,
                  )}
                  title={nomeDoMembro(slug)}
                >
                  {nomeDoMembro(slug).charAt(0)}
                </span>
              ))}
            </div>
            <span className="text-xs text-white/40">
              {/* Com limite, o que interessa é o que sobra: "5 de 8" diz na hora
                  se ainda dá para chamar alguém. Sem limite, o número puro. */}
              {clube.limite !== undefined
                ? `${clube.membros.length} de ${clube.limite} lugares`
                : `${clube.membros.length} ${clube.membros.length === 1 ? "membro" : "membros"}`}
              {" · moderado por "}
              {nomeDoMembro(clube.donoSlug)}
            </span>
          </div>

          {/*
            O selo do moderador virou **porta** para a tela de gerenciar, em vez
            de um aviso que só informava. Antes ele listava poderes que estavam
            espalhados pela própria tela; agora ele leva ao lugar onde todos
            moram, que é o que o Matheus pediu em 28/07 ao falar de autonomia.
          */}
          {dono && (
            <Link
              href={`/clube/${clube.id}/gerenciar`}
              className="flex items-center gap-2 rounded-lg bg-primary/[0.08] px-3 py-2.5 text-[11px] leading-relaxed text-white/60 transition-colors hover:bg-primary/15"
              data-testid="selo-moderador"
            >
              <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="flex-1">
                <b className="text-white/85">Você modera este clube.</b> Vagas, quem fica, o que a
                turma vota.
              </span>
              <span className="shrink-0 font-semibold text-primary">Gerenciar ›</span>
            </Link>
          )}

          <div className="flex gap-2">
            {/*
              **Clube cheio deixou de ser beco sem saída** (30/07, §4.58). Antes
              a tela dizia "está cheio" e acabava ali: quem se interessou não
              tinha o que fazer, e o moderador nem ficava sabendo que havia gente
              querendo entrar. Agora há fila — e a fila **anda sozinha**: quando
              alguém sai ou é removido, o primeiro entra.
            */}
            {!membro && cheio && (
              <div className="flex-1 rounded-xl bg-white/[0.04] px-4 py-3" data-testid="clube-cheio">
                {posicao !== undefined ? (
                  <>
                    <p className="text-xs leading-relaxed text-white/55">
                      <b className="text-primary">Você está na fila</b> — {posicao}º lugar. Abriu
                      vaga, você entra e é avisado.
                    </p>
                    <button
                      onClick={() => {
                        sairDaFila(clube.id);
                        setVersao((v) => v + 1);
                        toast({ title: "Você saiu da fila" });
                      }}
                      className="mt-2 text-[11.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
                      data-testid="button-sair-da-fila"
                    >
                      Sair da fila
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs leading-relaxed text-white/45">
                      <b className="text-white/75">Este clube está cheio</b> — {clube.limite} de{" "}
                      {clube.limite} lugares ocupados.
                      {fila.length > 0 &&
                        ` ${fila.length} ${fila.length === 1 ? "pessoa espera" : "pessoas esperam"} vaga.`}
                    </p>
                    <button
                      onClick={() => {
                        if (!entrarNaFila(clube.id)) return;
                        setVersao((v) => v + 1);
                        toast({
                          title: "Você entrou na fila",
                          description: "Quando alguém sair, o primeiro da fila entra no lugar.",
                        });
                      }}
                      className="mt-2.5 w-full rounded-lg bg-white/[0.08] py-2 text-[12.5px] font-bold transition-colors hover:bg-white/15"
                      data-testid="button-entrar-na-fila"
                    >
                      Entrar na lista de espera
                    </button>
                  </>
                )}
              </div>
            )}

            {!membro && !cheio && (
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

        <EncontrosDoClube clube={clube} />

        {membro ? (
          <>
            {/*
              Rodada, pauta e votação **aparecem quando é a hora**, não como
              seções fixas (ROTEIRO 4.40). Cada uma some sozinha quando não há
              nada aberto — é a regra que tirou as caixas vazias da tela.
            */}
            <PautaNoClube clube={clube} />
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

        {/*
          Sair e apagar são ações diferentes e agora ficam em lugares diferentes.
          **Apagar saiu daqui** (ROTEIRO 4.40): era o mesmo botão discreto de
          "sair", destruía o clube e o mural num toque, sem confirmação, e ainda
          avisava "você saiu do…" — o aviso mentia sobre o que tinha acontecido.
          Agora mora em Gerenciar, com uma caixa que diz o que se perde.
        */}
        {membro && !dono && (
          <button
            onClick={() => {
              sairDoClube(clube.id);
              toast({
                title: `Você saiu do ${clube.nome}`,
                description: "Dá para voltar pelo mesmo endereço, se o clube não estiver cheio.",
              });
              navegar("/clubes");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/40 transition-colors hover:text-white/70"
            data-testid="button-sair-clube"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair do clube
          </button>
        )}

        {/*
          A honestidade que o app pratica em toda parte (ROTEIRO 4.23): os outros
          membros são os leitores fictícios de `community.ts`. Encenar um grupo
          cheio de gente real seria o tipo de teatro que já foi varrido daqui.

          **Só aparece quando há "outros"** (ROTEIRO 4.40): num clube recém-criado
          existe você e mais ninguém, e a frase falava de gente que não estava lá
          — aviso que não corresponde a nada na tela é ruído, não honestidade.
        */}
        {clube.membros.length > 1 && (
          <p className="pb-2 text-center text-[10.5px] leading-relaxed text-white/25">
            Os outros membros são leitores fictícios, como o resto da comunidade — o clube funciona
            de verdade, com gente de verdade, quando houver contas e servidor.
          </p>
        )}

        {clube.membros.length === 1 && membro && (
          <p className="pb-2 text-center text-[10.5px] leading-relaxed text-white/25">
            Por enquanto você está sozinho aqui. Compartilhe o endereço do clube — quem abrir o
            link cai nesta página com o botão de entrar
            {vagas !== undefined ? `, e ainda há ${vagas} ${vagas === 1 ? "lugar" : "lugares"}` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * **Os encontros marcados que apontam para este clube** (31/07).
 *
 * A ponte pedida pelo Matheus tem duas pontas: o evento mostra o clube (lá na
 * comunidade) e o clube mostra os eventos — esta aqui.
 *
 * ⚠️ **Isto não é o encontro do ciclo, e a tela diz isso.** A §4.39 decidiu que
 * o encontro do clube **não tem hora marcada** porque quem ouve audiolivro ouve
 * dirigindo e às 23h; ele é uma rodada de dois ou três dias. O que aparece aqui
 * é outra coisa: a maratona combinada, o presencial na livraria — marcados numa
 * comunidade do fórum, por quem quis marcar. Sem a frase do rodapé, as duas
 * coisas viravam uma só na cabeça de quem lê.
 *
 * **Só aparece quando há encontro** — a regra da §4.40 que tirou as caixas
 * vazias desta tela.
 */
function EncontrosDoClube({ clube }: { clube: ClubeTipo }) {
  const eventos = eventosDoClube(clube.id);
  if (eventos.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="encontros-do-clube">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Encontros marcados</h2>
        <span className="text-xs text-white/35">
          {eventos.length} {eventos.length === 1 ? "encontro" : "encontros"}
        </span>
      </div>

      <div className="space-y-2">
        {eventos.map((evento) => {
          const quando = new Date(`${evento.data}T12:00:00`);
          const comunidade = forumNaTela(evento.grupoId);

          return (
            <Link
              key={evento.id}
              href={`/forum/${evento.grupoId}`}
              className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
              data-testid={`encontro-${evento.id}`}
            >
              <span className="w-[46px] shrink-0 overflow-hidden rounded-xl text-center ring-1 ring-inset ring-primary/25">
                <span className="block bg-primary/15 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-primary">
                  {quando.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                </span>
                <span className="block py-1 font-display text-[18px] font-bold leading-none">
                  {quando.getDate()}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold leading-snug">
                  {evento.titulo}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-white/40">
                  {quando.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric" })}
                  {evento.hora && ` · ${evento.hora}`}
                  {evento.local && ` · ${evento.local}`}
                </span>
                {comunidade && (
                  <span className="mt-0.5 block truncate text-[10.5px] text-white/25">
                    marcado em {comunidade.nome}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      <p className="text-[10.5px] leading-relaxed text-white/25">
        Encontro marcado tem hora e é combinado numa comunidade. A rodada do clube continua sem
        hora — você responde quando der.
      </p>
    </section>
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
