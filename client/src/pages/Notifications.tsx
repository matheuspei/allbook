import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  CalendarClock,
  Check,
  Flame,
  Gift,
  MessageCircleQuestion,
  Mic,
  Sparkles,
  Tag,
  Vote,
  X,
  type LucideIcon,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { minhasNovidades, nomeDoAlvo } from "@/lib/acompanhando";
import { avisosDeClube } from "@/lib/avisosDeClube";
import { catalog, getBooksByIds } from "@/lib/books";
import { CLUBES_EVENT, clubePorId, estreiaEmTexto } from "@/lib/clubes";
import {
  CONVITES_EVENT,
  aceitarConvite,
  convitesParaMim,
  recusarConvite,
  type Convite,
} from "@/lib/convites";
import { findMember, type CommunityMember, avatarDeLeitor } from "@/lib/community";
import { useToast } from "@/hooks/use-toast";
import { SEGUIDORES_EVENT, aceitarPedido, pedidosPendentes, recusarPedido } from "@/lib/seguidores";
import { readSettings } from "@/lib/settings";
import { PLAYBACK_EVENT } from "@/lib/playback";
import { todosOsPosts } from "@/lib/posts";
import { RODADAS_EVENT } from "@/lib/rodadas";
import {
  isSystemRead,
  markAllNotificationsRead,
  markAllSystemRead,
  markNotificationRead,
  markSystemRead,
  readNotifications,
  type ReplyNotification,
} from "@/lib/notifications";

/**
 * Notificações (`/notifications`).
 *
 * **Por que a tela foi repaginada.** Antes era uma lista chapada: todo aviso
 * com o mesmo ícone cinza, o mesmo peso e nenhuma cor — destoava do resto do
 * app, que é colorido. Três mudanças resolvem isso, e todas são as mesmas
 * ideias já usadas em outras telas:
 *
 * 1. **Cor por tipo de aviso**, no quadradinho em degradê do menu do Perfil.
 *    A cor não é enfeite: ela diz de que assunto é o aviso antes de você ler.
 * 2. **A capa do livro** quando o aviso fala de um livro. Reconhecer a capa é
 *    mais rápido do que ler o título, e é o que a Comunidade já faz.
 * 3. **Agrupado por tempo** (Hoje / Esta semana / Antes), numa lista só. Antes
 *    as respostas ficavam sempre no topo e os exemplos embaixo, o que é uma
 *    ordem arbitrária: aviso é coisa cronológica.
 *
 * **As duas origens continuam diferentes por baixo.** As de "responderam você"
 * nascem de ação sua e moram no `localStorage` (ver `lib/notifications.ts`);
 * as de sistema são exemplos fixos, porque não há servidor que as emita. Elas
 * se juntam só na hora de mostrar — quando houver API, os exemplos saem e o
 * resto da tela não muda.
 */

type Faixa = "Hoje" | "Esta semana" | "Antes";

/**
 * Um aviso já pronto para a tela, venha ele de onde vier. Unificar os dois
 * formatos aqui é o que permite ordenar e agrupar tudo junto.
 */
type Aviso = {
  id: string;
  /**
   * De onde veio: muda o desenho (avatar de gente x quadradinho de ícone) e,
   * no caso do **pedido**, muda a natureza do cartão — ele não leva a lugar
   * nenhum, ele **pede uma resposta** e traz os dois botões (ROTEIRO 4.55).
   */
  tipo: "resposta" | "sistema" | "pedido" | "convite";
  /** Só em "pedido" e "convite": quem está do outro lado. */
  slug?: string;
  /**
   * Só em "convite": o clube para onde te chamaram, e o id do convite.
   *
   * **Convite é o segundo cartão que pede resposta em vez de levar a algum
   * lugar** — o primeiro foi o pedido para te seguir (§4.55). A diferença entre
   * os dois é o que a resposta faz: aceitar um pedido abre a sua vitrine;
   * aceitar um convite **te põe dentro de uma turma com prazo**.
   */
  clubeId?: string;
  conviteId?: string;
  titulo: string;
  corpo: string;
  /** ISO. É o que ordena e agrupa — por isso os exemplos também têm data real. */
  data: string;
  /** Classes do degradê (`from-… to-…`). */
  cor: string;
  icone?: LucideIcon;
  /** Inicial de quem respondeu, para o avatar. */
  inicial?: string;
  bookId?: number;
  /** Quando a resposta é num **post** do feed: o toque abre `/post/:id`. */
  postId?: string;
  /** Resposta a um **convite de evento**: o toque abre a comunidade do fórum. */
  forumId?: string;
  lida: boolean;
};

