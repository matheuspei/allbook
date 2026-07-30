/**
 * O post da Comunidade — **uma fala com um objeto do AllBook dentro**.
 *
 * É a peça central da reformulação decidida em 29/07 (ROTEIRO §4.53 a §4.58).
 * Vale reler o porquê antes de mexer aqui, porque foi a décima segunda tentativa
 * e as onze anteriores morreram do mesmo mal:
 *
 * **Onze maquetes de Comunidade falharam porque o feed delas era sobre
 * pessoas** — "fulano avaliou", "fulano está ouvindo". Texto sem corpo. O
 * Matheus reagia sempre igual: *"as coisas que eu vejo aqui são muito cruas"*.
 *
 * A virada foi dele: **dar um objeto ao post.** Aqui um post carrega a capa
 * grande de um livro, um trecho de 40s que toca, ou um clube com prazo e vagas.
 * Não é "post de rede social" — é o livro circulando pela voz das pessoas. E é o
 * que responde ao "cru": **o que dá corpo visual não é foto de gente, é a capa.**
 *
 * **Um objeto por post, nunca dois** (decisão de 29/07): dois anexos brigam pelo
 * mesmo espaço e o cartão perde a forma.
 *
 * **Texto puro é permitido, mas nunca é o padrão.** "Terminei meu primeiro livro
 * do ano" é post legítimo e não tem objeto nenhum; o compositor abre com os
 * anexos à mão para que a exceção continue exceção.
 *
 * ---
 *
 * **Herda o mural, não o substitui.** Os posts que você já escreveu vivem em
 * `lib/mural.ts` (chave `allbook_mural_posts`) e continuam ali: esta camada os
 * lê e converte. Assim nada se perde, e o Perfil — que já lia `readMeusPosts` —
 * segue funcionando sem alteração. Decisão do Matheus quando perguntei o que
 * fazer com os antigos: *"tanto faz; pode deixar os que já tem lá"*.
 *
 * ⚠️ **Os posts de outras pessoas são fictícios**, como o resto do esqueleto
 * (`community.ts`): não há servidor, então ninguém publica de verdade. O que
 * **você** publica é real dentro da maquete.
 */

import { criarCitacao, type Citacao } from "@/lib/citacoes";
import { catalog } from "@/lib/books";
import { readMeusPosts, apagarPost as apagarPostDoMural, MAX_POST, type MeuPost } from "@/lib/mural";
import { people } from "@/lib/people";
import { todosOsClubes } from "@/lib/clubes";

/** O mesmo limite do mural — 280. Um só, para não haver dois tetos no app. */
export { MAX_POST };

/**
 * O que o post carrega. **Um só, nunca dois.**
 *
 * `livro` é o mais comum e o mais barato: a capa já existe, já é bonita e já é
 * link para a ficha. `trecho` é o que só o AllBook tem — 40 segundos que tocam
 * parando no fim. `clube` é convite disfarçado de post: quem lê pode entrar.
 */
export type ObjetoDoPost =
  | { tipo: "livro"; bookId: number }
  | { tipo: "trecho"; citacao: Citacao }
  | { tipo: "clube"; clubeId: string };

