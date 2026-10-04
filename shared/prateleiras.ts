/**
 * As prateleiras do Catálogo: um assunto, uma prateleira (04/10, §4.170).
 *
 * ## Por que existe
 *
 * Cada loja batiza as próprias estantes, e o Catálogo mostrava **100 cards de
 * gênero** — quase metade com menos de 20 livros, e o mesmo assunto repetido
 * com o nome de cada loja: negócios quatro vezes ("Economia & Negócios",
 * "Empresas e Negócios", "Negócios, Economia e Investimentos", "Negócios e
 * investimentos"), infantil e juvenil em onze rótulos. O Matheus estendeu a
 * todos os gêneros o que tinha decidido para Religião em 21/09 (§4.165): **um
 * assunto vira uma prateleira, com nome do AllBook, não da loja**.
 *
 * ## Como funciona
 *
 * 🚨 **O mapa é aplicado na LEITURA, não no banco.** O banco continua guardando
 * o rótulo que a loja deu (`livros.genero_slug` e `livros.generos`); quem
 * traduz para prateleira é `server/catalogo.ts`, ao montar a resposta. Assim
 * desfazer ou mudar uma junção é editar este arquivo e reiniciar o servidor —
 * nada para reimportar, nada para "desmisturar".
 *
 * Um livro pode estar em **várias** prateleiras (§4.158): *"Ficção > Terror"*
 * põe o livro em Ficção e em Suspense, Crime e Terror. A primeira da lista é a
 * principal — a que a ficha mostra.
 *
 * ⚠️ **Só entra junção que ele aprovou.** A tentação de juntar por parecença é
 * grande; cada linha do mapa abaixo está no vídeo de 04/10 que ele viu e
 * respondeu. Junção nova, pergunte.
 */

