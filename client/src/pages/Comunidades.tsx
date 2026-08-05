import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Link } from "wouter";
import { ChevronRight, Search, X } from "lucide-react";

import {
  BotaoDoForum,
  CAMPO,
  CapaDaComunidade,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORIAS,
  capaDaComunidade,
  categoriaDe,
  configDo,
  desistirDoPedido,
  forunsVisiveis,
  iconeDaCategoria,
  membrosDo,
  minhasComunidades,
  pedirEntrada,
  salvarConfig,
  situacaoDe,
  type SituacaoDeEntrada,
} from "@/lib/forum";
import { emAlta, porCategoria, sugestoes } from "@/lib/forumVitrine";
import { GRUPOS_EVENT, alternarParticipacao, criarGrupo, topicosDa, type Grupo } from "@/lib/grupos";

/**
 * **Comunidades** (`/forum`) — a porta de entrada dos fóruns, no **formato do
 * app do Reddit** (§4.102, 05/08).
 *
 * ---
 *
 * ⚠️ **Refeita três vezes, e os três motivos ficam registrados.**
 *
 * **31/07, manhã (§4.78):** grade para as suas, lista para a busca.
 * **31/07, tarde (§4.82):** *"muito crua… sem vida"* → virou vitrine de blocos
 * (acontecendo agora, em alta, categorias, números).
 * **05/08 (§4.102):** o Matheus mandou screenshots do app do Reddit: *"pegue
 * toda a biblioteca de como é o Reddit pelo formato de aplicativo e a gente
 * colocar exatamente como é"*. E delimitou na mesma hora: *"a página de dentro
 * a gente poderia manter… até me agrada a parte de dentro assim como está"* —
 * ou seja, **só esta vitrine muda**; `Grupo.tsx`/`Topico.tsx` seguem com a
 * estrutura da §4.74/4.77.
 *
 * **O molde (o screenshot dele):** pastilhas de assunto no topo ("Explore
 * comunidades por assunto"), carrossel de cartões "Recomendado para você" com
 * o botão de entrar **no próprio cartão**, e seções "Semelhantes a X". Título
 * grande, cartão arredondado, nada de caixinha com versalete.
 *
 * **O que saiu junto com a reforma — de propósito, não por esquecimento:**
 * - os blocos "Acontecendo agora", "Em alta" e os números do rodapé (§4.82):
 *   a vida da tela agora são os cartões com rosto e descrição;
 * - a **paginação de 10 em 10** e a lista estilo Orkut — o molde aqui deixou
 *   de ser o Orkut (na parte de dentro ele fica);
 * - a **roleta de categoria** (o `<select>`): as pastilhas assumem o papel,
 *   com os ícones que ele gostava (§4.82).
 *
 * **O que ficou, porque é regra dele que não depende de molde:** a busca no
 * topo; as 36 categorias TODAS visíveis, vazias apagadas mas clicáveis
 * (§4.82); a porta "ver todas" para `/forum/minhas` (§4.92); e `?criar=1`
 * abrindo o formulário (§4.92 — é como o "Criar comunidade" do painel chega).
 */