/**
 * Uma palavra do texto que virou link — **um livro, um autor ou um narrador**.
 *
 * Ideia do Matheus (§4.58): *"que tal ela mencionar um livro, narrador ou
 * coisa, como acontece hoje no Facebook?"*. O argumento a favor é que o post
 * carrega **um** objeto, mas a fala às vezes precisa de dois — *"terminei Duna e
 * me lembrou Fundação"*. Sem menção, o segundo livro é texto morto.
 *
 * **Mencionar pessoas da comunidade (@fulano) ficou fora de propósito**: traz
 * notificação, traz quem-pode-mencionar-quem e traz moderação. Menção é a porta
 * de entrada de importunação em toda rede — entra depois, se fizer falta.
 *
 * ---
 *
 * **A menção passou a ser o caminho ÚNICO de citar por nome** (30/07, crítica do
 * Matheus). Antes havia dois: os botões "Livro" e "Clube" no compositor **e** o
 * `@`. Ele apontou a redundância: *"se você já pode marcar com @, qual é o
 * sentido de ter isso aqui?"*. Tinha razão — e a consequência é que a **primeira
 * menção de livro ou de clube vira o cartão do post** (ver
 * `objetoDaPrimeiraMencao`). Sem isso a menção seria uma citação de segunda
 * classe, e era exatamente disso que ele reclamou: *"não colocou a capa"*.
 *
 * **O botão "Trecho" ficou**, e a razão é dele: não há como digitar um trecho de
 * áudio dentro de uma frase. Trecho se escolhe de uma lista; livro e clube têm
 * nome.
 *
 * ⚠️ **Como isto é guardado, e por quê.** O texto fica **limpo** (`"lembrou
 * @Fundação"`) e a lista de menções vem ao lado. Não há marcação dentro do texto
 * (`[[livro:7|Fundação]]`) por um motivo prático: o texto é digitado num
 * `textarea`, e ali a marcação apareceria crua para quem escreve. Na hora de
 * mostrar, o app casa `@` + rótulo com esta lista; se a pessoa editar e quebrar o
 * nome, a menção simplesmente **volta a ser texto** — nunca vira link errado.
 */
export interface Mencao {
  /** O nome como aparece no texto, **sem** o `@`. */
  rotulo: string;
  alvo:
    | { tipo: "livro"; bookId: number }
    | { tipo: "clube"; clubeId: string }
    | { tipo: "pessoa"; slug: string };
}

export interface Post {
  id: string;
  /** Slug em `community.ts`. **Ausente = você.** */
  autorSlug?: string;
  texto: string;
  /** As palavras do texto que são link. Ver `Mencao`. */
  mencoes?: Mencao[];
  objeto?: ObjetoDoPost;
  /**
   * Post que espera resposta ("Terminei Duna, sigo na série?").
   *
   * É **um tipo de post, e não uma aba separada** — decisão de 29/07: aba
   * dividiria a comunidade em duas plateias, e o que a aba tinha de bom (juntar
   * as sem resposta) vira um filtro dentro do próprio feed.
   */
  pergunta?: boolean;
  /** ISO completo. A ordem do feed é cronológica pura — sem algoritmo. */
  date: string;
  /** Quando foi editado, se foi. A tela mostra "editado" a partir disto. */
  editadoEm?: string;
  /**
   * "Eu **não** quero o cartão desta menção" — o X do compositor.
   *
   * Existe para distinguir duas ausências que, sem ele, seriam iguais no
   * armazenamento: o post que **não tem cartão porque a pessoa tirou** e o post
   * que **não tem cartão porque foi escrito antes de a menção virar cartão**
   * (30/07). O segundo ganha o cartão ao ser lido; o primeiro, nunca.
   */
  semCartao?: boolean;
}

/** Dias atrás, em ISO — os fictícios precisam de data relativa a hoje. */
function atras(horas: number): string {
  const d = new Date();
  d.setHours(d.getHours() - horas);
  return d.toISOString();
}

/** Só usa livro que existe de verdade no catálogo — nada de capa quebrada. */
function existe(bookId: number): boolean {
  return catalog.some((livro) => livro.id === bookId);
}

/**
 * O que a comunidade fictícia anda dizendo.
 *
 * Escritos à mão, um por um, e não gerados: post de esqueleto tem de soar como
 * gente falando de livro — se soar como exemplo de layout ("Lorem ipsum do
 * audiolivro"), o feed parece morto mesmo cheio. Cada um traz um objeto
 * diferente, de propósito, para a tela mostrar as três formas do cartão logo na
 * primeira rolagem.
 */