/** Data ISO de N dias atrás. Os exemplos precisam de data de verdade para
 *  cair na faixa certa hoje, amanhã e daqui a um mês. */
function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

// Confere se os livros citados existem antes de montar os avisos.
const [duna, habitos, iluminado, psicologia] = getBooksByIds([7, 102, 105, 101]);

/**
 * Os avisos de exemplo. Ficam numa função (e não numa constante) porque as
 * datas são relativas a agora: constante de módulo congelaria o "hoje" no
 * instante em que o arquivo foi carregado.
 */
function avisosDoSistema(): Aviso[] {
  return [
    {
      id: "s1",
      tipo: "sistema",
      icone: Sparkles,
      cor: "from-primary to-orange-600",
      titulo: "Novo na AllBook",
      corpo: `${duna?.title ?? "Duna"} chegou ao catálogo, narrado na íntegra.`,
      data: diasAtras(0),
      bookId: duna?.id,
      lida: false,
    },
    {
      id: "s2",
      tipo: "sistema",
      icone: Flame,
      cor: "from-orange-500 to-red-600",
      titulo: "Sua sequência continua",
      corpo: "3 semanas seguidas ouvindo. Faltam 15 minutos para manter a de hoje.",
      data: diasAtras(0),
      lida: false,
    },
    {
      id: "s3",
      tipo: "sistema",
      icone: Mic,
      cor: "from-violet-500 to-purple-600",
      titulo: "Novo narrador",
      corpo: `${iluminado?.title ?? "O Iluminado"} ganhou uma nova narração.`,
      data: diasAtras(1),
      bookId: iluminado?.id,
      lida: false,
    },
    {
      id: "s4",
      tipo: "sistema",
      icone: Tag,
      cor: "from-emerald-500 to-teal-600",
      titulo: "Livro da sua lista em oferta",
      corpo: `${psicologia?.title ?? "A Psicologia Financeira"} está com 40% de desconto esta semana.`,
      data: diasAtras(2),
      bookId: psicologia?.id,
      lida: true,
    },
    {
      id: "s5",
      tipo: "sistema",
      icone: Gift,
      cor: "from-fuchsia-500 to-purple-600",
      titulo: "Um mês grátis para indicar",
      corpo: "Convide alguém e vocês dois ganham 30 dias de Premium.",
      data: diasAtras(4),
      lida: true,
    },
    {
      id: "s6",
      tipo: "sistema",
      icone: Bell,
      cor: "from-blue-500 to-cyan-500",
      titulo: "Você parou no capítulo 4",
      corpo: `Continue ${habitos?.title ?? "Hábitos Atômicos"} de onde parou.`,
      data: diasAtras(9),
      bookId: habitos?.id,
      lida: true,
    },
  ];
}

/** Converte a notificação guardada no `localStorage` no formato da tela. */
/** O post é seu? Em `lib/posts.ts`, ausência de `autorSlug` significa "eu". */
function ehMeuPost(postId: string): boolean {
  const post = todosOsPosts().find((item) => item.id === postId);
  return post?.autorSlug === undefined;
}

