import { type ReactNode } from "react";
import { Link } from "wouter";

import PageHeader from "@/components/PageHeader";
import { fotoDoMembro } from "@/lib/community";

/**
 * **As peças visuais das comunidades** — agora com a cara do AllBook.
 *
 * ---
 *
 * **A história curta, porque ela explica a forma.** Em 31/07 o Matheus pediu a
 * aba inteira *"tal e como era no Orkut"* (§4.74) e ela foi construída assim:
 * branca, azul, Verdana 11px, caixas com cabeçalho azul-claro. Horas depois ele
 * mudou: *"sem mexer nessa questão das funções, vamos deixar essa página com a
 * cara do AllBook, seguindo os mesmos layouts. Vamos deixar mais ou menos no
 * mesmo formato."*
 *
 * **O que mudou e o que não mudou** — e a distinção é o ponto:
 *
 * - **Mudou a pele:** fundo #141414, laranja da marca, Outfit/Inter, cantos de
 *   12–16px, avatares redondos com gradiente. Nada mais de branco e Verdana.
 * - **Não mudou a estrutura:** a ficha da comunidade continua com os mesmos
 *   campos e na mesma ordem, o fórum continua paginado com mensagens numeradas, a
 *   enquete continua com barra e porcentagem, o evento continua com vou · talvez ·
 *   não vou. **A governança inteira ficou intacta** — era a condição dele.
 *
 * Ou seja: o que o Orkut ensinou sobre *como organizar uma comunidade* ficou; o
 * que ele tinha de 2004 na aparência, não.
 */

/** A moldura da página — o mesmo fundo e a mesma respiração das outras telas. */
export function PaginaDoForum({
  titulo,
  voltarPara = "/community",
  acao,
  children,
  testid,
}: {
  titulo: string;
  voltarPara?: string;
  acao?: ReactNode;
  children: ReactNode;
  testid?: string;
}) {
  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid={testid}>
      <PageHeader title={titulo} fallback={voltarPara} action={acao} />
      {children}
    </div>
  );
}

/**
 * O bloco de conteúdo — o cartão da casa, com o título em versalete.
 *
 * É o mesmo desenho das seções do Perfil e do clube (`rounded-2xl`, borda de 7%
 * de branco, fundo de 3%), e é por isso que a comunidade deixou de parecer um
 * enxerto: ela usa a peça que o app inteiro usa.
 */
export function Bloco({
  titulo,
  acao,
  children,
  testid,
}: {
  titulo?: string;
  /** O "ver todos" da direita — vira link laranja. */
  acao?: ReactNode;
  children: ReactNode;
  testid?: string;
}) {
  return (
    <section className="mb-3" data-testid={testid}>
      {(titulo || acao) && (
        <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
          {titulo && (
            <h2 className="text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
              {titulo}
            </h2>
          )}
          {acao}
        </div>
      )}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">{children}</div>
    </section>
  );
}

/** Ação em texto — laranja, como todo link de ação do app. */
export function LinkDoForum({
  href,
  onClick,
  children,
  testid,
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  testid?: string;
  className?: string;
}) {
  const estilo = `text-[11.5px] font-semibold text-primary transition-opacity hover:opacity-80 ${className}`;
  if (href) {
    return (
      <Link href={href} className={estilo} data-testid={testid}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`text-left ${estilo}`} data-testid={testid}>
      {children}
    </button>
  );
}

