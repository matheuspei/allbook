import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Lock, MessageCircle, Pause, Play, Radio, Send, X } from "lucide-react";
import { catalog } from "@/lib/books";
import { avatarDeLeitor, findMember } from "@/lib/community";
import { EU } from "@/lib/clubes";
import { readProfile } from "@/lib/profile";
import {
  encerrarSala,
  entrarNaSala,
  faltaEmTexto,
  falarNaSala,
  falasAteAgora,
  mandarNoAudio,
  posicaoAgora,
  sairDaSala,
  salaPorId,
  SALA_AO_VIVO_EVENT,
  situacaoDaSala,
  souAnfitriao,
  type FalaDaSala,
  type SalaAoVivo as Sala,
} from "@/lib/salaAoVivo";
import { formatarPosicao } from "@/lib/sala";
import { ultimaTelaNavegavel } from "@/lib/navegacao";
import { useToast } from "@/hooks/use-toast";

/**
 * **A sala de escuta ao vivo** — a tela onde se ouve junto.
 *
 * O desenho inteiro está no ROTEIRO §4.81. As três regras que mandam aqui:
 *
 * 1. **A transmissão é corrida, e o chat também.** Nada de esperar pausa para
 *    falar — a pessoa comenta em cima da transmissão. Decisão do Matheus, contra
 *    a minha proposta de conversa por turnos.
 * 2. **Quem assiste vê tudo e não controla nada.** Capítulo, nome do capítulo,
 *    quanto falta para virar, posição e total ficam à mostra; tocar, pausar e
 *    arrastar são só do anfitrião. *"Por mais que ela não possa pausar, é
 *    importante ela se situar onde está no livro."*
 * 3. **Recolher o chat é saída, não estrutura.** Nasce aberto. Quem quer só ouvir
 *    aquele trecho recolhe, e continua na sala.
 *
 * ⚠️ **Sem áudio de verdade.** Como no resto do app, o player não toca arquivo
 * nenhum: a transmissão fictícia anda com o relógio (`posicaoAgora`) e as falas
 * entram quando ela passa por elas. Com servidor, muda a fonte e não esta tela.
 */
