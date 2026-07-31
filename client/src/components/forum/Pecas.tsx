import { type ReactNode } from "react";
import { Link } from "wouter";

import PageHeader from "@/components/PageHeader";

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
  src,
  cor = "from-primary to-orange-600",
  tamanho = 44,
  testid,
}: {
  nome: string;
  src?: string;
  /** As classes de gradiente de `community.ts`. */
  cor?: string;
  tamanho?: number;
  testid?: string;
}) {
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
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${cor} font-display font-bold`}
      data-testid={testid}
    >
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}

/** Campo de texto do app: fundo transparente, borda fina, foco laranja. */
export const CAMPO =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none";
