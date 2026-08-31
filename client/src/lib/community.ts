/**
 * Leitores da comunidade — fictícios, de propósito.
 *
 * Não existe servidor nem cadastro, então não há outros usuários de verdade.
 * Estas pessoas são o **esqueleto**: perfis com bio, recomendações e comentários
 * próprios, para dar o que ver enquanto a comunidade de gente real não existe.
 * Quando houver backend, isto vira uma chamada à API e os perfis passam a ser de
 * pessoas mesmo — o resto das telas não muda.
 *
 * As recomendações usam ids que existem no catálogo — nada de capa quebrada.
 */

import { type Book, livroPorId } from "@/lib/books";

/**
 * **A foto de cada leitor** (31/07).
 *
 * Pedido do Matheus: *"crie caras para os perfis… imagens mesmo, como se fosse
 * uma pessoa real"*. Os arquivos ficam em `assets/images/community/<slug>.jpg` e
 * são baixados uma vez por `npm run caras` — nunca durante o uso, como as capas
 * dos livros.
 *
 * ⚠️ **São fotos de rosto, e a primeira versão errou aqui.** Eu tinha usado
 * ilustração gerada, alegando que usar o rosto de uma pessoa real num perfil
 * fictício toma a imagem de quem não escolheu estar ali. Ele viu na tela e
 * respondeu: *"esse tá um avatar fictício, não é o que eu queria; eu queria
 * realmente o rosto de pessoas que parecessem pessoas"*. É decisão dele, tomada
 * duas vezes. O registro fica no cabeçalho de `scripts/caras.mjs`, sem insistir:
 * são fotos de banco de protótipo e saem quando houver contas de verdade.
 *
 * Falta o arquivo? O avatar volta a ser a inicial no gradiente, como antes — é o
 * mesmo desenho de `people.ts`, e por isso soltar um `<slug>.jpg` na pasta basta.
 */
const arquivosDeRosto = import.meta.glob("../assets/images/community/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const rostosPorSlug: Record<string, string> = Object.fromEntries(
  Object.entries(arquivosDeRosto).map(([caminho, url]) => [
    caminho.split("/").pop()!.replace(/\.(jpg|jpeg|png|webp)$/, ""),
    url,
  ]),
);

/** O rosto de um leitor, se ele tiver um arquivo na pasta. */
export function fotoDoMembro(slug: string): string | undefined {
  return rostosPorSlug[slug];
}

/**
 * **Põe o rosto em qualquer avatar do app, sem mexer na marcação dele.**
 *
 * Nasceu de uma queixa exata do Matheus (31/07): *"clico no perfil da Ana Paula e
 * não aparece imagem nenhuma; clico nos membros dos fóruns e não aparece nada
 * disso"*. Ele estava certo, e a causa era o método: eu tinha trocado o avatar
 * **em quatro telas**, à mão, quando existem **vinte e cinco** lugares que
 * desenham a mesma bolinha com a inicial.
 *
 * Trocar 25 marcações diferentes é o jeito de a metade voltar (o defeito que a
 * §4.67 já tinha cobrado com o curtir). Este helper resolve por outro caminho: ele
 * devolve um `style` que **pinta a foto no fundo do próprio elemento** e apaga a
 * letra, então cada avatar precisa de **uma linha** — `{...avatarDeLeitor(slug)}`
 * — e continua com o tamanho, a forma e a borda que já tinha.
 *
 * Sem foto, devolve objeto vazio: o gradiente e a inicial ficam como sempre
 * foram, e nenhuma tela precisa saber da diferença.
 */
