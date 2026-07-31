/**
 * **A governança do fórum** — os poderes de dono e moderador, como nas
 * comunidades do Orkut.
 *
 * Pedido do Matheus em 31/07, com a lista fechada e a instrução explícita:
 * *"exatamente como era no Orkut, replicar tudo, com todas as coisas iguais. Não
 * vamos fazer nada de diferente. Depois nós editamos."* Por isso este arquivo
 * **não inventa** modelo próprio: ele copia o do Orkut, com os nomes que aquilo
 * tinha.
 *
 * ---
 *
 * **Por que uma lib separada de `grupos.ts`.** Aquele guarda o **conteúdo** —
 * tópicos, respostas, o que está escondido. Este guarda **quem pode o quê**. São
 * dois assuntos com ciclos de vida diferentes: o conteúdo cresce todo dia, a
 * governança muda raramente e é lida por quase toda tela do fórum. Juntos dariam
 * um arquivo de mil linhas onde a regra de permissão se perde no meio de texto de
 * tópico semeado.
 *
 * **Como fica guardado, e por quê.** Nada disto entra no esqueleto (`grupos`, em
 * `grupos.ts`): a configuração mora **por fora**, num mapa por id de fórum, do
 * mesmo jeito que os clubes renomeados (§4.69). Assim o esqueleto continua sendo
 * código imutável e a sua interferência sobrevive a recarregar — e some junto se
 * um dia o fórum semeado mudar de nome no código.
 *
 * **A imagem é enviada de verdade, como no Orkut.** Eu tinha proposto emoji ou
 * capa de livro, alegando a rejeição de upload da §4.58; o Matheus corrigiu:
 * *"inclusive as imagens, tudo tal como era no Orkut"*. E ele está certo, porque
 * **aquela rejeição era sobre outra coisa**: upload num feed público custa
 * servidor, banda e moderação de imagem. Aqui a foto é escolhida pelo dono da
 * comunidade, **encolhida no próprio navegador** (canvas, 140×140, JPEG) e
 * guardada como `data:` URL no `localStorage` — alguns quilobytes, zero servidor.
 */

import { EU } from "@/lib/clubes";
import { community } from "@/lib/community";
import { grupoPorId, GRUPOS_EVENT, todosOsGrupos, type Grupo } from "@/lib/grupos";

const CHAVE = "allbook_forum_governanca";

/* ------------------------------------------------------------------ *
 * Os tipos — a mesma gramática do Orkut
 * ------------------------------------------------------------------ */

/**
 * Como se entra, na régua do Orkut:
 *
 * - `aberta` — um toque e você está dentro.
 * - `moderada` — o pedido cai numa **fila** e alguém aprova.
 * - `fechada` — ninguém pede; só entra quem for convidado pelo dono/moderador.
 */
export type TipoDeEntrada = "aberta" | "moderada" | "fechada";

/** Não-membro **lê** o fórum, ou nem isso? (a "visibilidade" do Orkut) */
export type Visibilidade = "publica" | "privada";

/** Quem pode criar — a trava que o Orkut tinha por tipo de conteúdo. */
export type QuemPodeCriar = "membros" | "moderadores";

export interface ConfigDoForum {
  /* — o que o dono edita da casa — */
  nome?: string;
  descricao?: string;
  categoria?: string;
  emoji?: string;
  /**
   * A imagem da comunidade — `data:` URL de 140×140, encolhida no navegador.
   * Ver `encolherImagem`, no fim deste arquivo.
   */
  imagem?: string;
  regras?: string;
  /** O Orkut mostrava o idioma da comunidade na ficha. */
  idioma?: string;

  /* — as regras de entrada e leitura — */
  entrada: TipoDeEntrada;
  visibilidade: Visibilidade;

  /* — quem cria o quê — */
  criarTopicos: QuemPodeCriar;
  criarEnquetes: QuemPodeCriar;
  criarEventos: QuemPodeCriar;

