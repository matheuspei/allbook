import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import {
  BarraOrkut,
  BotaoOrkut,
  Caixa,
  Campo,
  FotoOrkut,
  LinkOrkut,
  PaginaOrkut,
} from "@/components/forum/Orkut";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import {
  configDo,
  criadaEm,
  desistirDoPedido,
  donoDo,
  ehModerador,
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
 * A página de uma **comunidade** (`/forum/:id`) — o layout do Orkut.
 *
 * Refeita em 31/07 a pedido do Matheus: *"a gente vai fazer tudo tal e como era
 * no Orkut… esquece o aplicativo"*. A ordem da informação é a de lá, de cima para
 * baixo: **a ficha** (imagem quadrada à esquerda, nome, descrição e os campos
 * `categoria / criada em / dono / tipo / idioma / membros`), **os links de ação**
 * em lista com «», **a grade de membros** e **a tabela de tópicos**.
 *
 * O que mudou junto (e mora em `lib/forum.ts`): entrar deixou de ser sempre um
 * toque — depende de a comunidade ser **aberta, moderada ou fechada** —, e
 * comunidade **privada** não se lê de fora.
 */
export default function Grupo() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
      <PaginaOrkut testid="grupo-missing">
        <BarraOrkut />
        <div className="p-3">
          <Caixa titulo="comunidade">
            <p className="text-[#666]">
              Esta comunidade não existe mais. Ela pode ter sido excluída pelo dono.
            </p>
            <p className="mt-2">
              <LinkOrkut href="/forum">« voltar para as comunidades</LinkOrkut>
            </p>
          </Caixa>
        </div>
      </PaginaOrkut>
    );
  }

  const config = configDo(id);
  const situacao = situacaoDe(id);
  const dentro = situacao === "dentro";
  const membros = membrosDo(id);
  const moderadores = membros.filter((m) => m.papel === "moderador");
  const dono = donoDo(id);
  const fila = souModerador(id) ? filaDe(id) : [];

  /* Comunidade privada não se lê de fora — a ficha aparece, o conteúdo não.
     É o comportamento do Orkut, e é o que dá sentido a "moderada". */
  const podeLer = possoLer(id);

  function entrar() {
    if (situacao === "livre") {
      alternarParticipacao(id);
      toast({ title: `Você entrou em ${grupo!.nome}` });
      return;
    }
    if (situacao === "pedir") {
      pedirEntrada(id);
      toast({
        title: "Pedido enviado",
        description: "Um moderador precisa aprovar a sua entrada.",
      });
      return;
    }
    if (situacao === "esperando") {
      desistirDoPedido(id);
      toast({ title: "Pedido cancelado" });
      return;
    }
    if (situacao === "dentro") {
      alternarParticipacao(id);
      toast({ title: `Você saiu de ${grupo!.nome}` });
    }
  }

  function publicarTopico() {
    const novo = criarTopico(id, titulo);
    if (novo) {
      setTitulo("");
      setCriando(false);
      toast({ title: "Tópico criado" });
    }
  }

  const rotuloDeEntrada: Record<typeof situacao, string> = {
    dentro: "sair da comunidade",
    livre: "participar desta comunidade",
    pedir: "pedir para entrar",
    esperando: "cancelar meu pedido",
    "so-convidado": "esta comunidade é fechada",
    banido: "você foi banido desta comunidade",
  };

  return (
    <PaginaOrkut testid="grupo-page">
      <BarraOrkut onde={grupo.nome} />

      <div className="p-2.5" key={versao}>
        {/* ---------------- a ficha ---------------- */}
        <Caixa titulo="comunidade" testid="ficha-da-comunidade">
          <div className="flex gap-3">
            <div className="shrink-0">
              {config.imagem ? (
                <img
                  src={config.imagem}
                  alt={grupo.nome}
                  className="h-[110px] w-[110px] border border-[#c9c9c9] object-cover"
                  data-testid="imagem-da-comunidade"
                />
              ) : (
                <span
                  className="grid h-[110px] w-[110px] place-items-center border border-[#c9c9c9] bg-[#f4f4f4] text-[44px]"
                  data-testid="imagem-da-comunidade"
                >
                  {grupo.emoji}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-bold leading-tight text-[#2b4a80]" data-testid="nome-da-comunidade">
                {grupo.nome}
              </h1>
              <p className="mt-1 leading-[1.5] text-[#444]">{grupo.descricao}</p>

              <div className="mt-2 space-y-0.5">
                {config.categoria && <Campo rotulo="categoria">{config.categoria}</Campo>}
                <Campo rotulo="criada em">{porExtenso(criadaEm(id))}</Campo>
                <Campo rotulo="dono">
                  {dono === EU ? (
                    <LinkOrkut href="/profile">Você</LinkOrkut>
                  ) : (
                    <LinkOrkut href={`/user/${dono}`}>
                      {findMember(dono)?.name ?? "Alguém"}
                    </LinkOrkut>
                  )}
                </Campo>
                {moderadores.length > 0 && (
                  <Campo rotulo="moderadores">
                    {moderadores.map((m, i) => (
                      <span key={m.slug}>
                        {i > 0 && ", "}
                        {m.slug === EU ? (
                          <LinkOrkut href="/profile">Você</LinkOrkut>
                        ) : (
                          <LinkOrkut href={`/user/${m.slug}`}>
                            {findMember(m.slug)?.name ?? "Alguém"}
                          </LinkOrkut>
                        )}
                      </span>
                    ))}
                  </Campo>
                )}
                <Campo rotulo="tipo">
                  {config.entrada === "aberta"
                    ? "aberta a todos"
                    : config.entrada === "moderada"
                      ? "entrada moderada"
                      : "fechada (só por convite)"}
                  {config.visibilidade === "privada" && " · privada"}
                </Campo>
                <Campo rotulo="idioma">{config.idioma ?? "Português (Brasil)"}</Campo>
                <Campo rotulo="membros">{membros.length}</Campo>
              </div>
            </div>
          </div>

          {/* Os links de ação, em lista com «», como no Orkut. */}
          <div className="mt-3 space-y-1 border-t border-[#e4e4e4] pt-2.5">
            {situacao !== "banido" && situacao !== "so-convidado" && (
              <p>
                <LinkOrkut onClick={entrar} testid="grupo-join">
                  » {rotuloDeEntrada[situacao]}
                </LinkOrkut>
              </p>
            )}
            {(situacao === "banido" || situacao === "so-convidado") && (
              <p className="text-[#a00]" data-testid="grupo-bloqueado">
                {rotuloDeEntrada[situacao]}
              </p>
            )}
            <p>
              <LinkOrkut
                onClick={() =>
                  toast({
                    title: "Denúncia enviada",
                    description: "Ninguém é avisado de que foi você.",
                  })
                }
                testid="grupo-denunciar"
              >
                » denunciar abuso
              </LinkOrkut>
            </p>
            {souModerador(id) && (
              <p>
                <LinkOrkut href={`/forum/${id}/gerenciar`} testid="grupo-gerenciar">
                  » editar comunidade
                  {fila.length > 0 && (
                    <span className="ml-1.5 rounded-[2px] bg-[#c00] px-1 py-px text-[9px] font-bold text-white">
                      {fila.length}
                    </span>
                  )}
                </LinkOrkut>
              </p>
            )}
          </div>

          {config.regras && (
            <div className="mt-2.5 border-t border-[#e4e4e4] pt-2.5" data-testid="regras-da-comunidade">
              <p className="font-bold text-[#2b4a80]">regras da comunidade</p>
              <p className="mt-1 whitespace-pre-line leading-[1.6] text-[#444]">{config.regras}</p>
            </div>
          )}
        </Caixa>

        {!podeLer ? (
          <Caixa titulo="conteúdo" testid="grupo-privado">
            <p className="text-[#666]">
              Esta comunidade é <b>privada</b>. Só quem participa vê os tópicos daqui.
            </p>
          </Caixa>
        ) : (
          <>
            {/* ---------------- membros ---------------- */}
            <Caixa
              titulo={`membros (${membros.length})`}
              testid="grupo-membros"
              acao={
                <LinkOrkut href={`/forum/${id}/membros`} testid="ver-todos-membros">
                  ver todos »
                </LinkOrkut>
              }
            >
              <div className="flex flex-wrap gap-2">
                {membros.slice(0, 8).map(({ slug, papel }) => {
                  const membro = slug === EU ? undefined : findMember(slug);
                  const nome = slug === EU ? "Você" : (membro?.name ?? "Alguém");
                  return (
                    <Link
                      key={slug}
                      href={slug === EU ? "/profile" : `/user/${slug}`}
                      className="w-[52px] text-center"
                      data-testid={`membro-${slug}`}
                    >
                      <FotoOrkut nome={nome} tamanho={52} />
                      <span className="mt-0.5 block truncate text-[10px] text-[#1a4fa0] hover:underline">
                        {nome.split(" ")[0]}
                      </span>
                      {papel !== "membro" && (
                        <span className="block text-[9px] text-[#888]">
                          {papel === "dono" ? "dono" : "moderador"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </Caixa>

            {/* ---------------- fóruns (tópicos) ---------------- */}
            <Caixa
              titulo="fóruns"
              testid="grupo-topicos"
              acao={
                possoCriar(id, "topicos") ? (
                  <LinkOrkut onClick={() => setCriando((v) => !v)} testid="grupo-create-topic">
                    criar tópico »
                  </LinkOrkut>
                ) : dentro ? (
                  <span className="text-[10px] text-[#888]">só moderadores criam</span>
                ) : undefined
              }
            >
              {criando && (
                <div className="mb-2.5 border border-[#dcdcdc] bg-[#f8f8f8] p-2" data-testid="grupo-composer">
                  <p className="mb-1 text-[10px] text-[#666]">assunto do tópico:</p>
                  <input
                    value={titulo}
                    onChange={(evento) => setTitulo(evento.target.value.slice(0, MAX_TITULO))}
                    autoFocus
                    className={`w-full border border-[#b5b5b5] px-1.5 py-1 text-[11px] text-[#333] focus:outline-none focus:border-[#5b7ab5]`}
                    data-testid="grupo-topic-title"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <BotaoOrkut
                      primario
                      onClick={publicarTopico}
                      disabled={titulo.trim().length === 0}
                      testid="grupo-topic-publish"
                    >
                      criar tópico
                    </BotaoOrkut>
                    <BotaoOrkut onClick={() => setCriando(false)}>cancelar</BotaoOrkut>
                  </div>
                </div>
              )}

              {topicos.length === 0 ? (
                <p className="text-[#666]">Nenhum tópico ainda.</p>
              ) : (
                <table className="w-full border-collapse" data-testid="tabela-de-topicos">
                  <thead>
                    <tr className="border-b border-[#dcdcdc] text-left text-[10px] text-[#666]">
                      <th className="pb-1 font-normal">tópico</th>
                      <th className="pb-1 pl-2 text-right font-normal">msgs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicos.map((topico) => (
                      <tr
                        key={topico.id}
                        className="border-b border-[#f0f0f0] align-top"
                        data-testid={`topico-${topico.id}`}
                      >
                        <td className="py-1.5 pr-2">
                          <LinkOrkut href={`/forum/${id}/topico/${topico.id}`}>
                            {topico.fixado && <span className="mr-1">📌</span>}
                            {topico.titulo}
                          </LinkOrkut>
                          <span className="block text-[10px] text-[#888]">
                            por {topico.meu ? "Você" : (topico.autor?.name ?? "Alguém")} ·{" "}
                            {new Date(topico.ultimaAtividade).toLocaleDateString("pt-BR")}
                          </span>
                          {souModerador(id) && !topico.meu && (
                            <span className="mt-0.5 flex gap-2 text-[10px]">
                              <LinkOrkut
                                onClick={() => {
                                  const fixou = alternarFixado(id, topico.id);
                                  toast({ title: fixou ? "Tópico fixado" : "Tópico solto" });
                                }}
                                testid={`fixar-${topico.id}`}
                              >
                                {topico.fixado ? "soltar" : "fixar"}
                              </LinkOrkut>
                              <LinkOrkut
                                onClick={() => {
                                  alternarTopicoEscondido(id, topico.id);
                                  toast({ title: "Tópico removido do fórum" });
                                }}
                                testid={`esconder-${topico.id}`}
                              >
                                remover
                              </LinkOrkut>
                            </span>
                          )}
                          {topico.meu && (
                            <span className="mt-0.5 block text-[10px]">
                              <LinkOrkut
                                onClick={() => {
                                  apagarMeuTopico(topico.id);
                                  toast({ title: "Tópico apagado" });
                                }}
                                testid={`topico-delete-${topico.id}`}
                              >
                                apagar
                              </LinkOrkut>
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 pl-2 text-right text-[#666]">
                          {topico.totalRespostas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Caixa>
          </>
        )}

        <p className="mt-3 text-center text-[10px] text-[#999]">
          <LinkOrkut href="/community" testid="voltar-app">
            voltar ao AllBook
          </LinkOrkut>
        </p>
      </div>
    </PaginaOrkut>
  );
}

/* `ehModerador` fica importado de propósito: a tela de membros (próximo passo)
   usa a mesma regra, e deixá-la aqui evita duas versões da mesma pergunta. */
void ehModerador;