/** Botão da casa: laranja no principal, borda apagada no resto. */
export function BotaoDoForum({
  onClick,
  children,
  primario,
  disabled,
  testid,
}: {
  onClick?: () => void;
  children: ReactNode;
  primario?: boolean;
  disabled?: boolean;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors disabled:opacity-30 ${
        primario
          ? "bg-primary text-black hover:opacity-90"
          : "border border-white/15 text-white/70 hover:bg-white/5"
      }`}
      data-testid={testid}
    >
      {children}
    </button>
  );
}

/** Uma linha "rótulo: valor" da ficha da comunidade. */
export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <p className="text-[12px] leading-[1.7]">
      <span className="text-white/35">{rotulo} </span>
      <span className="text-white/75">{children}</span>
    </p>
  );
}

/**
 * O avatar — **redondo e com o gradiente da pessoa**, como no resto do app.
 *
 * Era quadrado e cinza na versão Orkut. O redondo com gradiente não é só gosto:
 * é o que faz a lista de membros daqui parecer a mesma lista que aparece no
 * clube, no feed e na conversa do livro.
 */
export function AvatarDoForum({
  nome,
  slug,
  src,
  cor = "from-primary to-orange-600",
  tamanho = 44,
  testid,
}: {
  nome: string;
  /** Quem é — o componente busca o rosto sozinho (31/07). */
  slug?: string;
  /** Foto pronta, para o **seu** avatar (que vem do perfil, não da comunidade). */
  src?: string;
  /** As classes de gradiente de `community.ts`. */
  cor?: string;
  tamanho?: number;
  testid?: string;
}) {
  /* A foto do perfil vem inteira e é recortada; a do leitor é um PNG
     transparente que se **sobrepõe** ao gradiente. São dois casos diferentes de
     propósito: o gradiente é o que identifica a pessoa de relance no app inteiro,
     e jogá-lo fora ao ganhar rosto seria trocar uma informação por outra. */
  const rosto = src ?? (slug ? fotoDoMembro(slug) : undefined);

  if (src) {
    return (
      <img
        src={src}
        alt={nome}
        style={{ width: tamanho, height: tamanho }}
        className="shrink-0 rounded-full object-cover"
        data-testid={testid}
      />
    );
  }

  return (
    <span
      style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho / 2.6) }}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${cor} font-display font-bold`}
      data-testid={testid}
    >
      {rosto ? (
        <img src={rosto} alt={nome} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        nome.charAt(0).toUpperCase()
      )}
    </span>
  );
}

/**
 * **A capa de uma comunidade** — imagem enviada, ou o mosaico das capas dos
 * livros de que ela fala, ou o emoji.
 *
 * A ordem importa e é a de sempre no app: o que a pessoa **escolheu** ganha do
 * que o app **deduz**, e o deduzido ganha do genérico. Ver `capaDaComunidade`,
 * em `lib/forum.ts`, para o registro de por que a foto de banco foi descartada.
 */
export function CapaDaComunidade({
  imagem,
  foto,
  emoji,
  semente,
  lado,
  className = "",
  testid,
}: {
  /** A imagem que o dono **enviou** — ganha de tudo. */
  imagem?: string;
  /** A foto que veio com a comunidade semeada (`capaDaComunidade`). */
  foto?: string;
  emoji: string;
  /** O id da comunidade — dá a cor do degradê quando não há foto. */
  semente?: string;
  /** Em px, para a moldura quadrada. Sem valor, ocupa a largura do pai. */
  lado?: number;
  className?: string;
  testid?: string;
}) {
  const estilo = lado ? { width: lado, height: lado } : undefined;
  const moldura = `shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 ${
    lado ? "" : "aspect-square w-full"
  } ${className}`;

  /* **O que a pessoa escolheu ganha do que veio pronto.** É a mesma ordem do
     resto do app, e é o que faz o "trocar imagem" da tela de gerenciar valer
     alguma coisa: quem envia uma foto vê a foto dela, sempre. */
  const src = imagem ?? foto;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={estilo}
        className={`${moldura} object-cover`}
        data-testid={testid}
      />
    );
  }

  /*
   * **Sem foto, a capa é um degradê com o emoji grande** — e isso é conserto de
   * 31/07. O fundo era `bg-white/[0.06]`, um cinza chapado: ao lado das
   * comunidades que têm foto, as que não têm pareciam buracos na grade, e foi
   * parte do que o Matheus chamou de "sem vida" (§4.82). A cor sai do nome da
   * comunidade, então **é sempre a mesma** para a mesma comunidade — capa que
   * muda de cor a cada desenho é interface mentindo.
   */
  return (
    <span
      style={{
        ...estilo,
        fontSize: lado ? Math.round(lado / 2.4) : undefined,
        background: degradeDe(semente ?? emoji),
      }}
      className={`grid place-items-center ${moldura} ${lado ? "" : "text-[32px]"}`}
      data-testid={testid}
    >
      <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">{emoji}</span>
    </span>
  );
}

/**
 * **A capa de um tópico** (ROTEIRO §4.91) — imagem enviada, capa do livro de que
 * ele fala, ou um degradê com o emoji da comunidade.
 *
 * ---
 *
 * **Por que a capa de livro é a boa ideia aqui, e a imagem livre é a exceção.**
 * O Matheus pediu as duas em 31/07. A de livro é a que **carrega informação**:
 * num app de audiolivro a maioria dos tópicos é sobre um livro, e ver qual antes
 * de tocar poupa o toque. A imagem enviada é para o tópico que não é sobre livro
 * nenhum — existe porque senão esses ficariam todos iguais.
 *
 * **O tamanho é o cuidado.** Capa grande em lista longa destrói a varredura, que
 * é justamente para o que uma lista de fórum serve. Por isso são dois tamanhos:
 * `44–56px` na lista, e a versão larga só nos **destaques** do topo, que são no
 * máximo dois.
 */
