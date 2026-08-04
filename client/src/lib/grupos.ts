/**
 * Os **fóruns** — comunidade → tópicos → respostas, a estrutura do Orkut.
 *
 * **Na tela chama-se "Fórum"; no código, `grupo`.** A troca de nome é de 28/07
 * (ROTEIRO 4.44) e não é cosmética: o Matheus tinha pedido um "grupo" com dono,
 * privacidade e expulsão, e a janela A mostrou que isso era, funcionalmente, **o
 * clube de leitura sem livro** — dois produtos convergindo para o mesmo ponto.
 * Ele então corrigiu o rumo: *"a ideia do grupo talvez seja ruim, mas a ideia do
 * fórum é boa"*. Fórum e clube não competem, porque **um fórum de 300 pessoas
 * funciona melhor que um de 8, e um clube de 300 não funciona**.
 *
 * Os identificadores continuam `grupo` porque renomeá-los mexeria em chaves do
 * `localStorage` de quem já usa, sem nada mudar para quem vê. Se um dia forem
 * renomeados, a tela não muda — ela já diz Fórum.
 *
 * **O nível que faltava:** a sala do livro conversa sobre UM livro; o clube é uma
 * turma com prazo; o fórum conversa sobre UM ASSUNTO ("Suspense & Mistério",
 * "Quem ouve no trânsito"), sem fim e sem compromisso.
 *
 * **Quem pode o quê:** entrar é livre (um toque); criar tópico e responder é para
 * quem entrou; **quem criou o fórum modera o conteúdo** (esconder, fixar, cobrir
 * spoiler) mas não pode apagá-lo depois que outras pessoas escreveram lá — ver a
 * seção de moderação, mais abaixo.
 *
 * Como tudo no app: os fóruns e os fios dos leitores fictícios são o esqueleto
 * semeado; o que VOCÊ faz mora no `localStorage` e sobrevive a recarregar.
 */

import { type Citacao } from "@/lib/citacoes";
import { community, type CommunityMember } from "@/lib/community";

const PARTICIPO_KEY = "allbook_grupos_participo";
const MEUS_TOPICOS_KEY = "allbook_grupos_meus_topicos";
const MINHAS_RESPOSTAS_KEY = "allbook_grupos_minhas_respostas";

/** Aviso de mudança — as telas releem sem recarregar. */
export const GRUPOS_EVENT = "allbook:grupos";

/** Tamanhos: título curto de fórum; resposta um pouco maior que post do mural. */
export const MAX_TITULO = 120;
export const MAX_RESPOSTA = 400;

export interface Grupo {
  id: string;
  nome: string;
  /** O ícone do grupo — emoji, como as comunidades do Orkut tinham imagem. */
  emoji: string;
  descricao: string;
  /** Slugs de `community.ts` que "moram" neste grupo. */
  membros: string[];
  /**
   * A categoria de origem — uma das `CATEGORIAS` de `forum.ts`.
   *
   * **Entrou em 31/07 e conserta um buraco silencioso:** a categoria só existia
   * na config editável, então **nenhuma comunidade semeada tinha uma** e o
   * filtro por categoria da busca não achava nada. Quem edita a comunidade
   * continua mandando (a config ganha desta); isto é o valor de fábrica.
   */
  categoria?: string;
  /** Você criou — pode apagar, e ele mora no `localStorage`. */
  meu?: boolean;
}

export interface RespostaSemeada {
  autorSlug: string;
  texto: string;
  /** ISO (só dia). */
  date: string;
}

export interface TopicoSemeado {
  id: string;
  grupoId: string;
  titulo: string;
  autorSlug: string;
  date: string;
  /** Fixado no topo do grupo (o 📌 do Orkut). */
  fixado?: boolean;
  /**
   * **O livro de que este tópico fala** — a capa dele vira a capa do tópico.
   *
   * Ver `CapaDoTopico`, em `components/forum/Pecas.tsx`, para o porquê de a capa
   * de livro vir **antes** da imagem enviada na hora de escolher.
   */
  bookId?: number;
  respostas: RespostaSemeada[];
}

/* ------------------------------------------------------------------ *
 * O esqueleto — grupos e fios fictícios, para dar o que ler no dia 1
 * ------------------------------------------------------------------ */