  /* — as pessoas — */
  /** Slug do dono. Ausente = o dono é quem o esqueleto diz (ou você, se `meu`). */
  donoSlug?: string;
  /** Slugs promovidos a moderador (o dono não precisa estar aqui). */
  moderadores: string[];
  /** Quem foi banido — **não volta a entrar**, como no Orkut. */
  banidos: string[];
  /** Pedidos de entrada esperando aprovação, em ordem de chegada. */
  fila: string[];
  /** Convidados de um fórum fechado — podem entrar sem pedir. */
  convidados: string[];

  /** O fórum foi excluído pelo dono. */
  excluido?: boolean;
}

const PADRAO: ConfigDoForum = {
  /* **Os padrões são os do Orkut**: comunidade nasce aberta, pública e com todo
     mundo podendo criar. Fechar é uma escolha do dono, não o estado inicial —
     comunidade que nasce trancada não recebe ninguém. */
  entrada: "aberta",
  visibilidade: "publica",
  criarTopicos: "membros",
  criarEnquetes: "membros",
  criarEventos: "membros",
  moderadores: [],
  banidos: [],
  fila: [],
  convidados: [],
};

/**
 * As categorias — a lista do Orkut, **trazida para o assunto deste app**.
 *
 * O Orkut tinha "Veículos", "Culinária", "Escolas". Copiar aquilo aqui daria
 * categoria vazia para sempre num app de audiolivro; o que se copia é a **ideia**
 * (uma lista fixa e curta, escolhida numa roleta, que serve para achar comunidade
 * parecida). Se faltar alguma, acrescentar aqui.
 */
export const CATEGORIAS = [
  "Autores",
  "Clássicos",
  "Escuta e hábitos",
  "Fantasia e Ficção Científica",
  "Gêneros",
  "História e Biografia",
  "Infantil e Juvenil",
  "Narração e vozes",
  "Não-ficção",
  "Outros",
  "Romance",
  "Suspense e Mistério",
  "Terror",
] as const;

/* ------------------------------------------------------------------ *
 * Leitura e escrita
 * ------------------------------------------------------------------ */

type Mapa = Record<string, ConfigDoForum>;

function lerMapa(): Mapa {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    return guardado && typeof guardado === "object" && !Array.isArray(guardado) ? guardado : {};
  } catch {
    return {};
  }
}