export function CapaDoTopico({
  imagem,
  capaDoLivro,
  emoji = "💬",
  semente,
  lado = 52,
  retrato,
  className = "",
  testid,
}: {
  /** `data:` URL enviada — ganha de tudo. */
  imagem?: string;
  /** A capa do livro do catálogo (`book.cover`). */
  capaDoLivro?: string;
  /** O emoji da comunidade, para quando não há imagem nenhuma. */
  emoji?: string;
  /** O id do tópico — dá a cor do degradê, e ela nunca muda. */
  semente?: string;
  /** Largura em px. Quadrado na lista; com `retrato`, vira 2×3. */
  lado?: number;
  /**
   * **Proporção de capa de livro (2×3)**, para o cartaz.
   *
   * Conserto de 31/07: a primeira versão do destaque esticava a capa num banner
   * 16×7 com `object-cover`, e o resultado era uma tira do meio da arte — de
   * "Garota Exemplar" sobrava a palavra FLYNN. Capa de livro é retrato; mostrar
   * como retrato é a única forma de ela continuar sendo a capa daquele livro.
   */
  retrato?: boolean;
  className?: string;
  testid?: string;
}) {
  const estilo = { width: lado, height: retrato ? Math.round(lado * 1.45) : lado };
  const moldura = `shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 ${className}`;

  const src = imagem ?? capaDoLivro;
  if (src) {
    return (
      <img src={src} alt="" style={estilo} className={`${moldura} object-cover`} data-testid={testid} />
    );
  }

  return (
    <span
      style={{
        ...estilo,
        fontSize: Math.round(lado / 2.2),
        background: degradeDe(semente ?? emoji),
      }}
      className={`grid place-items-center ${moldura}`}
      data-testid={testid}
    >
      <span className="opacity-60 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">{emoji}</span>
    </span>
  );
}

/**
 * **O cartaz de um tópico** — a capa em tamanho de capa, sobre o borrão dela
 * mesma.
 *
 * É a peça dos **destaques** e do topo do fio. O fundo é a própria imagem
 * desfocada e escurecida: dá uma cor que combina com a arte sem inventar uma, e
 * funciona igual para capa de livro (retrato), foto enviada (quadrada) e
 * degradê (sem imagem nenhuma) — três proporções que nenhum recorte único
 * atenderia.
 */
export function CartazDoTopico({
  imagem,
  capaDoLivro,
  emoji,
  semente,
  children,
  testid,
}: {
  imagem?: string;
  capaDoLivro?: string;
  emoji?: string;
  semente?: string;
  /** O texto ao lado da capa: título, selo, números. */
  children: ReactNode;
  testid?: string;
}) {
  const src = imagem ?? capaDoLivro;

  return (
    <div className="relative overflow-hidden" data-testid={testid}>
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-xl"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: degradeDe(semente ?? emoji ?? "💬") }}
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-black/55" />

      <div className="relative flex items-center gap-3 p-3">
        <CapaDoTopico
          imagem={imagem}
          capaDoLivro={capaDoLivro}
          emoji={emoji}
          semente={semente}
          lado={64}
          retrato
          className="shadow-lg shadow-black/40"
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

/** Os pares de cor das capas sem foto — escuros, para o emoji sobressair. */
const DEGRADES = [
  ["#2b1a4a", "#4c2a6b"],
  ["#12333a", "#1d5c58"],
  ["#3a1717", "#6b2b2b"],
  ["#1a2a45", "#2f4d7a"],
  ["#3a2a10", "#6b4a18"],
  ["#1f3320", "#385c33"],
  ["#301a2a", "#5c2a4a"],
  ["#22262e", "#3d4552"],
] as const;

function degradeDe(texto: string): string {
  let n = 0;
  for (let i = 0; i < texto.length; i += 1) n = (n * 31 + texto.charCodeAt(i)) % 9973;
  const [a, b] = DEGRADES[n % DEGRADES.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

/** Campo de texto do app: fundo transparente, borda fina, foco laranja. */
export const CAMPO =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none";
