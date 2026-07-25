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

export interface DadosDoCartao {
  /** "39h 42min" — o número grande. */
  total: string;
  /** "15 títulos · 42 dias ouvindo" — a linha de apoio. */
  apoio: string;
  /** "Romance" ou vazio. */
  generoFavorito: string;
  /** Até 3 livros, os mais ouvidos. */
  livros: Book[];
  /** O mesmo resumo em texto, para quem preferir colar. */
  texto: string;
}

const LARGURA = 1080;
const ALTURA = 1350;

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

async function desenhar(canvas: HTMLCanvasElement, dados: DadosDoCartao): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Sem esperar as fontes, o primeiro desenho sai na fonte do sistema.
  try {
    await document.fonts.ready;
  } catch {
    /* navegador sem a API: segue com o fallback */
  }

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

  const margem = 88;

  // Marca.
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 46px Outfit, sans-serif";
  ctx.fillStyle = "#FF6A00";
  ctx.fillText("All", margem, 130);
  const largoAll = ctx.measureText("All").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Book", margem + largoAll, 130);

  // Rótulo.
  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.letterSpacing = "6px";
  ctx.fillText("MINHA AUDIÇÃO", margem, 300);
  ctx.letterSpacing = "0px";

  // O número grande.
  ctx.font = "700 132px Outfit, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dados.total, margem, 430);

  // Linha de apoio.
  ctx.font = "400 34px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(textoQueCabe(ctx, dados.apoio, LARGURA - margem * 2), margem, 490);

  // As capas do que mais tomou seu tempo.
  const livros = dados.livros.slice(0, 3);
  if (livros.length > 0) {
    ctx.font = "600 24px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.letterSpacing = "4px";
    ctx.fillText("O QUE MAIS TOMOU SEU TEMPO", margem, 640);
    ctx.letterSpacing = "0px";

    const vao = 36;
    const largura = (LARGURA - margem * 2 - vao * (livros.length - 1)) / livros.length;
    const altura = largura * 1.4;
    const topo = 690;

    for (let i = 0; i < livros.length; i++) {
      const livro = livros[i];
      const x = margem + i * (largura + vao);
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
      ctx.fillText(textoQueCabe(ctx, livro.title, largura), x, topo + altura + 44);
    }
  }

  // Rodapé: gênero favorito de um lado, assinatura do outro.
  if (dados.generoFavorito) {
    ctx.font = "400 30px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(`Gênero favorito: ${dados.generoFavorito}`, margem, ALTURA - 110);
  }

  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("feito no AllBook", margem, ALTURA - 60);
}

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

  useEffect(() => {
    if (!aberto || !canvasRef.current) return;
    setPronto(false);
    let vivo = true;
    desenhar(canvasRef.current, dados).then(() => {
      if (vivo) setPronto(true);
    });
    return () => {
      vivo = false;
    };
  }, [aberto, dados]);

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
          <button
            onClick={onClose}
            className="-mr-1.5 p-1.5 text-white/40 transition-colors hover:text-white"
            aria-label="Fechar"
            data-testid="button-close-card"
          >
            <X className="h-5 w-5" />
          </button>
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