export default function Comunidades() {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [criando, setCriando] = useState(
    () => new URLSearchParams(window.location.search).get("criar") === "1",
  );
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  /* O formulário mora logo abaixo da busca; quem toca "Criar comunidade" no fim
     da página é levado até ele (window.scrollTo não funciona na moldura de
     desenvolvimento — scrollIntoView funciona, porque rola o contêiner). */
  useEffect(() => {
    if (criando) formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [criando]);

  const todas = useMemo(() => forunsVisiveis(), [versao]);
  const minhas = useMemo(() => minhasComunidades(), [versao]);
  /*
   * O recomendado tem duas fontes, nesta ordem: os motivos **pessoais** de
   * `sugestoes` (gente que você segue, categoria sua) e, completando as vagas,
   * as comunidades **vivas da semana** (`emAlta`, sem as suas). Sem a segunda
   * fonte o carrossel nascia vazio — os dados semeados não têm categoria em
   * comum com as suas — e o coração do molde Reddit sumia da tela.
   * O motivo continua escrito no cartão, seja qual for a fonte (§4.78).
   */
  const recomendadas = useMemo(() => {
    const fortes = sugestoes(6);
    const jaTem = new Set(fortes.map((item) => item.grupo.id));
    const vivas = emAlta(8)
      .filter(({ grupo }) => situacaoDe(grupo.id) !== "dentro" && !jaTem.has(grupo.id))
      .slice(0, Math.max(0, 6 - fortes.length));
    return [...fortes, ...vivas];
  }, [versao]);
  const categorias = useMemo(() => porCategoria(), [versao]);

  const termo = busca.trim().toLowerCase();
  const procurando = termo.length > 0 || categoria.length > 0;

  /** O resultado — a busca varre TUDO, inclusive as suas (quem digita quer achar). */
  const resultados = todas.filter((grupo) => {
    if (categoria && categoriaDe(grupo.id) !== categoria) return false;
    if (!termo) return true;
    return (
      grupo.nome.toLowerCase().includes(termo) || grupo.descricao.toLowerCase().includes(termo)
    );
  });

  /*
   * As seções de descoberta — a **cadeia de carrosséis** do Reddit. É a
   * correção dele na primeira olhada (05/08): *"no Reddit tem bem mais
   * carrosséis do que a forma como está… você meio que quis implementar do
   * seu jeito"*. Como lá, a mesma comunidade pode aparecer em mais de uma
   * seção — o que muda é o ângulo (recomendada, parecida, popular, do
   * assunto). A lista completa do fim é o censo: ninguém fica invisível.
   */
  const foraDasMinhas = todas.filter((grupo) => situacaoDe(grupo.id) !== "dentro");

  /* "Semelhantes a X": mesma categoria, OU 2+ membros em comum — o "quem
     está lá também está cá" é o que o Reddit usa de verdade. */
  const semelhantes: { dona: Grupo; parecidas: Grupo[] }[] = [];
  for (const dona of minhas) {
    const cat = categoriaDe(dona.id);
    const daDona = new Set(dona.membros);
    const parecidas = foraDasMinhas
      .map((grupo) => ({
        grupo,
        /* Mesmo assunto pesa mais que gente em comum — é o que diferencia as
           seções entre si quando as suas comunidades dividem membros. */
        peso:
          cat && categoriaDe(grupo.id) === cat
            ? 2
            : grupo.membros.filter((slug) => daDona.has(slug)).length >= 2
              ? 1
              : 0,
      }))
      .filter((item) => item.peso > 0)
      .sort((a, b) => b.peso - a.peso)
      .map((item) => item.grupo)
      .slice(0, 6);
    if (parecidas.length < 2) continue;
    semelhantes.push({ dona, parecidas });
    if (semelhantes.length === 2) break;
  }

  /* "Mais populares": as maiores em que você ainda não está. */
  const populares = [...foraDasMinhas]
    .sort((a, b) => membrosDo(b.id).length - membrosDo(a.id).length)
    .slice(0, 6);

  /* Os carrosséis por assunto — o "Jogos" do screenshot dele: as categorias
     com mais comunidades para você descobrir viram seções com nome próprio. */
  const porAssunto = (() => {
    const mapa = new Map<string, Grupo[]>();
    for (const grupo of foraDasMinhas) {
      const cat = categoriaDe(grupo.id);
      if (!cat) continue;
      mapa.set(cat, [...(mapa.get(cat) ?? []), grupo]);
    }
    return Array.from(mapa, ([cat, grupos]) => ({ cat, grupos }))
      .filter((item) => item.grupos.length >= 2)
      .sort((a, b) => b.grupos.length - a.grupos.length)
      .slice(0, 3);
  })();

  function limpar() {
    setBusca("");
    setCategoria("");
  }

  return (
    <PaginaDoForum titulo="Comunidades" voltarPara="/community" testid="comunidades-page">
      <div className="pt-4">
        {/* A busca no topo — regra dele desde a folha dos clubes: "a busca
            sempre está no topo". Redonda, como a do Reddit. */}
        <div className="px-5">
          <div className="flex items-center gap-2.5 rounded-full bg-white/[0.07] px-4 py-2.5 ring-1 ring-inset ring-white/10 focus-within:ring-primary/40">
            <Search className="h-4 w-4 shrink-0 text-white/35" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar comunidades"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-white/30"
              data-testid="campo-busca"
            />
            {busca.length > 0 && (
              <button
                onClick={() => setBusca("")}
                className="shrink-0 rounded-full p-0.5 text-white/30 transition-colors hover:text-white/70"
                aria-label="Limpar a busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {criando && (
          <div ref={formRef} className="px-5 pt-3">
            <FormularioDeCriacao onPronto={() => setCriando(false)} />
          </div>
        )}

        {/* ---------------- explore por assunto ---------------- */}
        <section className="pt-6" data-testid="explorar-por-assunto">
          <h2 className="px-5 font-display text-[17px] font-bold tracking-tight">
            Explore comunidades por assunto
          </h2>
          {/*
            As 36 em três fileiras que rolam de lado, como as do Reddit — e
            TODAS aparecem, inclusive as vazias (§4.82): vazia fica apagada,
            mas continua clicável, e quem toca recebe o convite de criar a
            primeira. Os emojis são os ícones de categoria que ele pediu de
            volta em 31/07.
          */}
          <div className="mt-3 grid auto-cols-max grid-flow-col grid-rows-3 gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
            {categorias.map((item) => {
              const ligada = categoria === item.categoria;
              return (
                <button
                  key={item.categoria}
                  onClick={() => setCategoria(ligada ? "" : item.categoria)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    ligada
                      ? "bg-primary font-semibold text-black"
                      : item.total === 0
                        ? "bg-white/[0.04] text-white/35 hover:text-white/60"
                        : "bg-white/[0.07] text-white/85 hover:bg-white/10"
                  }`}
                  data-testid={`categoria-${item.categoria}`}
                >
                  <span className="mr-1.5">{iconeDaCategoria(item.categoria)}</span>
                  {item.categoria}
                </button>
              );
            })}
          </div>
        </section>

        {procurando ? (
          /* ---------------- o resultado ---------------- */
          <section className="px-5 pt-5" data-testid="resultado-da-busca">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-white/40" data-testid="total-de-resultados">
                {resultados.length}{" "}
                {resultados.length === 1 ? "comunidade encontrada" : "comunidades encontradas"}
              </span>
              <LinkDoForum onClick={limpar} className="text-[12px]" testid="limpar-busca">
                limpar
              </LinkDoForum>
            </p>

            {resultados.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-5 text-[13px] leading-relaxed text-white/45">
                Nenhuma comunidade
                {termo && ` para "${busca.trim()}"`}
                {categoria && ` em ${categoria}`}.{" "}
                <LinkDoForum onClick={() => setCriando(true)} className="text-[13px]">
                  criar esta comunidade »
                </LinkDoForum>
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {resultados.map((grupo) => (
                  <LinhaDeComunidade key={grupo.id} grupo={grupo} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* ---------------- suas comunidades ---------------- */}
            {minhas.length > 0 && (
              <section className="pt-7" data-testid="suas-comunidades">
                <div className="flex items-baseline justify-between px-5">
                  <h2 className="font-display text-[17px] font-bold tracking-tight">
                    Suas comunidades
                  </h2>
                  <Link
                    href="/forum/minhas"
                    className="text-[12px] font-semibold text-primary transition-opacity hover:opacity-80"
                    data-testid="ver-todas-as-minhas"
                  >
                    ver todas »
                  </Link>
                </div>
                <div className="mt-3 flex gap-4 overflow-x-auto px-5 pb-1 scrollbar-hide">
                  {minhas.map((grupo) => (
                    <Link
                      key={grupo.id}
                      href={`/forum/${grupo.id}`}
                      className="w-[64px] shrink-0 text-center"
                      data-testid={`minha-${grupo.id}`}
                    >
                      <RostoDaComunidade grupo={grupo} lado={56} className="mx-auto" />
                      <span className="mt-1.5 block text-[10.5px] leading-tight text-white/70 line-clamp-2">
                        {grupo.nome}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ---------------- recomendado para você ---------------- */}
            {recomendadas.length > 0 && (
              <SecaoDeCartoes
                titulo="Recomendado para você"
                itens={recomendadas.map(({ grupo, motivo }) => ({ grupo, nota: motivo }))}
                testid="recomendado-para-voce"
              />
            )}

            {/* ---------------- semelhantes às suas ---------------- */}
            {semelhantes.map(({ dona, parecidas }) => (
              <SecaoDeCartoes
                key={dona.id}
                titulo={`Semelhantes a ${dona.nome}`}
                itens={parecidas.map((grupo) => ({ grupo }))}
                aoTocarTitulo={() => setCategoria(categoriaDe(dona.id) ?? "")}
                testid={`semelhantes-${dona.id}`}
              />
            ))}

            {/* ---------------- mais populares ---------------- */}
            <SecaoDeCartoes
              titulo="Mais populares"
              itens={populares.map((grupo) => ({ grupo }))}
              testid="mais-populares"
            />

            {/* ---------------- os carrosséis por assunto ---------------- */}
            {porAssunto.map(({ cat, grupos }) => (
              <SecaoDeCartoes
                key={cat}
                titulo={cat}
                itens={grupos.map((grupo) => ({ grupo }))}
                aoTocarTitulo={() => setCategoria(cat)}
                testid={`assunto-${cat}`}
              />
            ))}

            {/* ---------------- o censo, para ninguém ficar invisível ---------------- */}
            <section className="px-5 pt-7" data-testid="todas-as-comunidades">
              <h2 className="font-display text-[17px] font-bold tracking-tight">
                Todas as comunidades{" "}
                <span className="font-sans text-[12px] font-normal text-white/40">
                  · {todas.length}
                </span>
              </h2>
              <div className="mt-3 space-y-2.5">
                {todas.map((grupo) => (
                  <LinhaDeComunidade key={grupo.id} grupo={grupo} />
                ))}
              </div>
            </section>

            {/* ---------------- criar ---------------- */}
            <section className="px-5 pb-2 pt-7">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="font-display text-[15px] font-bold tracking-tight">
                  Não achou a sua turma?
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">
                  Crie a comunidade — você vira o dono, e o assunto vira casa.
                </p>
                <div className="mt-3">
                  <BotaoDoForum primario onClick={() => setCriando(true)} testid="criar-comunidade">
                    Criar comunidade
                  </BotaoDoForum>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PaginaDoForum>
  );
}

/**
 * A capa da comunidade **redonda** — o formato dos avatares do Reddit.
 *
 * É a `CapaDaComunidade` de sempre (imagem do dono > foto semeada > degradê
 * com emoji) dentro de uma máscara circular: a ordem de quem ganha não muda,
 * só a moldura.
 */
function RostoDaComunidade({
  grupo,
  lado = 44,
  className = "",
}: {
  grupo: Grupo;
  lado?: number;
  className?: string;
}) {
  return (
    <span
      style={{ width: lado, height: lado }}
      className={`block shrink-0 overflow-hidden rounded-full ${className}`}
    >
      <CapaDaComunidade
        imagem={configDo(grupo.id).imagem}
        foto={capaDaComunidade(grupo.id)}
        emoji={grupo.emoji}
        semente={grupo.id}
        lado={lado}
      />
    </span>
  );
}

/**
 * O **"Unir-se" do Reddit** — entrar sem sair do cartão, que é a diferença
 * prática do formato: na lista antiga era preciso abrir a comunidade para
 * participar dela.
 *
 * Um botão para cada situação da governança (§4.74): aberta entra na hora,
 * moderada pede, pedido feito cancela, dentro sai — e fechada avisa que é
 * fechada, em vez de sumir com o botão e deixar o cartão manco.
 */
function BotaoDeEntrar({ grupo }: { grupo: Grupo }) {
  const { toast } = useToast();
  const situacao = situacaoDe(grupo.id);
  if (situacao === "banido") return null;

  const rotulos: Record<SituacaoDeEntrada, string> = {
    dentro: "Entrou ✓",
    livre: "Entrar",
    pedir: "Pedir",
    esperando: "Pedido enviado",
    "so-convidado": "Fechada",
    banido: "",
  };

  function tocar(e: MouseEvent) {
    /* O cartão em volta é um link para a comunidade — o botão não navega. */
    e.preventDefault();
    e.stopPropagation();
    if (situacao === "livre") {
      alternarParticipacao(grupo.id);
      toast({ title: `Você entrou em ${grupo.nome}` });
    } else if (situacao === "dentro") {
      alternarParticipacao(grupo.id);
      toast({ title: `Você saiu de ${grupo.nome}` });
    } else if (situacao === "pedir") {
      pedirEntrada(grupo.id);
      toast({ title: "Pedido enviado", description: "Um moderador precisa aprovar." });
    } else if (situacao === "esperando") {
      desistirDoPedido(grupo.id);
      toast({ title: "Pedido cancelado" });
    }
  }

  return (
    <button
      type="button"
      onClick={tocar}
      disabled={situacao === "so-convidado"}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-30 ${
        situacao === "livre" || situacao === "pedir"
          ? "bg-primary text-black hover:opacity-90"
          : "border border-white/15 text-white/60 hover:bg-white/5"
      }`}
      data-testid={`entrar-${grupo.id}`}
    >
      {rotulos[situacao]}
    </button>
  );
}

/** Um carrossel de cartões com título grande — a seção-padrão do molde Reddit. */
function SecaoDeCartoes({
  titulo,
  itens,
  aoTocarTitulo,
  testid,
}: {
  titulo: string;
  itens: { grupo: Grupo; nota?: string }[];
  /** Com isso, o título vira porta (a setinha » do Reddit) — abre a categoria. */
  aoTocarTitulo?: () => void;
  testid?: string;
}) {
  if (itens.length === 0) return null;
  const cabecalho = (
    <h2 className="min-w-0 truncate font-display text-[17px] font-bold tracking-tight">{titulo}</h2>
  );
  return (
    <section className="pt-7" data-testid={testid}>
      {aoTocarTitulo ? (
        <button
          type="button"
          onClick={aoTocarTitulo}
          className="flex w-full items-center justify-between gap-2 px-5 text-left"
        >
          {cabecalho}
          <ChevronRight className="h-4.5 w-4.5 shrink-0 text-white/40" />
        </button>
      ) : (
        <div className="px-5">{cabecalho}</div>
      )}
      {/* Duas fileiras empilhadas que rolam juntas de lado — a correção dele:
          "tem uma fileira apenas de carrossel aqui". No Reddit cada coluna do
          carrossel tem DOIS cartões, e a coluna seguinte fica espiando. */}
      <div className="mt-3 grid auto-cols-max grid-flow-col grid-rows-2 gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
        {itens.map(({ grupo, nota }) => (
          <CartaoDeComunidade key={grupo.id} grupo={grupo} nota={nota} />
        ))}
      </div>
    </section>
  );
}

/**
 * O cartão de comunidade do molde Reddit: rosto redondo, nome grande, números,
 * o botão de entrar ali mesmo, e a descrição em duas linhas.
 *
 * A `nota` é o motivo da recomendação ("2 pessoas que você segue estão aqui").
 * O Reddit não escreve o porquê; aqui escreve — recomendação sem porquê é
 * lista aleatória com nome bonito (§4.78), e essa regra não é de molde.
 */
function CartaoDeComunidade({ grupo, nota }: { grupo: Grupo; nota?: string }) {
  const pessoas = membrosDo(grupo.id).length;
  const topicos = topicosDa(grupo.id).length;

  return (
    <Link
      href={`/forum/${grupo.id}`}
      className="w-[300px] shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3.5 transition-colors hover:bg-white/[0.06]"
      data-testid={`comunidade-${grupo.id}`}
    >
      <span className="flex items-center gap-2.5">
        <RostoDaComunidade grupo={grupo} lado={44} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold leading-tight line-clamp-2">
            {grupo.nome}
          </span>
          <span className="mt-0.5 block truncate whitespace-nowrap text-[11px] text-white/40">
            {pessoas} {pessoas === 1 ? "membro" : "membros"} · {topicos}{" "}
            {topicos === 1 ? "tópico" : "tópicos"}
          </span>
        </span>
        <BotaoDeEntrar grupo={grupo} />
      </span>
      <span className="mt-2.5 block text-[12px] leading-snug text-white/55 line-clamp-2">
        {grupo.descricao}
      </span>
      {nota && <span className="mt-1.5 block text-[11px] font-medium text-primary">{nota}</span>}
    </Link>
  );
}

/** A mesma coisa em linha vertical — o formato do resultado de busca do Reddit. */
function LinhaDeComunidade({ grupo }: { grupo: Grupo }) {
  const pessoas = membrosDo(grupo.id).length;
  const topicos = topicosDa(grupo.id).length;
  const cat = categoriaDe(grupo.id);

  return (
    <Link
      href={`/forum/${grupo.id}`}
      className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.05]"
      data-testid={`comunidade-${grupo.id}`}
    >
      <RostoDaComunidade grupo={grupo} lado={40} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[14px] font-bold">{grupo.nome}</span>
          <BotaoDeEntrar grupo={grupo} />
        </span>
        <span className="mt-0.5 block text-[11px] text-white/40">
          {pessoas} {pessoas === 1 ? "membro" : "membros"} · {topicos}{" "}
          {topicos === 1 ? "tópico" : "tópicos"}
          {cat && ` · ${iconeDaCategoria(cat)} ${cat}`}
        </span>
        <span className="mt-1 block text-[12px] leading-snug text-white/55 line-clamp-2">
          {grupo.descricao}
        </span>
      </span>
    </Link>
  );
}

function FormularioDeCriacao({ onPronto }: { onPronto: () => void }) {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cat, setCat] = useState("");

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
      data-testid="form-criar"
    >
      <p className="mb-1.5 text-[12px] font-semibold text-white/60">criar uma comunidade</p>
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
          placeholder="💬"
          className={`${CAMPO} w-14 text-center text-[16px]`}
          aria-label="Ícone"
          data-testid="novo-emoji"
        />
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value.slice(0, 60))}
          placeholder="nome da comunidade"
          autoFocus
          className={CAMPO}
          data-testid="novo-nome"
        />
      </div>
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value.slice(0, 400))}
        placeholder="sobre o que é esta comunidade?"
        rows={2}
        className={`${CAMPO} mt-2 resize-none`}
        data-testid="nova-descricao"
      />
      <select
        value={cat}
        onChange={(e) => setCat(e.target.value)}
        className={`${CAMPO} mt-2`}
        data-testid="nova-categoria"
      >
        <option value="">— categoria —</option>
        {CATEGORIAS.map((item) => (
          <option key={item} value={item}>
            {iconeDaCategoria(item)} {item}
          </option>
        ))}
      </select>

      <div className="mt-2.5 flex gap-2">
        <BotaoDoForum
          primario
          disabled={nome.trim().length === 0}
          onClick={() => {
            const novo = criarGrupo(nome, emoji, descricao);
            if (!novo) return;
            if (cat) salvarConfig(novo.id, { categoria: cat });
            onPronto();
            toast({
              title: `"${novo.nome}" criada`,
              description: "Você é o dono — o resto se ajusta em «editar comunidade».",
            });
          }}
          testid="confirmar-criar"
        >
          Criar comunidade
        </BotaoDoForum>
        <BotaoDoForum onClick={onPronto}>Cancelar</BotaoDoForum>
      </div>
    </div>
  );
}
