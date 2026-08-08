import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Ban, Camera, Crown, ShieldCheck, Trash2, UserPlus } from "lucide-react";

import {
  AvatarDoForum,
  Bloco,
  BotaoDoForum,
  CAMPO,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import {
  CATEGORIAS,
  IDIOMAS,
  aprovarPedido,
  banir,
  categoriaDe,
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
 * **Gerenciar a comunidade** (`/forum/:id/gerenciar`) — os poderes do dono e do
 * moderador, com a pele do AllBook.
 *
 * A lista é a que o Matheus fechou em 31/07 e **nada dela mudou na troca de
 * aparência** (§4.74): editar a casa inteira; entrada **livre, moderada ou por
 * convite**; visibilidade; travar a criação de tópicos, enquetes e eventos;
 * aprovar e recusar pedidos; **banir** (o banido não volta); nomear e destituir
 * moderadores; **transferir a propriedade**; e excluir a comunidade.
 *
 * **Quem vê o quê:** moderador cuida de gente e conteúdo; **só o dono** mexe na
 * casa (nomear moderador, transferir, excluir). É o que impede um moderador de
 * derrubar o outro.
 *
 * O desenho segue `GerenciarClube` — seções em cartão, uma por poder —, que é a
 * tela irmã desta no app.
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
      <PaginaDoForum titulo="Gerenciar" voltarPara={`/forum/${id}`} testid="gerenciar-negado">
        <div className="px-5 pt-4">
          <Bloco>
            <p className="text-[13px] text-white/55">Você não modera esta comunidade.</p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${id}`}>Voltar para a comunidade</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  return (
    <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="gerenciar-forum">
      <div className="px-5 pt-4" key={versao}>
        <Informacoes id={id} />
        <Configuracoes id={id} />
        <Pedidos id={id} />
        <Pessoas id={id} />
        <Banidos id={id} />
        {souDono(id) && <ZonaDePerigo id={id} onExcluir={() => setLocation("/forum")} />}
      </div>
    </PaginaDoForum>
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
  /* A de fábrica aparece no campo — senão editar qualquer outra coisa apagaria
     a categoria que a comunidade já tinha. */
  const [categoria, setCategoria] = useState(categoriaDe(id) ?? "");
  const [idioma, setIdioma] = useState(config.idioma ?? IDIOMAS[0]);
  const [regras, setRegras] = useState(config.regras ?? "");
  const [enviando, setEnviando] = useState(false);

  /**
   * A imagem é escolhida do aparelho e **encolhida aqui mesmo** para 140×140 —
   * é o que torna o upload possível sem servidor (ver `encolherImagem`).
   */
  async function escolherImagem(evento: React.ChangeEvent<HTMLInputElement>) {
    const escolhido = evento.target.files?.[0];
    if (!escolhido) return;
    setEnviando(true);
    try {
      salvarConfig(id, { imagem: await encolherImagem(escolhido) });
      toast({ title: "Imagem da comunidade trocada" });
    } catch {
      toast({ title: "Não deu para usar esta imagem", description: "Tente outro arquivo." });
    } finally {
      setEnviando(false);
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  return (
    <Bloco titulo="Informações" testid="editar-informacoes">
      <div className="flex gap-3.5">
        <div className="shrink-0">
          <button
            onClick={() => arquivo.current?.click()}
            className="relative block"
            data-testid="trocar-imagem"
            aria-label="Trocar a imagem da comunidade"
          >
            {config.imagem ? (
              <img
                src={config.imagem}
                alt=""
                className="h-[88px] w-[88px] rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="grid h-[88px] w-[88px] place-items-center rounded-2xl bg-white/[0.06] text-[36px] ring-1 ring-white/10">
                {grupo?.emoji}
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <input
            ref={arquivo}
            type="file"
            accept="image/*"
            onChange={escolherImagem}
            className="hidden"
            data-testid="input-imagem"
          />
          {enviando && <p className="mt-1 text-center text-[10px] text-white/40">enviando…</p>}
          {config.imagem && !enviando && (
            <div className="mt-1.5 text-center">
              <LinkDoForum
                onClick={() => {
                  salvarConfig(id, { imagem: undefined });
                  toast({ title: "Imagem removida" });
                }}
                className="text-[10.5px] text-white/35 hover:text-white/70"
                testid="remover-imagem"
              >
                remover
              </LinkDoForum>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <Rotulo texto="Nome">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value.slice(0, 60))}
              className={CAMPO}
              data-testid="campo-nome"
            />
          </Rotulo>
          <Rotulo texto="Categoria">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={CAMPO}
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
        </div>
      </div>

      <div className="mt-2.5 space-y-2">
        <Rotulo texto="Descrição">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, 400))}
            rows={3}
            className={`${CAMPO} resize-none`}
            data-testid="campo-descricao"
          />
        </Rotulo>
        <Rotulo texto="Idioma">
          <select
            value={idioma}
            onChange={(e) => setIdioma(e.target.value)}
            className={CAMPO}
            data-testid="campo-idioma"
          >
            {IDIOMAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Rotulo>
        <Rotulo texto="Regras da comunidade">
          <textarea
            value={regras}
            onChange={(e) => setRegras(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder={"1. Sem spoiler sem aviso.\n2. …"}
            className={`${CAMPO} resize-none`}
            data-testid="campo-regras"
          />
        </Rotulo>
      </div>

      <div className="mt-3 flex justify-end">
        <BotaoDoForum
          primario
          disabled={nome.trim().length === 0}
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
          testid="salvar-informacoes"
        >
          Salvar alterações
        </BotaoDoForum>
      </div>
    </Bloco>
  );
}

/* ------------------------------------------------------------------ *
 * 2. Quem entra, quem lê, quem cria
 * ------------------------------------------------------------------ */

function Configuracoes({ id }: { id: string }) {
  const { toast } = useToast();
  const config = configDo(id);

  const entradas: { valor: TipoDeEntrada; rotulo: string; ajuda: string }[] = [
    { valor: "aberta", rotulo: "Qualquer um entra", ajuda: "Um toque e a pessoa está dentro." },
    {
      valor: "moderada",
      rotulo: "Entrada moderada",
      ajuda: "O pedido cai numa fila e um moderador aprova.",
    },
    { valor: "fechada", rotulo: "Só por convite", ajuda: "Ninguém pede para entrar." },
  ];

  const visibilidades: { valor: Visibilidade; rotulo: string; ajuda: string }[] = [
    { valor: "publica", rotulo: "Pública", ajuda: "Quem não é membro consegue ler os tópicos." },
    { valor: "privada", rotulo: "Privada", ajuda: "Só membros veem o que se escreve aqui." },
  ];

  return (
    <Bloco titulo="Quem entra e quem vê" testid="editar-configuracoes">
      <p className="mb-1.5 text-[11px] font-semibold text-white/50">Entrada</p>
      {entradas.map((item) => (
        <Escolha
          key={item.valor}
          marcado={config.entrada === item.valor}
          rotulo={item.rotulo}
          ajuda={item.ajuda}
          onEscolher={() => {
            salvarConfig(id, { entrada: item.valor });
            toast({ title: item.rotulo });
          }}
          testid={`entrada-${item.valor}`}
        />
      ))}

      <p className="mb-1.5 mt-3.5 text-[11px] font-semibold text-white/50">Visibilidade</p>
      {visibilidades.map((item) => (
        <Escolha
          key={item.valor}
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

      <p className="mb-1.5 mt-3.5 text-[11px] font-semibold text-white/50">Quem pode criar</p>
      <TravaDeCriacao id={id} o="topicos" rotulo="Tópicos" />
      <TravaDeCriacao id={id} o="enquetes" rotulo="Enquetes" />
      <TravaDeCriacao id={id} o="eventos" rotulo="Eventos" />
    </Bloco>
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
  const campo =
    o === "topicos" ? "criarTopicos" : o === "enquetes" ? "criarEnquetes" : "criarEventos";
  const atual = config[campo] as QuemPodeCriar;
  const soModeradores = atual === "moderadores";

  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-2 last:border-0"
      data-testid={`criar-${o}`}
    >
      <span className="text-[13px] text-white/75">{rotulo}</span>
      {/* Um interruptor em vez de menu: são dois estados, e menu de dois itens
          pede um toque a mais para dizer a mesma coisa. */}
      <button
        onClick={() =>
          salvarConfig(id, { [campo]: soModeradores ? "membros" : "moderadores" } as never)
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          soModeradores ? "bg-primary" : "bg-white/15"
        }`}
        aria-pressed={soModeradores}
        aria-label={`${rotulo}: só moderadores`}
        data-testid={`select-criar-${o}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            soModeradores ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
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
    <Bloco titulo={`Pedidos de entrada · ${fila.length}`} testid="fila-de-pedidos">
      {fila.length === 0 ? (
        <p className="text-[13px] text-white/40">Nenhum pedido esperando.</p>
      ) : (
        <div className="-my-1">
          {fila.map((slug) => {
            const nome = slug === EU ? "Você" : (findMember(slug)?.name ?? "Alguém");
            return (
              <div
                key={slug}
                className="flex items-center gap-2.5 border-b border-white/[0.06] py-2.5 last:border-0"
                data-testid={`pedido-${slug}`}
              >
                <AvatarDoForum nome={nome} slug={slug} cor={findMember(slug)?.color} tamanho={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{nome}</span>
                  <span className="block truncate text-[11px] text-white/35">
                    {findMember(slug)?.bio ?? "quer entrar na comunidade"}
                  </span>
                </span>
                <BotaoDoForum
                  primario
                  onClick={() => {
                    aprovarPedido(id, slug);
                    toast({ title: `${nome} entrou na comunidade` });
                  }}
                  testid={`aprovar-${slug}`}
                >
                  Aprovar
                </BotaoDoForum>
                <LinkDoForum
                  onClick={() => {
                    recusarPedido(id, slug);
                    toast({ title: "Pedido recusado" });
                  }}
                  className="text-[11px] text-white/35 hover:text-white/70"
                  testid={`recusar-${slug}`}
                >
                  recusar
                </LinkDoForum>
              </div>
            );
          })}
        </div>
      )}
    </Bloco>
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
    <Bloco titulo={`Membros · ${membros.length}`} testid="gerenciar-membros">
      <div className="-my-1">
        {membros.map(({ slug, papel }) => {
          const membro = slug === EU ? undefined : findMember(slug);
          const nome = slug === EU ? "Você" : (membro?.name ?? "Alguém");
          return (
            <div
              key={slug}
              className="border-b border-white/[0.06] py-2.5 last:border-0"
              data-testid={`gerenciar-membro-${slug}`}
            >
              <div className="flex items-center gap-2.5">
                <AvatarDoForum nome={nome} slug={slug} cor={membro?.color} tamanho={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <span className="truncate">{nome}</span>
                    {papel === "dono" && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="dono" />
                    )}
                    {papel === "moderador" && (
                      <ShieldCheck
                        className="h-3.5 w-3.5 shrink-0 text-white/40"
                        aria-label="moderador"
                      />
                    )}
                  </span>
                  {membro?.bio && (
                    <span className="block truncate text-[11px] text-white/35">{membro.bio}</span>
                  )}
                </span>
              </div>

              {slug !== dono && (
                <div className="mt-1.5 flex flex-wrap gap-3 pl-[46px]">
                  {euSouDono &&
                    (papel === "moderador" ? (
                      <LinkDoForum
                        onClick={() => {
                          destituirModerador(id, slug);
                          toast({ title: `${nome} não modera mais` });
                        }}
                        className="text-[11px] text-white/40 hover:text-white/75"
                        testid={`destituir-${slug}`}
                      >
                        remover como moderador
                      </LinkDoForum>
                    ) : (
                      <LinkDoForum
                        onClick={() => {
                          nomearModerador(id, slug);
                          toast({ title: `${nome} agora é moderador` });
                        }}
                        className="text-[11px]"
                        testid={`nomear-${slug}`}
                      >
                        <UserPlus className="mr-0.5 inline h-3 w-3 align-[-1px]" />
                        nomear moderador
                      </LinkDoForum>
                    ))}

                  {slug !== EU && (
                    <LinkDoForum
                      onClick={() => {
                        banir(id, slug);
                        toast({
                          title: `${nome} foi banido`,
                          description: "Não consegue mais entrar nesta comunidade.",
                        });
                      }}
                      className="text-[11px] text-white/40 hover:text-red-300"
                      testid={`banir-${slug}`}
                    >
                      <Ban className="mr-0.5 inline h-3 w-3 align-[-1px]" />
                      banir
                    </LinkDoForum>
                  )}

                  {euSouDono && slug !== EU && (
                    <LinkDoForum
                      onClick={() => setTransferindo(transferindo === slug ? undefined : slug)}
                      className="text-[11px] text-white/40 hover:text-white/75"
                      testid={`transferir-${slug}`}
                    >
                      transferir a comunidade
                    </LinkDoForum>
                  )}
                </div>
              )}

              {transferindo === slug && (
                <div
                  className="ml-[46px] mt-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-2.5"
                  data-testid={`confirmar-transferencia-${slug}`}
                >
                  <p className="text-[11.5px] leading-relaxed text-white/70">
                    <b className="font-semibold">{nome}</b> passa a ser o dono e você vira
                    moderador. Só ele poderá devolver.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <BotaoDoForum
                      primario
                      onClick={() => {
                        transferirPropriedade(id, slug);
                        setTransferindo(undefined);
                        toast({ title: `${nome} agora é o dono` });
                      }}
                      testid={`confirmar-transferir-${slug}`}
                    >
                      Transferir
                    </BotaoDoForum>
                    <BotaoDoForum onClick={() => setTransferindo(undefined)}>Cancelar</BotaoDoForum>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Bloco>
  );
}

/* ------------------------------------------------------------------ *
 * 5. Os banidos — a lista é o único jeito de desfazer
 * ------------------------------------------------------------------ */

function Banidos({ id }: { id: string }) {
  const { toast } = useToast();
  const config = configDo(id);
  if (config.banidos.length === 0) return null;

  return (
    <Bloco titulo={`Banidos · ${config.banidos.length}`} testid="lista-de-banidos">
      <div className="-my-1">
        {config.banidos.map((slug) => {
          const membro = findMember(slug);
          const nome = membro?.name ?? "Alguém";
          return (
            <div
              key={slug}
              className="flex items-center gap-2.5 border-b border-white/[0.06] py-2 last:border-0"
              data-testid={`banido-${slug}`}
            >
              <span className="opacity-40">
                <AvatarDoForum nome={nome} slug={slug} cor={membro?.color} tamanho={32} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-white/55">{nome}</span>
              <LinkDoForum
                onClick={() => {
                  desbanir(id, slug);
                  toast({ title: `${nome} pode entrar de novo` });
                }}
                className="text-[11px]"
                testid={`desbanir-${slug}`}
              >
                desbanir
              </LinkDoForum>
            </div>
          );
        })}
      </div>
    </Bloco>
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
    <Bloco titulo="Apagar" testid="excluir-comunidade">
      {!confirmando ? (
        <>
          <p className="text-[12.5px] leading-relaxed text-white/45">
            A comunidade some para {membros === 1 ? "o único membro" : `os ${membros} membros`}, com
            os tópicos e as mensagens.
          </p>
          <button
            onClick={() => setConfirmando(true)}
            className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-300/70 transition-colors hover:text-red-300"
            data-testid="quero-excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Apagar esta comunidade
          </button>
        </>
      ) : (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3">
          <p className="text-[12.5px] leading-relaxed text-white/75">
            Tem certeza? <b className="font-semibold">{grupo?.nome}</b> tem {membros}{" "}
            {membros === 1 ? "membro" : "membros"}, e o que eles escreveram vai junto.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => {
                excluirForum(id);
                toast({ title: "Comunidade apagada" });
                onExcluir();
              }}
              className="rounded-full bg-red-500/90 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-red-500"
              data-testid="confirmar-exclusao"
            >
              Sim, apagar
            </button>
            <BotaoDoForum onClick={() => setConfirmando(false)}>Cancelar</BotaoDoForum>
          </div>
        </div>
      )}
    </Bloco>
  );
}

/* ------------------------------------------------------------------ *
 * Peças pequenas do formulário
 * ------------------------------------------------------------------ */

function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
        {texto}
      </span>
      {children}
    </label>
  );
}

/** Uma opção de escolha única — o mesmo desenho das opções do clube. */
function Escolha({
  marcado,
  rotulo,
  ajuda,
  onEscolher,
  testid,
}: {
  marcado: boolean;
  rotulo: string;
  ajuda: string;
  onEscolher: () => void;
  testid: string;
}) {
  return (
    <button
      onClick={onEscolher}
      className={`mb-1.5 flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors last:mb-0 ${
        marcado
          ? "border-primary/40 bg-primary/[0.08]"
          : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
      aria-pressed={marcado}
      data-testid={testid}
    >
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
          marcado ? "border-primary" : "border-white/25"
        }`}
      >
        {marcado && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] ${marcado ? "font-semibold" : "text-white/75"}`}>
          {rotulo}
        </span>
        <span className="block text-[11px] leading-relaxed text-white/35">{ajuda}</span>
      </span>
    </button>
  );
}
