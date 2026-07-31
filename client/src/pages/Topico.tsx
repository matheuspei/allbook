import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Lock, Send } from "lucide-react";

import AnexarTrecho from "@/components/AnexarTrecho";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import Reacoes from "@/components/comunidade/Reacoes";
import {
  AvatarDoForum,
  Bloco,
  CAMPO,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { type Citacao } from "@/lib/citacoes";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { readProfile } from "@/lib/profile";
import { forumNaTela, possoLer, situacaoDe, souModerador } from "@/lib/forum";
import {
  MAX_RESPOSTA,
  GRUPOS_EVENT,
  alternarRespostaEscondida,
  alternarSpoiler,
  apagarMinhaResposta,
  fioDo,
  responder,
  tituloDoTopico,
  type RespostaNaTela,
} from "@/lib/grupos";

/** Herdado do Orkut, e mantido: fio longo cansa mais rolando do que paginando. */
const POR_PAGINA = 10;

/**
 * Um tópico (`/forum/:id/topico/:topicoId`).
 *
 * **A forma é a do fórum do Orkut; a pele é a do AllBook** (§4.74). O que ficou
 * de lá porque é bom: a mensagem **numerada** (dá para dizer "concordo com a 7"),
 * o autor à esquerda, a data à direita e a **paginação de 10 em 10**.
 *
 * **Moderar é remover a mensagem de qualquer um** — por baixo continua sendo
 * esconder, para o erro ter volta.
 */
export default function Topico() {
  const params = useParams<{ id: string; topicoId: string }>();
  const { toast } = useToast();
  const perfil = useMemo(readProfile, []);

  const grupoId = params.id ?? "";
  const grupo = forumNaTela(grupoId);
  const topico = tituloDoTopico(params.topicoId ?? "");

  const [fio, setFio] = useState<RespostaNaTela[]>([]);
  const [texto, setTexto] = useState("");
  const [trecho, setTrecho] = useState<Citacao | undefined>(undefined);
  const [pagina, setPagina] = useState(0);
  const [revelados, setRevelados] = useState<string[]>([]);

  useEffect(() => {
    const atualizar = () => setFio(fioDo(params.topicoId ?? ""));
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [params.topicoId]);

  if (!grupo || !topico) {
    return (
      <PaginaDoForum titulo="Tópico" voltarPara="/forum" testid="topico-missing">
        <div className="px-5 pt-4">
          <Bloco>
            <p className="text-[13px] text-white/55">Este tópico não existe mais.</p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${grupoId}`}>Voltar para a comunidade</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  if (!possoLer(grupoId)) {
    return (
      <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${grupoId}`} testid="topico-privado">
        <div className="px-5 pt-4">
          <Bloco>
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa desta comunidade lê os tópicos dela.
            </p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${grupoId}`}>Ver a comunidade</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  const modero = souModerador(grupoId);
  const dentro = situacaoDe(grupoId) === "dentro";
  const paginas = Math.max(1, Math.ceil(fio.length / POR_PAGINA));
  const visiveis = fio.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA);

  function publicar() {
    if (responder(topico!.id, texto, trecho)) {
      setTexto("");
      setTrecho(undefined);
      /* Quem responde quer ver o que escreveu: a última página é onde ela cai. */
      setPagina(Math.floor(fio.length / POR_PAGINA));
      toast({ title: "Mensagem enviada" });
    }
  }

  return (
    <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${grupoId}`} testid="topico-page">
      <div className="px-5 pt-4">
        <header className="mb-4">
          <h1 className="font-display text-lg font-bold leading-snug tracking-tight">
            {topico.titulo}
          </h1>
          <p className="mt-1 text-[11.5px] text-white/35">
            por {topico.meu ? "você" : (topico.autor?.name ?? "alguém")} ·{" "}
            <Link href={`/forum/${grupoId}`} className="text-white/50">
              {grupo.nome}
            </Link>{" "}
            · {fio.length} {fio.length === 1 ? "mensagem" : "mensagens"}
          </p>
        </header>

        {fio.length === 0 ? (
          <p className="py-6 text-[13px] text-white/35">
            Ninguém respondeu ainda — seja a primeira voz.
          </p>
        ) : (
          <div className="space-y-3">
            {visiveis.map((resposta, indice) => {
              const numero = pagina * POR_PAGINA + indice + 1;
              const nome = resposta.minha ? "Você" : (resposta.autor?.name ?? "Alguém");
              const coberta = resposta.spoiler && !revelados.includes(resposta.id);
              const href = resposta.minha ? "/profile" : `/user/${resposta.autor?.slug ?? ""}`;

              return (
                <article
                  key={resposta.id}
                  className="flex gap-2.5"
                  data-testid={`resposta-${resposta.id}`}
                >
                  <Link href={href} className="shrink-0 self-start">
                    <AvatarDoForum
                      nome={nome}
                      slug={resposta.autor?.slug}
                      src={resposta.minha ? perfil.photo : undefined}
                      cor={resposta.autor?.color}
                      tamanho={36}
                    />
                  </Link>

                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                    <p className="flex items-baseline gap-2">
                      <Link href={href} className="text-[13px] font-semibold hover:text-primary">
                        {nome}
                      </Link>
                      <span className="text-[10.5px] text-white/25">
                        {relativeDate(resposta.date)}
                      </span>
                      {/* O número da mensagem, herdado do Orkut: é o que permite
                          "concordo com a 7" numa conversa de quarenta. */}
                      <span className="ml-auto text-[10.5px] text-white/15">#{numero}</span>
                    </p>

                    {coberta ? (
                      <button
                        onClick={() => setRevelados((atual) => [...atual, resposta.id])}
                        className="mt-1.5 flex w-full items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-left text-[11.5px] text-white/45 transition-colors hover:bg-white/10"
                        data-testid={`revelar-${resposta.id}`}
                      >
                        Marcada como spoiler — toque para ler assim mesmo.
                      </button>
                    ) : (
                      <>
                        {resposta.texto && (
                          <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-white/80">
                            {resposta.texto}
                          </p>
                        )}
                        {resposta.citacao && <CitacaoDeAudio citacao={resposta.citacao} />}
                        <div className="mt-1.5">
                          <Reacoes id={resposta.id} deOutraPessoa={!resposta.minha} />
                        </div>
                      </>
                    )}

                    {(resposta.minha || modero) && (
                      <div className="mt-1 flex flex-wrap gap-3">
                        {resposta.minha && (
                          <LinkDoForum
                            onClick={() => {
                              apagarMinhaResposta(resposta.id);
                              toast({ title: "Mensagem apagada" });
                            }}
                            className="text-[10.5px] text-white/30 hover:text-red-300"
                            testid={`resposta-delete-${resposta.id}`}
                          >
                            apagar
                          </LinkDoForum>
                        )}
                        {modero && !resposta.minha && (
                          <>
                            <LinkDoForum
                              onClick={() => {
                                const cobriu = alternarSpoiler(grupoId, resposta.id);
                                toast({ title: cobriu ? "Coberta como spoiler" : "Descoberta" });
                              }}
                              className="text-[10.5px] text-white/30 hover:text-white/70"
                              testid={`spoiler-${resposta.id}`}
                            >
                              {resposta.spoiler ? "descobrir" : "marcar spoiler"}
                            </LinkDoForum>
                            <LinkDoForum
                              onClick={() => {
                                alternarRespostaEscondida(grupoId, resposta.id);
                                toast({
                                  title: "Mensagem removida",
                                  description: "Sai do fórum para todo mundo.",
                                });
                              }}
                              className="text-[10.5px] text-white/30 hover:text-red-300"
                              testid={`esconder-resposta-${resposta.id}`}
                            >
                              remover
                            </LinkDoForum>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* A paginação, com a pele da casa: pílulas em vez de números soltos. */}
        {paginas > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {Array.from({ length: paginas }, (_, n) => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={`h-7 min-w-7 rounded-full px-2 text-[11.5px] font-semibold transition-colors ${
                  n === pagina
                    ? "bg-white text-black"
                    : "border border-white/15 text-white/50 hover:text-white/80"
                }`}
                data-testid={`pagina-${n + 1}`}
              >
                {n + 1}
              </button>
            ))}
          </div>
        )}

        {/* Responder — no fim, onde a leitura termina. */}
        {dentro ? (
          <div
            className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
            data-testid="topico-composer"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={texto}
                onChange={(evento) => setTexto(evento.target.value.slice(0, MAX_RESPOSTA))}
                placeholder="Responder ao tópico…"
                rows={2}
                className={`${CAMPO} min-h-[44px] resize-none border-0 bg-transparent`}
                data-testid="topico-input"
              />
              <button
                onClick={publicar}
                disabled={texto.trim().length === 0 && !trecho}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[12px] font-bold text-black transition-opacity disabled:opacity-30"
                data-testid="topico-publish"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar
              </button>
            </div>
            <div className="mt-2 px-1">
              <AnexarTrecho citacao={trecho} onEscolher={setTrecho} />
            </div>
          </div>
        ) : (
          <Bloco>
            <p className="text-[13px] leading-relaxed text-white/55">
              Só quem participa da comunidade escreve aqui.
            </p>
            <div className="mt-2.5">
              <LinkDoForum href={`/forum/${grupoId}`}>Entrar na comunidade</LinkDoForum>
            </div>
          </Bloco>
        )}
      </div>
    </PaginaDoForum>
  );
}