export const grupos: Grupo[] = [
  /*
   * **Este fórum é seu**, e existe por um motivo prático (ROTEIRO 4.44): um
   * fórum recém-criado nasce vazio, sem tópico de outra pessoa dentro — e a
   * moderação que o Matheus pediu nasceria como botão morto, que é o que a 4.23
   * manda varrer. Marcá-lo como seu dá o que moderar. Mesmo precedente do clube
   * "Suspense de Domingo", e pela mesma razão.
   */
  {
    id: "suspense-misterio",
    nome: "Suspense & Mistério",
    emoji: "🕵️",
    descricao:
      "Reviravolta, narrador não confiável e o medo de dar play no último capítulo. Este é seu: dá para fixar e esconder o que aparece aqui.",
    membros: ["ana-paula", "marcos-v", "beto", "carla-lima", "ricardo"],
    categoria: "Suspense e Mistério",
    meu: true,
  },
  {
    id: "quem-ouve-no-transito",
    nome: "Quem ouve no trânsito",
    emoji: "🚗",
    descricao: "O carro é a nossa poltrona de leitura. Dicas, manias e horários.",
    membros: ["marcos-v", "felipe-g", "ricardo"],
    categoria: "Ouvir no trânsito",
  },
  {
    id: "classicos",
    nome: "Clássicos",
    emoji: "📚",
    descricao: "O que envelheceu bem — e o que só faz sentido com uma boa narração.",
    membros: ["juliana-s", "luciana", "ana-paula", "carla-lima"],
    categoria: "Clássicos",
  },
  {
    id: "ficcao-cientifica",
    nome: "Ficção Científica",
    emoji: "🚀",
    descricao: "Mundos inteiros no fone de ouvido, de Duna a Fundação.",
    membros: ["carla-lima", "felipe-g", "ricardo"],
    categoria: "Fantasia e Ficção Científica",
  },
  {
    id: "habitos-vida-real",
    nome: "Hábitos na vida real",
    emoji: "💪",
    descricao: "O que a gente ouviu em Produtividade — e o que funcionou de verdade.",
    membros: ["ricardo", "luciana", "beto", "felipe-g"],
    categoria: "Escuta e hábitos",
  },

  /* ------------------------------------------------------------------ *
   * As dez de 31/07 — porque cinco comunidades não fazem uma aba viva
   *
   * O Matheus abriu a aba e disse: *"eu acho ela muito crua, sem vida
   * nenhuma"*. Parte disso era a tela (ver §4.82), mas parte era **o que havia
   * dentro**: cinco comunidades, e você já participava de três. Uma aba de
   * descoberta com duas coisas para descobrir não tem como parecer viva.
   *
   * As dez abaixo seguem a régua das cinco primeiras: **nenhuma nasce vazia**
   * (toda uma tem tópico e conversa lá embaixo), os membros são leitores de
   * `community.ts`, e o assunto é sempre uma coisa que gente de audiolivro
   * realmente discute — inclusive as "aleatórias" que ele pediu, do tipo que só
   * existe aqui: ouvir em 2x, dormir no meio do capítulo, abandonar livro.
   * ------------------------------------------------------------------ */
  {
    id: "ouvir-dormindo",
    nome: "Durmo antes do fim do capítulo",
    emoji: "😴",
    descricao:
      "Quem ouve na cama e acorda três capítulos à frente. Temporizador, voz calma e a arte de achar onde parou.",
    membros: ["tereza-m", "luciana", "bia-costa", "nara", "hugo-p"],
    categoria: "Ouvir dormindo",
  },
  {
    id: "velocidade-2x",
    nome: "Eu ouço em 2x (e entendo tudo)",
    emoji: "⏩",
    descricao:
      "A comunidade mais rápida do AllBook. Defesa, limites e a briga eterna com quem ouve em 1x.",
    membros: ["marcos-v", "gustavo-a", "caio", "vitor-h"],
    categoria: "Escuta e hábitos",
  },
  {
    id: "true-crime",
    nome: "True Crime sem sensacionalismo",
    emoji: "🔎",
    descricao:
      "Caso real contado com respeito por quem viveu. Indicações, e a linha que a gente não gosta de ver cruzada.",
    membros: ["carla-lima", "sandra-l", "renata-v", "elias", "iara"],
    categoria: "True Crime",
  },
  {
    id: "narradores-favoritos",
    nome: "Vozes que eu sigo",
    emoji: "🎙️",
    descricao:
      "Escolher o livro pelo narrador é normal aqui. Quem faz vozes, quem lê sóbrio, quem estraga tudo respirando no microfone.",
    membros: ["juliana-s", "ana-paula", "otavio", "lia-f", "paulo-s", "marina-t"],
    categoria: "Narração e vozes",
  },
  {
    id: "literatura-brasileira",
    nome: "Literatura brasileira em áudio",
    emoji: "🇧🇷",
    descricao:
      "Machado, Clarice, Conceição, Torto Arado. O sotaque certo muda o livro — e aqui a gente discute qual é o certo.",
    membros: ["juliana-s", "iara", "paulo-s", "dani-r", "tereza-m"],
    categoria: "Literatura Brasileira",
  },
  {
    id: "fantasia-epica",
    nome: "Fantasia com mapa no começo",
    emoji: "🐉",
    descricao:
      "Saga longa, nome impronunciável e vinte horas de narração. Onde começar, o que pular, quem aguentou.",
    membros: ["felipe-g", "caio", "vitor-h", "nara", "beto"],
    categoria: "Fantasia e Ficção Científica",
  },
  {
    id: "li-antes-da-serie",
    nome: "Li antes da série",
    emoji: "🎬",
    descricao:
      "Adaptação boa, adaptação traidora e o livro que só ficou famoso depois. Sem spoiler das duas mídias.",
    membros: ["bia-costa", "gustavo-a", "renata-v", "hugo-p", "marina-t"],
    categoria: "Cinema, Séries e Adaptações",
  },
  {
    id: "abandonei-no-meio",
    nome: "Abandonei no meio (e tudo bem)",
    emoji: "🚪",
    descricao:
      "Confessionário de livro largado no capítulo 4. Sem culpa, sem julgamento — e às vezes alguém convence a voltar.",
    membros: ["luciana", "dani-r", "sandra-l", "elias", "caio", "bia-costa"],
    categoria: "Escuta e hábitos",
  },
  {
    id: "dinheiro-sem-jargao",
    nome: "Dinheiro sem jargão",
    emoji: "💸",
    descricao:
      "Finanças explicadas como gente. O que funcionou no mês seguinte, e o que era só frase bonita de guru.",
    membros: ["ricardo", "otavio", "gustavo-a", "paulo-s"],
    categoria: "Dinheiro e Negócios",
  },
  {
    id: "corrida-com-narrador",
    nome: "Corrida com narrador",
    emoji: "🏃",
    descricao:
      "Quem troca a playlist pelo audiolivro na esteira e na rua. Ritmo, distância e o livro que fez a hora passar.",
    membros: ["felipe-g", "vitor-h", "nara", "lia-f", "elias"],
    categoria: "Ouvir na academia",
  },
];

