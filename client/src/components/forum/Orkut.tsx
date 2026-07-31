import { type ReactNode } from "react";
import { Link } from "wouter";

/**
 * **As peças visuais do Orkut** — usadas só na aba Fóruns.
 *
 * Pedido do Matheus em 31/07, dito duas vezes e sem margem: *"a gente vai fazer
 * tudo tal e como era no Orkut, inclusive as imagens, tudo. Esquece o aplicativo.
 * Copiar tudo, layout, tudo — não só regras de governança."*
 *
 * ---
 *
 * **O que isso significa na prática, e por que fica num arquivo só.** O AllBook é
 * escuro (#141414), laranja, Outfit/Inter, cantos de 12px. O Orkut era **branco,
 * azul, Verdana 11px, caixas com cabeçalho azul-claro e links sublinhados**. São
 * duas identidades opostas, e misturá-las por engano fora desta aba é o risco
 * óbvio — por isso todas as peças moram aqui, e nada nelas usa a paleta da casa.
 *
 * **A ressalva que eu registro em vez de esconder:** esta aba vai destoar do resto
 * do app, e isso é consequência aceita da decisão dele (*"depois nós editamos"*).
 * Se um dia a decisão mudar, o conserto está concentrado neste arquivo.
 *
 * **A adaptação inevitável:** o Orkut era desktop, com tabelas de 800px; este app
 * é um celular. As colunas viram linhas quando não cabem, mas a **ordem da
 * informação** e a **forma** (caixa, cabeçalho, link azul) são as de lá.
 */

/** Verdana pequena, o corpo do Orkut inteiro. */
export const FONTE_ORKUT = "font-[Verdana,Geneva,Tahoma,sans-serif]";

/** A moldura da página: fundo branco, texto cinza-escuro, letra pequena. */
export function PaginaOrkut({
  children,
  testid,
}: {
  children: ReactNode;
  testid?: string;
}) {
  return (
    <div
      className={`min-h-screen bg-white pb-24 text-[11px] text-[#333] ${FONTE_ORKUT}`}
      data-testid={testid}
    >
      {children}
    </div>
  );
}

/**
 * A barra azul do topo — o Orkut tinha a dele em todas as telas, com o nome à
 * esquerda e os destinos à direita.
 *
 * Aqui ela leva de volta ao app: sem isso, entrar numa comunidade seria entrar
 * numa tela sem saída (§4.23), já que a aba não usa mais o cabeçalho da casa.
 */
export function BarraOrkut({ onde }: { onde?: string }) {
  return (
    <div className="bg-[#3b5998] px-3 py-1.5 text-white" data-testid="barra-orkut">
      <div className="flex items-center justify-between gap-3">
        <Link href="/community" className="font-bold tracking-tight text-white hover:underline">
          <span className="text-[15px] lowercase">allbook</span>
          <span className="ml-1.5 text-[10px] font-normal text-white/70">comunidades</span>
        </Link>
        <div className="flex items-center gap-2.5 text-[10px]">
          <Link href="/profile" className="text-white/85 hover:underline">
            perfil
          </Link>
          <Link href="/forum" className="text-white/85 hover:underline">
            comunidades
          </Link>
          <Link href="/community" className="text-white/85 hover:underline">
            voltar ao app
          </Link>
        </div>
      </div>
      {onde && <p className="mt-1 truncate text-[10px] text-white/70">{onde}</p>}
    </div>
  );
}

/**
 * A caixa — a unidade de layout do Orkut inteiro: borda fina, cabeçalho
 * azul-claro com o título em minúsculas, e um link de ação à direita.
 */
export function Caixa({
  titulo,
  acao,
  children,
  testid,
}: {
  titulo: string;
  /** O "ver todos" que ficava no canto direito do cabeçalho. */
  acao?: ReactNode;
  children: ReactNode;
  testid?: string;
}) {
  return (
    <div
      className="mb-2.5 rounded-[4px] border border-[#c9d7e8] bg-white"
      data-testid={testid}
    >
      <div className="flex items-center justify-between gap-2 rounded-t-[3px] border-b border-[#c9d7e8] bg-[#e8eef7] px-2.5 py-1.5">
        <h2 className="text-[11px] font-bold lowercase text-[#2b4a80]">{titulo}</h2>
        {acao}
      </div>
      <div className="p-2.5">{children}</div>
    </div>
  );
}

/** Link azul sublinhado no hover — o único estilo de link que o Orkut tinha. */
export function LinkOrkut({
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
  const estilo = `text-[#1a4fa0] hover:underline ${className}`;
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

/** O botão cinza de formulário, com a borda dupla da época. */
export function BotaoOrkut({
  onClick,
  children,
  primario,
  disabled,
  testid,
}: {
  onClick?: () => void;
  children: ReactNode;
  /** O botão de ação principal era azul, os outros cinza. */
  primario?: boolean;
  disabled?: boolean;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[3px] border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 ${
        primario
          ? "border-[#2b4a80] bg-[#5b7ab5] font-bold text-white hover:bg-[#4a6aa5]"
          : "border-[#a8a8a8] bg-[#f0f0f0] text-[#333] hover:bg-[#e4e4e4]"
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
    <p className="leading-[1.6]">
      <span className="text-[#666]">{rotulo}: </span>
      <span className="text-[#333]">{children}</span>
    </p>
  );
}

/**
 * O avatarzinho quadrado do Orkut — foto se houver, senão a inicial num quadrado
 * cinza. **Quadrado, não redondo**: o Orkut não tinha avatar redondo, e é uma das
 * coisas que mais dizem "isto é aquilo".
 */
export function FotoOrkut({
  nome,
  src,
  tamanho = 48,
  testid,
}: {
  nome: string;
  src?: string;
  tamanho?: number;
  testid?: string;
}) {
  return src ? (
    <img
      src={src}
      alt={nome}
      style={{ width: tamanho, height: tamanho }}
      className="border border-[#c9c9c9] object-cover"
      data-testid={testid}
    />
  ) : (
    <span
      style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho / 2.4) }}
      className="grid place-items-center border border-[#c9c9c9] bg-[#e9e9e9] font-bold text-[#8a8a8a]"
      data-testid={testid}
    >
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}