function deResposta(item: ReplyNotification): Aviso {
  const membro = findMember(item.fromSlug);
  return {
    id: item.id,
    tipo: "resposta",
    /*
      **O título diz o que de fato aconteceu**, e isto foi um bug pego na tela em
      30/07: todo aviso de post dizia *"comentou no seu post"* — inclusive quando o
      post era de outra pessoa e o que houve foi alguém **respondendo o seu
      comentário** lá. Aviso que descreve errado é pior que aviso nenhum: a pessoa
      abre esperando uma coisa e encontra outra.
    */
    titulo:
      item.clubeId || item.forumId
      ? /* Resposta a convite: o texto já conta o desfecho ("entrou", "não pôde",
           "vai"), então o título só nomeia o assunto. Dizer "respondeu você"
           aqui era o mesmo defeito de descrição pego logo acima — visto na tela
           em 30/07. Vale para convite de clube e para convite de evento. */
        `${membro?.name ?? "Um leitor"} respondeu ao seu convite`
      : item.postId
        ? `${membro?.name ?? "Um leitor"} ${ehMeuPost(item.postId) ? "comentou no seu post" : "respondeu seu comentário"}`
        : `${membro?.name ?? "Um leitor"} respondeu você`,
    /* Convite não vai entre aspas: não é fala de ninguém, é o que aconteceu. */
    corpo: item.clubeId || item.forumId ? item.text : `“${item.text}”`,
    data: item.date,
    // A cor do avatar da própria pessoa: é assim que ela aparece nas outras
    // telas, e reconhecer a cor é reconhecer quem falou.
    slug: item.fromSlug,
    cor: membro?.color ?? "from-primary to-orange-600",
    inicial: membro?.name.charAt(0) ?? "?",
    bookId: item.bookId,
    clubeId: item.clubeId,
    postId: item.postId,
    forumId: item.forumId,
    lida: item.read,
  };
}

/**
 * Os pedidos para te seguir, no formato da tela.
 *
 * Pergunta do Matheus (29/07): *"como é que você vê isso no ícone de
 * notificação e você aceita a pessoa por aquele ícone?"*. É aqui — e o cartão
 * traz os dois botões, porque um aviso que só diz "fulano quer te seguir" e
 * obriga a caçar a tela de seguidores é meia notificação.
 *
 * **As datas são fixas e relativas** (2h e 1 dia), como os avisos de exemplo:
 * não há servidor que registre quando o pedido chegou, e datar tudo de "agora"
 * empilharia os dois no mesmo minuto a cada abertura da tela.
 */
function avisosDePedido(pendentes: CommunityMember[]): Aviso[] {
  return pendentes.map((pessoa, i) => ({
    id: `pedido-${pessoa.slug}`,
    tipo: "pedido" as const,
    slug: pessoa.slug,
    titulo: `${pessoa.name} quer te seguir`,
    corpo: pessoa.bio,
    data: i === 0 ? horasAtras(2) : diasAtras(1),
    cor: pessoa.color,
    inicial: pessoa.name.charAt(0),
    /* Pedido nunca nasce lido: é pendência, não recado. Some quando você
       responde, e é isso que apaga a marca do sino. */
    lida: false,
  }));
}

/**
 * Os convites de clube que esperam a sua palavra (§4.58, item 5).
 *
 * **Nunca nasce lido**, pelo mesmo motivo do pedido para te seguir: é pendência,
 * não recado. E some da lista quando você responde — é isso que apaga a marca do
 * sino sem precisar de "marcar como lida".
 */
function avisosDeConvite(convites: Convite[]): Aviso[] {
  return convites.flatMap((convite) => {
    const clube = clubePorId(convite.clubeId);
    const quem = findMember(convite.deSlug);
    if (!clube) return [];
    return [
      {
        id: convite.id,
        tipo: "convite" as const,
        slug: convite.deSlug,
        clubeId: convite.clubeId,
        conviteId: convite.id,
        /* Curto para caber numa linha no celular: "te convidou para um clube"
           estourava e virava reticências, e o clube já está na linha de baixo. */
        titulo: `${quem?.name ?? "Alguém"} te convidou`,
        corpo: `${clube.nome} · ${estreiaEmTexto(clube)}`,
        data: convite.date,
        cor: quem?.color ?? "from-primary to-orange-600",
        inicial: (quem?.name ?? "?").charAt(0),
        lida: false,
      },
    ];
  });
}

function horasAtras(horas: number): string {
  const d = new Date();
  d.setHours(d.getHours() - horas);
  return d.toISOString();
}

function faixaDe(iso: string): Faixa {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias < 1) return "Hoje";
  if (dias < 7) return "Esta semana";
  return "Antes";
}