const DO_ESQUELETO: Post[] = [
  {
    id: "p-esq-1",
    autorSlug: "ana-paula",
    texto:
      "Parei o carro para ouvir isso duas vezes. A pausa que ela dá antes de responder muda a cena inteira.",
    objeto: { tipo: "trecho", citacao: criarCitacao(106, 1250, 40) },
    date: atras(2),
  },
  {
    id: "p-esq-2",
    autorSlug: "ricardo",
    texto: "Terminei Duna hoje. Sigo na série ou paro enquanto está bom?",
    objeto: { tipo: "livro", bookId: 7 },
    pergunta: true,
    date: atras(6),
  },
  {
    id: "p-esq-3",
    autorSlug: "carla-lima",
    texto:
      "Abri uma turma para ler devagar, três capítulos por semana. Quem nunca conseguiu terminar, é a nossa chance.",
    objeto: { tipo: "clube", clubeId: "tres-corpos" },
    date: atras(20),
  },
  {
    id: "p-esq-4",
    autorSlug: "marcos-v",
    texto:
      "Trinta segundos que resumem o livro inteiro. Se você só ouvir isso hoje, já valeu o dia.",
    objeto: { tipo: "trecho", citacao: criarCitacao(4, 688, 34) },
    date: atras(26),
  },
  {
    /* Os dois de baixo existem também para **mostrar a menção funcionando**:
       um menciona uma narradora (post sem objeto nenhum), o outro um segundo
       livro — que é o caso de uso que justificou a menção na §4.58. */
    id: "p-esq-5",
    autorSlug: "juliana-s",
    texto:
      "Já ouvi tudo que a @Helena Vasques narrou e agora estou órfã. Alguém tem uma voz feminina que valha por si só, independente do livro?",
    mencoes: [{ rotulo: "Helena Vasques", alvo: { tipo: "pessoa", slug: "helena-vasques" } }],
    pergunta: true,
    date: atras(30),
  },
  {
    id: "p-esq-6",
    autorSlug: "beto",
    texto:
      "Comecei achando que era autoajuda de aeroporto e terminei com quatro páginas de anotação. Me deu mais chão que @Hábitos Atômicos, e eu não esperava dizer isso.",
    mencoes: [{ rotulo: "Hábitos Atômicos", alvo: { tipo: "livro", bookId: 102 } }],
    objeto: { tipo: "livro", bookId: 4 },
    date: atras(44),
  },
  {
    id: "p-esq-7",
    autorSlug: "luciana",
    texto: "Terminei meu quinto livro do ano. Ano passado inteiro foram três.",
    date: atras(52),
  },
];

/* ------------------------------------------------------------------ *
 * Os seus posts — escrever, editar, apagar
 * ------------------------------------------------------------------ */

/**
 * ⚠️ **Chave nova, e o motivo de não reaproveitar a do mural.**
 *
 * `allbook_mural_posts` guarda o `MeuPost` do mural, e ele **não serve** para o
 * post da Comunidade nova por três razões concretas, não estéticas:
 *
 * 1. **Não aceita trecho.** O `MeuPost` só tem `bookId` ou `clubeId`, e o trecho
 *    de 40s é justamente o objeto que só o AllBook tem.
 * 2. **Exige âncora.** A validação dele descarta post sem livro nem clube — e a
 *    §4.58 decidiu que **texto puro é permitido** (nunca o padrão, mas permitido).
 * 3. **Não tem `pergunta`, `mencoes` nem `editadoEm`.**
 *
 * **Nada do que já existe se perde:** os posts do mural continuam sendo lidos e
 * convertidos por `meuPostComoPost`, e o Perfil, que lê `readMeusPosts`, segue
 * funcionando. Foi a resposta do Matheus quando perguntei o que fazer com os
 * antigos: *"tanto faz; pode deixar os que já tem lá"*.
 */
const CHAVE_POSTS = "allbook_posts";

/** Aviso de que os seus posts mudaram — a tela relê sem recarregar. */
export const POSTS_EVENT = "allbook:posts";

function lerMeus(): Post[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE_POSTS) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado
      .filter(
        (item): item is Post =>
          item &&
          typeof item.id === "string" &&
          typeof item.texto === "string" &&
          typeof item.date === "string",
      )
      .map(comCartaoDaMencao);
  } catch {
    return [];
  }
}

/**
 * Dá cartão ao post antigo que mencionava um livro e não ganhou capa.
 *
 * **Por que a leitura conserta e não uma migração.** O Matheus publicou uma
 * pergunta citando `@O clube das 5 da manhã` **antes** de a menção virar cartão, e
 * a queixa dele foi justamente *"não colocou a capa"*. Reescrever o
 * `localStorage` na leitura seria efeito colateral escondido; derivar na hora de
 * mostrar dá o mesmo resultado e não mexe no que está gravado.
 *
 * **Só age quando não há nada gravado.** Post com objeto próprio fica como está —
 * é o que garante que **editar o texto não troca a capa** de um post que já
 * circulou. E post com `semCartao` continua sem cartão, porque ali a ausência foi
 * escolha.
 */