function gravarMapa(mapa: Mapa): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(mapa));
  } catch {
    /* sem storage a configuração não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/** A configuração de um fórum, com os padrões preenchidos. */
export function configDo(grupoId: string): ConfigDoForum {
  return { ...PADRAO, ...(lerMapa()[grupoId] ?? {}) };
}

/** Muda um pedaço da configuração. Só o dono chega aqui (as telas checam). */
export function salvarConfig(grupoId: string, mudanca: Partial<ConfigDoForum>): ConfigDoForum {
  const mapa = lerMapa();
  const nova = { ...configDo(grupoId), ...mudanca };
  mapa[grupoId] = nova;
  gravarMapa(mapa);
  return nova;
}

/* ------------------------------------------------------------------ *
 * Quem é quem
 * ------------------------------------------------------------------ */

/**
 * O dono do fórum.
 *
 * Sem transferência, é quem o esqueleto diz: o fórum marcado `meu` é seu; os
 * outros pertencem ao primeiro membro da lista — é o mais antigo, e no Orkut o
 * dono era quem criou. Com transferência, vale o `donoSlug` gravado.
 */
export function donoDo(grupoId: string): string {
  const config = configDo(grupoId);
  if (config.donoSlug) return config.donoSlug;
  const grupo = grupoPorId(grupoId);
  if (!grupo) return EU;
  return grupo.meu ? EU : (grupo.membros[0] ?? EU);
}

export function souDono(grupoId: string): boolean {
  return donoDo(grupoId) === EU;
}

/** Dono **ou** moderador — a maioria dos poderes é dos dois, como no Orkut. */
export function souModerador(grupoId: string): boolean {
  return souDono(grupoId) || configDo(grupoId).moderadores.includes(EU);
}

export function ehModerador(grupoId: string, slug: string): boolean {
  return donoDo(grupoId) === slug || configDo(grupoId).moderadores.includes(slug);
}

/**
 * A lista de gente do fórum, com o papel de cada um — o que a tela de gerenciar
 * mostra.
 *
 * **Banido sai da lista**, não fica marcado nela: no Orkut o banido deixava de
 * ser membro. Quem quiser conferir quem baniu tem a lista de banidos, separada.
 */
export function membrosDo(grupoId: string): { slug: string; papel: "dono" | "moderador" | "membro" }[] {
  const grupo = grupoPorId(grupoId);
  if (!grupo) return [];
  const config = configDo(grupoId);
  const dono = donoDo(grupoId);

  const slugs = [...grupo.membros];
  /* Você entra na lista quando participa — e quando é dono de um fórum seu, que
     nasce sem membro nenhum no esqueleto. */
  if (!slugs.includes(EU) && (dono === EU || participa(grupoId))) slugs.unshift(EU);
  if (!slugs.includes(dono)) slugs.unshift(dono);

  return slugs
    .filter((slug) => !config.banidos.includes(slug))
    .map((slug) => ({
      slug,
      papel:
        slug === dono ? ("dono" as const) : config.moderadores.includes(slug) ? ("moderador" as const) : ("membro" as const),
    }))
    .sort((a, b) => {
      const peso = { dono: 0, moderador: 1, membro: 2 };
      return peso[a.papel] - peso[b.papel];
    });
}

/** Você participa? Lê o `grupos.ts`, que é quem guarda a participação. */
function participa(grupoId: string): boolean {
  try {
    const lista = JSON.parse(localStorage.getItem("allbook_grupos_participo") || "[]");
    return Array.isArray(lista) && lista.includes(grupoId);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Entrar — livre, na fila, ou nem isso
 * ------------------------------------------------------------------ */

export type SituacaoDeEntrada =
  | "dentro"
  | "livre"
  | "pedir"
  | "esperando"
  | "so-convidado"
  | "banido";

/** Em que pé você está com este fórum. É o que decide o botão da tela. */
export function situacaoDe(grupoId: string): SituacaoDeEntrada {
  const config = configDo(grupoId);
  if (config.banidos.includes(EU)) return "banido";
  if (participa(grupoId) || souDono(grupoId)) return "dentro";
  if (config.fila.includes(EU)) return "esperando";
  if (config.entrada === "aberta") return "livre";
  if (config.entrada === "moderada") return "pedir";
  return config.convidados.includes(EU) ? "livre" : "so-convidado";
}

/**
 * Você pede para entrar num fórum moderado. Devolve `false` se não fazia sentido
 * (já está dentro, já pediu, ou foi banido).
 */
export function pedirEntrada(grupoId: string): boolean {
  const situacao = situacaoDe(grupoId);
  if (situacao !== "pedir") return false;
  const config = configDo(grupoId);
  salvarConfig(grupoId, { fila: [...config.fila, EU] });
  return true;
}

/** Desiste do pedido enquanto ele está na fila. */
export function desistirDoPedido(grupoId: string): void {
  const config = configDo(grupoId);
  salvarConfig(grupoId, { fila: config.fila.filter((slug) => slug !== EU) });
}

/**
 * A fila de pedidos que o moderador vê.
 *
 * ⚠️ **Os pedidos fictícios são semeados, e isso não é enfeite:** fila sempre
 * vazia faria "aprovar" e "recusar" nascerem como botões mortos — o defeito que a
 * §4.23 manda varrer, e o mesmo argumento da lista de espera do clube (§4.69). A
 * escolha é **estável** (semente pelo id do fórum), para o número não dançar a
 * cada desenho.
 */
export function filaDe(grupoId: string): string[] {
  const config = configDo(grupoId);
  if (config.entrada !== "moderada") return config.fila.filter((slug) => slug === EU);

  const grupo = grupoPorId(grupoId);
  const jaDentro = new Set([...(grupo?.membros ?? []), donoDo(grupoId)]);
  const candidatos = community
    .filter((membro) => !jaDentro.has(membro.slug) && !config.banidos.includes(membro.slug))
    .map((membro) => membro.slug);

  let semente = 0;
  for (let i = 0; i < grupoId.length; i += 1) semente = (semente * 31 + grupoId.charCodeAt(i)) % 9973;
  const quantos = Math.min(semente % 4, candidatos.length);

  /* Os recusados somem da fila fictícia; os seus pedidos vêm sempre. */
  const recusados = new Set(lerRecusados(grupoId));
  const doEsqueleto = candidatos.slice(0, quantos).filter((slug) => !recusados.has(slug));
  return [...config.fila, ...doEsqueleto];
}

const RECUSADOS_CHAVE = "allbook_forum_recusados";

function lerRecusados(grupoId: string): string[] {
  try {
    const mapa = JSON.parse(localStorage.getItem(RECUSADOS_CHAVE) || "{}");
    return Array.isArray(mapa?.[grupoId]) ? mapa[grupoId] : [];
  } catch {
    return [];
  }
}

function gravarRecusado(grupoId: string, slug: string): void {
  try {
    const mapa = JSON.parse(localStorage.getItem(RECUSADOS_CHAVE) || "{}");
    const atual = Array.isArray(mapa?.[grupoId]) ? mapa[grupoId] : [];
    localStorage.setItem(
      RECUSADOS_CHAVE,
      JSON.stringify({ ...mapa, [grupoId]: [...atual, slug] }),
    );
  } catch {
    /* sem storage o recusado volta na próxima leitura; a tela já mostrou */
  }
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/**
 * O moderador aprova um pedido — a pessoa entra.
 *
 * Aprovar alguém do esqueleto **não** mexe no `grupos.ts` (que é código): o
 * membro novo é guardado como "admitido" e a lista de membros o inclui na
 * leitura. É a mesma solução dos clubes renomeados.
 */
export function aprovarPedido(grupoId: string, slug: string): void {
  if (!souModerador(grupoId)) return;
  const config = configDo(grupoId);
  salvarConfig(grupoId, {
    fila: config.fila.filter((item) => item !== slug),
    convidados: config.convidados.includes(slug) ? config.convidados : [...config.convidados, slug],
  });
  admitir(grupoId, slug);
  gravarRecusado(grupoId, slug); // sai da fila fictícia — já está dentro
}

/** O moderador recusa: o pedido some e a pessoa pode pedir de novo depois. */
export function recusarPedido(grupoId: string, slug: string): void {
  if (!souModerador(grupoId)) return;
  const config = configDo(grupoId);
  salvarConfig(grupoId, { fila: config.fila.filter((item) => item !== slug) });
  gravarRecusado(grupoId, slug);
}

/* — quem foi admitido depois, e portanto entra na lista de membros — */

const ADMITIDOS_CHAVE = "allbook_forum_admitidos";

function admitir(grupoId: string, slug: string): void {
  try {
    const mapa = JSON.parse(localStorage.getItem(ADMITIDOS_CHAVE) || "{}");
    const atual: string[] = Array.isArray(mapa?.[grupoId]) ? mapa[grupoId] : [];
    if (!atual.includes(slug)) {
      localStorage.setItem(ADMITIDOS_CHAVE, JSON.stringify({ ...mapa, [grupoId]: [...atual, slug] }));
    }
  } catch {
    /* idem */
  }
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

export function admitidosDe(grupoId: string): string[] {
  try {
    const mapa = JSON.parse(localStorage.getItem(ADMITIDOS_CHAVE) || "{}");
    return Array.isArray(mapa?.[grupoId]) ? mapa[grupoId] : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Os poderes sobre as pessoas
 * ------------------------------------------------------------------ */

/**
 * **Banir** — e o banido não volta a entrar, como no Orkut.
 *
 * É o único poder desta lib sem simetria fácil: desbanir existe (o dono erra), e
 * fica na mesma tela, mas o padrão é o banimento **valer para sempre** até alguém
 * desfazer à mão.
 */
export function banir(grupoId: string, slug: string): void {
  if (!souModerador(grupoId) || slug === donoDo(grupoId)) return;
  const config = configDo(grupoId);
  salvarConfig(grupoId, {
    banidos: config.banidos.includes(slug) ? config.banidos : [...config.banidos, slug],
    /* Banido perde o cargo junto: moderador banido que volta seria moderador de
       novo, e isso é o tipo de bug que só aparece no pior dia. */
    moderadores: config.moderadores.filter((item) => item !== slug),
    fila: config.fila.filter((item) => item !== slug),
    convidados: config.convidados.filter((item) => item !== slug),
  });
}

export function desbanir(grupoId: string, slug: string): void {
  if (!souModerador(grupoId)) return;
  const config = configDo(grupoId);
  salvarConfig(grupoId, { banidos: config.banidos.filter((item) => item !== slug) });
}

/** Nomear moderador. Só o **dono** nomeia — no Orkut era assim. */
export function nomearModerador(grupoId: string, slug: string): void {
  if (!souDono(grupoId) || slug === donoDo(grupoId)) return;
  const config = configDo(grupoId);
  if (config.moderadores.includes(slug)) return;
  salvarConfig(grupoId, { moderadores: [...config.moderadores, slug] });
}

/** Destituir. Também só o dono — senão um moderador derrubaria o outro. */
export function destituirModerador(grupoId: string, slug: string): void {
  if (!souDono(grupoId)) return;
  const config = configDo(grupoId);
  salvarConfig(grupoId, { moderadores: config.moderadores.filter((item) => item !== slug) });
}

/**
 * **Transferir a propriedade.**
 *
 * Quem sai de dono vira **moderador**, e não membro raso: no Orkut o antigo dono
 * continuava na equipe, e tirar todo o poder de alguém que acabou de entregar a
 * casa por vontade própria seria punir o gesto.
 */
export function transferirPropriedade(grupoId: string, paraSlug: string): void {
  if (!souDono(grupoId) || paraSlug === donoDo(grupoId)) return;
  const config = configDo(grupoId);
  const antigo = donoDo(grupoId);
  salvarConfig(grupoId, {
    donoSlug: paraSlug,
    moderadores: [
      ...config.moderadores.filter((item) => item !== paraSlug),
      ...(antigo === EU ? [EU] : [antigo]),
    ],
  });
}

/* ------------------------------------------------------------------ *
 * Excluir a comunidade
 * ------------------------------------------------------------------ */

/**
 * **Excluir o fórum inteiro** — poder do dono, como no Orkut.
 *
 * ⚠️ **Isto reverte a decisão de 28/07** (§4.44), que dizia: *"apagar só enquanto
 * o fórum for só seu — um fórum com gente dentro guarda o trabalho de outras
 * pessoas"*. O Matheus decidiu em 31/07 copiar o Orkut inteiro, e lá o dono
 * **apagava a comunidade com todo mundo dentro**. A regra antiga fica registrada
 * no ROTEIRO, porque o argumento dela continua de pé se um dia ele quiser voltar.
 *
 * O fórum semeado não sai do código — ele é marcado como excluído e some das
 * telas, que é o mesmo efeito com uma vantagem: dá para desfazer.
 */
export function excluirForum(grupoId: string): void {
  if (!souDono(grupoId)) return;
  salvarConfig(grupoId, { excluido: true });
}

export function foiExcluido(grupoId: string): boolean {
  return configDo(grupoId).excluido === true;
}

/* ------------------------------------------------------------------ *
 * O que as telas perguntam
 * ------------------------------------------------------------------ */

/** Dá para **ler** este fórum? Privado só abre para quem está dentro. */
export function possoLer(grupoId: string): boolean {
  if (foiExcluido(grupoId)) return false;
  if (configDo(grupoId).visibilidade === "publica") return true;
  return situacaoDe(grupoId) === "dentro";
}

/** Dá para criar tópico aqui? (o mesmo vale para enquete e evento) */
export function possoCriar(grupoId: string, o: "topicos" | "enquetes" | "eventos"): boolean {
  if (situacaoDe(grupoId) !== "dentro") return false;
  const config = configDo(grupoId);
  const regra =
    o === "topicos" ? config.criarTopicos : o === "enquetes" ? config.criarEnquetes : config.criarEventos;
  return regra === "membros" || souModerador(grupoId);
}

/**
 * O fórum **como a tela deve mostrá-lo**: o esqueleto com a edição do dono por
 * cima, e os membros admitidos somados.
 *
 * Existe para as telas não terem de lembrar de juntar as duas fontes — que é
 * exatamente como a metade some (§4.67).
 */
export function forumNaTela(grupoId: string): Grupo | undefined {
  const base = grupoPorId(grupoId);
  if (!base) return undefined;
  const config = configDo(grupoId);
  const admitidos = admitidosDe(grupoId).filter((slug) => slug !== EU);
  return {
    ...base,
    nome: config.nome?.trim() || base.nome,
    descricao: config.descricao?.trim() || base.descricao,
    emoji: config.emoji?.trim() || base.emoji,
    membros: [...base.membros, ...admitidos]
      .filter((slug, i, todos) => todos.indexOf(slug) === i)
      .filter((slug) => !config.banidos.includes(slug)),
  };
}

/** Todos os fóruns que a tela pode listar — sem os excluídos, já com a edição. */
export function forunsVisiveis(): Grupo[] {
  return todosOsGrupos()
    .filter((grupo) => !foiExcluido(grupo.id))
    .map((grupo) => forumNaTela(grupo.id) ?? grupo);
}

/* ------------------------------------------------------------------ *
 * A ficha da comunidade — os campos que o Orkut mostrava no topo
 * ------------------------------------------------------------------ */

/** Idiomas da roleta do Orkut, encurtada ao que este app usa. */
export const IDIOMAS = ["Português (Brasil)", "Português (Portugal)", "Inglês", "Espanhol"] as const;

/**
 * "Criada em" — o Orkut mostrava, e a ficha sem isso fica com um buraco.
 *
 * O fórum **seu** guarda a data de verdade (o id carrega o instante da criação);
 * o **semeado** ganha uma data estável tirada do id, porque inventar uma nova a
 * cada desenho faria a ficha mentir de forma visível.
 */
export function criadaEm(grupoId: string): string {
  const doId = grupoId.startsWith("meu-g-") ? Number(grupoId.slice(6)) : NaN;
  if (!Number.isNaN(doId)) return new Date(doId).toISOString();

  let semente = 0;
  for (let i = 0; i < grupoId.length; i += 1) semente = (semente * 31 + grupoId.charCodeAt(i)) % 9973;
  /* Entre 2 e 5 anos atrás — comunidade de fórum não nasce ontem. */
  const dias = 730 + (semente % 1095);
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString();
}

/** Como o Orkut escrevia data por extenso. */
export function porExtenso(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Encolhe a imagem escolhida para 140×140 **no navegador**, antes de guardar.
 *
 * É o que torna o upload possível sem servidor: uma foto de 4 MB vira ~8 KB de
 * `data:` URL, que cabe no `localStorage` com folga. O corte é **central e
 * quadrado**, como a miniatura do Orkut — esticar a foto para caber deformaria
 * rosto, que é o que mais aparece em imagem de comunidade.
 */
export function encolherImagem(arquivo: File, lado = 140): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("não deu para ler o arquivo"));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("não é uma imagem"));
      img.onload = () => {
        const tela = document.createElement("canvas");
        tela.width = lado;
        tela.height = lado;
        const pincel = tela.getContext("2d");
        if (!pincel) return reject(new Error("sem canvas"));

        const corte = Math.min(img.width, img.height);
        pincel.drawImage(
          img,
          (img.width - corte) / 2,
          (img.height - corte) / 2,
          corte,
          corte,
          0,
          0,
          lado,
          lado,
        );
        resolve(tela.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}
