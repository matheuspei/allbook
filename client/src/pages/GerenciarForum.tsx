import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";

import {
  BarraOrkut,
  BotaoOrkut,
  Caixa,
  FotoOrkut,
  LinkOrkut,
  PaginaOrkut,
} from "@/components/forum/Orkut";
import { useToast } from "@/hooks/use-toast";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import {
  CATEGORIAS,
  IDIOMAS,
  aprovarPedido,
  banir,
  configDo,
  desbanir,
  destituirModerador,
  donoDo,
  encolherImagem,
  excluirForum,
  filaDe,
  forumNaTela,
  membrosDo,
  nomearModerador,
  recusarPedido,
  salvarConfig,
  souDono,
  souModerador,
  transferirPropriedade,
  type QuemPodeCriar,
  type TipoDeEntrada,
  type Visibilidade,
} from "@/lib/forum";
import { GRUPOS_EVENT } from "@/lib/grupos";

/**
 * **Editar comunidade** (`/forum/:id/gerenciar`) — os poderes de dono e
 * moderador do Orkut, na ordem em que ele os tinha.
 *
 * A lista veio do Matheus em 31/07, fechada: editar a comunidade inteira (nome,
 * descrição, categoria, imagem, regras); definir se a entrada é livre, por
 * convite ou **moderada com fila**; controlar se não-membro lê; travar a criação
 * de tópicos, enquetes e eventos só para moderadores; aprovar e recusar pedidos;
 * **banir**, e o banido não volta; nomear e destituir moderadores; apagar
 * qualquer tópico ou mensagem; **transferir a propriedade**; e excluir a
 * comunidade.
 *
 * **Quem vê o quê:** moderador cuida de gente e conteúdo (fila, banir, remover);
 * **só o dono** mexe na casa (nomear moderador, transferir, excluir). É a divisão
 * do Orkut, e é a que impede um moderador de derrubar o outro.
 */
export default function GerenciarForum() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = params.id ?? "";
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const grupo = forumNaTela(id);

  if (!grupo || !souModerador(id)) {
    return (
      <PaginaOrkut testid="gerenciar-negado">
        <BarraOrkut />
        <div className="p-2.5">
          <Caixa titulo="editar comunidade">
            <p className="text-[#666]">Você não modera esta comunidade.</p>
            <p className="mt-2">
              <LinkOrkut href={`/forum/${id}`}>« voltar para a comunidade</LinkOrkut>
            </p>
          </Caixa>
        </div>
      </PaginaOrkut>
    );
  }

  return (
    <PaginaOrkut testid="gerenciar-forum">
      <BarraOrkut onde={`${grupo.nome} › editar`} />
      <div className="p-2.5" key={versao}>
        <Informacoes id={id} />
        <Configuracoes id={id} />
        <Pedidos id={id} />
        <Pessoas id={id} />
        <Banidos id={id} />
        {souDono(id) && <ZonaDePerigo id={id} onExcluir={() => setLocation("/forum")} />}

        <p className="mt-3 text-center">
          <LinkOrkut href={`/forum/${id}`} testid="voltar-comunidade">
            « voltar para a comunidade
          </LinkOrkut>
        </p>
      </div>
    </PaginaOrkut>
  );
}

/* ------------------------------------------------------------------ *
 * 1. As informações da casa — com a imagem enviada de verdade
 * ------------------------------------------------------------------ */

