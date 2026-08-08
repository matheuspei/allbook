import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Lock } from "lucide-react";

import AnexarTrecho from "@/components/AnexarTrecho";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import Reacoes from "@/components/comunidade/Reacoes";
import EscolherCapa from "@/components/forum/EscolherCapa";
import {
  AvatarDoForum,
  Bloco,
  BotaoDoForum,
  CAMPO,
  CartazDoTopico,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { catalog } from "@/lib/books";
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
  definirCapaDoTopico,
  fioDo,
  responder,
  tituloDoTopico,
  type CapaDeTopico,
  type RespostaNaTela,
  type TopicoNaTela,
} from "@/lib/grupos";

/** O Orkut paginava o fórum de 10 em 10. */
const POR_PAGINA = 10;

/**
 * Um tópico (`/forum/:id/topico/:topicoId`) — **o fórum do Orkut**.
 *
 * ⚠️ **A forma desta lista é decisão, não estilo** (§4.74, refeita em §4.77). Ao
 * trocar a pele em 31/07 eu transformei cada mensagem numa **bolha de chat com
 * avatar ao lado**, e isso é outra coisa: bolha é conversa de duas pessoas
 * passando; fórum é uma **lista numerada** que várias pessoas leem depois e
 * citam pelo número.
 *
 * **A estrutura, e ela é para ficar:**
 *
 * - cada mensagem é uma **linha da lista**, separada por um filete;
 * - à esquerda, a **coluna estreita** com o número, a foto e nada mais;
 * - à direita, o nome (link), a **data alinhada à direita**, o texto, o trecho
 *   citado e as ações;
 * - no fim, **a paginação de 10 em 10** e a caixa de responder.
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
          <Bloco titulo="Tópico">
            <p className="text-[13px] text-white/55">Este tópico não existe mais.</p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${grupoId}`}>« voltar para a comunidade</LinkDoForum>
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
          <Bloco titulo="Comunidade privada">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa desta comunidade lê os tópicos dela.
            </p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${grupoId}`}>« ver a comunidade</LinkDoForum>
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
        {/* A trilha, como no Orkut: comunidade › tópico. */}
        <p className="mb-2 text-[11px] text-white/35">
          <Link href={`/forum/${grupoId}`} className="text-primary">
            {grupo.nome}
          </Link>
          {" › "}
          <span>{topico.titulo}</span>
        </p>

        <CapaDoFio topico={topico} emoji={grupo.emoji} podeEditar={topico.meu || modero} />

        {/* **O cartaz já diz o título — o bloco não repete.** Com capa, o título
            aparecia três vezes na mesma tela (trilha, cartaz e este cabeçalho);
            sem capa, este é o único lugar que o mostra em tamanho de título. */}
        <Bloco
          titulo={topico.imagem || topico.bookId ? "Mensagens" : topico.titulo}
          testid="fio-do-topico"
          acao={
            <span className="text-[10.5px] text-white/35">
              {fio.length} {fio.length === 1 ? "mensagem" : "mensagens"}
            </span>
          }
        >
          {fio.length === 0 ? (
            <p className="text-[13px] text-white/40">
              Nenhuma mensagem ainda. Seja o primeiro a escrever.
            </p>
          ) : (
            <div>
              {visiveis.map((resposta, indice) => {
                const numero = pagina * POR_PAGINA + indice + 1;
                const nome = resposta.minha ? "Você" : (resposta.autor?.name ?? "Alguém");
                const coberta = resposta.spoiler && !revelados.includes(resposta.id);
                const href = resposta.minha ? "/profile" : `/user/${resposta.autor?.slug ?? ""}`;

                return (
                  <div
                    key={resposta.id}
                    className="flex gap-2.5 border-b border-white/[0.06] py-2.5 last:border-0"
                    data-testid={`resposta-${resposta.id}`}
                  >
                    {/* A coluna da esquerda do Orkut: número e foto. */}
                    <div className="w-[44px] shrink-0 text-center">
                      <span className="mb-1 block text-[9.5px] text-white/25">{numero}</span>
                      <Link href={href}>
                        <AvatarDoForum
                          nome={nome}
                          slug={resposta.autor?.slug}
                          src={resposta.minha ? perfil.photo : undefined}
                          cor={resposta.autor?.color}
                          tamanho={40}
                        />
                      </Link>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2">
                        <Link href={href} className="text-[13px] font-semibold hover:text-primary">
                          {nome}
                        </Link>
                        <span className="shrink-0 text-[10.5px] text-white/25">
                          {new Date(resposta.date).toLocaleDateString("pt-BR")}
                        </span>
                      </p>

                      {coberta ? (
                        <LinkDoForum
                          onClick={() => setRevelados((atual) => [...atual, resposta.id])}
                          testid={`revelar-${resposta.id}`}
                        >
                          [mensagem marcada como spoiler — toque para ler]
                        </LinkDoForum>
                      ) : (
                        <>
                          {resposta.texto && (
                            <p className="mt-0.5 whitespace-pre-line text-[13.5px] leading-relaxed text-white/80">
                              {resposta.texto}
                            </p>
                          )}
                          {resposta.citacao && (
                            <div className="mt-1.5">
                              <CitacaoDeAudio citacao={resposta.citacao} />
                            </div>
                          )}
                          <div className="mt-1">
                            <Reacoes id={resposta.id} deOutraPessoa={!resposta.minha} />
                          </div>
                        </>
                      )}

                      {/* As ações em linha de links, como as de lá. */}
                      <p className="mt-1 flex flex-wrap gap-3">
                        {resposta.minha && (
                          <LinkDoForum
                            onClick={() => {
                              apagarMinhaResposta(resposta.id);
                              toast({ title: "Mensagem apagada" });
                            }}
                            className="text-[10.5px] text-white/30 hover:text-destructive"
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
                              {resposta.spoiler ? "descobrir" : "marcar como spoiler"}
                            </LinkDoForum>
                            <LinkDoForum
                              onClick={() => {
                                alternarRespostaEscondida(grupoId, resposta.id);
                                toast({
                                  title: "Mensagem removida",
                                  description: "Sai do fórum para todo mundo.",
                                });
                              }}
                              className="text-[10.5px] text-white/30 hover:text-destructive"
                              testid={`esconder-resposta-${resposta.id}`}
                            >
                              remover
                            </LinkDoForum>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* A paginação numerada, no fim da lista — como no fórum de lá. */}
              {paginas > 1 && (
                <p className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
                  <span className="text-[10.5px] text-white/35">páginas:</span>
                  {Array.from({ length: paginas }, (_, n) => (
                    <button
                      key={n}
                      onClick={() => setPagina(n)}
                      className={`text-[11.5px] font-semibold transition-colors ${
                        n === pagina ? "text-white" : "text-primary hover:opacity-80"
                      }`}
                      data-testid={`pagina-${n + 1}`}
                    >
                      {n + 1}
                    </button>
                  ))}
                </p>
              )}
            </div>
          )}
        </Bloco>

        {/* Responder — no fim do fio, como no Orkut. */}
        {dentro ? (
          <Bloco titulo="Responder" testid="topico-composer">
            <textarea
              value={texto}
              onChange={(evento) => setTexto(evento.target.value.slice(0, MAX_RESPOSTA))}
              rows={4}
              className={`${CAMPO} resize-none leading-relaxed`}
              data-testid="topico-input"
            />
            <div className="mt-2">
              <AnexarTrecho citacao={trecho} onEscolher={setTrecho} />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <BotaoDoForum
                primario
                onClick={publicar}
                disabled={texto.trim().length === 0 && !trecho}
                testid="topico-publish"
              >
                Enviar mensagem
              </BotaoDoForum>
              <span className="text-[10.5px] text-white/25">
                {texto.length}/{MAX_RESPOSTA}
              </span>
            </div>
          </Bloco>
        ) : (
          <Bloco titulo="Responder">
            <p className="text-[13px] leading-relaxed text-white/55">
              Só quem participa da comunidade escreve aqui.{" "}
              <LinkDoForum href={`/forum/${grupoId}`}>participar da comunidade »</LinkDoForum>
            </p>
          </Bloco>
        )}

        <p className="mt-3 text-center">
          <LinkDoForum href={`/forum/${grupoId}`}>« voltar para a comunidade</LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}

/**
 * **A capa no topo do fio** (ROTEIRO §4.91) — e o lugar de trocá-la.
 *
 * ---
 *
 * **Duas regras que decidem quando ela aparece:**
 *
 * 1. **Sem capa, sem banner.** Um retângulo cinza dizendo "este tópico não tem
 *    imagem" é a praga que a §4.40 varreu do app inteiro. Quem pode pôr uma vê o
 *    link discreto; quem não pode não vê nada.
 * 2. **A capa de livro é clicável e leva ao livro.** É o que a torna informação
 *    em vez de enfeite: dali dá para ir ouvir o que a conversa está discutindo.
 */
function CapaDoFio({
  topico,
  emoji,
  podeEditar,
}: {
  topico: TopicoNaTela;
  emoji?: string;
  podeEditar: boolean;
}) {
  const { toast } = useToast();
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<CapaDeTopico>({});

  const livro = topico.bookId ? catalog.find((item) => item.id === topico.bookId) : undefined;
  const temCapa = Boolean(topico.imagem || livro);

  function abrir() {
    setRascunho({
      ...(topico.imagem ? { imagem: topico.imagem } : {}),
      ...(topico.bookId ? { bookId: topico.bookId } : {}),
    });
    setEditando(true);
  }

  if (editando) {
    return (
      <Bloco titulo="Capa do tópico" testid="editar-capa-do-topico">
        <EscolherCapa
          capa={rascunho}
          onMudar={setRascunho}
          emoji={emoji}
          semente={topico.id}
          lado={64}
        />
        <div className="mt-3 flex items-center gap-2">
          <BotaoDoForum
            primario
            onClick={() => {
              if (definirCapaDoTopico(topico.grupoId, topico.id, rascunho)) {
                toast({ title: "Capa salva" });
                setEditando(false);
              }
            }}
            testid="salvar-capa"
          >
            Salvar capa
          </BotaoDoForum>
          <BotaoDoForum onClick={() => setEditando(false)}>Cancelar</BotaoDoForum>
        </div>
      </Bloco>
    );
  }

  if (!temCapa) {
    /* Sem capa: só quem pode pôr uma vê o convite, e ele é uma linha de texto. */
    return podeEditar ? (
      <p className="mb-3">
        <LinkDoForum onClick={abrir} testid="por-capa">
          pôr uma capa neste tópico »
        </LinkDoForum>
      </p>
    ) : null;
  }

  return (
    <div className="mb-3 overflow-hidden rounded-2xl ring-1 ring-white/10" data-testid="capa-do-fio">
      <CartazDoTopico
        imagem={topico.imagem}
        capaDoLivro={livro?.cover}
        emoji={emoji}
        semente={topico.id}
      >
        <p className="font-display text-[15px] font-bold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          {topico.titulo}
        </p>
        <p className="mt-1 text-[10.5px] text-white/50">
          por {topico.meu ? "Você" : (topico.autor?.name ?? "alguém")} ·{" "}
          {topico.totalRespostas} {topico.totalRespostas === 1 ? "mensagem" : "mensagens"}
        </p>
      </CartazDoTopico>

      {(livro || podeEditar) && (
        <div className="flex items-center justify-between gap-3 bg-white/[0.04] px-3 py-2">
          {livro ? (
            <Link
              href={`/book/${livro.id}`}
              className="min-w-0 truncate text-[11.5px] text-white/55 hover:text-primary"
              data-testid="livro-do-topico"
            >
              sobre <span className="font-semibold text-white/80">{livro.title}</span>, de{" "}
              {livro.author}
            </Link>
          ) : (
            <span />
          )}
          {podeEditar && (
            <LinkDoForum
              onClick={abrir}
              className="shrink-0 text-[10.5px] text-white/35 hover:text-white/70"
              testid="trocar-capa"
            >
              trocar capa
            </LinkDoForum>
          )}
        </div>
      )}
    </div>
  );
}
