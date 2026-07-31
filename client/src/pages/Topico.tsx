import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";

import AnexarTrecho from "@/components/AnexarTrecho";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import Reacoes from "@/components/comunidade/Reacoes";
import {
  BarraOrkut,
  BotaoOrkut,
  Caixa,
  FotoOrkut,
  LinkOrkut,
  PaginaOrkut,
} from "@/components/forum/Orkut";
import { type Citacao } from "@/lib/citacoes";
import { useToast } from "@/hooks/use-toast";
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

/** O Orkut paginava o fórum de 10 em 10. */
const POR_PAGINA = 10;

/**
 * Um tópico (`/forum/:id/topico/:topicoId`) — **o fórum do Orkut**.
 *
 * Refeito em 31/07 com o resto da aba (§4.74). A forma é a de lá: cada mensagem
 * é uma **linha numerada**, com a foto quadrada do autor à esquerda, o nome em
 * azul, a data à direita e o texto embaixo. A caixa de responder fica no fim, e a
 * lista pagina **de 10 em 10** — o Orkut paginava, e num fio de quarenta
 * mensagens a rolagem infinita esconde onde a conversa está.
 *
 * **Moderar aqui é apagar de verdade a mensagem de qualquer um** (pedido do
 * Matheus, §4.74). Continua sendo *esconder* por baixo, para o erro ter volta —
 * mas quem lê vê o que o Orkut mostrava: a mensagem sai.
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
  /* Revelar é por sessão e por resposta: fechar a tela cobre tudo de novo. */
  const [revelados, setRevelados] = useState<string[]>([]);

  useEffect(() => {
    const atualizar = () => setFio(fioDo(params.topicoId ?? ""));
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [params.topicoId]);

  if (!grupo || !topico) {
    return (
      <PaginaOrkut testid="topico-missing">
        <BarraOrkut />
        <div className="p-2.5">
          <Caixa titulo="tópico">
            <p className="text-[#666]">Este tópico não existe mais.</p>
            <p className="mt-2">
              <LinkOrkut href={`/forum/${grupoId}`}>« voltar para a comunidade</LinkOrkut>
            </p>
          </Caixa>
        </div>
      </PaginaOrkut>
    );
  }

  if (!possoLer(grupoId)) {
    return (
      <PaginaOrkut testid="topico-privado">
        <BarraOrkut onde={grupo.nome} />
        <div className="p-2.5">
          <Caixa titulo="comunidade privada">
            <p className="text-[#666]">Só quem participa desta comunidade lê os tópicos dela.</p>
            <p className="mt-2">
              <LinkOrkut href={`/forum/${grupoId}`}>« ver a comunidade</LinkOrkut>
            </p>
          </Caixa>
        </div>
      </PaginaOrkut>
    );
  }

  const modero = souModerador(grupoId);
  const dentro = situacaoDe(grupoId) === "dentro";
  const paginas = Math.max(1, Math.ceil(fio.length / POR_PAGINA));
  const visiveis = fio.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA);

  function publicar() {
    const nova = responder(topico!.id, texto, trecho);
    if (nova) {
      setTexto("");
      setTrecho(undefined);
      /* Quem responde quer ver o que escreveu: a última página é onde ela cai. */
      setPagina(Math.floor(fio.length / POR_PAGINA));
      toast({ title: "Mensagem enviada" });
    }
  }

  return (
    <PaginaOrkut testid="topico-page">
      <BarraOrkut onde={`${grupo.nome} › ${topico.titulo}`} />

      <div className="p-2.5">
        <p className="mb-1.5 text-[10px] text-[#666]">
          <LinkOrkut href={`/forum/${grupoId}`}>{grupo.nome}</LinkOrkut>
          {" › "}
          <span>{topico.titulo}</span>
        </p>

        <Caixa
          titulo={topico.titulo}
          testid="fio-do-topico"
          acao={
            <span className="text-[10px] text-[#666]">
              {fio.length} {fio.length === 1 ? "mensagem" : "mensagens"}
            </span>
          }
        >
          {fio.length === 0 ? (
            <p className="text-[#666]">Nenhuma mensagem ainda. Seja o primeiro a escrever.</p>
          ) : (
            <div>
              {visiveis.map((resposta, indice) => {
                const numero = pagina * POR_PAGINA + indice + 1;
                const nome = resposta.minha ? "Você" : (resposta.autor?.name ?? "Alguém");
                const coberta = resposta.spoiler && !revelados.includes(resposta.id);

                return (
                  <div
                    key={resposta.id}
                    className="flex gap-2 border-b border-[#eee] py-2 last:border-0"
                    data-testid={`resposta-${resposta.id}`}
                  >
                    {/* A coluna da esquerda do Orkut: número, foto e nome. */}
                    <div className="w-[46px] shrink-0 text-center">
                      <span className="mb-0.5 block text-[9px] text-[#999]">{numero}</span>
                      {resposta.minha ? (
                        <Link href="/profile">
                          <FotoOrkut nome={perfil.name} src={perfil.photo} tamanho={40} />
                        </Link>
                      ) : (
                        <Link href={`/user/${resposta.autor?.slug ?? ""}`}>
                          <FotoOrkut nome={nome} tamanho={40} />
                        </Link>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2">
                        {resposta.minha ? (
                          <LinkOrkut href="/profile" className="font-bold">
                            Você
                          </LinkOrkut>
                        ) : (
                          <LinkOrkut href={`/user/${resposta.autor?.slug ?? ""}`} className="font-bold">
                            {nome}
                          </LinkOrkut>
                        )}
                        <span className="shrink-0 text-[10px] text-[#999]">
                          {new Date(resposta.date).toLocaleDateString("pt-BR")}
                        </span>
                      </p>

                      {coberta ? (
                        <LinkOrkut
                          onClick={() => setRevelados((atual) => [...atual, resposta.id])}
                          testid={`revelar-${resposta.id}`}
                        >
                          [mensagem marcada como spoiler — clique para ler]
                        </LinkOrkut>
                      ) : (
                        <>
                          {resposta.texto && (
                            <p className="mt-0.5 whitespace-pre-line leading-[1.6] text-[#333]">
                              {resposta.texto}
                            </p>
                          )}
                          {resposta.citacao && (
                            <div className="mt-1.5">
                              <CitacaoDeAudio citacao={resposta.citacao} />
                            </div>
                          )}
                          <div className="mt-1">
                            <Reacoes id={resposta.id} deOutraPessoa={!resposta.minha} claro />
                          </div>
                        </>
                      )}

                      {/* As ações em linha de links, como as do Orkut. */}
                      <p className="mt-1 flex flex-wrap gap-2.5 text-[10px]">
                        {resposta.minha && (
                          <LinkOrkut
                            onClick={() => {
                              apagarMinhaResposta(resposta.id);
                              toast({ title: "Mensagem apagada" });
                            }}
                            testid={`resposta-delete-${resposta.id}`}
                          >
                            apagar
                          </LinkOrkut>
                        )}
                        {modero && !resposta.minha && (
                          <>
                            <LinkOrkut
                              onClick={() => {
                                const cobriu = alternarSpoiler(grupoId, resposta.id);
                                toast({ title: cobriu ? "Coberta como spoiler" : "Descoberta" });
                              }}
                              testid={`spoiler-${resposta.id}`}
                            >
                              {resposta.spoiler ? "descobrir" : "marcar spoiler"}
                            </LinkOrkut>
                            <LinkOrkut
                              onClick={() => {
                                alternarRespostaEscondida(grupoId, resposta.id);
                                toast({
                                  title: "Mensagem removida",
                                  description: "Sai do fórum para todo mundo.",
                                });
                              }}
                              testid={`esconder-resposta-${resposta.id}`}
                            >
                              remover
                            </LinkOrkut>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* A paginação numerada do Orkut. */}
              {paginas > 1 && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#eee] pt-2 text-[10px]">
                  <span className="text-[#666]">páginas:</span>
                  {Array.from({ length: paginas }, (_, n) => (
                    <button
                      key={n}
                      onClick={() => setPagina(n)}
                      className={
                        n === pagina
                          ? "font-bold text-[#333]"
                          : "text-[#1a4fa0] hover:underline"
                      }
                      data-testid={`pagina-${n + 1}`}
                    >
                      {n + 1}
                    </button>
                  ))}
                </p>
              )}
            </div>
          )}
        </Caixa>

        {/* Responder — no Orkut a caixa ficava no fim do fio. */}
        {dentro ? (
          <Caixa titulo="responder" testid="topico-composer">
            <textarea
              value={texto}
              onChange={(evento) => setTexto(evento.target.value.slice(0, MAX_RESPOSTA))}
              rows={4}
              className="w-full resize-none border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] leading-[1.6] text-[#333] focus:border-[#5b7ab5] focus:outline-none"
              data-testid="topico-input"
            />
            <div className="mt-1.5">
              <AnexarTrecho citacao={trecho} onEscolher={setTrecho} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <BotaoOrkut
                primario
                onClick={publicar}
                disabled={texto.trim().length === 0 && !trecho}
                testid="topico-publish"
              >
                enviar mensagem
              </BotaoOrkut>
              <span className="text-[10px] text-[#999]">
                {texto.length}/{MAX_RESPOSTA}
              </span>
            </div>
          </Caixa>
        ) : (
          <Caixa titulo="responder">
            <p className="text-[#666]">
              Só quem participa da comunidade escreve aqui.{" "}
              <LinkOrkut href={`/forum/${grupoId}`}>entrar na comunidade »</LinkOrkut>
            </p>
          </Caixa>
        )}

        <p className="mt-2 text-center text-[10px]">
          <LinkOrkut href={`/forum/${grupoId}`}>« voltar para a comunidade</LinkOrkut>
        </p>
      </div>
    </PaginaOrkut>
  );
}