export default function SalaAoVivo({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [versao, setVersao] = useState(0);
  const [chatAberto, setChatAberto] = useState(true);
  const [texto, setTexto] = useState("");
  /** Quantas falas havia quando o chat foi recolhido — vira o "N novas". */
  const [marcaDoRecolher, setMarcaDoRecolher] = useState(0);

  const sala = useMemo(() => salaPorId(params.id), [params.id, versao]);

  useEffect(() => {
    const atualizar = () => setVersao((v) => v + 1);
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    return () => window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
  }, []);

  /*
   * O relógio da sala. Um tique por segundo é o que faz a transmissão andar e as
   * falas entrarem na hora — sem ele a tela ficaria parada até alguém mexer.
   * Só corre enquanto a sala está tocando e não foi encerrada.
   */
  useEffect(() => {
    if (!sala || sala.encerradaEm || !sala.tocando) return;
    const relogio = window.setInterval(() => setVersao((v) => v + 1), 1000);
    return () => window.clearInterval(relogio);
  }, [sala?.id, sala?.tocando, sala?.encerradaEm]);

  /* Entrar é automático ao abrir a tela: você chegou na sala, você está nela. */
  useEffect(() => {
    if (sala && !sala.encerradaEm) entrarNaSala(sala.id);
    // Só ao trocar de sala — não a cada tique do relógio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala?.id]);

  if (!sala) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#141414] px-6 text-center text-white">
        <Radio className="h-10 w-10 text-white/25" />
        <div>
          <h1 className="font-display text-xl font-bold">Esta sala não está mais no ar</h1>
          <p className="mt-2 text-sm text-white/45">
            O anfitrião encerrou, ou o endereço mudou.
          </p>
        </div>
        <Link
          href="/community"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black"
          data-testid="link-voltar-comunidade"
        >
          Ver o que está acontecendo
        </Link>
      </div>
    );
  }

  const book = catalog.find((item) => item.id === sala.bookId);
  const situacao = situacaoDaSala(sala);
  const falas = falasAteAgora(sala);
  const anfitriao = findMember(sala.anfitriao);
  const euMando = souAnfitriao(sala);
  const encerrada = Boolean(sala.encerradaEm);

  const novasNoRecolhido = Math.max(0, falas.length - marcaDoRecolher);

  function recolher() {
    setMarcaDoRecolher(falas.length);
    setChatAberto(false);
  }

  function enviar() {
    if (!texto.trim()) return;
    falarNaSala(sala!.id, texto);
    setTexto("");
  }

  function sair() {
    sairDaSala(sala!.id);
    navigate(ultimaTelaNavegavel(), { replace: true });
  }

  function encerrar() {
    encerrarSala(sala!.id);
    toast({
      title: "Sala encerrada",
      description:
        sala!.porta === "privada"
          ? "Sala privada não deixa rastro — a conversa não ficou guardada."
          : "A conversa ficou guardada no livro, no minuto de cada fala.",
    });
    navigate(ultimaTelaNavegavel(), { replace: true });
  }

  return (
    /*
      `h-[100dvh]` + `overflow-hidden`, e não `min-h-screen`: numa sala o chat
      cresce sozinho, e com altura mínima a página inteira passava a rolar — o
      campo de escrever saía da vista bem na hora em que a conversa esquenta.
      Aqui quem rola é só a lista de falas, e o campo fica sempre no lugar.
    */
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#141414] text-white"
      data-testid="sala-ao-vivo"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Cabeçalho                                                         */}
      {/* ---------------------------------------------------------------- */}
      {/*
        **A seta para baixo minimiza, não sai** — a mesma gramática do player
        (ROTEIRO §4.81). O Matheus cobrou isso no primeiro uso: entrar na sala
        prendia a pessoa lá dentro. Agora fechar a tela deixa você **dentro da
        sala**, com a barrinha do rodapé provando isso, e sair virou ação
        explícita, embaixo.

        ⚠️ **Devolve para a última tela com menu, nunca para o player.** A
        primeira versão minimizava indo para o player — que também é tela cheia
        —, e as duas passaram a se empurrar uma para a outra: *"ele fica nesse
        limbo"*. `replace` em vez de empilhar, para o voltar do navegador não
        trazer a sala de volta. A regra mora em `lib/navegacao.ts`.
      */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <button
          onClick={() => navigate(ultimaTelaNavegavel(), { replace: true })}
          className="text-white/55 transition-colors hover:text-white"
          aria-label="Minimizar a sala"
          data-testid="button-minimizar-sala"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
        <span className="flex-1 text-center text-[11px] font-bold uppercase tracking-[0.13em] text-white/35">
          {euMando ? "Sua sala" : "Sala ao vivo"}
        </span>
        <span className="w-6" />
      </div>

      <div className="mx-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 ring-1 ring-inset ring-red-500/30">
        <span className="relative flex h-2 w-2 shrink-0">
          {!encerrada && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-[10.5px] font-extrabold tracking-[0.12em] text-red-300">
          {encerrada ? "ENCERRADA" : "AO VIVO"}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11.5px] text-white/55">
          {euMando ? "sua transmissão" : `Sala de ${anfitriao?.name ?? "alguém"}`} ·{" "}
          {sala.presentes.length} ouvindo
        </span>
        <Presentes slugs={sala.presentes} />
      </div>

      {/* Quem foi chamado e ainda não chegou. Some sozinho conforme entram —
          sem isto, a sala privada recém-aberta parecia um erro: uma pessoa
          dentro e nenhum sinal de que alguém foi convidado. */}
      {euMando && (sala.convidados?.length ?? 0) > 0 && (
        <p className="mx-4 mt-2 text-[10.5px] text-white/30" data-testid="esperando-convidados">
          esperando{" "}
          {sala.convidados!
            .map((slug) => findMember(slug)?.name ?? slug)
            .join(", ")}
          …
        </p>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* O livro e a situação                                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col items-center px-6 pt-5">
        {book && (
          <Link href={`/book/${book.id}`} data-testid="link-livro-da-sala">
            <img
              src={book.cover}
              alt={book.title}
              className={`rounded-xl object-cover shadow-2xl transition-all ${
                chatAberto ? "h-28 w-28" : "h-44 w-44"
              }`}
            />
          </Link>
        )}
        <h1 className="mt-3 text-center font-display text-[17px] font-bold leading-tight">
          {book?.title ?? "Livro"}
        </h1>
        <p className="mt-0.5 text-[11.5px] text-white/35">{book?.narrator}</p>
      </div>

      {/*
        A situação de quem assiste (§4.81). Pedido explícito do Matheus, e ele
        corrigiu um erro do meu desenho: eu tinha tirado a barra de quem não
        controla e, junto com o controle, tirei a informação. Perder o controle é
        a regra; perder o mapa era defeito.
      */}
      <div className="px-6 pt-4" data-testid="situacao-da-sala">
        <div className="text-center">
          <div className="font-display text-[15px] font-bold">
            Capítulo {situacao.capitulo}
            <span className="ml-1.5 text-[11px] font-normal text-white/30">
              de {situacao.totalDeCapitulos}
            </span>
          </div>
          {/* O `chapters.ts` gera título genérico ("Capítulo 7"); repetir isso
              embaixo do número seria linha morta. Só aparece quando o livro tem
              nome de capítulo de verdade. */}
          {situacao.tituloDoCapitulo !== `Capítulo ${situacao.capitulo}` && (
            <div className="mt-0.5 truncate text-[11.5px] text-white/35">
              {situacao.tituloDoCapitulo}
            </div>
          )}
        </div>

        <div className="relative mt-3.5 h-[3px] rounded-full bg-white/[0.13]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${Math.min(100, (situacao.posicaoSec / situacao.totalSec) * 100)}%` }}
          />
          <div
            className="absolute -top-[3.5px] h-2.5 w-2.5 rounded-full bg-white"
            style={{
              left: `calc(${Math.min(100, (situacao.posicaoSec / situacao.totalSec) * 100)}% - 5px)`,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/30">
          <span>{formatarPosicao(situacao.posicaoSec)}</span>
          <span>−{formatarPosicao(Math.max(0, situacao.totalSec - situacao.posicaoSec))}</span>
        </div>

        <div className="mx-auto mt-2.5 flex w-fit items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[10.5px] text-white/55">
          <span>⏳</span>
          <span>
            faltam <b className="text-white">{faltaEmTexto(situacao.faltaParaVirarSec)}</b>{" "}
            {/* No último capítulo não existe "próximo" — dizer "cap. 12" num
                livro de 11 seria mentira visível. */}
            {situacao.capitulo < situacao.totalDeCapitulos
              ? `para o cap. ${situacao.capitulo + 1}`
              : "para o fim do livro"}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Controles — ou o cadeado                                          */}
      {/* ---------------------------------------------------------------- */}
      {euMando && !encerrada ? (
        <>
          <div className="flex items-center justify-center gap-6 pt-3">
            <button
              onClick={() => mandarNoAudio(sala.id, { posicaoSec: Math.max(0, posicaoAgora(sala) - 15) })}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-[11px] font-bold text-white/60"
              data-testid="button-voltar-15"
            >
              −15
            </button>
            <button
              onClick={() => mandarNoAudio(sala.id, { tocando: !sala.tocando })}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-black"
              data-testid="button-tocar-pausar-sala"
            >
              {sala.tocando ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
            </button>
            <button
              onClick={() => mandarNoAudio(sala.id, { posicaoSec: posicaoAgora(sala) + 15 })}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-[11px] font-bold text-white/60"
              data-testid="button-avancar-15"
            >
              +15
            </button>
          </div>
          <p className="mx-6 mt-3 rounded-xl bg-primary/[0.09] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-orange-300 ring-1 ring-inset ring-primary/25">
            Você manda na sala. <b className="text-white">Pausar, voltar, adiantar e encerrar</b>{" "}
            {sala.presentes.length === 1
              ? "valem para quem entrar."
              : `valem para as ${sala.presentes.length} pessoas.`}
          </p>
        </>
      ) : (
        <div className="mt-3 flex items-center justify-center gap-1.5 px-6 text-[10.5px] text-white/30">
          <Lock className="h-3 w-3" />
          <span>
            {encerrada
              ? "a transmissão terminou"
              : "o áudio é do anfitrião — você acompanha, não controla"}
          </span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* O chat corrido                                                    */}
      {/* ---------------------------------------------------------------- */}
      {chatAberto ? (
        <ChatDaSala
          sala={sala}
          falas={falas}
          texto={texto}
          onTexto={setTexto}
          onEnviar={enviar}
          onRecolher={recolher}
          encerrada={encerrada}
        />
      ) : (
        <button
          onClick={() => setChatAberto(true)}
          className="mx-4 mb-4 mt-auto flex items-center gap-2.5 rounded-2xl bg-white/[0.05] px-3.5 py-3 text-left ring-1 ring-inset ring-white/10"
          data-testid="button-abrir-chat"
        >
          <MessageCircle className="h-4 w-4 shrink-0 text-white/45" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold">Conversa recolhida</span>
            <span className="mt-0.5 block text-[10.5px] text-white/35">
              {novasNoRecolhido > 0
                ? `${novasNoRecolhido} ${novasNoRecolhido === 1 ? "fala nova" : "falas novas"} · toque para abrir`
                : "toque para abrir"}
            </span>
          </span>
          {novasNoRecolhido > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-extrabold text-black">
              {novasNoRecolhido}
            </span>
          )}
        </button>
      )}

      {/* Sair é ação explícita, e é diferente de minimizar. Para o anfitrião a
          saída é encerrar — a sala é dele e não sobrevive sem ele. */}
      {!encerrada &&
        (euMando ? (
          <button
            onClick={encerrar}
            className="mx-4 mb-5 rounded-xl bg-red-500/[0.14] py-3 text-[13px] font-bold text-red-300 ring-1 ring-inset ring-red-500/30"
            data-testid="button-encerrar-sala"
          >
            Encerrar a sala
          </button>
        ) : (
          <button
            onClick={sair}
            className="mx-4 mb-5 rounded-xl bg-white/[0.05] py-3 text-[13px] font-semibold text-white/55 ring-1 ring-inset ring-white/10"
            data-testid="button-sair-da-sala"
          >
            Sair da sala
          </button>
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** As bolinhas de quem está dentro. */
function Presentes({ slugs }: { slugs: string[] }) {
  const mostrar = slugs.slice(0, 3);
  const resto = slugs.length - mostrar.length;

  return (
    <span className="flex shrink-0">
      {mostrar.map((slug, i) => {
        const membro = findMember(slug);
        const nome = slug === EU ? "Você" : membro?.name ?? slug;
        return (
          <span
            key={slug}
            className={`flex h-[21px] w-[21px] items-center justify-center rounded-full border-2 border-[#141414] bg-gradient-to-br text-[9px] font-bold text-black ${
              membro?.color ?? "from-primary to-amber-500"
            } ${i > 0 ? "-ml-1.5" : ""}`}
            {...avatarDeLeitor(slug)}
            title={nome}
          >
            {nome.charAt(0)}
          </span>
        );
      })}
      {resto > 0 && (
        <span className="-ml-1.5 flex h-[21px] w-[21px] items-center justify-center rounded-full border-2 border-[#141414] bg-white/15 text-[8.5px] font-bold text-white">
          +{resto}
        </span>
      )}
    </span>
  );
}

/**
 * O chat. **Corrido de propósito** — a decisão está na §4.81 e no cabeçalho
 * deste arquivo. As falas entram quando a transmissão passa pelo segundo delas.
 */
function ChatDaSala({
  sala,
  falas,
  texto,
  onTexto,
  onEnviar,
  onRecolher,
  encerrada,
}: {
  sala: Sala;
  falas: FalaDaSala[];
  texto: string;
  onTexto: (v: string) => void;
  onEnviar: () => void;
  onRecolher: () => void;
  encerrada: boolean;
}) {
  const fim = useRef<HTMLDivElement>(null);
  const perfil = readProfile();

  /* Chat corrido rola sozinho para a última fala — senão a conversa "acontece"
     fora da vista e a sala parece morta. */
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [falas.length]);

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-white/10">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <h2 className="flex-1 text-[11px] font-bold uppercase tracking-[0.13em] text-white/35">
          Conversa da sala
        </h2>
        <span className="text-[10.5px] text-white/25">só aqui dentro</span>
        <button
          onClick={onRecolher}
          className="ml-1 text-white/30 transition-colors hover:text-white/70"
          aria-label="Recolher a conversa"
          data-testid="button-recolher-chat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4">
        {falas.length === 0 && (
          <p className="py-6 text-center text-[11.5px] leading-relaxed text-white/25">
            Ninguém falou ainda.
            <br />
            Comente em cima da transmissão — todo mundo está no mesmo segundo.
          </p>
        )}

        {falas.map((fala) => {
          const membro = findMember(fala.autor);
          const souEu = fala.autor === EU;
          const nome = souEu ? perfil.name || "Você" : membro?.name ?? fala.autor;
          const ehAnfitriao = fala.autor === sala.anfitriao;

          return (
            <div key={fala.id} className="flex items-start gap-2" data-testid={`fala-${fala.id}`}>
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-black ${
                  membro?.color ?? "from-primary to-amber-500"
                }`}
                {...avatarDeLeitor(souEu ? undefined : fala.autor)}
              >
                {nome.charAt(0)}
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white/80">
                  {nome}
                  {ehAnfitriao && (
                    <span className="ml-1.5 text-[9px] font-extrabold tracking-[0.08em] text-primary">
                      ANFITRIÃO
                    </span>
                  )}
                </div>
                <div className="mt-px text-[12.5px] leading-snug text-white/60">{fala.texto}</div>
              </div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>

      {!encerrada && (
        /*
          **Sem botões de reação, e o argumento é do Matheus** (31/07): *"se ela
          já pode digitar um monte deles, então não faz sentido ter botão de
          reação"*. Eu tinha posto dois emojis fixos ao lado do campo; dois é
          escolha arbitrária minha, e o teclado já dá todos. Era redundância com
          cara de recurso.
        */
        <div className="mx-4 mb-4 mt-2.5">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.055] px-3.5 py-2.5 ring-1 ring-inset ring-white/10">
            <input
              value={texto}
              onChange={(e) => onTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onEnviar()}
              placeholder="Escreva na sala…"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/30"
              data-testid="input-fala-da-sala"
            />
            <button
              onClick={onEnviar}
              className="text-primary disabled:text-white/20"
              disabled={!texto.trim()}
              aria-label="Enviar"
              data-testid="button-enviar-fala"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