const topicosSemeados: TopicoSemeado[] = [
  {
    id: "t-garota-final",
    grupoId: "suspense-misterio",
    titulo: 'Final de "Garota Exemplar": genial ou trapaça?',
    autorSlug: "ana-paula",
    date: "2026-07-26",
    bookId: 3,
    fixado: true,
    respostas: [
      {
        autorSlug: "ana-paula",
        texto:
          "Pra mim é genial. A pista estava lá o tempo todo e ninguém viu. Quem releu o capítulo 3 depois do final me entende.",
        date: "2026-07-26",
      },
      {
        autorSlug: "marcos-v",
        texto:
          "Discordo — trapaça elegante ainda é trapaça. O narrador esconde o que só ele sabia, e isso quebra o combinado com quem ouve.",
        date: "2026-07-26",
      },
      {
        autorSlug: "juliana-s",
        texto:
          "O áudio deixa melhor: a narradora muda o tom nos diários e você DEVIA ter desconfiado. A culpa é nossa.",
        date: "2026-07-27",
      },
      {
        autorSlug: "beto",
        texto: "Genial. Ponto. E eu nunca mais confiei em personagem que escreve diário.",
        date: "2026-07-27",
      },
    ],
  },
  {
    id: "t-narrador-suspense",
    grupoId: "suspense-misterio",
    titulo: "Narrador de suspense: sussurro ou voz firme?",
    autorSlug: "marcos-v",
    date: "2026-07-24",
    bookId: 1,
    respostas: [
      {
        autorSlug: "marcos-v",
        texto:
          "Voz firme. Sussurro em cena de tensão me faz aumentar o volume — e aí o susto estoura o ouvido.",
        date: "2026-07-24",
      },
      {
        autorSlug: "carla-lima",
        texto: "Depende do livro: o Aurélio Prado segura o Massacre inteiro quase falando baixo.",
        date: "2026-07-25",
      },
    ],
  },
  {
    id: "t-indicacao-suspense",
    grupoId: "suspense-misterio",
    titulo: "Me indiquem: suspense curto pra maratonar no feriado",
    autorSlug: "ricardo",
    date: "2026-07-21",
    bookId: 106,
    respostas: [
      {
        autorSlug: "ana-paula",
        texto: "A empregada. Curto, rápido e o fim te dá um tapa. Ouvi em dois dias.",
        date: "2026-07-21",
      },
      {
        autorSlug: "carla-lima",
        texto: "A Paciente Silenciosa — e não leia NADA sobre antes de começar.",
        date: "2026-07-22",
      },
    ],
  },
  {
    id: "t-velocidade-transito",
    grupoId: "quem-ouve-no-transito",
    titulo: "Velocidade 1,5x no trânsito: prática ou heresia?",
    autorSlug: "marcos-v",
    date: "2026-07-23",
    respostas: [
      {
        autorSlug: "marcos-v",
        texto: "1,2x é o meu teto. Acima disso eu chego na reunião sem saber o que ouvi.",
        date: "2026-07-23",
      },
      {
        autorSlug: "felipe-g",
        texto: "Heresia nenhuma: biografia aguenta 1,5x fácil. Romance é que não dá.",
        date: "2026-07-24",
      },
    ],
  },
  {
    id: "t-capitulo-acaba",
    grupoId: "quem-ouve-no-transito",
    titulo: "O capítulo acabou e você ainda não chegou: o que fazem?",
    autorSlug: "felipe-g",
    date: "2026-07-19",
    respostas: [
      {
        autorSlug: "luciana",
        texto: "Dou mais uma volta no quarteirão. Sem vergonha nenhuma.",
        date: "2026-07-20",
      },
    ],
  },
  {
    id: "t-elizabeth-audio",
    grupoId: "classicos",
    titulo: "Orgulho e Preconceito: a Elizabeth do áudio supera a do papel?",
    autorSlug: "juliana-s",
    date: "2026-07-22",
    bookId: 140,
    respostas: [
      {
        autorSlug: "juliana-s",
        texto:
          "A Helena Vasques faz a ironia da Elizabeth aparecer ONDE eu não tinha percebido lendo. Pra mim, supera.",
        date: "2026-07-22",
      },
      {
        autorSlug: "luciana",
        texto: "Reouvi duas vezes só pelos diálogos com o Darcy. O timing dela é perfeito.",
        date: "2026-07-23",
      },
    ],
  },
  {
    id: "t-1984-medo",
    grupoId: "classicos",
    titulo: "1984 em áudio dá mais medo do que no papel?",
    autorSlug: "carla-lima",
    date: "2026-07-18",
    bookId: 130,
    respostas: [
      {
        autorSlug: "juliana-s",
        texto: "Dá. A voz do Diogo Serrano no interrogatório é um pesadelo — elogio, claro.",
        date: "2026-07-19",
      },
    ],
  },
  {
    id: "t-duna-audio",
    grupoId: "ficcao-cientifica",
    titulo: "Duna: dá pra começar pelo áudio ou se perde nos nomes?",
    autorSlug: "carla-lima",
    date: "2026-07-20",
    bookId: 7,
    respostas: [
      {
        autorSlug: "carla-lima",
        texto:
          "Comecei pelo áudio e não me perdi: os nomes assustam menos quando alguém os pronuncia por você.",
        date: "2026-07-20",
      },
      {
        autorSlug: "ricardo",
        texto: "Concordo, mas ouçam com a ficha do livro aberta na primeira hora. Ajuda muito.",
        date: "2026-07-21",
      },
    ],
  },
  {
    id: "t-habitos-funcionou",
    grupoId: "habitos-vida-real",
    titulo: "Hábitos Atômicos: o que funcionou de verdade pra vocês?",
    autorSlug: "luciana",
    date: "2026-07-25",
    bookId: 102,
    respostas: [
      {
        autorSlug: "luciana",
        texto: "A regra dos 2 minutos. Foi ela que me fez voltar a ouvir todo dia, aliás.",
        date: "2026-07-25",
      },
      {
        autorSlug: "ricardo",
        texto: "Empilhar hábito: audiolivro junto com a caminhada. Nunca mais falhei os dois.",
        date: "2026-07-26",
      },
    ],
  },

  /* Um tópico para cada comunidade nova de 31/07 — comunidade sem conversa
     dentro é o beco sem saída da §4.23, e é o que faria a aba continuar
     parecendo crua mesmo com quinze quadradinhos. */
  {
    id: "t-dormir-temporizador",
    grupoId: "ouvir-dormindo",
    titulo: "Quantos minutos vocês põem no temporizador?",
    autorSlug: "tereza-m",
    date: "2026-07-30",
    respostas: [
      {
        autorSlug: "tereza-m",
        texto:
          "Comecei com 30 e acordava perdida. Baixei para 15 e agora quase sempre sei onde parei.",
        date: "2026-07-30",
      },
      {
        autorSlug: "luciana",
        texto: "20, e sempre volto um capítulo antes no dia seguinte. Vira releitura de graça.",
        date: "2026-07-31",
      },
      {
        autorSlug: "hugo-p",
        texto: "Eu não uso temporizador. Uso livro que já ouvi — se dormir, não perdi nada.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-2x-entende",
    grupoId: "velocidade-2x",
    titulo: "Existe livro que NÃO dá para ouvir em 2x?",
    autorSlug: "marcos-v",
    date: "2026-07-29",
    bookId: 8,
    respostas: [
      {
        autorSlug: "gustavo-a",
        texto: "Poesia. Tentei uma vez e virou rap ruim.",
        date: "2026-07-29",
      },
      {
        autorSlug: "caio",
        texto:
          "Qualquer coisa com muito nome próprio estrangeiro. Fantasia em 2x eu perco quem é quem.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-true-crime-limite",
    grupoId: "true-crime",
    titulo: "Onde está a linha entre contar o caso e explorar a vítima?",
    autorSlug: "sandra-l",
    date: "2026-07-28",
    respostas: [
      {
        autorSlug: "carla-lima",
        texto:
          "Para mim é simples: se a família participou ou autorizou, muda tudo. Sem isso já começo desconfiada.",
        date: "2026-07-28",
      },
      {
        autorSlug: "elias",
        texto: "E trilha sonora de terror em caso real. Isso me tira na hora.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-narrador-segue",
    grupoId: "narradores-favoritos",
    titulo: "Você já ouviu um livro só por causa do narrador?",
    autorSlug: "juliana-s",
    date: "2026-07-29",
    respostas: [
      {
        autorSlug: "otavio",
        texto: "Já ouvi manual de jardinagem por causa de voz. Não me orgulho, mas ouvi inteiro.",
        date: "2026-07-29",
      },
      {
        autorSlug: "marina-t",
        texto:
          "Sempre. Tem gente que lê rápido demais e mata o suspense; com a voz certa até livro morno segura.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-sotaque-brasileiro",
    grupoId: "literatura-brasileira",
    titulo: "Machado com sotaque carioca de época: mais ou menos difícil?",
    autorSlug: "paulo-s",
    date: "2026-07-27",
    respostas: [
      {
        autorSlug: "iara",
        texto:
          "Mais fácil, disparado. A pontuação dele faz sentido quando alguém lê em voz alta com a entonação certa.",
        date: "2026-07-28",
      },
      {
        autorSlug: "dani-r",
        texto: "Concordo. Li Dom Casmurro no colégio odiando e ouvindo virou outra coisa.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-fantasia-comecar",
    grupoId: "fantasia-epica",
    titulo: "Saga de 20h+: por qual começar sem se arrepender?",
    autorSlug: "felipe-g",
    date: "2026-07-26",
    bookId: 129,
    respostas: [
      {
        autorSlug: "caio",
        texto:
          "Sempre pelo primeiro. Todo mundo diz para pular o volume 1 de alguma saga e eu sempre me perco quando pulo.",
        date: "2026-07-27",
      },
      {
        autorSlug: "nara",
        texto: "Dica prática: ouça a primeira hora antes de decidir. Se o narrador cansar, cansa 20h.",
        date: "2026-07-29",
      },
    ],
  },
  {
    id: "t-adaptacao-traidora",
    grupoId: "li-antes-da-serie",
    titulo: "Qual adaptação melhorou o livro?",
    autorSlug: "bia-costa",
    date: "2026-07-28",
    bookId: 132,
    respostas: [
      {
        autorSlug: "gustavo-a",
        texto: "Confesso: teve série que cortou 200 páginas de enrolação e ficou melhor.",
        date: "2026-07-29",
      },
      {
        autorSlug: "renata-v",
        texto: "Nenhuma, e vou morrer nessa. Mas aceito discutir com quem trouxer exemplo.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-abandonei-capitulo",
    grupoId: "abandonei-no-meio",
    titulo: "Em que capítulo você desiste?",
    autorSlug: "dani-r",
    date: "2026-07-30",
    bookId: 302,
    respostas: [
      {
        autorSlug: "luciana",
        texto: "Dou uma hora. Se em uma hora eu não me importo com ninguém, saio sem dó.",
        date: "2026-07-30",
      },
      {
        autorSlug: "sandra-l",
        texto:
          "Eu tenho o vício de terminar tudo e estou tentando largar. Este ano abandonei dois e me senti livre.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-dinheiro-mes-seguinte",
    grupoId: "dinheiro-sem-jargao",
    titulo: "O que você fez diferente no mês seguinte ao livro?",
    autorSlug: "ricardo",
    date: "2026-07-27",
    bookId: 101,
    respostas: [
      {
        autorSlug: "otavio",
        texto: "Automatizei a reserva no dia do salário. Só isso, e foi o único que durou.",
        date: "2026-07-28",
      },
      {
        autorSlug: "paulo-s",
        texto: "Cancelei três assinaturas que eu nem lembrava. O livro nem falava disso.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-corrida-ritmo",
    grupoId: "corrida-com-narrador",
    titulo: "Livro para correr: agitado ou calmo?",
    autorSlug: "vitor-h",
    date: "2026-07-29",
    respostas: [
      {
        autorSlug: "felipe-g",
        texto: "Calmo. Se o livro é tenso demais eu acelero sem perceber e estouro no quilômetro 5.",
        date: "2026-07-30",
      },
      {
        autorSlug: "lia-f",
        texto: "Ao contrário aqui: capítulo de perseguição me faz bater recorde.",
        date: "2026-07-31",
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * A segunda leva de 31/07 — porque três tópicos não fazem uma página
   *
   * A página `/forum/:id/topicos` (§4.91) nasceu com busca, quatro filtros e
   * destaques, e abriu mostrando **três linhas**. Ferramenta de achar coisa
   * numa lista que cabe inteira na tela é enfeite; o problema não era a tela,
   * era não haver o que procurar — o mesmo diagnóstico da §4.82, quando cinco
   * comunidades não faziam uma aba viva.
   *
   * A régua destes: **todo tópico é sobre uma coisa que gente de audiolivro
   * discute de verdade** (o narrador, a velocidade, dormir no meio, largar no
   * capítulo 4), a maioria **aponta um livro do catálogo** — que é o que dá
   * capa e o que faz a busca por livro achar coisa —, e alguns ficam de
   * propósito **sem livro**, porque nem toda conversa é sobre um.
   * ------------------------------------------------------------------ */

  /* — Suspense & Mistério: a comunidade dele, e a que mais precisava — */
  {
    id: "t-rachel-trem",
    grupoId: "suspense-misterio",
    titulo: "A Garota no Trem: dá para confiar em alguma coisa que a Rachel diz?",
    autorSlug: "carla-lima",
    date: "2026-07-30",
    bookId: 120,
    respostas: [
      {
        autorSlug: "carla-lima",
        texto:
          "Ouvindo é pior (melhor?): a narradora entrega o tremor na voz dela e você fica sem chão a cada capítulo.",
        date: "2026-07-30",
      },
      {
        autorSlug: "beto",
        texto:
          "Confiar não dá, mas é aí que está a graça. Fui anotando o que ela dizia e o que os outros diziam sobre o mesmo dia.",
        date: "2026-07-31",
      },
      {
        autorSlug: "ana-paula",
        texto: "Eu voltei duas vezes o capítulo da estação achando que tinha perdido alguma coisa. Não tinha.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-empregada-virada",
    grupoId: "suspense-misterio",
    titulo: "A empregada: quem adivinhou a virada antes da metade?",
    autorSlug: "beto",
    date: "2026-07-28",
    bookId: 2,
    respostas: [
      {
        autorSlug: "beto",
        texto: "Eu não. E olha que eu me acho bom nisso.",
        date: "2026-07-28",
      },
      {
        autorSlug: "ricardo",
        texto:
          "Desconfiei no capítulo 9 e desisti da desconfiança no 12. Ou seja: caí redondo, com escala.",
        date: "2026-07-29",
      },
      {
        autorSlug: "carla-lima",
        texto: "Minha irmã acertou na primeira hora e passou o livro inteiro me olhando de lado.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-narrador-ruim",
    grupoId: "suspense-misterio",
    titulo: "Suspense bom com narrador ruim: vocês largam ou aguentam?",
    autorSlug: "ana-paula",
    date: "2026-07-27",
    respostas: [
      {
        autorSlug: "ana-paula",
        texto:
          "Largo. Já perdi dois livros ótimos assim e não tenho mais paciência — prefiro esperar outra edição.",
        date: "2026-07-27",
      },
      {
        autorSlug: "marcos-v",
        texto:
          "Aguento se a história segurar. Mas voz que respira no microfone em cena de tensão me tira na hora.",
        date: "2026-07-28",
      },
    ],
  },
  {
    id: "t-massacre-final",
    grupoId: "suspense-misterio",
    titulo: "O massacre da família Hope: o final te convenceu?",
    autorSlug: "marcos-v",
    date: "2026-07-25",
    bookId: 1,
    respostas: [
      {
        autorSlug: "marcos-v",
        texto: "A explicação é boa, mas chega rápido demais. Faltou um capítulo para respirar.",
        date: "2026-07-25",
      },
      {
        autorSlug: "ricardo",
        texto: "Me convenceu. O que segura tudo é o Aurélio Prado mudando o tom nas duas linhas do tempo.",
        date: "2026-07-26",
      },
    ],
  },
  {
    id: "t-objetos-cortantes",
    grupoId: "suspense-misterio",
    titulo: "Objetos Cortantes é pesado demais para ouvir antes de dormir?",
    autorSlug: "ana-paula",
    date: "2026-07-23",
    bookId: 313,
    respostas: [
      {
        autorSlug: "ana-paula",
        texto: "É. Tentei três noites e nas três eu desliguei e fui ver algo bobo na TV.",
        date: "2026-07-23",
      },
      {
        autorSlug: "carla-lima",
        texto: "Ouvi de manhã, andando. Mesmo livro, outra experiência — recomendo trocar o horário.",
        date: "2026-07-24",
      },
    ],
  },
  {
    id: "t-davinci-envelheceu",
    grupoId: "suspense-misterio",
    titulo: "O Código Da Vinci envelheceu bem em áudio?",
    autorSlug: "ricardo",
    date: "2026-07-20",
    bookId: 119,
    respostas: [
      {
        autorSlug: "ricardo",
        texto:
          "Surpreendentemente sim. O capítulo curto que o Dan Brown usa funciona melhor ouvindo do que lendo.",
        date: "2026-07-20",
      },
      {
        autorSlug: "beto",
        texto: "Os diálogos explicativos ficaram datados, mas a corrida contra o tempo continua boa.",
        date: "2026-07-22",
      },
    ],
  },
  {
    id: "t-escrito-na-agua",
    grupoId: "suspense-misterio",
    titulo: "Escrito na Água: perdi quem era quem. Só eu?",
    autorSlug: "beto",
    date: "2026-07-17",
    bookId: 314,
    respostas: [
      {
        autorSlug: "carla-lima",
        texto: "Não é só você. São muitas vozes narrando e em áudio isso cobra o dobro de atenção.",
        date: "2026-07-18",
      },
    ],
  },

  /* — Clássicos — */
  {
    id: "t-revolucao-bichos",
    grupoId: "classicos",
    titulo: "A Revolução dos Bichos: em áudio, dá vontade de rir ou de chorar?",
    autorSlug: "luciana",
    date: "2026-07-29",
    bookId: 304,
    respostas: [
      {
        autorSlug: "luciana",
        texto: "As duas. O narrador faz aquilo com uma calma que deixa tudo mais assustador.",
        date: "2026-07-29",
      },
      {
        autorSlug: "ana-paula",
        texto: "É curto e devastador. Ouvi num sábado e fiquei pensando nele a semana inteira.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-dracula-cartas",
    grupoId: "classicos",
    titulo: "Drácula é um livro de cartas — isso funciona no fone?",
    autorSlug: "carla-lima",
    date: "2026-07-24",
    bookId: 144,
    respostas: [
      {
        autorSlug: "juliana-s",
        texto:
          "Funciona melhor do que no papel, porque cada carta ganha uma voz e você para de confundir os personagens.",
        date: "2026-07-25",
      },
      {
        autorSlug: "luciana",
        texto: "O diário do Jonathan no castelo, ouvido de noite, é uma péssima ideia. Fiz mesmo assim.",
        date: "2026-07-26",
      },
    ],
  },

  /* — Ficção Científica — */
  {
    id: "t-3corpos-dificil",
    grupoId: "ficcao-cientifica",
    titulo: "O Problema dos 3 Corpos: a física atrapalha ou é o melhor do livro?",
    autorSlug: "ricardo",
    date: "2026-07-28",
    bookId: 109,
    respostas: [
      {
        autorSlug: "ricardo",
        texto: "Para mim é o melhor. Mas admito que ouvi dois capítulos duas vezes.",
        date: "2026-07-28",
      },
      {
        autorSlug: "carla-lima",
        texto:
          "Atrapalhou no começo. Depois entendi que não precisava entender tudo, e o livro ficou ótimo.",
        date: "2026-07-30",
      },
    ],
  },
  {
    id: "t-fundacao-ordem",
    grupoId: "ficcao-cientifica",
    titulo: "Fundação: ordem de publicação ou ordem cronológica?",
    autorSlug: "felipe-g",
    date: "2026-07-21",
    bookId: 8,
    respostas: [
      {
        autorSlug: "felipe-g",
        texto: "Publicação, sempre. A cronológica entrega coisa que o Asimov queria que fosse surpresa.",
        date: "2026-07-21",
      },
    ],
  },

  /* — True Crime: sem livro de propósito, porque a conversa não é sobre um — */
  {
    id: "t-true-crime-familia",
    grupoId: "true-crime",
    titulo: "Vocês ouviriam um caso se a família da vítima pediu que não contassem?",
    autorSlug: "renata-v",
    date: "2026-07-30",
    respostas: [
      {
        autorSlug: "renata-v",
        texto: "Eu não ouço. Para mim isso encerra o assunto, por melhor que seja a produção.",
        date: "2026-07-30",
      },
      {
        autorSlug: "iara",
        texto:
          "Concordo, e acho que devia estar escrito na ficha do livro se a família participou ou não.",
        date: "2026-07-31",
      },
      {
        autorSlug: "elias",
        texto: "Discordo em parte: caso antigo, sem família viva, é história. O problema é o caso recente.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-true-crime-dormir",
    grupoId: "true-crime",
    titulo: "Alguém mais só consegue ouvir true crime de dia?",
    autorSlug: "sandra-l",
    date: "2026-07-26",
    respostas: [
      {
        autorSlug: "carla-lima",
        texto: "De dia e em lugar movimentado. Em casa sozinha eu começo a ouvir barulho que não existe.",
        date: "2026-07-27",
      },
    ],
  },

  /* — Vozes que eu sigo — */
  {
    id: "t-otavio-terror",
    grupoId: "narradores-favoritos",
    titulo: "O Otávio Marques em terror: exagerado ou perfeito?",
    autorSlug: "lia-f",
    date: "2026-07-30",
    bookId: 105,
    respostas: [
      {
        autorSlug: "lia-f",
        texto: "Perfeito. Ele sabe onde NÃO fazer voz, e é isso que separa narrador bom de imitador.",
        date: "2026-07-30",
      },
      {
        autorSlug: "otavio",
        texto: "No Iluminado ele segura o Jack por horas sem entregar o que vem. Aula.",
        date: "2026-07-31",
      },
    ],
  },
  {
    id: "t-narrador-troca",
    grupoId: "narradores-favoritos",
    titulo: "Livro que troca de narrador no meio da série: passa ou reprova?",
    autorSlug: "marina-t",
    date: "2026-07-25",
    respostas: [
      {
        autorSlug: "marina-t",
        texto: "Reprova. Já larguei uma série de seis livros no terceiro por causa disso.",
        date: "2026-07-25",
      },
      {
        autorSlug: "paulo-s",
        texto:
          "Passa se avisarem. O que me irrita é descobrir no capítulo 1, quando já comprei o livro inteiro.",
        date: "2026-07-27",
      },
    ],
  },

  /* — Quem ouve no trânsito — */
  {
    id: "t-transito-ficcao",
    grupoId: "quem-ouve-no-transito",
    titulo: "Ficção no trânsito: vocês conseguem, ou só não-ficção?",
    autorSlug: "ricardo",
    date: "2026-07-29",
    bookId: 102,
    respostas: [
      {
        autorSlug: "ricardo",
        texto:
          "Só não-ficção. Romance eu perco o fio na primeira freada e chego em casa sem saber quem morreu.",
        date: "2026-07-29",
      },
      {
        autorSlug: "marcos-v",
        texto: "Comigo é o contrário: livro de hábito eu esqueço, história eu lembro até do trecho.",
        date: "2026-07-30",
      },
    ],
  },

  /* — Durmo antes do fim do capítulo — */
  {
    id: "t-dormir-releitura",
    grupoId: "ouvir-dormindo",
    titulo: "Vocês voltam onde dormiram ou seguem em frente?",
    autorSlug: "bia-costa",
    date: "2026-07-31",
    respostas: [
      {
        autorSlug: "bia-costa",
        texto: "Volto sempre um capítulo. Já aceitei que metade do livro eu ouço duas vezes.",
        date: "2026-07-31",
      },
      {
        autorSlug: "nara",
        texto:
          "Sigo. Se o livro é bom eu percebo que perdi alguma coisa e volto; se não percebo, é porque não fazia falta.",
        date: "2026-07-31",
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * O que é SEU — participações, tópicos e respostas
 * ------------------------------------------------------------------ */

export interface MeuTopico {
  id: string;
  grupoId: string;
  titulo: string;
  date: string;
  /** O livro de que ele fala — a capa sai daqui. */
  bookId?: number;
}

export interface MinhaResposta {
  id: string;
  topicoId: string;
  texto: string;
  date: string;
  /** Um trecho do áudio citado junto (ROTEIRO 4.45). */
  citacao?: Citacao;
}

function lerLista<T>(chave: string): T[] {
  try {
    const stored = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(stored) ? (stored as T[]) : [];
  } catch {
    return [];
  }
}

function gravarLista<T>(chave: string, lista: T[]): void {
  localStorage.setItem(chave, JSON.stringify(lista));
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/* — os grupos que VOCÊ cria (pedido de 28/07: "eu não posso criar um grupo?") — */

const MEUS_GRUPOS_KEY = "allbook_grupos_meus";

export function meusGrupos(): Grupo[] {
  return lerLista<Grupo>(MEUS_GRUPOS_KEY).map((grupo) => ({ ...grupo, meu: true }));
}

/** Cria um grupo seu. Nome vazio não cria; emoji vazio ganha o padrão 💬. */
export function criarGrupo(nome: string, emoji: string, descricao: string): Grupo | null {
  const nomeLimpo = nome.trim().slice(0, 40);
  if (!nomeLimpo) return null;
  const grupo: Grupo = {
    id: `meu-g-${Date.now()}`,
    nome: nomeLimpo,
    emoji: emoji.trim().slice(0, 4) || "💬",
    descricao: descricao.trim().slice(0, 160),
    membros: [],
    meu: true,
  };
  gravarLista(MEUS_GRUPOS_KEY, [...lerLista<Grupo>(MEUS_GRUPOS_KEY), grupo]);
  // Quem cria, participa — criar já é o maior gesto de entrada.
  const participo = lerLista<string>(PARTICIPO_KEY);
  if (!participo.includes(grupo.id)) gravarLista(PARTICIPO_KEY, [...participo, grupo.id]);
  return grupo;
}


/** Todos os grupos que existem: os semeados e os seus. */
export function todosOsGrupos(): Grupo[] {
  return [...grupos, ...meusGrupos()];
}

export function gruposQueParticipo(): string[] {
  return lerLista<string>(PARTICIPO_KEY);
}

export function participoDa(grupoId: string): boolean {
  return gruposQueParticipo().includes(grupoId);
}

/** Entra ou sai. Devolve o estado novo (true = dentro). */
export function alternarParticipacao(grupoId: string): boolean {
  const atual = gruposQueParticipo();
  const dentro = atual.includes(grupoId);
  gravarLista(PARTICIPO_KEY, dentro ? atual.filter((id) => id !== grupoId) : [...atual, grupoId]);
  return !dentro;
}

export function meusTopicos(): MeuTopico[] {
  return lerLista<MeuTopico>(MEUS_TOPICOS_KEY);
}

/**
 * Cria um tópico seu num grupo. Título vazio não cria.
 *
 * A `capa` é opcional e tem dois formatos, que são as duas coisas que o Matheus
 * pediu em 31/07: `{ bookId }` (a capa de um livro do catálogo) ou
 * `{ imagem }` (uma foto sua, já encolhida). Ver `capaDoTopico`, abaixo.
 */
export function criarTopico(
  grupoId: string,
  titulo: string,
  capa?: CapaDeTopico,
): MeuTopico | null {
  const clean = titulo.trim().slice(0, MAX_TITULO);
  if (!clean || !grupoPorId(grupoId)) return null;
  const topico: MeuTopico = {
    id: `meu-t-${Date.now()}`,
    grupoId,
    titulo: clean,
    date: new Date().toISOString(),
    ...(capa?.bookId ? { bookId: capa.bookId } : {}),
  };
  gravarLista(MEUS_TOPICOS_KEY, [...meusTopicos(), topico]);
  /* A imagem enviada mora no mapa de capas, e não dentro do tópico: assim ela
     serve igual para tópico seu e para tópico semeado que você modera. */
  if (capa?.imagem) gravarCapa(topico.id, { imagem: capa.imagem });
  return topico;
}

export function apagarMeuTopico(id: string): void {
  gravarLista(MEUS_TOPICOS_KEY, meusTopicos().filter((item) => item.id !== id));
  // As suas respostas dentro dele perdem o pai — saem junto.
  gravarLista(
    MINHAS_RESPOSTAS_KEY,
    minhasRespostas().filter((item) => item.topicoId !== id),
  );
  // E a capa também: imagem órfã no `localStorage` é lixo que ninguém vê.
  tirarCapaDoTopico(id);
}

/* ------------------------------------------------------------------ *
 * A capa do tópico (ROTEIRO §4.91)
 *
 * **Pedido do Matheus em 31/07**, ao reprovar a primeira página de tópicos:
 * *"principalmente com o poder de colocar capa nos tópicos… ou até exportar
 * imagens, ou até colocar a possibilidade de capas dos livros nos tópicos"*.
 *
 * **As duas coisas entram, e nesta ordem de importância:**
 *
 * 1. **A capa de um livro do catálogo.** É a que mais vale, e não por ser
 *    barata: num app de audiolivro, a maioria dos tópicos É sobre um livro, e
 *    dizer *qual* antes do toque é **informação**, não enfeite. De quebra, o
 *    tópico passa a ter um link para o livro (e o livro, mais tarde, para o
 *    tópico).
 * 2. **Uma imagem sua**, para o tópico que não é sobre livro nenhum ("quantos
 *    minutos vocês põem no temporizador?"). Mesmo caminho da capa de
 *    comunidade: encolhida no navegador por `encolherImagem` e guardada como
 *    `data:` URL — alguns quilobytes, zero servidor.
 *
 * **Por que a capa mora aqui, e não dentro do tópico.** Tópico semeado é
 * código; se a capa morasse nele, ninguém poderia trocar a de um tópico que já
 * existe. O mapa por fora vale para os dois casos e é a mesma solução da
 * moderação, logo abaixo, e dos clubes renomeados (§4.69).
 * ------------------------------------------------------------------ */

const CAPAS_KEY = "allbook_grupos_capas";

export interface CapaDeTopico {
  /** `data:` URL enviada pela pessoa — ganha da capa de livro. */
  imagem?: string;
  /** Id de um livro do `catalog`. */
  bookId?: number;
}

function lerCapas(): Record<string, CapaDeTopico> {
  try {
    const guardado = JSON.parse(localStorage.getItem(CAPAS_KEY) || "{}");
    return guardado && typeof guardado === "object" && !Array.isArray(guardado) ? guardado : {};
  } catch {
    return {};
  }
}

function gravarCapa(topicoId: string, capa: CapaDeTopico): void {
  const mapa = lerCapas();
  try {
    localStorage.setItem(CAPAS_KEY, JSON.stringify({ ...mapa, [topicoId]: capa }));
  } catch {
    /* localStorage cheio: a capa não persiste, mas a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/**
 * A capa **escolhida** para um tópico — o que a pessoa gravou, se gravou.
 *
 * Não devolve a do esqueleto de propósito: quem junta as duas é `topicosDa`,
 * pela mesma razão de sempre (a tela não deve lembrar de casar duas fontes).
 */
export function capaEscolhida(topicoId: string): CapaDeTopico | undefined {
  return lerCapas()[topicoId];
}

/**
 * Põe (ou troca) a capa de um tópico. Só o **autor** ou um **moderador** —
 * é a mesma régua de fixar e esconder.
 */
export function definirCapaDoTopico(
  grupoId: string,
  topicoId: string,
  capa: CapaDeTopico,
): boolean {
  const meu = meusTopicos().some((topico) => topico.id === topicoId);
  if (!meu && !podeModerar(grupoId)) return false;
  gravarCapa(topicoId, capa);
  return true;
}

/** Tira a capa escolhida — o tópico volta à do esqueleto, ou a nenhuma. */
export function tirarCapaDoTopico(topicoId: string): void {
  const mapa = lerCapas();
  delete mapa[topicoId];
  try {
    localStorage.setItem(CAPAS_KEY, JSON.stringify(mapa));
  } catch {
    /* idem */
  }
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

export function minhasRespostas(): MinhaResposta[] {
  return lerLista<MinhaResposta>(MINHAS_RESPOSTAS_KEY);
}

/** Responde a um tópico (semeado ou seu). Texto vazio não entra. */
export function responder(
  topicoId: string,
  texto: string,
  citacao?: Citacao,
): MinhaResposta | null {
  const clean = texto.trim().slice(0, MAX_RESPOSTA);
  /* Resposta só com trecho vale: às vezes o trecho já é a resposta. */
  if (!clean && !citacao) return null;
  const resposta: MinhaResposta = {
    id: `minha-r-${Date.now()}`,
    topicoId,
    texto: clean,
    date: new Date().toISOString(),
    ...(citacao ? { citacao } : {}),
  };
  gravarLista(MINHAS_RESPOSTAS_KEY, [...minhasRespostas(), resposta]);
  return resposta;
}

export function apagarMinhaResposta(id: string): void {
  gravarLista(MINHAS_RESPOSTAS_KEY, minhasRespostas().filter((item) => item.id !== id));
}

/* ------------------------------------------------------------------ *
 * As leituras que as telas usam — esqueleto + o seu, já juntos
 * ------------------------------------------------------------------ */

export function grupoPorId(id: string): Grupo | undefined {
  return todosOsGrupos().find((grupo) => grupo.id === id);
}

/** Um tópico como a tela vê: semeado ou seu, com contagem e última data. */
export interface TopicoNaTela {
  id: string;
  grupoId: string;
  titulo: string;
  /** Membro fictício, ou `null` = você. */
  autor: CommunityMember | null;
  date: string;
  fixado: boolean;
  /** Você criou — pode apagar. */
  meu: boolean;
  /** O dono do fórum escondeu (ROTEIRO 4.44). */
  escondido: boolean;
  totalRespostas: number;
  ultimaAtividade: string;

  /* — o que a lista de tópicos mostra além do título (§4.91) — */

  /** A capa: imagem enviada, se houver. */
  imagem?: string;
  /** A capa: o livro de que o tópico fala. */
  bookId?: number;
  /**
   * **A última coisa que alguém disse ali.** É o que faz querer entrar — a
   * lista antiga mostrava título, autor e um número, e nenhum deles diz se a
   * conversa está boa.
   */
  ultimaFala?: { autor: CommunityMember | null; texto: string };
  /** Quem falou no fio, em ordem de chegada. `null` na lista = você. */
  participantes: (CommunityMember | null)[];
}

function contarRespostas(topicoId: string, semeadas: RespostaSemeada[]): {
  total: number;
  ultima: string;
  base: string;
  ultimaFala?: { autor: CommunityMember | null; texto: string };
  participantes: (CommunityMember | null)[];
} {
  const minhas = minhasRespostas().filter((item) => item.topicoId === topicoId);

  /* Tudo numa lista só, ordenada por data — é dela que saem a última fala e a
     ordem de chegada de quem participou. */
  const falas = [
    ...semeadas.map((item) => ({
      date: item.date,
      texto: item.texto,
      autor: community.find((membro) => membro.slug === item.autorSlug) ?? null,
    })),
    ...minhas.map((item) => ({
      date: item.date.slice(0, 10),
      /* Resposta que é só um trecho de áudio não tem texto: a lista diz o que
         ela é, em vez de mostrar uma linha vazia. */
      texto: item.texto || "(um trecho do áudio)",
      autor: null as CommunityMember | null,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const vistos = new Set<string>();
  const participantes: (CommunityMember | null)[] = [];
  for (const fala of falas) {
    const chave = fala.autor?.slug ?? "voce";
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    participantes.push(fala.autor);
  }

  const ultima = falas[falas.length - 1];
  return {
    total: falas.length,
    ultima: ultima?.date ?? "",
    base: falas[0]?.date ?? "",
    ...(ultima ? { ultimaFala: { autor: ultima.autor, texto: ultima.texto } } : {}),
    participantes,
  };
}

/* ------------------------------------------------------------------ *
 * Moderação de conteúdo — o poder de quem criou (28/07, ROTEIRO 4.44).
 *
 * **A decisão do Matheus, e o que ficou de fora.** Ele pediu que quem cria
 * pudesse *"excluir em algum momento isso"*. Moderar **conteúdo** entrou sem
 * ressalva: esconder resposta, esconder tópico, fixar, cobrir spoiler. Destruir
 * o fórum inteiro, não — um fórum com gente dentro guarda o trabalho de outras
 * pessoas, e apagá-lo é apagar o que não é seu. Isso é o contrário do clube, que
 * tem oito pessoas e **acaba de qualquer jeito** quando o ciclo fecha; por lá
 * apagar é legítimo (§4.40).
 *
 * **A regra que sobrou:** apagar só enquanto o fórum for **só seu** — nenhum
 * tópico de outra pessoa dentro. Passado disso, o criador esconde o que precisa,
 * mas a casa fica de pé.
 *
 * **Esconder, e não apagar de verdade**, pelo mesmo motivo do mural do clube:
 * moderação errada acontece, e sem volta ela custa uma pessoa. Tudo o que se
 * esconde aqui pode ser devolvido.
 * ------------------------------------------------------------------ */

const MODERACAO_KEY = "allbook_grupos_moderacao";

interface Moderacao {
  /** Ids de tópicos escondidos pelo dono do fórum. */
  topicos: string[];
  /** Ids de respostas escondidas. */
  respostas: string[];
  /** Ids de tópicos que o dono fixou no topo. */
  fixados: string[];
  /** Ids de respostas cobertas como spoiler pelo dono. */
  spoilers: string[];
}

const SEM_MODERACAO: Moderacao = { topicos: [], respostas: [], fixados: [], spoilers: [] };

function lerModeracao(): Moderacao {
  try {
    const guardado = JSON.parse(localStorage.getItem(MODERACAO_KEY) || "null");
    if (!guardado || typeof guardado !== "object") return SEM_MODERACAO;
    return {
      topicos: Array.isArray(guardado.topicos) ? guardado.topicos : [],
      respostas: Array.isArray(guardado.respostas) ? guardado.respostas : [],
      fixados: Array.isArray(guardado.fixados) ? guardado.fixados : [],
      spoilers: Array.isArray(guardado.spoilers) ? guardado.spoilers : [],
    };
  } catch {
    return SEM_MODERACAO;
  }
}

function gravarModeracao(estado: Moderacao): void {
  localStorage.setItem(MODERACAO_KEY, JSON.stringify(estado));
  window.dispatchEvent(new Event(GRUPOS_EVENT));
}

/** Você criou este fórum — e portanto modera o que acontece nele. */
export function souDonoDo(grupoId: string): boolean {
  return grupoPorId(grupoId)?.meu === true;
}

/**
 * Você é dono **ou moderador** desta comunidade.
 *
 * ⚠️ **Esta função é um espelho de `lib/forum.ts`, e é de propósito.** A regra de
 * verdade mora lá (`souModerador`), mas `forum.ts` **importa este arquivo** — e
 * importar de volta faria um ciclo. Como a regra é curta e estável (dono, ou
 * estar na lista de moderadores), o espelho custa dez linhas e evita o ciclo.
 *
 * Se um dia a regra ficar complicada, o certo é extrair o esqueleto dos fóruns
 * para um terceiro módulo, e as duas libs passarem a depender dele.
 */
function podeModerar(grupoId: string): boolean {
  if (souDonoDo(grupoId)) return true;
  try {
    const mapa = JSON.parse(localStorage.getItem("allbook_forum_governanca") || "{}");
    const config = mapa?.[grupoId];
    if (config?.donoSlug === "voce") return true;
    return Array.isArray(config?.moderadores) && config.moderadores.includes("voce");
  } catch {
    return false;
  }
}

/** Liga/desliga um id numa das listas de moderação. Só dono e moderador. */
function alternar(grupoId: string, campo: keyof Moderacao, id: string): boolean {
  if (!podeModerar(grupoId)) return false;
  const estado = lerModeracao();
  const tinha = estado[campo].includes(id);
  gravarModeracao({
    ...estado,
    [campo]: tinha ? estado[campo].filter((item) => item !== id) : [...estado[campo], id],
  });
  return !tinha;
}

/** Esconder/devolver um tópico. Devolve `true` quando passou a ficar escondido. */
export function alternarTopicoEscondido(grupoId: string, topicoId: string): boolean {
  return alternar(grupoId, "topicos", topicoId);
}

/** Esconder/devolver uma resposta. */
export function alternarRespostaEscondida(grupoId: string, respostaId: string): boolean {
  return alternar(grupoId, "respostas", respostaId);
}

/** Fixar/soltar um tópico no topo — o 📌 do fórum. */
export function alternarFixado(grupoId: string, topicoId: string): boolean {
  return alternar(grupoId, "fixados", topicoId);
}

/**
 * Cobrir uma resposta como spoiler.
 *
 * É o poder mais usado na prática em qualquer conversa sobre livro: quase
 * ninguém posta spoiler de má-fé, posta distraído. Esconder a mensagem inteira
 * seria punição desproporcional; cobrir resolve e mantém a conversa.
 */
export function alternarSpoiler(grupoId: string, respostaId: string): boolean {
  return alternar(grupoId, "spoilers", respostaId);
}


/** Os tópicos de umo grupo: fixado primeiro, depois pela última atividade. */
/**
 * Os tópicos de fórum que falam de **um livro** — a ponte de volta.
 *
 * Criada em 04/08, quando a conversa saiu da ficha do livro (ROTEIRO §4.87): sem
 * ela, quem está na página do livro nunca fica sabendo que existe gente
 * debatendo o final dele num grupo — e era exatamente esse o buraco que fazia as
 * duas conversas parecerem concorrentes silenciosas.
 *
 * Varre **todos** os grupos, e não só os seus: o debate mais vivo sobre um livro
 * pode estar num grupo em que você não entrou.
 */
export function topicosDoLivro(bookId: number): TopicoNaTela[] {
  return todosOsGrupos()
    .flatMap((grupo) => topicosDa(grupo.id))
    .filter((topico) => topico.bookId === bookId && !topico.escondido)
    .sort((a, b) => b.ultimaAtividade.localeCompare(a.ultimaAtividade));
}

export function topicosDa(
  grupoId: string,
  opcoes: { incluirEscondidos?: boolean } = {},
): TopicoNaTela[] {
  const moderacao = lerModeracao();
  const capas = lerCapas();

  /* A capa escolhida ganha da de fábrica — a mesma ordem da capa de comunidade:
     o que a pessoa **escolheu** vence o que o app **traz pronto**. */
  const capaDe = (topicoId: string, doEsqueleto?: number) => {
    const escolhida = capas[topicoId];
    return {
      ...(escolhida?.imagem ? { imagem: escolhida.imagem } : {}),
      ...(escolhida?.bookId ?? doEsqueleto ? { bookId: escolhida?.bookId ?? doEsqueleto } : {}),
    };
  };

  const doEsqueleto: TopicoNaTela[] = topicosSemeados
    .filter((topico) => topico.grupoId === grupoId)
    .map((topico) => {
      const { total, ultima, ultimaFala, participantes } = contarRespostas(
        topico.id,
        topico.respostas,
      );
      return {
        id: topico.id,
        grupoId,
        titulo: topico.titulo,
        autor: community.find((member) => member.slug === topico.autorSlug) ?? null,
        date: topico.date,
        fixado: topico.fixado === true || moderacao.fixados.includes(topico.id),
        meu: false,
        escondido: moderacao.topicos.includes(topico.id),
        totalRespostas: total,
        ultimaAtividade: ultima || topico.date,
        ...capaDe(topico.id, topico.bookId),
        ...(ultimaFala ? { ultimaFala } : {}),
        participantes,
      };
    });

  const meus: TopicoNaTela[] = meusTopicos()
    .filter((topico) => topico.grupoId === grupoId)
    .map((topico) => {
      const { total, ultima, ultimaFala, participantes } = contarRespostas(topico.id, []);
      return {
        id: topico.id,
        grupoId,
        titulo: topico.titulo,
        autor: null,
        date: topico.date,
        fixado: moderacao.fixados.includes(topico.id),
        meu: true,
        escondido: moderacao.topicos.includes(topico.id),
        totalRespostas: total,
        ultimaAtividade: ultima || topico.date.slice(0, 10),
        ...capaDe(topico.id, topico.bookId),
        ...(ultimaFala ? { ultimaFala } : {}),
        participantes,
      };
    });

  return [...doEsqueleto, ...meus]
    /* Escondido some para todo mundo. O dono vê pela tela de moderação, que é
       onde ele devolve — deixar na lista com um véu confundiria quem lê. */
    .filter((topico) => opcoes.incluirEscondidos || !topico.escondido)
    .sort(
      (a, b) =>
        Number(b.fixado) - Number(a.fixado) ||
        b.ultimaAtividade.localeCompare(a.ultimaAtividade),
    );
}

/** Uma resposta como o fio mostra. */
export interface RespostaNaTela {
  id: string;
  autor: CommunityMember | null;
  texto: string;
  date: string;
  minha: boolean;
  /** Um trecho do áudio citado junto. */
  citacao?: Citacao;
  /** O dono do fórum escondeu. */
  escondida: boolean;
  /** O dono cobriu como spoiler: o texto fica atrás de um toque. */
  spoiler: boolean;
}

export function tituloDoTopico(topicoId: string): TopicoNaTela | undefined {
  for (const grupo of todosOsGrupos()) {
    const achado = topicosDa(grupo.id).find((topico) => topico.id === topicoId);
    if (achado) return achado;
  }
  return undefined;
}

/** O fio: respostas semeadas + as suas, na ordem em que chegaram. */
export function fioDo(topicoId: string): RespostaNaTela[] {
  const moderacao = lerModeracao();
  const semeado = topicosSemeados.find((topico) => topico.id === topicoId);
  const doEsqueleto: RespostaNaTela[] = (semeado?.respostas ?? []).map((item, indice) => ({
    id: `${topicoId}-r${indice}`,
    autor: community.find((member) => member.slug === item.autorSlug) ?? null,
    texto: item.texto,
    date: item.date,
    minha: false,
    escondida: moderacao.respostas.includes(`${topicoId}-r${indice}`),
    spoiler: moderacao.spoilers.includes(`${topicoId}-r${indice}`),
  }));

  const minhas: RespostaNaTela[] = minhasRespostas()
    .filter((item) => item.topicoId === topicoId)
    .map((item) => ({
      id: item.id,
      autor: null,
      texto: item.texto,
      date: item.date.slice(0, 10),
      minha: true,
      ...(item.citacao ? { citacao: item.citacao } : {}),
      escondida: moderacao.respostas.includes(item.id),
      spoiler: moderacao.spoilers.includes(item.id),
    }));

  return [...doEsqueleto, ...minhas]
    .filter((resposta) => !resposta.escondida)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** O resumo que a vitrine da Comunidade mostra. */
export function resumoDosGrupos(): {
  grupo: Grupo;
  totalTopicos: number;
  totalPessoas: number;
  participo: boolean;
}[] {
  // Os seus grupos primeiro: quem cria quer se ver no topo da lista.
  return [...meusGrupos(), ...grupos].map((grupo) => ({
    grupo,
    totalTopicos: topicosDa(grupo.id).length,
    // Você conta quando entrou — o esqueleto não vira número inflado.
    totalPessoas: grupo.membros.length + (participoDa(grupo.id) ? 1 : 0),
    participo: participoDa(grupo.id),
  }));
}
