import { useEffect, useRef, useState } from "react";
import { Copy, Download, X } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/lib/books";

/**
 * O cartão de retrospectiva — uma **imagem** com os seus números, para dar
 * print ou compartilhar.
 *
 * **O que ele substituiu.** Havia um botão "Copiar meu resumo" que jogava
 * texto cru na área de transferência ("• 39h 42min ouvidas…"). Funcionava, mas
 * era a coisa menos premium da tela: ninguém posta uma lista de tópicos. O que
 * um app grande entrega aqui é uma peça pronta, com a marca, os números e as
 * capas — do jeito que Spotify e Strava fazem no fim do ano.
 *
 * **Duas versões, e a escolha é de quem usa.** O Matheus gostou do cartão e
 * quis ver "com mais informação", sem perder o que já estava bom. Em vez de
 * trocar um pelo outro no escuro, o painel tem um alternador: **Simples** (o
 * original: número grande, três capas, gênero) e **Completo** (acrescenta o
 * período, quatro números, o gráfico das últimas 12 semanas e um rodapé com
 * narrador e horário). O padrão continua sendo o Simples.
 *
 * **Por que desenhar num `<canvas>` em vez de estilizar uma `<div>`:** a
 * imagem precisa existir como arquivo para o `navigator.share` levá-la ao
 * WhatsApp ou ao Instagram. Uma `div` bonita só viraria imagem com uma
 * biblioteca de captura (html2canvas e afins), que é peso novo no projeto para
 * um resultado pior. Desenhando direto, o que se vê na tela **é** o arquivo:
 * não existe divergência entre a prévia e o que sai.
 *
 * As capas vêm do próprio site (o Vite serve tudo da mesma origem), então o
 * canvas não é "contaminado" e o `toBlob` funciona.
 */

export type ModoDoCartao = "simples" | "completo";

export interface DadosDoCartao {
  /** "39h 42min" — o número grande. */
  total: string;
  /** "15 títulos · 42 dias ouvindo" — a linha de apoio da versão simples. */
  apoio: string;
  /** "Romance" ou vazio. */
  generoFavorito: string;
  /** Até 3 livros, os mais ouvidos. */
  livros: Book[];
  /** O mesmo resumo em texto, para quem preferir colar. */
  texto: string;

  // — Só a versão completa usa daqui para baixo —
  /** "maio a julho de 2026" — desde quando o histórico existe. */
  periodo: string;
  /** Quatro números curtos, com rótulo. */
  numeros: { valor: string; rotulo: string }[];
  /** Horas por semana nas últimas 12 — o mini gráfico. */
  serieSemanal: number[];
  /** "Helena Vasques · mais à noite" — o fecho da versão completa. */
  rodape: string;
}

const LARGURA = 1080;
const ALTURA = 1350;
const MARGEM = 88;

function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolver) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => resolver(null);
    imagem.src = src;
  });
}

/** Corta o texto com reticências para caber na largura pedida. */
function textoQueCabe(ctx: CanvasRenderingContext2D, texto: string, largura: number): string {
  if (ctx.measureText(texto).width <= largura) return texto;
  let corte = texto;
  while (corte.length > 1 && ctx.measureText(`${corte}…`).width > largura) {
    corte = corte.slice(0, -1);
  }
  return `${corte.trim()}…`;
}

/** Fundo, brilho da marca e a assinatura — o que as duas versões dividem. */
function moldura(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, LARGURA, ALTURA);
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // O mesmo brilho da marca que abre as telas do app — contido: na primeira
  // versão ele tomava metade do cartão e deixava o topo todo amarronzado.
  const brilho = ctx.createRadialGradient(LARGURA / 2, 0, 0, LARGURA / 2, 0, 620);
  brilho.addColorStop(0, "rgba(255,106,0,0.22)");
  brilho.addColorStop(1, "rgba(255,106,0,0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, LARGURA, 620);

  ctx.textBaseline = "alphabetic";
  ctx.font = "700 46px Outfit, sans-serif";
  ctx.fillStyle = "#FF6A00";
  ctx.fillText("All", MARGEM, 130);
  const largoAll = ctx.measureText("All").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Book", MARGEM + largoAll, 130);

  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("feito no AllBook", MARGEM, ALTURA - 60);
}