function Informacoes({ id }: { id: string }) {
  const { toast } = useToast();
  const grupo = forumNaTela(id);
  const config = configDo(id);
  const arquivo = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(grupo?.nome ?? "");
  const [descricao, setDescricao] = useState(grupo?.descricao ?? "");
  const [categoria, setCategoria] = useState(config.categoria ?? "");
  const [idioma, setIdioma] = useState(config.idioma ?? IDIOMAS[0]);
  const [regras, setRegras] = useState(config.regras ?? "");
  const [enviando, setEnviando] = useState(false);

  /**
   * A imagem é escolhida do aparelho e **encolhida aqui mesmo** para 140×140.
   * É o que torna o upload possível sem servidor — ver `encolherImagem`.
   */
  async function escolherImagem(evento: React.ChangeEvent<HTMLInputElement>) {
    const escolhido = evento.target.files?.[0];
    if (!escolhido) return;
    setEnviando(true);
    try {
      const imagem = await encolherImagem(escolhido);
      salvarConfig(id, { imagem });
      toast({ title: "Imagem da comunidade trocada" });
    } catch {
      toast({ title: "Não deu para usar esta imagem", description: "Tente outro arquivo." });
    } finally {
      setEnviando(false);
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  return (
    <Caixa titulo="informações da comunidade" testid="editar-informacoes">
      <div className="flex gap-3">
        <div className="shrink-0 text-center">
          {config.imagem ? (
            <img
              src={config.imagem}
              alt=""
              className="h-[110px] w-[110px] border border-[#c9c9c9] object-cover"
            />
          ) : (
            <span className="grid h-[110px] w-[110px] place-items-center border border-[#c9c9c9] bg-[#f4f4f4] text-[44px]">
              {grupo?.emoji}
            </span>
          )}
          <input
            ref={arquivo}
            type="file"
            accept="image/*"
            onChange={escolherImagem}
            className="hidden"
            data-testid="input-imagem"
          />
          <p className="mt-1 text-[10px]">
            <LinkOrkut onClick={() => arquivo.current?.click()} testid="trocar-imagem">
              {enviando ? "enviando…" : "trocar imagem"}
            </LinkOrkut>
          </p>
          {config.imagem && (
            <p className="text-[10px]">
              <LinkOrkut
                onClick={() => {
                  salvarConfig(id, { imagem: undefined });
                  toast({ title: "Imagem removida" });
                }}
                testid="remover-imagem"
              >
                remover
              </LinkOrkut>
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <Rotulo texto="nome da comunidade">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value.slice(0, 60))}
              className={ENTRADA}
              data-testid="campo-nome"
            />
          </Rotulo>

          <Rotulo texto="descrição">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, 400))}
              rows={3}
              className={`${ENTRADA} resize-none`}
              data-testid="campo-descricao"
            />
          </Rotulo>

          <Rotulo texto="categoria">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={ENTRADA}
              data-testid="campo-categoria"
            >
              <option value="">— escolha —</option>
              {CATEGORIAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Rotulo>

          <Rotulo texto="idioma">
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className={ENTRADA}
              data-testid="campo-idioma"
            >
              {IDIOMAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Rotulo>

          <Rotulo texto="regras da comunidade">
            <textarea
              value={regras}
              onChange={(e) => setRegras(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="1. Sem spoiler sem aviso.&#10;2. …"
              className={`${ENTRADA} resize-none`}
              data-testid="campo-regras"
            />
          </Rotulo>

          <BotaoOrkut
            primario
            onClick={() => {
              salvarConfig(id, {
                nome: nome.trim(),
                descricao: descricao.trim(),
                categoria: categoria || undefined,
                idioma,
                regras: regras.trim() || undefined,
              });
              toast({ title: "Comunidade atualizada" });
            }}
            disabled={nome.trim().length === 0}
            testid="salvar-informacoes"
          >
            salvar alterações
          </BotaoOrkut>
        </div>
      </div>
    </Caixa>
  );
}

/* ------------------------------------------------------------------ *
 * 2. Quem entra, quem lê, quem cria
 * ------------------------------------------------------------------ */

function Configuracoes({ id }: { id: string }) {
  const { toast } = useToast();
  const config = configDo(id);

  const entradas: { valor: TipoDeEntrada; rotulo: string; ajuda: string }[] = [
    { valor: "aberta", rotulo: "Qualquer um pode entrar", ajuda: "Um toque e a pessoa está dentro." },
    {
      valor: "moderada",
      rotulo: "Entrada moderada",
      ajuda: "O pedido cai numa fila e um moderador aprova.",
    },
    {
      valor: "fechada",
      rotulo: "Fechada",
      ajuda: "Ninguém pede: só entra quem for convidado.",
    },
  ];

  const visibilidades: { valor: Visibilidade; rotulo: string; ajuda: string }[] = [
    { valor: "publica", rotulo: "Pública", ajuda: "Quem não é membro consegue ler os tópicos." },
    { valor: "privada", rotulo: "Privada", ajuda: "Só membros veem o que se escreve aqui." },
  ];

  return (
    <Caixa titulo="configurações" testid="editar-configuracoes">
      <Bloco titulo="quem pode entrar">
        {entradas.map((item) => (
          <Radio
            key={item.valor}
            nome="entrada"
            marcado={config.entrada === item.valor}
            rotulo={item.rotulo}
            ajuda={item.ajuda}
            onEscolher={() => {
              salvarConfig(id, { entrada: item.valor });
              toast({ title: `Entrada: ${item.rotulo.toLowerCase()}` });
            }}
            testid={`entrada-${item.valor}`}
          />
        ))}
      </Bloco>

      <Bloco titulo="quem pode ver">
        {visibilidades.map((item) => (
          <Radio
            key={item.valor}
            nome="visibilidade"
            marcado={config.visibilidade === item.valor}
            rotulo={item.rotulo}
            ajuda={item.ajuda}
            onEscolher={() => {
              salvarConfig(id, { visibilidade: item.valor });
              toast({ title: `Comunidade ${item.rotulo.toLowerCase()}` });
            }}
            testid={`visibilidade-${item.valor}`}
          />
        ))}
      </Bloco>

      <Bloco titulo="quem pode criar">
        <TravaDeCriacao id={id} o="topicos" rotulo="tópicos" />
        <TravaDeCriacao id={id} o="enquetes" rotulo="enquetes" />
        <TravaDeCriacao id={id} o="eventos" rotulo="eventos" />
      </Bloco>
    </Caixa>
  );
}

function TravaDeCriacao({
  id,
  o,
  rotulo,
}: {
  id: string;
  o: "topicos" | "enquetes" | "eventos";
  rotulo: string;
}) {
  const config = configDo(id);
  const campo = o === "topicos" ? "criarTopicos" : o === "enquetes" ? "criarEnquetes" : "criarEventos";
  const atual = config[campo] as QuemPodeCriar;

  return (
    <div className="flex items-center justify-between gap-2 py-1" data-testid={`criar-${o}`}>
      <span className="text-[11px] text-[#333]">{rotulo}</span>
      <select
        value={atual}
        onChange={(e) => salvarConfig(id, { [campo]: e.target.value as QuemPodeCriar })}
        className="border border-[#b5b5b5] bg-white px-1 py-0.5 text-[10px] text-[#333] focus:outline-none"
        data-testid={`select-criar-${o}`}
      >
        <option value="membros">todos os membros</option>
        <option value="moderadores">só moderadores</option>
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 3. A fila de pedidos
 * ------------------------------------------------------------------ */

function Pedidos({ id }: { id: string }) {
  const { toast } = useToast();
  const config = configDo(id);
  const fila = filaDe(id);

  if (config.entrada !== "moderada") return null;

  return (
    <Caixa titulo={`pedidos de entrada (${fila.length})`} testid="fila-de-pedidos">
      {fila.length === 0 ? (
        <p className="text-[#666]">Nenhum pedido esperando.</p>
      ) : (
        <div className="space-y-1.5">
          {fila.map((slug) => {
            const nome = slug === EU ? "Você" : (findMember(slug)?.name ?? "Alguém");
            return (
              <div
                key={slug}
                className="flex items-center gap-2 border-b border-[#f0f0f0] pb-1.5 last:border-0"
                data-testid={`pedido-${slug}`}
              >
                <FotoOrkut nome={nome} tamanho={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-[#2b4a80]">{nome}</span>
                  <span className="block truncate text-[10px] text-[#888]">
                    {findMember(slug)?.bio ?? "quer entrar na comunidade"}
                  </span>
                </span>
                <BotaoOrkut
                  primario
                  onClick={() => {
                    aprovarPedido(id, slug);
                    toast({ title: `${nome} entrou na comunidade` });
                  }}
                  testid={`aprovar-${slug}`}
                >
                  aprovar
                </BotaoOrkut>
                <BotaoOrkut
                  onClick={() => {
                    recusarPedido(id, slug);
                    toast({ title: "Pedido recusado" });
                  }}
                  testid={`recusar-${slug}`}
                >
                  recusar
                </BotaoOrkut>
              </div>
            );
          })}
        </div>
      )}
    </Caixa>
  );
}

/* ------------------------------------------------------------------ *
 * 4. As pessoas — cargo, banimento e transferência
 * ------------------------------------------------------------------ */

function Pessoas({ id }: { id: string }) {
  const { toast } = useToast();
  const membros = membrosDo(id);
  const dono = donoDo(id);
  const euSouDono = souDono(id);
  const [transferindo, setTransferindo] = useState<string | undefined>();

  return (
    <Caixa titulo={`membros (${membros.length})`} testid="gerenciar-membros">
      <div className="space-y-1.5">
        {membros.map(({ slug, papel }) => {
          const nome = slug === EU ? "Você" : (findMember(slug)?.name ?? "Alguém");
          return (
            <div
              key={slug}
              className="border-b border-[#f0f0f0] pb-1.5 last:border-0"
              data-testid={`gerenciar-membro-${slug}`}
            >
              <div className="flex items-center gap-2">
                <FotoOrkut nome={nome} tamanho={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-[#2b4a80]">
                    {nome}
                    {papel !== "membro" && (
                      <span className="ml-1.5 rounded-[2px] bg-[#e8eef7] px-1 py-px text-[9px] font-normal text-[#2b4a80]">
                        {papel}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[10px] text-[#888]">
                    {findMember(slug)?.bio ?? ""}
                  </span>
                </span>
              </div>

              {/* As ações ficam em linha de links, como as do Orkut. */}
              {slug !== dono && (
                <div className="mt-1 flex flex-wrap gap-2.5 pl-[40px] text-[10px]">
                  {euSouDono &&
                    (papel === "moderador" ? (
                      <LinkOrkut
                        onClick={() => {
                          destituirModerador(id, slug);
                          toast({ title: `${nome} não modera mais` });
                        }}
                        testid={`destituir-${slug}`}
                      >
                        destituir moderador
                      </LinkOrkut>
                    ) : (
                      <LinkOrkut
                        onClick={() => {
                          nomearModerador(id, slug);
                          toast({ title: `${nome} agora é moderador` });
                        }}
                        testid={`nomear-${slug}`}
                      >
                        nomear moderador
                      </LinkOrkut>
                    ))}

                  {slug !== EU && (
                    <LinkOrkut
                      onClick={() => {
                        banir(id, slug);
                        toast({
                          title: `${nome} foi banido`,
                          description: "Não consegue mais entrar nesta comunidade.",
                        });
                      }}
                      testid={`banir-${slug}`}
                    >
                      banir
                    </LinkOrkut>
                  )}

                  {euSouDono && slug !== EU && (
                    <LinkOrkut
                      onClick={() => setTransferindo(transferindo === slug ? undefined : slug)}
                      testid={`transferir-${slug}`}
                    >
                      transferir propriedade
                    </LinkOrkut>
                  )}
                </div>
              )}

              {transferindo === slug && (
                <div
                  className="mt-1.5 ml-[40px] border border-[#e0c0c0] bg-[#fff6f6] p-2"
                  data-testid={`confirmar-transferencia-${slug}`}
                >
                  <p className="text-[10px] leading-[1.5] text-[#833]">
                    <b>{nome}</b> passa a ser o dono desta comunidade e você vira moderador. Só ele
                    poderá devolver.
                  </p>
                  <div className="mt-1.5 flex gap-2">
                    <BotaoOrkut
                      primario
                      onClick={() => {
                        transferirPropriedade(id, slug);
                        setTransferindo(undefined);
                        toast({ title: `${nome} agora é o dono` });
                      }}
                      testid={`confirmar-transferir-${slug}`}
                    >
                      transferir
                    </BotaoOrkut>
                    <BotaoOrkut onClick={() => setTransferindo(undefined)}>cancelar</BotaoOrkut>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Caixa>
  );
}

/* ------------------------------------------------------------------ *
 * 5. Os banidos — o Orkut tinha a lista, e ela é o único jeito de desfazer
 * ------------------------------------------------------------------ */

function Banidos({ id }: { id: string }) {
  const { toast } = useToast();
  const config = configDo(id);
  if (config.banidos.length === 0) return null;

  return (
    <Caixa titulo={`banidos (${config.banidos.length})`} testid="lista-de-banidos">
      <div className="space-y-1.5">
        {config.banidos.map((slug) => {
          const nome = findMember(slug)?.name ?? "Alguém";
          return (
            <div key={slug} className="flex items-center gap-2" data-testid={`banido-${slug}`}>
              <FotoOrkut nome={nome} tamanho={28} />
              <span className="min-w-0 flex-1 truncate text-[11px] text-[#333]">{nome}</span>
              <LinkOrkut
                onClick={() => {
                  desbanir(id, slug);
                  toast({ title: `${nome} pode entrar de novo` });
                }}
                testid={`desbanir-${slug}`}
              >
                desbanir
              </LinkOrkut>
            </div>
          );
        })}
      </div>
    </Caixa>
  );
}

/* ------------------------------------------------------------------ *
 * 6. Excluir a comunidade
 * ------------------------------------------------------------------ */

function ZonaDePerigo({ id, onExcluir }: { id: string; onExcluir: () => void }) {
  const { toast } = useToast();
  const [confirmando, setConfirmando] = useState(false);
  const grupo = forumNaTela(id);
  const membros = membrosDo(id).length;

  return (
    <Caixa titulo="excluir comunidade" testid="excluir-comunidade">
      {!confirmando ? (
        <>
          <p className="leading-[1.6] text-[#666]">
            A comunidade some para todos os {membros} membros, com os tópicos e as mensagens.
          </p>
          <p className="mt-2">
            <BotaoOrkut onClick={() => setConfirmando(true)} testid="quero-excluir">
              excluir esta comunidade
            </BotaoOrkut>
          </p>
        </>
      ) : (
        <div className="border border-[#e0c0c0] bg-[#fff6f6] p-2">
          <p className="leading-[1.6] text-[#833]">
            Tem certeza? <b>{grupo?.nome}</b> tem {membros}{" "}
            {membros === 1 ? "membro" : "membros"} e o que eles escreveram vai junto.
          </p>
          <div className="mt-2 flex gap-2">
            <BotaoOrkut
              primario
              onClick={() => {
                excluirForum(id);
                toast({ title: "Comunidade excluída" });
                onExcluir();
              }}
              testid="confirmar-exclusao"
            >
              sim, excluir
            </BotaoOrkut>
            <BotaoOrkut onClick={() => setConfirmando(false)}>não</BotaoOrkut>
          </div>
        </div>
      )}
    </Caixa>
  );
}

/* ------------------------------------------------------------------ *
 * Peças pequenas do formulário
 * ------------------------------------------------------------------ */

const ENTRADA =
  "w-full border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] text-[#333] focus:border-[#5b7ab5] focus:outline-none";

function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] text-[#666]">{texto}</span>
      {children}
    </label>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1 font-bold text-[#2b4a80]">{titulo}</p>
      {children}
    </div>
  );
}

function Radio({
  nome,
  marcado,
  rotulo,
  ajuda,
  onEscolher,
  testid,
}: {
  nome: string;
  marcado: boolean;
  rotulo: string;
  ajuda: string;
  onEscolher: () => void;
  testid: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-1.5 py-1" data-testid={testid}>
      <input
        type="radio"
        name={nome}
        checked={marcado}
        onChange={onEscolher}
        className="mt-0.5 accent-[#5b7ab5]"
      />
      <span>
        <span className="block text-[11px] text-[#333]">{rotulo}</span>
        <span className="block text-[10px] text-[#888]">{ajuda}</span>
      </span>
    </label>
  );
}