/**
 * Há quanto tempo o aviso chegou.
 *
 * **Por que não usa o `relativeDate` do `activity.ts`:** aquele recebe só a
 * data (`AAAA-MM-DD`) e assume meio-dia, o que é o bastante para "comentou há
 * 3 dias". Aqui não serve por dois motivos. Primeiro, o fuso: recortar os dez
 * primeiros caracteres de um ISO (que é UTC) pode cair no dia anterior, e a
 * tela chegou a mostrar "ontem" dentro do grupo "Hoje" — as duas contas
 * discordavam. Segundo, aviso é coisa de hora: "há 2 h" diz mais que "hoje".
 * Esta versão usa o instante inteiro, a mesma base do `faixaDe`, então rótulo
 * e grupo nunca se contradizem.
 */
function quandoFoi(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 14) return "há 1 semana";
  if (dias < 31) return `há ${Math.floor(dias / 7)} semanas`;
  if (dias < 60) return "há 1 mês";
  return `há ${Math.floor(dias / 30)} meses`;
}

/**
 * **Os avisos de quem você segue no catálogo** (§4.84).
 *
 * É o que faz o botão "Seguir" de autor, narrador, editora e Studio valer
 * alguma coisa: sem esta função ele seria uma marcação sem consequência — o
 * botão morto que a §4.23 manda varrer. Cada novidade vira um aviso com o
 * mesmo mecanismo de "lida" dos de sistema (ids `acomp-…`, em `isSystemRead`).
 */
function avisosDeAcompanhados(): Aviso[] {
  /* **Seis, e não todas**: seguir o Studio rende treze novidades de uma vez, e
     treze avisos iguais afogam o resto do sino. A lista inteira mora em
     `/acompanhando`, que é a tela feita para isso. */
  return minhasNovidades(6).map((item) => ({
    id: `acomp-${item.id}`,
    tipo: "sistema" as const,
    icone: item.tipo === "narracao" ? Mic : Sparkles,
    cor: "from-primary to-orange-600",
    titulo: `Novidade de ${nomeDoAlvo(item.alvo)}`,
    corpo: item.texto,
    data: `${item.data}T12:00:00.000Z`,
    bookId: item.bookId,
    lida: false,
  }));
}

const ORDEM_DAS_FAIXAS: Faixa[] = ["Hoje", "Esta semana", "Antes"];