/** Rótulo pequeno em caixa alta, com espaçamento — o "título de seção". */
function rotulo(ctx: CanvasRenderingContext2D, texto: string, y: number, tamanho = 24): void {
  ctx.font = `600 ${tamanho}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.letterSpacing = "5px";
  ctx.fillText(texto, MARGEM, y);
  ctx.letterSpacing = "0px";
}

/** As capas lado a lado, com o título embaixo de cada uma. */
async function desenharCapas(
  ctx: CanvasRenderingContext2D,
  livros: Book[],
  topo: number,
  altura: number,
  /** Quando dado, as capas ficam nesta largura e o conjunto vai para o centro. */
  larguraForcada?: number
): Promise<void> {
  if (livros.length === 0) return;

  const vao = 36;
  const largura =
    larguraForcada ?? (LARGURA - MARGEM * 2 - vao * (livros.length - 1)) / livros.length;
  const conjunto = largura * livros.length + vao * (livros.length - 1);
  const inicio = (LARGURA - conjunto) / 2;

  for (let i = 0; i < livros.length; i++) {
    const livro = livros[i];
    const x = inicio + i * (largura + vao);
    const imagem = await carregarImagem(livro.cover);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, topo, largura, altura, 16);
    ctx.clip();
    if (imagem) {
      // Preenche mantendo a proporção (o mesmo efeito do `object-cover`).
      const escala = Math.max(largura / imagem.width, altura / imagem.height);
      const largoFinal = imagem.width * escala;
      const altoFinal = imagem.height * escala;
      ctx.drawImage(
        imagem,
        x - (largoFinal - largura) / 2,
        topo - (altoFinal - altura) / 2,
        largoFinal,
        altoFinal
      );
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, topo, largura, altura);
    }
    ctx.restore();

    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(textoQueCabe(ctx, livro.title, largura), x, topo + altura + 42);
  }
}

/** A versão original: um número grande, três capas e o gênero. */
async function desenharSimples(ctx: CanvasRenderingContext2D, dados: DadosDoCartao): Promise<void> {
  moldura(ctx);

  rotulo(ctx, "MINHA AUDIÇÃO", 300, 26);

  ctx.font = "700 132px Outfit, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dados.total, MARGEM, 430);

  ctx.font = "400 34px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(textoQueCabe(ctx, dados.apoio, LARGURA - MARGEM * 2), MARGEM, 490);

  if (dados.livros.length > 0) {
    rotulo(ctx, "O QUE MAIS TOMOU SEU TEMPO", 640);
    const largura = (LARGURA - MARGEM * 2 - 36 * (dados.livros.length - 1)) / dados.livros.length;
    await desenharCapas(ctx, dados.livros, 690, largura * 1.4);
  }

  if (dados.generoFavorito) {
    ctx.font = "400 30px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(`Gênero favorito: ${dados.generoFavorito}`, MARGEM, ALTURA - 110);
  }
}

/**
 * A versão cheia: período, quatro números, o gráfico das 12 semanas, as capas e
 * um rodapé com gênero, narrador e horário. Cabe tudo porque o número grande
 * encolhe e as capas ficam mais baixas — nada aqui foi espremido sem conta.
 */
async function desenharCompleto(ctx: CanvasRenderingContext2D, dados: DadosDoCartao): Promise<void> {
  moldura(ctx);

  if (dados.periodo) {
    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(dados.periodo, MARGEM, 190);
  }

  rotulo(ctx, "MINHA AUDIÇÃO", 288, 26);

  ctx.font = "700 112px Outfit, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dados.total, MARGEM, 392);

  // Quatro números em colunas, com um risco fino separando do topo.
  const numeros = dados.numeros.slice(0, 4);
  if (numeros.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.fillRect(MARGEM, 440, LARGURA - MARGEM * 2, 2);

    const largura = (LARGURA - MARGEM * 2) / numeros.length;
    numeros.forEach((item, i) => {
      const x = MARGEM + i * largura;
      ctx.font = "700 44px Outfit, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(textoQueCabe(ctx, item.valor, largura - 12), x, 512);

      ctx.font = "400 24px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(textoQueCabe(ctx, item.rotulo, largura - 12), x, 548);
    });
  }

  // O gráfico das últimas 12 semanas.
  const serie = dados.serieSemanal.slice(-12);
  if (serie.length > 0) {
    rotulo(ctx, "ÚLTIMAS 12 SEMANAS", 624);

    const topo = 652;
    const altura = 108;
    const vao = 10;
    const largura = (LARGURA - MARGEM * 2 - vao * (serie.length - 1)) / serie.length;
    const maior = Math.max(...serie, 1);

    serie.forEach((valor, i) => {
      const x = MARGEM + i * (largura + vao);
      // Barra vazia continua sendo um risco, para a semana existir no desenho.
      const alto = Math.max((valor / maior) * altura, 4);
      ctx.fillStyle = valor > 0 ? "rgba(255,106,0,0.85)" : "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.roundRect(x, topo + altura - alto, largura, alto, 6);
      ctx.fill();
    });
  }

  if (dados.livros.length > 0) {
    rotulo(ctx, "O QUE MAIS TOMOU SEU TEMPO", 836);
    // Capas mais estreitas e centralizadas: com a largura cheia da versão
    // simples elas ficariam **mais largas que altas** (a arte cortada) e o
    // título de cada uma bateria no rodapé.
    await desenharCapas(ctx, dados.livros, 858, 276, 207);
  }

  const fecho = [dados.generoFavorito, dados.rodape].filter(Boolean).join(" · ");
  if (fecho) {
    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(textoQueCabe(ctx, fecho, LARGURA - MARGEM * 2), MARGEM, ALTURA - 110);
  }
}

async function desenhar(
  canvas: HTMLCanvasElement,
  dados: DadosDoCartao,
  modo: ModoDoCartao
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Sem esperar as fontes, o primeiro desenho sai na fonte do sistema.
  try {
    await document.fonts.ready;
  } catch {
    /* navegador sem a API: segue com o fallback */
  }

  if (modo === "completo") await desenharCompleto(ctx, dados);
  else await desenharSimples(ctx, dados);
}

const MODOS: { key: ModoDoCartao; label: string }[] = [
  { key: "simples", label: "Simples" },
  { key: "completo", label: "Completo" },
];

export default function CartaoDeResumo({
  aberto,
  dados,
  onClose,
}: {
  aberto: boolean;
  dados: DadosDoCartao;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pronto, setPronto] = useState(false);
  const [modo, setModo] = useState<ModoDoCartao>("simples");

  useEffect(() => {
    if (!aberto || !canvasRef.current) return;
    setPronto(false);
    let vivo = true;
    desenhar(canvasRef.current, dados, modo).then(() => {
      if (vivo) setPronto(true);
    });
    return () => {
      vivo = false;
    };
  }, [aberto, dados, modo]);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  if (!aberto) return null;

  /**
   * No celular abre a folha nativa de compartilhar com a imagem; no computador
   * (e onde o navegador não aceita compartilhar arquivo) baixa o PNG.
   */
  async function salvar() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolver) =>
      canvas.toBlob((resultado) => resolver(resultado), "image/png")
    );
    if (!blob) {
      toast({ title: "Não deu para gerar a imagem", description: "Tente de novo." });
      return;
    }

    const arquivo = new File([blob], "allbook.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: "Minhas estatísticas no AllBook" });
        return;
      } catch {
        // A pessoa fechou a folha nativa: não é erro, não avisa nada.
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "allbook.png";
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Imagem salva", description: "O cartão foi baixado como allbook.png." });
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(dados.texto);
      toast({ title: "Resumo copiado", description: "Agora é só colar onde você quiser." });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "O navegador bloqueou o acesso à área de transferência.",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" data-testid="summary-card">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-in slide-in-from-bottom fade-in relative w-full max-w-md rounded-t-2xl border-t border-white/10 bg-[#1c1c1c] px-5 pb-8 pt-4 duration-300">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold tracking-tight">Seu cartão</h2>

          <div className="flex items-center gap-2">
            {/* Duas versões, para comparar sem apostar em uma só. */}
            <div className="flex rounded-lg bg-white/[0.07] p-0.5">
              {MODOS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setModo(item.key)}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    modo === item.key ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"
                  }`}
                  data-testid={`card-mode-${item.key}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="-mr-1.5 p-1.5 text-white/40 transition-colors hover:text-white"
              aria-label="Fechar"
              data-testid="button-close-card"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/*
          O desenho leva um instante (fontes da marca + capas). Sem este aviso
          ficava um retângulo invisível no lugar, com cara de tela quebrada.
        */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={LARGURA}
            height={ALTURA}
            className={`w-full rounded-xl border border-white/10 transition-opacity duration-300 ${
              pronto ? "opacity-100" : "opacity-0"
            }`}
          />
          {!pronto && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <p className="text-xs text-white/40">Montando seu cartão…</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={salvar}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black transition-colors hover:bg-white/90"
            data-testid="button-save-card"
          >
            <Download className="h-4 w-4" />
            Salvar imagem
          </button>
          <button
            onClick={copiarTexto}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            data-testid="button-copy-text"
          >
            <Copy className="h-4 w-4" />
            Texto
          </button>
        </div>
      </div>
    </div>
  );
}