export function avatarDeLeitor(slug?: string): {
  style?: React.CSSProperties;
} {
  const foto = slug ? rostosPorSlug[slug] : undefined;
  if (!foto) return {};
  return {
    style: {
      backgroundImage: `url(${foto})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      /* A inicial continua no HTML (leitor de tela e busca a encontram), e some
         da vista atrás da foto. */
      color: "transparent",
    },
  };
}

/**
 * Um livro que a pessoa pôs na lista pública dela, com a data em que pôs.
 *
 * A data não é enfeite: é ela que permite dizer "Ana Paula recomendou Duna"
 * na ordem certa, na tela de Comunidade. Sem data, recomendação é um conjunto
 * sem antes e depois, e não dá para montar acontecimento nenhum.
 */
export interface Recommendation {
  bookId: number;
  /** ISO. */
  date: string;
  /** Por que a pessoa recomenda. Opcional — nem toda recomendação tem texto. */
  note?: string;
}

export interface CommunityMember {
  slug: string;
  name: string;
  bio: string;
  /**
   * O gradiente da pessoa.
   *
   * **Continua valendo mesmo com foto** (31/07): o rosto é PNG transparente e
   * entra por cima dele. Quem não tem arquivo mostra a inicial no gradiente, como
   * antes — nenhuma tela precisou saber da diferença.
   */
  color: string;
  /** Quando entrou, em texto — só para dar densidade ao perfil. */
  memberSince: string;
  hoursListened: number;
  /** Ids das conquistas (troféus) desta pessoa — ver `lib/achievements.ts`. */
  achievementIds: string[];
  recommendations: Recommendation[];
  /**
   * O que a pessoa está ouvindo **neste momento** — o bloco "Ouvindo agora" da
   * Comunidade (ROTEIRO 4.41): é a única vitrine que só um app de audiolivro
   * pode ter, e resolve o vazio do primeiro dia sem exigir que você siga
   * alguém. Nem todo mundo tem: gente parada também é verdade. Escolhido para
   * combinar com a bio e **não repetir** o que a pessoa já recomenda — estar no
   * meio de um livro é diferente de já tê-lo indicado. Quando houver servidor,
   * vem do progresso real (e com o interruptor de privacidade do painel).
   */
  ouvindoAgora?: { bookId: number; chapter: number };
}

export const community: CommunityMember[] = [
  {
    slug: "ana-paula",
    name: "Ana Paula",
    bio: "Suspense é meu vício. Se tiver reviravolta no fim, eu já quero.",
    color: "from-rose-500 to-pink-600",
    memberSince: "janeiro de 2025",
    hoursListened: 212,
    ouvindoAgora: { bookId: 313, chapter: 5 },
    achievementIds: ["primeira-escuta", "maratonista", "constante", "coruja", "centenario", "voz-ativa", "recomendador"],
    recommendations: [
      { bookId: 2, date: "2026-07-20", note: "Não consegui parar nas últimas duas horas. O fim me pegou de surpresa." },
      { bookId: 1, date: "2026-07-14" },
      { bookId: 120, date: "2026-06-30" },
      { bookId: 3, date: "2026-06-11" },
      { bookId: 106, date: "2026-05-27" },
    ],
  },
  {
    slug: "marcos-v",
    name: "Marcos V.",
    bio: "Ouço no trânsito, entre uma reunião e outra. Negócios e biografia.",
    color: "from-amber-500 to-orange-600",
    memberSince: "março de 2025",
    hoursListened: 148,
    ouvindoAgora: { bookId: 103, chapter: 9 },
    achievementIds: ["primeira-escuta", "maratonista", "constante", "explorador", "recomendador"],
    recommendations: [
      { bookId: 112, date: "2026-07-18", note: "Ouvi numa viagem de trabalho e mudou como eu penso em decisão." },
      { bookId: 113, date: "2026-07-07" },
      { bookId: 101, date: "2026-06-16" },
      { bookId: 108, date: "2026-05-30" },
    ],
  },
  {
    slug: "juliana-s",
    name: "Juliana S.",
    bio: "Livro bom é o que me faz perder a hora do almoço. Clássicos, sobretudo.",
    color: "from-violet-500 to-purple-600",
    memberSince: "novembro de 2024",
    hoursListened: 389,
    ouvindoAgora: { bookId: 307, chapter: 8 },
    achievementIds: ["primeira-escuta", "maratonista", "centenario", "constante", "coruja", "explorador", "concluido", "ecletico", "voz-ativa", "curtido", "recomendador"],
    recommendations: [
      { bookId: 140, date: "2026-07-15", note: "Um clássico que envelhece bem. Devia ser leitura obrigatória." },
      { bookId: 136, date: "2026-07-01" },
      { bookId: 130, date: "2026-06-18" },
      { bookId: 131, date: "2026-06-02" },
      { bookId: 137, date: "2026-05-19" },
    ],
  },
  {
    slug: "ricardo",
    name: "Ricardo",
    bio: "Fui do time que não tinha tempo de ler. Hoje ouço 2h por dia.",
    color: "from-emerald-500 to-teal-600",
    memberSince: "junho de 2025",
    hoursListened: 96,
    ouvindoAgora: { bookId: 321, chapter: 3 },
    achievementIds: ["primeira-escuta", "maratonista", "constante"],
    recommendations: [
      { bookId: 107, date: "2026-07-21", note: "Perfeito pra quem tem pouco tempo e quer começar por algo leve." },
      { bookId: 102, date: "2026-07-04" },
      { bookId: 124, date: "2026-06-09" },
    ],
  },
  {
    slug: "carla-lima",
    name: "Carla Lima",
    bio: "Ficção científica e o que mais me tirar deste século.",
    color: "from-blue-500 to-indigo-600",
    memberSince: "fevereiro de 2025",
    hoursListened: 267,
    ouvindoAgora: { bookId: 131, chapter: 12 },
    achievementIds: ["primeira-escuta", "maratonista", "centenario", "constante", "explorador", "concluido", "recomendador", "formador-de-roda"],
    recommendations: [
      { bookId: 7, date: "2026-07-13", note: "A melhor ficção científica que já ouvi. Simplesmente épico." },
      { bookId: 109, date: "2026-06-26" },
      { bookId: 8, date: "2026-06-15" },
      { bookId: 129, date: "2026-05-24" },
      { bookId: 132, date: "2026-05-06" },
    ],
  },
  {
    slug: "beto",
    name: "Beto",
    bio: "Terror antes de dormir. Sim, eu sei o que estou fazendo.",
    color: "from-red-600 to-rose-700",
    memberSince: "agosto de 2025",
    hoursListened: 74,
    achievementIds: ["primeira-escuta", "coruja", "constante"],
    recommendations: [
      { bookId: 105, date: "2026-07-11", note: "Dormir depois desse? Só de luz acesa. Vale cada arrepio." },
      { bookId: 104, date: "2026-06-29" },
      { bookId: 144, date: "2026-06-12" },
      { bookId: 145, date: "2026-05-21" },
    ],
  },
  {
    slug: "felipe-g",
    name: "Felipe G.",
    bio: "Comecei pelo dinheiro e fiquei pelas histórias. Investimento e psicologia.",
    color: "from-cyan-500 to-blue-600",
    memberSince: "abril de 2025",
    hoursListened: 131,
    achievementIds: ["primeira-escuta", "maratonista", "constante", "explorador", "recomendador"],
    recommendations: [
      { bookId: 101, date: "2026-07-17", note: "Mudou minha relação com dinheiro de vez. Recomendo a todo mundo." },
      { bookId: 137, date: "2026-06-20" },
      { bookId: 125, date: "2026-05-14" },
    ],
  },
  {
    slug: "luciana",
    name: "Luciana",
    bio: "Reouço o que gostei. Livro bom aguenta a segunda vez.",
    color: "from-fuchsia-500 to-purple-600",
    memberSince: "dezembro de 2024",
    hoursListened: 305,
    achievementIds: ["primeira-escuta", "maratonista", "centenario", "constante", "concluido", "ecletico", "curtido", "recomendador"],
    recommendations: [
      { bookId: 203, date: "2026-07-10" },
      { bookId: 102, date: "2026-07-02", note: "Reouvi três vezes. Cada vez acho um detalhe novo." },
      { bookId: 4, date: "2026-06-23" },
      { bookId: 201, date: "2026-06-08" },
    ],
  },
  /* ------------------------------------------------------------------ *
   * Os 16 que vieram dos clubes (promovidos em 29/07)
   *
   * Eles nasceram como "figurantes" dentro de `clubes.ts` — só slug, nome e
   * cor — para encher as turmas semeadas. O Matheus achou o defeito disso pelo
   * uso: no cartão de um clube, *"moderado por Elias"* não era clicável, porque
   * o Elias não existia como pessoa em lugar nenhum.
   *
   * **A regra que fica: quem aparece no app tem página.** Um nome que a
   * interface mostra e não deixa abrir é um beco sem saída (§4.23).
   *
   * Entram com **bio e nada mais inventado** — sem horas fabricadas em massa,
   * sem conquistas, sem recomendações. O que a página deles mostra é o que é
   * verdade: quem são e em que clubes estão.
   * ------------------------------------------------------------------ */
  { slug: "tereza-m", name: "Tereza M.", bio: "Leio devagar e releio. Clube é o jeito de eu não abandonar no meio.", color: "from-emerald-500 to-teal-600", memberSince: "março de 2025", hoursListened: 64, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "gustavo-a", name: "Gustavo A.", bio: "Ficção científica e história. Se tiver mapa no começo, eu topo.", color: "from-sky-500 to-blue-600", memberSince: "maio de 2025", hoursListened: 88, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "nara", name: "Nara", bio: "Ouço cozinhando. Livro bom é o que me faz queimar o arroz.", color: "from-fuchsia-500 to-purple-600", memberSince: "fevereiro de 2025", hoursListened: 121, achievementIds: ["primeira-escuta", "constante"], recommendations: [] },
  { slug: "elias", name: "Elias", bio: "Modero dois clubes. Gosto mais de discutir livro do que de ler sozinho.", color: "from-amber-500 to-orange-600", memberSince: "novembro de 2024", hoursListened: 190, achievementIds: ["primeira-escuta", "voz-ativa"], recommendations: [] },
  { slug: "bia-costa", name: "Bia Costa", bio: "Terror só de dia. Aprendi do jeito difícil.", color: "from-rose-400 to-red-500", memberSince: "junho de 2025", hoursListened: 45, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "hugo-p", name: "Hugo P.", bio: "Corro e ouço. Meia hora de rua, meia hora de capítulo.", color: "from-lime-500 to-green-600", memberSince: "abril de 2025", hoursListened: 133, achievementIds: ["primeira-escuta", "maratonista"], recommendations: [] },
  { slug: "sandra-l", name: "Sandra L.", bio: "Clássicos, sem pressa. Já reli Austen inteira duas vezes.", color: "from-violet-500 to-indigo-600", memberSince: "janeiro de 2025", hoursListened: 176, achievementIds: ["primeira-escuta", "constante"], recommendations: [] },
  { slug: "caio", name: "Caio", bio: "Entro em todo clube que abre. Termino uns dois de cada três.", color: "from-cyan-500 to-sky-600", memberSince: "julho de 2025", hoursListened: 39, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "renata-v", name: "Renata V.", bio: "Narração me decide mais que sinopse. Voz errada, livro morto.", color: "from-pink-500 to-rose-600", memberSince: "março de 2025", hoursListened: 97, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "otavio", name: "Otávio", bio: "Não ficção pesada e podcast leve. Equilíbrio.", color: "from-orange-500 to-amber-600", memberSince: "agosto de 2025", hoursListened: 58, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "lia-f", name: "Lia F.", bio: "Só termino livro que me deixa com raiva ou com saudade.", color: "from-teal-500 to-emerald-600", memberSince: "maio de 2025", hoursListened: 72, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "dani-r", name: "Dani R.", bio: "Romance sem culpa nenhuma. E fantasia quando o mundo aperta.", color: "from-indigo-500 to-violet-600", memberSince: "fevereiro de 2025", hoursListened: 145, achievementIds: ["primeira-escuta", "constante"], recommendations: [] },
  { slug: "paulo-s", name: "Paulo S.", bio: "Biografia de gente difícil. Aprendo mais com erro alheio.", color: "from-red-500 to-rose-600", memberSince: "outubro de 2024", hoursListened: 205, achievementIds: ["primeira-escuta", "centenario"], recommendations: [] },
  { slug: "iara", name: "Iara", bio: "Ouço à noite, no escuro, com o fone bom. É quase cinema.", color: "from-green-500 to-lime-600", memberSince: "junho de 2025", hoursListened: 61, achievementIds: ["primeira-escuta", "coruja"], recommendations: [] },
  { slug: "vitor-h", name: "Vitor H.", bio: "Mistério e policial. Tento sempre descobrir antes do fim.", color: "from-blue-500 to-cyan-600", memberSince: "abril de 2025", hoursListened: 112, achievementIds: ["primeira-escuta"], recommendations: [] },
  { slug: "marina-t", name: "Marina T.", bio: "Leio o que o clube escolher. É assim que eu descubro coisa nova.", color: "from-purple-500 to-fuchsia-600", memberSince: "julho de 2025", hoursListened: 51, achievementIds: ["primeira-escuta"], recommendations: [] },
];
/**
 * Acha o leitor pelo nome como ele aparece escrito, por exemplo num comentário
 * de livro ("Marcos V."). É por aqui que os comentários viram links de perfil.
 */
export function findMemberByName(name: string): CommunityMember | undefined {
  const wanted = normalizeName(name);
  return community.find((member) => normalizeName(member.name) === wanted);
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function findMember(slug: string): CommunityMember | undefined {
  return community.find((member) => member.slug === slug);
}

/**
 * Os livros recomendados por essa pessoa, do mais recente para o mais antigo e
 * sem ids órfãos.
 */
export function recommendationsOf(member: CommunityMember): { book: Book; note: string }[] {
  return [...member.recommendations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((item) => {
      const book = livroPorId(item.bookId);
      return book ? [{ book, note: item.note ?? "" }] : [];
    });
}