export default function Notifications() {
  const [, setLocation] = useLocation();
  // O "lida" dos avisos de sistema vem do localStorage (via `isSystemRead`), a
  // mesma fonte que o sino do TopNav conta — assim tela e sino nunca discordam.
  const [sistema, setSistema] = useState<Aviso[]>(() =>
    [...avisosDeAcompanhados(), ...avisosDoSistema()].map((a) => ({
      ...a,
      lida: isSystemRead(a.id),
    })),
  );
  const [respostas, setRespostas] = useState<ReplyNotification[]>([]);
  const [pedidos, setPedidos] = useState<CommunityMember[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);

  useEffect(() => {
    setRespostas(readNotifications());
  }, []);

  useEffect(() => {
    const atualizar = () => setPedidos(pedidosPendentes(readSettings().contaPrivada));
    atualizar();
    window.addEventListener(SEGUIDORES_EVENT, atualizar);
    return () => window.removeEventListener(SEGUIDORES_EVENT, atualizar);
  }, []);

  /* Os convites mudam por três caminhos — você responde, o clube enche, o ciclo
     começa —, e os dois últimos acontecem sem você tocar em nada. */
  useEffect(() => {
    const atualizar = () => setConvites(convitesParaMim());
    atualizar();
    window.addEventListener(CONVITES_EVENT, atualizar);
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => {
      window.removeEventListener(CONVITES_EVENT, atualizar);
      window.removeEventListener(CLUBES_EVENT, atualizar);
    };
  }, []);

  const avisos = [
    ...sistema,
    ...respostas.map(deResposta),
    ...avisosDePedido(pedidos),
    ...avisosDeConvite(convites),
  ].sort((a, b) => b.data.localeCompare(a.data));
  const naoLidas = avisos.filter((item) => !item.lida).length;

  function abrir(aviso: Aviso) {
    if (aviso.tipo === "resposta") {
      // Marca no localStorage — é isso que apaga a marca do sino no TopNav.
      setRespostas(markNotificationRead(aviso.id));
    } else {
      markSystemRead(aviso.id); // persiste no localStorage e atualiza o sino
      setSistema((atual) =>
        atual.map((item) => (item.id === aviso.id ? { ...item, lida: true } : item)),
      );
    }
    /*
      **"Responderam você" abre a conversa; o resto abre a ficha** (ROTEIRO
      4.51). O destino segue o que o aviso promete: quem toca numa resposta quer
      ler a resposta, e cair na sinopse obrigava a rolar a ficha inteira até
      achar a sala. Os avisos do sistema (o livro que ficou pronto, o lançamento
      do autor) falam do **título**, e para esses a ficha é o lugar certo.
    */
    /* Comentário num post do seu feed leva **ao post**, com a conversa aberta.
       Sem `/post/:id` o aviso caía no feed e o post podia estar a dez telas de
       rolagem — o mesmo defeito da 4.51, por outro caminho. */
    if (aviso.postId) {
      setLocation(`/post/${aviso.postId}`);
      return;
    }
    /* "Fulano entrou no seu clube" leva **ao clube** — o aviso fala da turma, e
       é a turma que a pessoa quer ver. */
    if (aviso.clubeId) {
      setLocation(`/clube/${aviso.clubeId}`);
      return;
    }
    /* Resposta a convite de evento leva **à comunidade**: é lá que o evento
       mora, com a data e a contagem de quem vai. */
    if (aviso.forumId) {
      setLocation(`/forum/${aviso.forumId}`);
      return;
    }
    if (!aviso.bookId) return;
    setLocation(
      aviso.tipo === "resposta" ? `/book/${aviso.bookId}/conversa` : `/book/${aviso.bookId}`,
    );
  }

  function marcarTodasLidas() {
    markAllSystemRead(); // persiste no localStorage e atualiza o sino
    setSistema((atual) => atual.map((item) => ({ ...item, lida: true })));
    setRespostas(markAllNotificationsRead());
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="notifications-page">
      <PageHeader
        title="Notificações"
        fallback="/profile"
        action={
          naoLidas > 0 ? (
            <button
              onClick={marcarTodasLidas}
              className="text-xs font-medium text-white/50 hover:text-white transition-colors shrink-0"
              data-testid="button-mark-all-read"
            >
              Marcar todas
            </button>
          ) : undefined
        }
      />

      {/* Quantas esperam por você. Some quando não há nenhuma — placar zerado
          não informa nada e só ocupa espaço. */}
      {naoLidas > 0 && (
        <div className="px-5 pb-3 flex items-center gap-2" data-testid="notifications-summary">
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
            {naoLidas}
          </span>
          <span className="text-xs text-white/50">
            {naoLidas === 1 ? "aviso novo" : "avisos novos"}
          </span>
        </div>
      )}

      {/*
        Os prazos dos seus clubes vêm **primeiro**, e são calculados na hora
        (ver `lib/avisosDeClube.ts`): é o único tipo de aviso aqui que ainda dá
        para resolver — o capítulo combinado, a rodada aberta, a votação. Eles
        não entram no contador do sino de propósito: não têm estado de "lida" e
        ficariam acesos o ciclo inteiro.
      */}
      <PrazosDosClubes />

      {avisos.length === 0 ? (
        <div className="px-8 py-24 text-center space-y-4" data-testid="notifications-empty">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/25 to-orange-600/10 ring-1 ring-primary/20 flex items-center justify-center">
            <Bell className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold font-display">Nada por aqui</h2>
          <p className="text-sm text-white/40">Seus avisos aparecem nesta tela.</p>
        </div>
      ) : (
        <div className="px-5 space-y-1" data-testid="notifications-list">
          {ORDEM_DAS_FAIXAS.map((faixa) => {
            const daFaixa = avisos.filter((item) => faixaDe(item.data) === faixa);
            if (daFaixa.length === 0) return null;

            return (
              <section key={faixa}>
                <h2 className="text-[11px] font-semibold text-white/35 uppercase tracking-wider px-1 mt-5 mb-2 first:mt-0">
                  {faixa}
                </h2>
                <div className="space-y-2">
                  {daFaixa.map((aviso, i) =>
                    aviso.tipo === "pedido" ? (
                      <CartaoDePedido key={aviso.id} aviso={aviso} />
                    ) : aviso.tipo === "convite" ? (
                      <CartaoDeConvite key={aviso.id} aviso={aviso} />
                    ) : (
                      <Cartao key={aviso.id} aviso={aviso} indice={i} onAbrir={abrir} />
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * O pedido para te seguir — o único cartão que **pede resposta** em vez de
 * levar a algum lugar (ROTEIRO 4.55).
 *
 * Por isso ele não é um `<button>` inteiro como os outros: os dois botões
 * moram dentro dele, e botão dentro de botão nem é HTML válido. Tocar no nome
 * abre a página da pessoa — é como se decide se aceita.
 */
function CartaoDePedido({ aviso }: { aviso: Aviso }) {
  const { toast } = useToast();
  const slug = aviso.slug ?? "";

  return (
    <div
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent p-3 ring-1 ring-primary/15"
      data-testid={`aviso-pedido-${slug}`}
    >
      <Link href={`/user/${slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${aviso.cor} font-display text-base font-bold`}
          {...avatarDeLeitor(aviso.slug)}
        >
          {aviso.inicial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{aviso.titulo}</span>
          <span className="mt-0.5 block truncate text-[11.5px] text-white/40">{aviso.corpo}</span>
          <span className="mt-0.5 block text-[10px] text-white/25">{quandoFoi(aviso.data)}</span>
        </span>
      </Link>

      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={() => {
            aceitarPedido(slug);
            toast({
              title: "Aceito",
              description: "Agora essa pessoa vê o que você ouve, comenta e avalia.",
            });
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-black transition-transform active:scale-95"
          aria-label="Aceitar"
          data-testid={`aviso-aceitar-${slug}`}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>
        <button
          onClick={() => {
            recusarPedido(slug);
            toast({ title: "Pedido recusado", description: "Ela não é avisada disso." });
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-white/60 transition-colors hover:text-white"
          aria-label="Recusar"
          data-testid={`aviso-recusar-${slug}`}
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/**
 * O convite para um clube — o **segundo** cartão que pede resposta (§4.58,
 * item 5).
 *
 * Tem a mesma forma do pedido para te seguir, de propósito: as duas coisas são a
 * mesma pergunta ("aceita?"), e dar formas diferentes a perguntas iguais faz a
 * pessoa reaprender o que já sabia. **O que muda é o peso do sim** — aceitar te
 * põe numa turma com prazo —, e por isso o aviso mostra o nome do clube e quando
 * ele estreia antes de você decidir.
 *
 * Tocar no cartão abre o clube: dá para ir ver o livro e o ritmo antes de
 * responder, e voltar. O convite continua aqui.
 */
function CartaoDeConvite({ aviso }: { aviso: Aviso }) {
  const { toast } = useToast();
  const id = aviso.conviteId ?? aviso.id;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent p-3 ring-1 ring-primary/15"
      data-testid={`aviso-convite-${id}`}
    >
      <Link href={`/clube/${aviso.clubeId}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${aviso.cor} font-display text-base font-bold`}
          {...avatarDeLeitor(aviso.slug)}
        >
          {aviso.inicial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{aviso.titulo}</span>
          <span className="mt-0.5 block truncate text-[11.5px] text-white/40">{aviso.corpo}</span>
          <span className="mt-0.5 block text-[10px] text-white/25">{quandoFoi(aviso.data)}</span>
        </span>
      </Link>

      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={() => {
            aceitarConvite(id);
            toast({
              title: "Você entrou na turma",
              description: "O clube aparece em Meus clubes, com o prazo de cada etapa.",
            });
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-black transition-transform active:scale-95"
          aria-label="Aceitar convite"
          data-testid={`convite-aceitar-${id}`}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>
        <button
          onClick={() => {
            recusarConvite(id);
            toast({ title: "Convite recusado", description: "Ninguém é avisado disso." });
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-white/60 transition-colors hover:text-white"
          aria-label="Recusar convite"
          data-testid={`convite-recusar-${id}`}
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/**
 * Um aviso.
 *
 * O não-lido não se distingue só por um pontinho: ganha fundo em degradê
 * laranja e um anel finíssimo. Num celular, um ponto de seis pixels é fácil
 * demais de não ver — o que é novo tem que saltar de relance.
 */
function Cartao({
  aviso,
  indice,
  onAbrir,
}: {
  aviso: Aviso;
  indice: number;
  onAbrir: (aviso: Aviso) => void;
}) {
  const Icone = aviso.icone;
  const livro = aviso.bookId ? catalog.find((item) => item.id === aviso.bookId) : undefined;

  return (
    <button
      // Entrada em cascata em CSS (não framer): keyframe não trava a tela
      // semitransparente se a janela perde o foco. O atraso por item dá a
      // cascata, com teto de 0,3s para a lista longa não chegar segundos depois;
      // `fill-mode-both` segura o estado inicial durante o atraso.
      style={{ animationDelay: `${Math.min(indice * 50, 300)}ms` }}
      onClick={() => onAbrir(aviso)}
      className={`animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
        aviso.lida
          ? "bg-white/[0.02] hover:bg-white/[0.06]"
          : "bg-gradient-to-r from-primary/12 to-white/[0.02] ring-1 ring-primary/20 hover:from-primary/20"
      }`}
      data-testid={`notification-${aviso.id}`}
    >
      {aviso.tipo === "resposta" ? (
        <span
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${aviso.cor} flex items-center justify-center shrink-0 text-sm font-bold shadow-md`}
          {...avatarDeLeitor(aviso.slug)}
        >
          {aviso.inicial}
        </span>
      ) : (
        // Ícone de sistema em tom neutro único (como o Perfil e a Biblioteca) —
        // não mais um gradiente de cor por tipo. O avatar de resposta acima segue
        // com a cor da pessoa, que é identidade, não enfeite.
        <span className="w-10 h-10 rounded-xl bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0">
          {Icone && <Icone className="w-[18px] h-[18px] text-white/80" strokeWidth={1.8} />}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm line-clamp-1 ${
              aviso.lida ? "font-medium text-white/70" : "font-semibold text-white"
            }`}
          >
            {aviso.titulo}
          </h3>
          {!aviso.lida && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-label="Não lida" />
          )}
        </div>

        <p
          className={`text-xs leading-relaxed mt-1 line-clamp-2 ${
            aviso.tipo === "resposta" ? "italic text-white/45" : "text-white/40"
          }`}
        >
          {aviso.corpo}
        </p>

        <p className="text-[11px] text-white/25 mt-1.5">{quandoFoi(aviso.data)}</p>
      </div>

      {livro && (
        <img
          src={livro.cover}
          alt={livro.title}
          className="w-10 h-[54px] rounded-md object-cover shrink-0"
        />
      )}
    </button>
  );
}

/**
 * Os prazos dos clubes em que você está.
 *
 * Ficam no topo da tela porque são a única coisa aqui que **ainda dá para
 * resolver**: o capítulo combinado desta semana, a rodada que fecha amanhã, a
 * votação que você não fez. Aviso de lançamento e de oferta pode esperar; um
 * prazo, não.
 *
 * Nada de "marcar como lida": um prazo não se lê, se cumpre — ele some sozinho
 * quando você alcança o capítulo, responde a rodada ou vota.
 */
function PrazosDosClubes() {
  const [, navegar] = useLocation();
  const [avisos, setAvisos] = useState(() => avisosDeClube());

  useEffect(() => {
    const atualizar = () => setAvisos(avisosDeClube());
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    window.addEventListener(RODADAS_EVENT, atualizar);
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    return () => {
      window.removeEventListener(CLUBES_EVENT, atualizar);
      window.removeEventListener(RODADAS_EVENT, atualizar);
      window.removeEventListener(PLAYBACK_EVENT, atualizar);
    };
  }, []);

  if (avisos.length === 0) return null;

  return (
    <section className="px-5 pb-4" data-testid="prazos-dos-clubes">
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
        Seus clubes
      </h2>
      <div className="space-y-2">
        {avisos.map((aviso) => (
          <button
            key={aviso.id}
            onClick={() => navegar(`/clube/${aviso.clubeId}`)}
            className="flex w-full items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3.5 text-left transition-colors hover:bg-primary/[0.1]"
            data-testid={`aviso-clube-${aviso.tipo}`}
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              {aviso.tipo === "rodada" ? (
                <MessageCircleQuestion className="h-4 w-4" />
              ) : aviso.tipo === "votacao" ? (
                <Vote className="h-4 w-4" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold">{aviso.clube}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-white/55">
                {aviso.texto}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