/** "Ficção Científica" → "ficcao-cientifica" — o mesmo do cliente e do importador. */
export function slugDe(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* -------------------------------------------------------------------------- */
/* As prateleiras                                                              */
/* -------------------------------------------------------------------------- */

export interface Prateleira {
  /** O nome de tela. O endereço (`/category/…`) é o `slugDe` dele. */
  rotulo: string;
  /**
   * Os botões no alto da página da prateleira, na ordem em que aparecem.
   * A chave é o slug do rótulo da loja que define o botão.
   */
  subcategorias?: { de: string; rotulo: string }[];
}

/**
 * ⚠️ **Ficção, Literatura e "Literatura e Ficção" continuam três** só até ele
 * decidir (§4.170, em aberto): eu defendi juntar — o rótulo segue a loja, não o
 * livro —, ele prefere duas. Até lá vale o que já estava.
 */
const LISTA: Prateleira[] = [
  {
    rotulo: "Religião e Espiritualidade",
    subcategorias: [
      { de: "cristianismo", rotulo: "Cristianismo" },
      { de: "catolicos", rotulo: "Católicos" },
      { de: "evangelica", rotulo: "Evangélica" },
      { de: "biblico", rotulo: "Bíblico" },
      { de: "matriz-africana", rotulo: "Matriz Africana" },
      { de: "cancao-nova", rotulo: "Canção Nova" },
    ],
  },
  { rotulo: "Ficção" },
  { rotulo: "Literatura" },
  { rotulo: "Literatura e Ficção" },
  { rotulo: "Autoajuda e Desenvolvimento Pessoal" },
  {
    /* 🚨 UMA prateleira por enquanto, com botões de idade — a opção B do
       segundo vídeo, escolhida por ele em 04/10. As lojas não separam idade
       direito (o Tocalivros põe "O Irmão do Pinóquio" em "Juvenil e Jovens
       Adultos", e 248 "Infantojuvenil" não dizem idade nenhuma); separar em
       Infantil e Juvenil fica para quando o agente de enriquecimento disser a
       idade livro por livro. Os botões só mostram a idade que a loja DEU. */
    rotulo: "Infantil e Juvenil",
    subcategorias: [
      { de: "infantil-ate-4-anos", rotulo: "Até 4 anos" },
      { de: "infantil-5-a-8-anos", rotulo: "5 a 8 anos" },
    ],
  },
  { rotulo: "Não-ficção" },
  { rotulo: "Negócios e Economia" },
  { rotulo: "Biografias e Memórias" },
  { rotulo: "Clássicos" },
  { rotulo: "Romance" },
  { rotulo: "Documentários" },
  { rotulo: "Ciência e Tecnologia" },
  { rotulo: "Idiomas" },
  { rotulo: "Saúde e Bem-Estar" },
  { rotulo: "Ciências Humanas e Sociais" },
  { rotulo: "História" },
  { rotulo: "Fantasia e Ficção Científica" },
  { rotulo: "Contos e Crônicas" },
  { rotulo: "Educação e Concursos" },
  { rotulo: "Suspense, Crime e Terror" },
  { rotulo: "Poesia e Teatro" },
  { rotulo: "Erótico" },
  /* Fora de Religião, por decisão dele (§4.165 e §4.170): "quem é de religião,
     principalmente cristão, não vai gostar de ver isso junto". */
  { rotulo: "Esoterismo" },
  { rotulo: "Podcasts e Palestras" },
  { rotulo: "Esportes" },
  { rotulo: "Casa e Gastronomia" },
  { rotulo: "Direito" },
  { rotulo: "Humor" },
  { rotulo: "Arte, Música e Quadrinhos" },
];

export const PRATELEIRAS: ReadonlyMap<string, Prateleira> = new Map(
  LISTA.map((p) => [slugDe(p.rotulo), p]),
);

/* -------------------------------------------------------------------------- */
/* De qual rótulo de loja para qual prateleira                                 */
/* -------------------------------------------------------------------------- */

/**
 * Slug do rótulo da loja → slug da prateleira.
 *
 * `null` quer dizer **"conhecido, mas não define prateleira"**: é segundo nível
 * de uma trilha cujo topo já diz a prateleira ("Ficção > Contemporâneo"). Fica
 * aqui para não aparecer no relatório de rótulo desconhecido.
 *
 * ⚠️ Os rótulos em inglês ("fiction", "children"…) não têm livro hoje: são
 * restos da Audible no banco. Estão mapeados para não virarem surpresa.
 */
const GRUPOS: Record<string, string[] | null> = {
  "religiao-e-espiritualidade": [
    "religiao-e-espiritualidade", "religiao", "espiritualidade", "religion-spirituality",
    "cristianismo", "catolicos", "evangelica", "biblico", "matriz-africana",
    "cancao-nova", "eventos", // "Canção Nova > Eventos": homilias e pregações
    "revistas", // as cinco "Lições Bíblicas" do Ubook
  ],
  ficcao: ["ficcao", "fiction", "audionovela"],
  literatura: ["literatura"],
  "literatura-e-ficcao": ["literatura-e-ficcao", "lgbtqia", "lgbt"],
  "autoajuda-e-desenvolvimento-pessoal": [
    "autoajuda", "crescimento-pessoal", "autoajuda-e-desenvolvimento-pessoal",
    "desenvolvimento-pessoal", "inspiracao", "personal-development",
    "relacionamentos-criacao-de-filhos-e-desenvolvimento-pessoal",
  ],
  "infantil-e-juvenil": [
    "kids", "infantojuvenil", "infantil-5-a-8-anos", "infantil-ate-4-anos", "jogos-e-atividades",
    "juvenil", "ficcao-juvenil", "juvenil-e-jovens-adultos", "young-adult",
    "nao-ficcao-juvenil", "nao-ficcao-young-adult",
    "audiolivros-infantis", "adolescentes-e-jovens-adultos", "children", "teens-young-adult",
  ],
  "nao-ficcao": ["nao-ficcao", "non-fiction"],
  "negocios-e-economia": [
    "economia-negocios", "empresas-e-negocios", "negocios-economia-e-investimentos",
    "negocios-e-investimentos", "negocios-e-carreiras", "dinheiro-e-financas", "negocios",
    "economy-business",
  ],
  "biografias-e-memorias": ["biografias", "biografias-e-memorias", "biografia", "biographies"],
  classicos: ["classicos", "classics"],
  romance: ["romance"],
  documentarios: ["documentarios", "jornal"],
  "ciencia-e-tecnologia": [
    "ciencia-e-conhecimento", "ciencia-e-tecnologia", "ciencia", "ciencias-da-natureza",
    "ciencias-e-engenharia", "computadores-e-tecnologia",
  ],
  idiomas: ["aprender-idiomas", "outros-idiomas", "language"],
  "saude-e-bem-estar": [
    "saude-e-bem-estar", "beleza-e-saude", "cuidados-e-dicas-de-saude-e-beleza", "medicina",
    "psicologia-e-saude-mental",
  ],
  "ciencias-humanas-e-sociais": [
    "ciencias-humanas", "sociologia", "ciencias-sociais", "politica", "filosofia", "psicologia",
    "politica-e-ciencias-sociais",
  ],
  historia: ["historia", "historia-e-geografia", "history"],
  "fantasia-e-ficcao-cientifica": ["fantasia", "ficcao-cientifica", "ficcao-cientifica-e-fantasia", "fantasy"],
  "contos-e-cronicas": ["contos", "contos-e-cronicas", "short-stories"],
  "educacao-e-concursos": [
    "educacao", "educacional-tecnico", "cursos", "referencia", "provas-e-concursos", "enem",
    "didaticos", "paradidaticos", "educacao-e-aprendizagem",
  ],
  "suspense-crime-e-terror": [
    "crime", "true-crime", "terror", "terror-suspense", "misterios-e-terror",
    "misterio-intriga-e-suspense",
  ],
  "poesia-e-teatro": ["poesia", "poesia-teatro", "lyric-poetry"],
  erotico: ["erotico", "erotica"],
  esoterismo: ["esoterismo"],
  "podcasts-e-palestras": ["podcast", "podcasts", "palestras-e-entrevistas"],
  esportes: ["esportes", "esportes-e-atividades-ao-ar-livre"],
  "casa-e-gastronomia": ["casa", "gastronomia", "casa-e-jardim"],
  direito: ["direito-e-legislacoes", "direito-e-legislacao", "legislacoes"],
  humor: ["humor", "comedia-e-humor"],
  "arte-musica-e-quadrinhos": [
    "arte-e-design", "musica", "quadrinhos", "historias-em-quadrinhos", "artes-e-entretenimento",
  ],
};

/** Segundo nível de trilha que não muda a prateleira (ver `null` acima). */
const SEM_PRATELEIRA_PROPRIA = ["contemporaneo", "ficcao-historica", "genero-ficcao"];

/**
 * 🚨 **Rótulos que não são assunto** — o livro cai pelo PRÓXIMO rótulo da
 * trilha, ou pela lista `PRATELEIRA_DO_LIVRO`.
 *
 * - **"Grátis" não existe no AllBook** (§4.170, ordem dele): nem prateleira,
 *   nem rótulo, nem selo. É condição comercial da loja, não o que o livro é.
 * - **"Originals" é a marca de produção do Ubook**, não assunto: 284 dos 322
 *   são documentários, e a trilha da loja já diz ("Originals > Documentários").
 * - **"Sem gênero" é a ausência da coisa.**
 */
const NAO_E_ASSUNTO = new Set(["originals", "gratuitos", "livros-gratis", "sem-genero"]);

const DE_ROTULO = new Map<string, string | null>();
for (const [prateleira, rotulos] of Object.entries(GRUPOS)) {
  for (const r of rotulos ?? []) DE_ROTULO.set(r, prateleira);
}
for (const r of SEM_PRATELEIRA_PROPRIA) DE_ROTULO.set(r, null);

/**
 * Os livros que a loja deixou **sem assunto nenhum** — classificados pela
 * sinopse, um a um, em 04/10 (§4.170). Sem esta lista eles não apareceriam em
 * prateleira nenhuma (continuariam achados pela busca).
 *
 * ⚠️ É por **id**. Se um desses livros for reimportado com outro id, ele volta
 * a aparecer no relatório do `npm run acervo` como "sem prateleira" — que é o
 * aviso certo.
 */
export const PRATELEIRA_DO_LIVRO: ReadonlyMap<number, string> = new Map([
  /* "Gratuitos" e "Sem gênero" */
  [112935, "classicos"], // Dom Casmurro
  [112936, "classicos"], // Memórias Póstumas de Brás Cubas
  [112716, "classicos"], // O Crime do Padre Amaro
  [111243, "contos-e-cronicas"], // Eu escreveria se soubesse — 15 histórias do RN
  [113552, "negocios-e-economia"], // De zero a mil drogarias em 7 anos
  [108912, "negocios-e-economia"], // Diversidade e inclusão: negócios em que todos prosperem
  [111797, "ciencias-humanas-e-sociais"], // Vozes que ocupam: cultura e memória negras
  [108916, "autoajuda-e-desenvolvimento-pessoal"], // Autor Palestrante
  /* "Livros Grátis" do Tocalivros: todos são o podcast TocaCast */
  ...[
    106593, 106720, 106767, 106707, 106577, 106895, 106896, 106898, 107161, 107162, 107163,
    107181, 107246, 106588, 106587, 106594, 106719,
  ].map((id) => [id, "podcasts-e-palestras"] as [number, string]),
  /* "Originals" sem trilha */
  [113389, "podcasts-e-palestras"], // Debate: Infiltrado na Klan
  [109502, "podcasts-e-palestras"], // GMIC São Paulo 2016
  [112351, "podcasts-e-palestras"], // GMIC São Paulo 2017
  [112269, "podcasts-e-palestras"], // Tela Viva Móvel 2017
  [112868, "podcasts-e-palestras"], // Tela Viva Móvel 2018
  [113476, "podcasts-e-palestras"], // Tela Viva Móvel 2019
  [113575, "saude-e-bem-estar"], // Enfrentando o Alzheimer
  [113576, "saude-e-bem-estar"], // Meditação
  [113593, "saude-e-bem-estar"], // Sem Glúten e Lactose
  [113591, "saude-e-bem-estar"], // Artrite e Artrose
  [113798, "saude-e-bem-estar"], // Não deixe de lavar as suas mãos
  [113473, "humor"], // Hermanoteu na Terra de Godah
  [113474, "humor"], // Humortivacional
  [113460, "humor"], // Paulinho Serra — stand-up
  [109401, "documentarios"], // Minecraft — O Mundo dos Blocos
  [110074, "documentarios"], // O delicado suicídio assistido
  [110092, "esportes"], // Salvando um time
]);

/* -------------------------------------------------------------------------- */
/* A classificação de um livro                                                 */
/* -------------------------------------------------------------------------- */

export interface Classificacao {
  /** Slugs de prateleira, a principal primeiro. Vazio = sem prateleira. */
  prateleiras: string[];
  /** Rótulos de tela dos botões em que o livro aparece. */
  subcategorias: string[];
  /** Slugs de rótulo que o mapa não conhece — vão para o relatório. */
  desconhecidos: string[];
}

/**
 * Em que prateleiras e botões um livro entra, a partir dos rótulos que a loja
 * deu (slugs, o topo primeiro).
 */
export function classificar(id: number, rotulos: string[]): Classificacao {
  const prateleiras: string[] = [];
  const desconhecidos: string[] = [];
  const fixa = PRATELEIRA_DO_LIVRO.get(id);
  if (fixa) prateleiras.push(fixa);

  for (const r of rotulos) {
    if (NAO_E_ASSUNTO.has(r)) continue;
    if (!DE_ROTULO.has(r)) {
      desconhecidos.push(r);
      continue;
    }
    const p = DE_ROTULO.get(r);
    if (p && !prateleiras.includes(p)) prateleiras.push(p);
  }

  const subcategorias: string[] = [];
  for (const p of prateleiras) {
    for (const s of PRATELEIRAS.get(p)?.subcategorias ?? []) {
      if (rotulos.includes(s.de)) subcategorias.push(s.rotulo);
    }
  }
  return { prateleiras, subcategorias, desconhecidos };
}

/* Conferência na carga: prateleira apontada no mapa tem de existir na lista.
   Erro de digitação aqui faria um assunto inteiro sumir do Catálogo calado. */
for (const alvo of [...Object.keys(GRUPOS), ...PRATELEIRA_DO_LIVRO.values()]) {
  if (!PRATELEIRAS.has(alvo)) throw new Error(`prateleiras.ts: "${alvo}" não está na lista`);
}
