import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Plus, Settings2, Flag, ChevronRight, MessageSquare, Pin, Lock } from "lucide-react";

import { Enquetes, Eventos } from "@/components/forum/ConteudoDaComunidade";
import {
  AvatarDoForum,
  Bloco,
  BotaoDoForum,
  CAMPO,
  Campo,
  CapaDaComunidade,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import {
  capaDaComunidade,
  configDo,
  criadaEm,
  desistirDoPedido,
  donoDo,
  filaDe,
  foiExcluido,
  forumNaTela,
  membrosDo,
  pedirEntrada,
  porExtenso,
  possoCriar,
  possoLer,
  situacaoDe,
  souModerador,
} from "@/lib/forum";
import {
  MAX_TITULO,
  GRUPOS_EVENT,
  alternarParticipacao,
  alternarFixado,
  alternarTopicoEscondido,
  apagarMeuTopico,
  criarTopico,
  topicosDa,
  type TopicoNaTela,
} from "@/lib/grupos";

/**
 * A página de uma **comunidade** (`/forum/:id`).
 *
 * **A estrutura é a do Orkut; a pele é a do AllBook** (§4.74, e a virada do fim
 * do mesmo dia). A ordem da informação continua a de lá — ficha com imagem à
 * esquerda e os campos `categoria / criada em / dono / tipo / idioma`, depois
 * membros, tópicos, enquetes e eventos —, mas desenhada com as peças da casa:
 * cartão escuro, laranja, avatares redondos.
 *
 * Toda a governança continua em `lib/forum.ts` e não foi tocada na troca de pele:
 * entrar depende de a comunidade ser **aberta, moderada ou fechada**, e
 * comunidade **privada** não se lê de fora.
 */
export default function Grupo() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const id = params.id ?? "";

  const [grupo, setGrupo] = useState(() => forumNaTela(id));
  const [topicos, setTopicos] = useState<TopicoNaTela[]>([]);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      setGrupo(forumNaTela(id));
      setTopicos(topicosDa(id));
      setVersao((n) => n + 1);
    };
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [id]);

  if (!grupo || foiExcluido(id)) {
    return (
      <PaginaDoForum titulo="Comunidade" voltarPara="/forum" testid="grupo-missing">
        <div className="px-5 pt-4">
          <Bloco>
            <p className="text-[13px] leading-relaxed text-white/55">
              Esta comunidade não existe mais — ela pode ter sido excluída pelo dono.
            </p>
            <div className="mt-3">
              <LinkDoForum href="/forum">Ver todas as comunidades</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  const config = configDo(id);
  const situacao = situacaoDe(id);
  const dentro = situacao === "dentro";
  const membros = membrosDo(id);
  const moderadores = membros.filter((m) => m.papel === "moderador");
  const dono = donoDo(id);
  const fila = souModerador(id) ? filaDe(id) : [];
  const podeLer = possoLer(id);

  function entrar() {
    if (situacao === "livre") {
      alternarParticipacao(id);
      toast({ title: `Você entrou em ${grupo!.nome}` });
    } else if (situacao === "pedir") {
      pedirEntrada(id);
      toast({ title: "Pedido enviado", description: "Um moderador precisa aprovar." });
    } else if (situacao === "esperando") {
      desistirDoPedido(id);
      toast({ title: "Pedido cancelado" });
    } else if (situacao === "dentro") {
      alternarParticipacao(id);
      toast({ title: `Você saiu de ${grupo!.nome}` });
    }
  }

  const rotuloDoBotao: Record<typeof situacao, string> = {
    dentro: "Participando",
    livre: "Participar",
    pedir: "Pedir para entrar",
    esperando: "Pedido enviado",
    "so-convidado": "Só por convite",
    banido: "Você foi banido",
  };
  const bloqueado = situacao === "banido" || situacao === "so-convidado";

  return (
    <PaginaDoForum
      titulo={grupo.nome}
      voltarPara="/forum"
      testid="grupo-page"
      acao={
        souModerador(id) ? (
          <Link
            href={`/forum/${id}/gerenciar`}
            className="relative rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Gerenciar comunidade"
            data-testid="grupo-gerenciar"
          >
            <Settings2 className="h-5 w-5" />
            {fila.length > 0 && (
              <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-black">
                {fila.length}
              </span>
            )}
          </Link>
        ) : undefined
      }
    >
      <div className="px-5 pt-4" key={versao}>
        {/* ---------------- a ficha ---------------- */}
        <div className="mb-4" data-testid="ficha-da-comunidade">
          <div className="flex gap-3.5">
            <CapaDaComunidade
              imagem={config.imagem}
              foto={capaDaComunidade(id)}
              emoji={grupo.emoji}
              lado={92}
              testid="imagem-da-comunidade"
            />

            <div className="min-w-0 flex-1">
              <h1
                className="font-display text-xl font-bold leading-tight tracking-tight"
                data-testid="nome-da-comunidade"
              >
                {grupo.nome}
              </h1>
              <p className="mt-1 text-[11.5px] text-white/40">
                {membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}
                {config.categoria && ` · ${config.categoria}`}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                <BotaoDoForum
                  primario={!dentro && !bloqueado}
                  onClick={bloqueado ? undefined : entrar}
                  disabled={bloqueado}
                  testid="grupo-join"
                >
                  {bloqueado && <Lock className="mr-1 inline h-3 w-3 align-[-1px]" />}
                  {rotuloDoBotao[situacao]}
                </BotaoDoForum>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-white/60">{grupo.descricao}</p>

          {/* Os campos da ficha — os mesmos do Orkut, na mesma ordem. */}
          <div className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
            <Campo rotulo="criada em">{porExtenso(criadaEm(id))}</Campo>
            <Campo rotulo="dono">
              {dono === EU ? (
                <Link href="/profile" className="text-primary">
                  Você
                </Link>
              ) : (
                <Link href={`/user/${dono}`} className="text-primary">
                  {findMember(dono)?.name ?? "Alguém"}
                </Link>
              )}
            </Campo>
            {moderadores.length > 0 && (
              <Campo rotulo="moderadores">
                {moderadores.map((m, i) => (
                  <span key={m.slug}>
                    {i > 0 && ", "}
                    <Link
                      href={m.slug === EU ? "/profile" : `/user/${m.slug}`}
                      className="text-primary"
                    >
                      {m.slug === EU ? "Você" : (findMember(m.slug)?.name ?? "Alguém")}
                    </Link>
                  </span>
                ))}
              </Campo>
            )}
            <Campo rotulo="entrada">
              {config.entrada === "aberta"
                ? "aberta a todos"
                : config.entrada === "moderada"
                  ? "moderada"
                  : "só por convite"}
              {config.visibilidade === "privada" && " · privada"}
            </Campo>
            <Campo rotulo="idioma">{config.idioma ?? "Português (Brasil)"}</Campo>
          </div>

          {config.regras && (
            <div
              className="mt-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              data-testid="regras-da-comunidade"
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
                Regras da comunidade
              </p>
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-white/60">
                {config.regras}
              </p>
            </div>
          )}

          <button
            onClick={() =>
              toast({
                title: "Denúncia enviada",
                description: "Ninguém é avisado de que foi você.",
              })
            }
            className="mt-2.5 flex items-center gap-1.5 py-2 text-[11px] text-white/25 transition-colors hover:text-white/50"
            data-testid="grupo-denunciar"
          >
            <Flag className="h-3 w-3" />
            Denunciar esta comunidade
          </button>
        </div>

        {!podeLer ? (
          <Bloco testid="grupo-privado">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Esta comunidade é <b className="font-semibold text-white/80">privada</b>. Só quem
              participa vê os tópicos daqui.
            </p>
          </Bloco>
        ) : (
          <>
            {/* ---------------- membros ---------------- */}
            <Bloco
              titulo={`Membros · ${membros.length}`}
              testid="grupo-membros"
              acao={
                <LinkDoForum href={`/forum/${id}/membros`} testid="ver-todos-membros">
                  Ver todos
                </LinkDoForum>
              }
            >
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {membros.slice(0, 10).map(({ slug, papel }) => {
                  const membro = slug === EU ? undefined : findMember(slug);
                  const nome = slug === EU ? "Você" : (membro?.name ?? "Alguém");
                  return (
                    <Link
                      key={slug}
                      href={slug === EU ? "/profile" : `/user/${slug}`}
                      className="w-[52px] shrink-0 text-center"
                      data-testid={`membro-${slug}`}
                    >
                      <AvatarDoForum nome={nome} slug={slug} cor={membro?.color} tamanho={48} />
                      <span className="mt-1 block truncate text-[10.5px] text-white/55">
                        {nome.split(" ")[0]}
                      </span>
                      {papel !== "membro" && (
                        <span className="block text-[9px] font-semibold uppercase tracking-wide text-primary/80">
                          {papel === "dono" ? "dono" : "modera"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </Bloco>

            {/* ---------------- tópicos ---------------- */}
            <Bloco
              titulo="Tópicos"
              testid="grupo-topicos"
              acao={
                possoCriar(id, "topicos") ? (
                  <LinkDoForum onClick={() => setCriando((v) => !v)} testid="grupo-create-topic">
                    <Plus className="mr-0.5 inline h-3 w-3 align-[-1px]" />
                    Criar tópico
                  </LinkDoForum>
                ) : dentro ? (
                  <span className="text-[10.5px] text-white/30">só moderadores criam</span>
                ) : undefined
              }
            >
              {criando && (
                <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5" data-testid="grupo-composer">
                  <input
                    value={titulo}
                    onChange={(evento) => setTitulo(evento.target.value.slice(0, MAX_TITULO))}
                    placeholder="O título do tópico — uma pergunta funciona bem…"
                    autoFocus
                    className={CAMPO}
                    data-testid="grupo-topic-title"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-white/25">
                      {titulo.length}/{MAX_TITULO}
                    </span>
                    <div className="flex gap-2">
                      <BotaoDoForum onClick={() => setCriando(false)}>Cancelar</BotaoDoForum>
                      <BotaoDoForum
                        primario
                        disabled={titulo.trim().length === 0}
                        onClick={() => {
                          if (criarTopico(id, titulo)) {
                            setTitulo("");
                            setCriando(false);
                            toast({ title: "Tópico criado" });
                          }
                        }}
                        testid="grupo-topic-publish"
                      >
                        Publicar
                      </BotaoDoForum>
                    </div>
                  </div>
                </div>
              )}

              {topicos.length === 0 ? (
                <p className="text-[13px] text-white/40">Nenhum tópico ainda.</p>
              ) : (
                <div className="-my-1">
                  {topicos.map((topico) => (
                    <div
                      key={topico.id}
                      className="border-b border-white/[0.06] py-2.5 last:border-0"
                      data-testid={`topico-${topico.id}`}
                    >
                      <Link
                        href={`/forum/${id}/topico/${topico.id}`}
                        className="flex items-start gap-2.5"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold leading-snug">
                            {topico.fixado && (
                              <Pin className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-primary" />
                            )}
                            {topico.titulo}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-white/35">
                            <span>{topico.meu ? "Você" : (topico.autor?.name ?? "Alguém")}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {topico.totalRespostas}
                            </span>
                            <span>·</span>
                            <span>{relativeDate(topico.ultimaAtividade)}</span>
                          </span>
                        </span>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/20" />
                      </Link>

                      {(souModerador(id) || topico.meu) && (
                        <div className="mt-1 flex gap-3">
                          {souModerador(id) && !topico.meu && (
                            <>
                              <LinkDoForum
                                onClick={() => {
                                  const fixou = alternarFixado(id, topico.id);
                                  toast({ title: fixou ? "Tópico fixado" : "Tópico solto" });
                                }}
                                className="text-[10.5px] text-white/35 hover:text-white/70"
                                testid={`fixar-${topico.id}`}
                              >
                                {topico.fixado ? "soltar" : "fixar"}
                              </LinkDoForum>
                              <LinkDoForum
                                onClick={() => {
                                  alternarTopicoEscondido(id, topico.id);
                                  toast({ title: "Tópico removido do fórum" });
                                }}
                                className="text-[10.5px] text-white/35 hover:text-red-300"
                                testid={`esconder-${topico.id}`}
                              >
                                remover
                              </LinkDoForum>
                            </>
                          )}
                          {topico.meu && (
                            <LinkDoForum
                              onClick={() => {
                                apagarMeuTopico(topico.id);
                                toast({ title: "Tópico apagado" });
                              }}
                              className="text-[10.5px] text-white/35 hover:text-red-300"
                              testid={`topico-delete-${topico.id}`}
                            >
                              apagar
                            </LinkDoForum>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Bloco>

            <Enquetes grupoId={id} />
            <Eventos grupoId={id} />
          </>
        )}
      </div>
    </PaginaDoForum>
  );
}
