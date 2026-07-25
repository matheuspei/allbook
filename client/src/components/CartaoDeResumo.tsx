import { useEffect, useRef, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { X } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/lib/books";

/**
 * As peças compartilháveis das Estatísticas — imagens geradas na hora.
 *
 * **De onde veio.** Havia um botão "Copiar meu resumo" que jogava texto cru na
 * área de transferência ("• 39h 42min ouvidas…"). Ninguém posta uma lista de
 * tópicos: o que um app grande entrega aqui é uma peça pronta, com a marca, os
 * números e as capas — como Spotify e Strava fazem no fim do ano.
 *
 * **Duas peças, com propósitos diferentes — e é isso que os nomes dizem.**
 * Antes elas se chamavam "Simples" e "Completo", que descreviam a *quantidade*
 * de coisas na imagem e não ajudavam ninguém a escolher. Agora são:
 *
 * - **Resumo** (4:5) — o retrato geral: horas desde sempre, capas, gênero.
 *   Serve para qualquer lugar, inclusive fora de rede social.
 * - **Story** (9:16) — feito para o story do Instagram, no tamanho exato. O
 *   herói aqui **não é hora, é livro**: "4 livros nos últimos 30 dias", com as
 *   capas grandes e os terminados marcados. Foi decisão do Matheus: o que as
 *   pessoas postam é "li tantos livros", não "ouvi tantas horas".
 *
 * **Por que desenhar num `<canvas>` em vez de estilizar uma `<div>`:** a
 * imagem precisa existir como arquivo para o `navigator.share` levá-la ao
 * Instagram. Capturar HTML exigiria uma biblioteca nova por um resultado pior.
 * Desenhando direto, o que se vê na tela **é** o arquivo.
 *
 * As capas vêm do próprio site (mesma origem), então o canvas não é
 * "contaminado" e o `toBlob` funciona.
 */

export type ModoDoCartao = "resumo" | "story";

/** Um destaque com nome: "GÊNERO DO MÊS" em cima, "Mistério" embaixo. */
export interface DestaqueDaStory {
  /** Curto, em caixa alta — vira o rótulo na cor da marca. */
  rotulo: string;
  /** O nome (gênero, autor, voz) ou a frase curta ("3 dias por livro"). */
  valor: string;
}

export interface DadosDaStory {
  /** "NOS ÚLTIMOS 30 DIAS". */
  periodo: string;
  /** O número gigante — em livros, não em horas. */
  destaque: string;
  /** "livros ouvidos" / "livro ouvido". */
  destaqueRotulo: string;
  /**
   * Até quatro destaques **com nome**, em duas colunas.
   *
   * Terceira forma deste bloco, e cada troca teve motivo. As linhas com
   * bolinha diziam esforço (hora, dia de uso). As colunas de contagem que
   * vieram depois ("8 GÊNEROS · 9 VOZES") eram honestas, mas contagem é
   * telemetria — "8 gêneros" não conta história nenhuma. O que se posta é
   * **nome**: "Mistério", "Stephen King", a voz que narrou. É o mesmo motivo
   * de o Wrapped do Spotify dizer *qual* foi a sua banda do ano, e não
   * *quantas* bandas você ouviu.
   */
  destaques: DestaqueDaStory[];
  /** Até 6 capas — as terminadas, se houver; senão as mais ouvidas. */
  capas: Book[];
  /** "O QUE EU TERMINEI" / "O QUE EU OUVI" — quem tem os dados decide. */
  tituloDasCapas: string;
  /** Até duas linhas de fecho, embaixo das capas. */
  fecho: string[];
}

export interface DadosDoCartao {
  /** "39h 42min" — o número grande do Resumo. */
  total: string;
  /** "15 títulos · 42 dias ouvindo" — a linha de apoio do Resumo. */
  apoio: string;
  /** "Romance" ou vazio. */
  generoFavorito: string;
  /** Até 3 livros, os mais ouvidos de sempre. */
  livros: Book[];
  /** O resumo em texto, para quem preferir colar. */
  texto: string;
  /** "maio a julho de 2026" — o período que o histórico cobre. */
  periodo: string;
  /** "Helena Vasques · mais à noite" — o fecho do Resumo. */
  rodape: string;
  /** Tudo que só a Story usa. */
  story: DadosDaStory;
}

const LARGURA = 1080;
const ALTURA_RESUMO = 1350;
const ALTURA_STORY = 1920;
const MARGEM = 88;

function alturaDe(modo: ModoDoCartao): number {
  return modo === "story" ? ALTURA_STORY : ALTURA_RESUMO;
}

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

/** Fundo, brilho da marca e a assinatura — o que as duas peças dividem. */
function moldura(ctx: CanvasRenderingContext2D, altura: number): void {
  ctx.clearRect(0, 0, LARGURA, altura);
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, LARGURA, altura);

  // O mesmo brilho da marca que abre as telas do app — contido: na primeira
  // versão ele tomava metade do cartão e deixava o topo todo amarronzado.
  const alcance = altura * 0.46;
  const brilho = ctx.createRadialGradient(LARGURA / 2, 0, 0, LARGURA / 2, 0, alcance);
  brilho.addColorStop(0, "rgba(255,106,0,0.22)");
  brilho.addColorStop(1, "rgba(255,106,0,0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, LARGURA, alcance);

  // Um calor quase invisível subindo do canto de baixo. Ele responde pelo
  // brilho do topo — sem isso a metade de baixo ficava chapada, cor de nada.
  const calor = ctx.createRadialGradient(
    LARGURA * 0.92,
    altura * 1.04,
    0,
    LARGURA * 0.92,
    altura * 1.04,
    altura * 0.5
  );
  calor.addColorStop(0, "rgba(255,106,0,0.08)");
  calor.addColorStop(1, "rgba(255,106,0,0)");
  ctx.fillStyle = calor;
  ctx.fillRect(0, altura * 0.5, LARGURA, altura * 0.5);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

/** A marca, no tamanho pedido. */
function marca(ctx: CanvasRenderingContext2D, y: number, tamanho: number): void {
  ctx.font = `700 ${tamanho}px Outfit, sans-serif`;
  ctx.fillStyle = "#FF6A00";
  ctx.fillText("All", MARGEM, y);
  const largoAll = ctx.measureText("All").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Book", MARGEM + largoAll, y);
}

/** Rótulo pequeno em caixa alta, com espaçamento — o "título de seção". */
function rotulo(ctx: CanvasRenderingContext2D, texto: string, y: number, tamanho = 24): void {
  ctx.font = `600 ${tamanho}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.letterSpacing = "5px";
  ctx.fillText(texto, MARGEM, y);
  ctx.letterSpacing = "0px";
}

/** Pinta uma capa recortada em cantos arredondados, no estilo `object-cover`. */
function pintarCapa(
  ctx: CanvasRenderingContext2D,
  imagem: HTMLImageElement | null,
  x: number,
  y: number,
  largura: number,
  altura: number
): void {
  /*
   * A sombra vem antes do recorte, num retângulo próprio: dentro do `clip` ela
   * não aparece (fica recortada junto). É ela que descola a capa do fundo
   * escuro — sem sombra, capa escura sobre fundo escuro virava uma mancha.
   */
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#1b1b1b";
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, 14);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, 14);
  ctx.clip();
  if (imagem) {
    const escala = Math.max(largura / imagem.width, altura / imagem.height);
    const largoFinal = imagem.width * escala;
    const altoFinal = imagem.height * escala;
    ctx.drawImage(
      imagem,
      x - (largoFinal - largura) / 2,
      y - (altoFinal - altura) / 2,
      largoFinal,
      altoFinal
    );
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x, y, largura, altura);
  }
  ctx.restore();
}

/**
 * Uma grade de capas, com cada linha centralizada — é o que permite mostrar
 * **até seis** livros na Story sem deixar a última fileira torta quando ela vem
 * incompleta (5 capas = 3 + 2).
 */
async function desenharGrade(
  ctx: CanvasRenderingContext2D,
  livros: Book[],
  topo: number,
  largura: number,
  altura: number,
  colunas: number,
  vao = 24
): Promise<void> {
  for (let i = 0; i < livros.length; i++) {
    const linha = Math.floor(i / colunas);
    const coluna = i % colunas;
    const nestaLinha = Math.min(colunas, livros.length - linha * colunas);
    const conjunto = nestaLinha * largura + (nestaLinha - 1) * vao;
    const x = (LARGURA - conjunto) / 2 + coluna * (largura + vao);
    const y = topo + linha * (altura + vao);
    pintarCapa(ctx, await carregarImagem(livros[i].cover), x, y, largura, altura);
  }
}

/** As capas lado a lado, com o título embaixo de cada uma. */
async function desenharCapas(
  ctx: CanvasRenderingContext2D,
  livros: Book[],
  topo: number,
  altura: number,
  /** Quando dada, as capas ficam nesta largura e o conjunto vai para o centro. */
  larguraForcada?: number,
  tamanhoDoTitulo = 26
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
    // O desenho em si é o mesmo da grade — `pintarCapa` cuida do recorte, do
    // `object-cover` e da sombra. Esta função só acrescenta o título embaixo.
    pintarCapa(ctx, await carregarImagem(livro.cover), x, topo, largura, altura);

    ctx.font = `600 ${tamanhoDoTitulo}px Inter, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(textoQueCabe(ctx, livro.title, largura), x, topo + altura + tamanhoDoTitulo + 16);
  }
}

/** O retrato geral, 4:5. */
async function desenharResumo(ctx: CanvasRenderingContext2D, dados: DadosDoCartao): Promise<void> {
  moldura(ctx, ALTURA_RESUMO);
  marca(ctx, 130, 46);

  if (dados.periodo) {
    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(dados.periodo, MARGEM, 190);
  }

  rotulo(ctx, "MINHA AUDIÇÃO", 300, 26);

  ctx.font = "700 132px Outfit, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dados.total, MARGEM, 430);

  ctx.font = "400 34px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(textoQueCabe(ctx, dados.apoio, LARGURA - MARGEM * 2), MARGEM, 490);

  if (dados.livros.length > 0) {
    rotulo(ctx, "O QUE MAIS TOMOU SEU TEMPO", 640);
    /*
     * A capa nunca passa da largura que teria se fossem três — que é o que a
     * altura desta peça aguenta. Sem o teto, quem tem uma ou duas capas via a
     * imagem quebrada: com duas, a capa esticava para 608px de altura e escrevia
     * o título **por cima** do rodapé e da assinatura.
     */
    const cabe = (LARGURA - MARGEM * 2 - 36 * (dados.livros.length - 1)) / dados.livros.length;
    const teto = (LARGURA - MARGEM * 2 - 36 * 2) / 3;
    const largura = Math.min(cabe, teto);
    await desenharCapas(ctx, dados.livros, 690, largura * 1.4, largura);
  }

  const fecho = [dados.generoFavorito, dados.rodape].filter(Boolean).join(" · ");
  if (fecho) {
    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(textoQueCabe(ctx, fecho, LARGURA - MARGEM * 2), MARGEM, ALTURA_RESUMO - 110);
  }

  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("feito no AllBook", MARGEM, ALTURA_RESUMO - 60);
}

/**
 * Os destaques em duas colunas: rótulo pequeno na cor da marca, nome grande em
 * branco. Acima deles, um filete que **começa laranja e termina cinza** — é o
 * único adorno da peça, e existe para amarrar o bloco à marca sem precisar de
 * ícone ou cartão (a regra da casa: nada com cara de enfeite de IA).
 */
function desenharDestaques(
  ctx: CanvasRenderingContext2D,
  destaques: DestaqueDaStory[],
  topo: number
): void {
  if (destaques.length === 0) return;

  const util = LARGURA - MARGEM * 2;
  ctx.fillStyle = "#FF6A00";
  ctx.fillRect(MARGEM, topo, 88, 3);
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.fillRect(MARGEM + 88, topo + 1, util - 88, 1);

  const coluna = util / 2;
  for (let i = 0; i < destaques.length && i < 4; i++) {
    const x = MARGEM + (i % 2) * coluna;
    const yRotulo = topo + 72 + Math.floor(i / 2) * 132;
    // 32px de respiro para a coluna vizinha, senão os nomes se encostam.
    const cabe = coluna - 32;

    ctx.font = "600 23px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,106,0,0.85)";
    ctx.letterSpacing = "4px";
    ctx.fillText(textoQueCabe(ctx, destaques[i].rotulo, cabe), x, yRotulo);
    ctx.letterSpacing = "0px";

    ctx.font = "600 40px Outfit, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(textoQueCabe(ctx, destaques[i].valor, cabe), x, yRotulo + 50);
  }
}

/**
 * A peça de rede social, 9:16 — o tamanho exato do story.
 *
 * O herói é o **número de livros** do período, não as horas: "39h ouvidas" diz
 * pouco para quem vê de fora, "4 livros em 30 dias" é o que se conta. Abaixo
 * dele, os destaques com nome (gênero, autor, voz, ritmo); depois a parede de
 * capas; e, quando a grade não mostra títulos, a frase dos terminados.
 */
async function desenharStory(ctx: CanvasRenderingContext2D, dados: DadosDoCartao): Promise<void> {
  const s = dados.story;
  moldura(ctx, ALTURA_STORY);
  marca(ctx, 210, 56);

  rotulo(ctx, s.periodo, 296, 28);

  // O número gigante e o rótulo dele.
  ctx.font = "700 260px Outfit, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(s.destaque, MARGEM, 560);

  ctx.font = "600 44px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(s.destaqueRotulo, MARGEM, 628);

  const destaques = s.destaques.slice(0, 4);
  const fileirasDeDestaque = Math.ceil(destaques.length / 2);
  desenharDestaques(ctx, destaques, 700);

  /*
   * Daqui para baixo o layout é **empilhado, não fixo**: cada bloco começa
   * onde o anterior terminou. Com posições fixas, quem tinha uma fileira de
   * destaques em vez de duas via um buraco de 130px no meio da peça — e
   * buraco no meio lê como defeito, não como respiro.
   */
  let cursor = destaques.length === 0 ? 720 : 700 + 122 + (fileirasDeDestaque - 1) * 132 + 82;

  /*
   * Até três capas, uma fileira grande com o título de cada livro. De quatro a
   * seis, duas fileiras menores e **sem título** — com seis nomes embaixo a
   * peça vira uma lista, e o que convence num story é a parede de capas.
   */
  const capas = s.capas.slice(0, 6);
  if (capas.length > 0) {
    rotulo(ctx, s.tituloDasCapas, cursor, 26);
    const topoDasCapas = cursor + 40;
    if (capas.length <= 3) {
      await desenharCapas(ctx, capas, topoDasCapas, 400, 274, 28);
      cursor = topoDasCapas + 400 + 60;
    } else {
      const fileiras = Math.ceil(capas.length / 3);
      await desenharGrade(ctx, capas, topoDasCapas, 176, 246, 3, 20);
      cursor = topoDasCapas + fileiras * 246 + (fileiras - 1) * 20;
    }
  }

  /*
   * O fecho: a frase dos terminados, quando a grade não mostra os títulos.
   * Autor e voz não moram mais aqui — subiram para os destaques, com rótulo.
   * O teto em 1650 impede a frase de invadir a assinatura.
   */
  const fecho = s.fecho.slice(0, 2);
  const yDoFecho = Math.min(cursor + 76, 1650);
  for (let i = 0; i < fecho.length; i++) {
    ctx.font = i === 0 ? "600 34px Inter, sans-serif" : "400 30px Inter, sans-serif";
    ctx.fillStyle = i === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)";
    ctx.fillText(textoQueCabe(ctx, fecho[i], LARGURA - MARGEM * 2), MARGEM, yDoFecho + i * 54);
  }

  /*
   * Assinatura com chamada — é um story, alguém vai perguntar onde é. Ela para
   * a ~180px do fim de propósito: **o Instagram cobre a faixa de baixo** com a
   * caixa de resposta, e o que ficar ali não é lido.
   */
  ctx.font = "700 36px Outfit, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("AllBook", MARGEM, ALTURA_STORY - 180);
  /*
   * O lema. Era "audiolivros em português" — que descreve a **categoria**, não
   * a empresa: qualquer concorrente poderia assinar a mesma frase. Este explica
   * o nome (All = todos) e promete o que o AllBook quer ser: não um catálogo
   * fechado, e sim qualquer livro disponível em voz.
   */
  ctx.font = "400 30px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("todos os livros, em voz alta", MARGEM, ALTURA_STORY - 134);
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

  if (modo === "story") await desenharStory(ctx, dados);
  else await desenharResumo(ctx, dados);
}