function comCartaoDaMencao(post: Post): Post {
  if (post.objeto || post.semCartao) return post;
  const objeto = objetoDaPrimeiraMencao(post.mencoes, post.texto);
  return objeto ? { ...post, objeto } : post;
}

function gravarMeus(lista: Post[]): void {
  try {
    localStorage.setItem(CHAVE_POSTS, JSON.stringify(lista));
  } catch {
    /* sem storage o post não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(POSTS_EVENT));
}

/** Os seus posts, do mais recente para o mais antigo. */
export function meusPosts(): Post[] {
  return lerMeus().sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Publica. Devolve o post — ou `null` se não havia nada de fato para publicar.
 *
 * **Post vazio de texto passa, se tiver objeto.** Anexar um trecho e não dizer
 * nada é uma fala completa ("ouçam isto"); o que não existe é post sem texto
 * **e** sem objeto, que seria um cartão em branco.
 */
export function publicarPost(dados: {
  texto: string;
  /**
   * O anexo explícito — hoje só o **trecho**, que é o único que não se digita.
   * Ausente, o objeto sai da primeira menção de livro ou clube (30/07).
   */
  objeto?: ObjetoDoPost;
  pergunta?: boolean;
  mencoes?: Mencao[];
  /** Quem tirou o cartão da menção com o X: fica só o texto com o link. */
  semCartao?: boolean;
}): Post | null {
  const texto = dados.texto.trim().slice(0, MAX_POST);
  const objeto =
    dados.objeto ??
    (dados.semCartao ? undefined : objetoDaPrimeiraMencao(dados.mencoes, texto));
  if (!texto && !objeto) return null;

  const post: Post = {
    id: `p-meu-${Date.now()}`,
    texto,
    ...(objeto ? { objeto } : {}),
    ...(dados.semCartao ? { semCartao: true } : {}),
    ...(dados.pergunta ? { pergunta: true } : {}),
    // Menção cujo nome saiu do texto (a pessoa apagou depois) não é guardada:
    // ela nunca apareceria, e ficaria pesando no armazenamento para sempre.
    ...(dados.mencoes?.length
      ? { mencoes: dados.mencoes.filter((m) => texto.includes(`@${m.rotulo}`)) }
      : {}),
    date: new Date().toISOString(),
  };
  gravarMeus([...lerMeus(), post]);
  return post;
}

/**
 * Reescreve o texto de um post seu — **com o selo "editado"**.
 *
 * Editar foi decisão do Matheus, contra o meu argumento (§4.58): *"nas grandes
 * plataformas você consegue editar"*. A condição que ficou é este carimbo, que
 * resolve a objeção original — sem ele, o autor vira o sentido do texto e faz os
 * comentários anteriores parecerem loucos.
 *
 * **Só o texto muda.** O objeto anexado fica: trocar a capa depois de o post
 * circular seria a troca-de-sentido que o selo não consegue avisar.
 */
export function editarPost(id: string, texto: string, mencoes?: Mencao[]): void {
  const limpo = texto.trim().slice(0, MAX_POST);
  gravarMeus(
    lerMeus().map((post) => {
      if (post.id !== id) return post;
      if (!limpo && !post.objeto) return post; // não deixa esvaziar até virar nada
      return {
        ...post,
        texto: limpo,
        mencoes: (mencoes ?? post.mencoes)?.filter((m) => limpo.includes(`@${m.rotulo}`)),
        editadoEm: new Date().toISOString(),
      };
    }),
  );
}

/**
 * Apaga um post seu — **dos dois formatos**.
 *
 * O feed mistura posts novos (`allbook_posts`) e os antigos do mural
 * (`allbook_mural_posts`), e quem toca "Apagar" não sabe nem tem por que saber
 * em qual dos dois o post está. Tentar nos dois é mais barato do que descobrir.
 */
export function apagarMeuPost(id: string): void {
  const restantes = lerMeus().filter((post) => post.id !== id);
  gravarMeus(restantes);
  apagarPostDoMural(id);
}

/* ------------------------------------------------------------------ *
 * Menção: quem pode ser mencionado
 * ------------------------------------------------------------------ */

/** Um candidato para a lista que abre ao digitar `@`. */
export interface CandidatoDeMencao {
  rotulo: string;
  alvo: Mencao["alvo"];
  /** A linha de baixo: o autor do livro, ou o chapéu da pessoa. */
  detalhe: string;
  /** Capa, quando é livro — a lista fica reconhecível de relance. */
  capa?: string;
}

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Quem casa com o que foi digitado depois do `@` — livros, autores e narradores.
 *
 * **Nada de detecção automática de títulos no texto** (§4.58): o catálogo tem
 * *It: A Coisa*, e "it" apareceria em qualquer frase; "Duna" em qualquer frase
 * sobre deserto. O certo é o padrão do Facebook — **digitar `@` abre a lista**, e
 * escolher é que faz a menção existir.
 *
 * **Quem começa com o que foi digitado vem primeiro.** Digitando "du", *Duna* tem
 * de estar acima de *A Sutil Arte…* só porque esta contém "du" no meio de uma
 * palavra — casamento no começo é quase sempre o que a pessoa quis.
 */
export function candidatosDeMencao(termo: string, limite = 6): CandidatoDeMencao[] {
  const busca = semAcento(termo.trim());
  if (busca.length === 0) return [];

  const achados: { item: CandidatoDeMencao; peso: number }[] = [];

  for (const livro of catalog) {
    const alvo = semAcento(livro.title);
    let onde = alvo.indexOf(busca);
    /*
      **Também acha pelo autor e pelo narrador**, mesmo mostrando o livro. Isto
      recupperava o que a busca do botão "Livro" fazia e que se perderia ao
      removê-lo (30/07): neste app o narrador é motivo de escolha de livro, e
      "quem narrou aquele do Aurélio?" é uma pergunta que a pessoa faz de fato.
      Peso maior, para não empurrar o casamento por título para baixo.
    */
    let peso = onde === 0 ? 0 : onde > 0 ? 2 : -1;
    if (peso === -1) {
      const porGente =
        semAcento(livro.author).includes(busca) || semAcento(livro.narrator).includes(busca);
      if (!porGente) continue;
      onde = 0;
      peso = 4;
    }
    achados.push({
      peso,
      item: {
        rotulo: livro.title,
        alvo: { tipo: "livro", bookId: livro.id },
        detalhe: livro.author,
        capa: livro.cover,
      },
    });
  }

  /*
    **Clube de leitura entra na lista** (30/07). Era o buraco por trás da queixa
    do Matheus: ele digitou `@` querendo um clube, o `@` só conhecia livros e
    pessoas, e o que ele acabou marcando foi o **livro** "O clube das 5 da manhã".
  */
  for (const clube of todosOsClubes()) {
    const alvo = semAcento(clube.nome);
    const onde = alvo.indexOf(busca);
    if (onde === -1) continue;
    const daVez = catalog.find((livro) => livro.id === clube.ciclo.bookId);
    achados.push({
      peso: onde === 0 ? 0 : 2,
      item: {
        rotulo: clube.nome,
        alvo: { tipo: "clube", clubeId: clube.id },
        detalhe: daVez ? `clube · lendo ${daVez.title}` : "clube de leitura",
        capa: daVez?.cover,
      },
    });
  }

  for (const pessoa of people) {
    const alvo = semAcento(pessoa.name);
    const onde = alvo.indexOf(busca);
    if (onde === -1) continue;
    const chapeus = [
      pessoa.roles.includes("author") ? "autor" : null,
      pessoa.roles.includes("narrator") ? "narração" : null,
    ].filter(Boolean);
    achados.push({
      // Pessoa fica um degrau acima de livro-no-meio e um abaixo de
      // livro-no-começo: quem digita `@` no AllBook costuma querer um livro.
      peso: onde === 0 ? 1 : 3,
      item: {
        rotulo: pessoa.name,
        alvo: { tipo: "pessoa", slug: pessoa.slug },
        detalhe: chapeus.join(" · "),
      },
    });
  }

  return achados
    .sort((a, b) => a.peso - b.peso || a.item.rotulo.length - b.item.rotulo.length)
    .slice(0, limite)
    .map((achado) => achado.item);
}

/** Para onde uma menção leva. */
export function hrefDaMencao(alvo: Mencao["alvo"]): string {
  if (alvo.tipo === "livro") return `/book/${alvo.bookId}`;
  if (alvo.tipo === "clube") return `/clube/${alvo.clubeId}`;
  return `/person/${alvo.slug}`;
}

/**
 * O cartão que sai de uma menção — **a primeira de livro ou de clube**.
 *
 * É o que faz o `@` ser o caminho único de citar por nome (30/07). O Matheus
 * apontou a redundância dos botões de anexo e, ao removê-los, a menção teve de
 * assumir o trabalho: *"não colocou a capa"* era a queixa exata.
 *
 * **Por que só a primeira, e não todas.** Continua valendo *um objeto por post*
 * (§4.58): dois cartões brigam pelo mesmo espaço e o post perde a forma. Um texto
 * pode citar três livros — o primeiro ganha corpo, os outros seguem como palavra
 * clicável, que é o que a §4.58 já dizia da menção.
 *
 * **Pessoa mencionada não vira cartão.** O objeto do post é sempre uma obra ou uma
 * turma; um cartão de gente traria de volta o feed "sobre pessoas" que fez as onze
 * maquetes anteriores falharem.
 */
export function objetoDaPrimeiraMencao(
  mencoes: Mencao[] | undefined,
  /**
   * O texto, para saber quem vem antes. **A ordem que importa é a da frase, não a
   * de escolha**: se a pessoa escreve sobre dois livros e só depois volta para
   * marcar o primeiro, o cartão tem de ser do que aparece primeiro — é o que ela
   * está lendo na tela.
   */
  texto?: string,
): ObjetoDoPost | undefined {
  const candidatas = (mencoes ?? []).filter(
    (mencao) => mencao.alvo.tipo === "livro" || mencao.alvo.tipo === "clube",
  );
  if (candidatas.length === 0) return undefined;

  const primeira =
    texto === undefined
      ? candidatas[0]
      : [...candidatas].sort((a, b) => {
          const posA = texto.indexOf(`@${a.rotulo}`);
          const posB = texto.indexOf(`@${b.rotulo}`);
          return (posA === -1 ? Infinity : posA) - (posB === -1 ? Infinity : posB);
        })[0];

  if (primeira.alvo.tipo === "livro") return { tipo: "livro", bookId: primeira.alvo.bookId };
  if (primeira.alvo.tipo === "clube") return { tipo: "clube", clubeId: primeira.alvo.clubeId };
  return undefined;
}

/* ------------------------------------------------------------------ *
 * O feed
 * ------------------------------------------------------------------ */

/** Converte um post seu (do mural) para o formato do feed. */
function meuPostComoPost(item: MeuPost): Post {
  const objeto: ObjetoDoPost | undefined =
    item.bookId !== undefined
      ? { tipo: "livro", bookId: item.bookId }
      : item.clubeId !== undefined
        ? { tipo: "clube", clubeId: item.clubeId }
        : undefined;
  return { id: item.id, texto: item.texto, objeto, date: item.date };
}

/**
 * Tudo o que o feed mostra, do mais recente para o mais antigo.
 *
 * **Cronológico puro, sem algoritmo** (decisão de 29/07): com pouca gente,
 * algoritmo é teatro — finge escolher entre dez coisas. E ordem por tempo é a
 * única que a pessoa consegue prever.
 */
export function todosOsPosts(): Post[] {
  const deFora = DO_ESQUELETO.filter(
    (post) => post.objeto?.tipo !== "livro" || existe(post.objeto.bookId),
  );
  return [
    ...deFora,
    // Os seus, nos dois formatos: o novo e os herdados do mural (ver `CHAVE_POSTS`).
    ...lerMeus(),
    ...readMeusPosts().map(meuPostComoPost),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

/** Só os de quem você segue (mais os seus) — a lente "Seguindo". */
export function postsDeQuemVoceSegue(seguindo: string[]): Post[] {
  return todosOsPosts().filter(
    (post) => post.autorSlug === undefined || seguindo.includes(post.autorSlug),
  );
}