const MODOS: { key: ModoDoCartao; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "story", label: "Story" },
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
  const [modo, setModo] = useState<ModoDoCartao>("resumo");

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

  async function gerarArquivo(): Promise<File | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const blob = await new Promise<Blob | null>((resolver) =>
      canvas.toBlob((resultado) => resolver(resultado), "image/png")
    );
    if (!blob) return null;
    return new File([blob], modo === "story" ? "allbook-story.png" : "allbook.png", {
      type: "image/png",
    });
  }

  /**
   * A folha nativa do celular é o caminho para o Instagram: ela lista os apps
   * instalados, e a imagem entra no story por lá. **Não existe, na web, como
   * publicar direto no story sem passar por ela** — o `instagram-stories://`
   * só aceita imagem vinda de um app nativo. No computador, baixa o PNG.
   */
  async function compartilhar() {
    const arquivo = await gerarArquivo();
    if (!arquivo) {
      toast({ title: "Não deu para gerar a imagem", description: "Tente de novo." });
      return;
    }

    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({
          files: [arquivo],
          title: "Minhas estatísticas no AllBook",
          text: dados.texto,
        });
        return;
      } catch {
        // A pessoa fechou a folha nativa: não é erro, não avisa nada.
        return;
      }
    }

    baixar(arquivo);
    toast({
      title: "Imagem salva",
      description: "Compartilhar direto só no celular — no computador o arquivo é baixado.",
    });
  }

  async function salvar() {
    const arquivo = await gerarArquivo();
    if (!arquivo) {
      toast({ title: "Não deu para gerar a imagem", description: "Tente de novo." });
      return;
    }
    baixar(arquivo);
    toast({ title: "Imagem salva", description: `Baixada como ${arquivo.name}.` });
  }

  function baixar(arquivo: File) {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = arquivo.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(`${dados.texto}\n${window.location.origin}`);
      toast({ title: "Resumo copiado", description: "O texto já vai com o link do AllBook." });
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

      <div className="animate-in slide-in-from-bottom fade-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#1c1c1c] px-5 pb-8 pt-4 duration-300">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold tracking-tight">Compartilhar</h2>

          <div className="flex items-center gap-2">
            {/* Duas peças com propósitos diferentes — o nome diz onde cada uma vai. */}
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
        <div className="relative mx-auto" style={{ maxWidth: modo === "story" ? "62%" : "100%" }}>
          <canvas
            ref={canvasRef}
            width={LARGURA}
            height={alturaDe(modo)}
            className={`w-full rounded-xl border border-white/10 transition-opacity duration-300 ${
              pronto ? "opacity-100" : "opacity-0"
            }`}
          />
          {!pronto && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <p className="text-xs text-white/40">Montando sua imagem…</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={compartilhar}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black transition-colors hover:bg-white/90"
            data-testid="button-share-card"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>
          <button
            onClick={salvar}
            className="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3.5 text-white transition-colors hover:bg-white/15"
            aria-label="Salvar imagem"
            data-testid="button-save-card"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={copiarTexto}
            className="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3.5 text-white transition-colors hover:bg-white/15"
            aria-label="Copiar texto"
            data-testid="button-copy-text"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {modo === "story" && (
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">
            No celular, "Compartilhar" abre a folha do sistema — é por ela que a imagem entra no
            story do Instagram.
          </p>
        )}
      </div>
    </div>
  );
}
