import { useEffect, useRef, useState } from "react";
import { Bookmark, Pause, Play } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { MAX_CITACAO_SEC, MIN_CITACAO_SEC, criarCitacao } from "@/lib/citacoes";
import { guardarTrecho, jaGuardado } from "@/lib/trechosGuardados";
import { chaptersTotalSec } from "@/lib/chapters";
import { formatarPosicao } from "@/lib/sala";

/**
 * Cortar o trecho — as duas pontas móveis, como num app de corte de áudio.
 *
 * **Pedido do Matheus (28/07, ROTEIRO 4.43):** *"seria interessante que ele
 * pudesse cortar exatamente o local onde ele quer citar, como se fosse aqueles
 * aplicativos de corte de áudio mesmo… e que ele pudesse reproduzir onde é que
 * ele está falando"*. A versão anterior fixava o início no ponto em que a folha
 * abriu e só deixava escolher o comprimento (10/20/30/40s) — o que serve para
 * "guardei por aqui", não para "é **esta** frase".
 *
 * **Limitação que precisa estar dita:** enquanto não houver áudio, cortar é
 * mirar pelo **relógio**, não pelo ouvido — num cortador de verdade a pessoa
 * ouve e acha o ponto. A ferramenta está correta e é a que vai ser necessária
 * quando o som existir; hoje ela é honesta sobre o que consegue.
 *
 * **Por que há arraste E botõezinhos de um segundo:** arrastar acha a região
 * depressa, mas o dedo num celular cobre uns 4 a 6 segundos de faixa nesta
 * escala — sem o ajuste fino, "exatamente" seria promessa vazia. Os dois juntos
 * são o que existe nos apps de corte pela mesma razão.
 */

/** Quanto do livro a faixa mostra. Três minutos dão folga para mover 40s. */
const JANELA_SEC = 180;

export default function CortadorDeTrecho({
  bookId,
  inicio,
  fim,
  onChange,
  permitirGuardar = true,
}: {
  bookId: number;
  inicio: number;
  fim: number;
  onChange: (inicio: number, fim: number) => void;
  /**
   * O botão "Guardar para usar em outra conversa", aqui dentro.
   *
   * Faz sentido quando o cortador nasce **dentro de um comentário** (o corte
   * serve ali e, de quebra, pode ser guardado). Some quando o cortador é aberto
   * para **editar um trecho que já está guardado**: ali quem salva é a folha,
   * e um segundo "guardar" criaria uma cópia em vez de corrigir o original.
   */
  permitirGuardar?: boolean;
}) {
  const { toast } = useToast();
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = useState<"inicio" | "fim" | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  /*
   * A janela é congelada na montagem. Se ela seguisse a seleção, arrastar uma
   * ponta moveria o fundo junto e o gesto viraria areia movediça.
   */
  const [janela] = useState(() => {
    const total = chaptersTotalSec(bookId);
    const centro = (inicio + fim) / 2;
    const comeco = Math.max(0, Math.min(centro - JANELA_SEC / 2, total - JANELA_SEC));
    return { comeco: Math.max(0, comeco), duracao: Math.min(JANELA_SEC, total) };
  });

  const pct = (sec: number) => ((sec - janela.comeco) / janela.duracao) * 100;

  const fimDaJanela = janela.comeco + janela.duracao;

  /**
   * Mover uma ponta, com as travas — e **empurrando a outra** quando bate no teto.
   *
   * O empurrão é o conserto de um defeito que só apareceu testando: com a
   * seleção já nos 40 segundos, "Início −5s" não fazia **nada**, porque recuar o
   * início estouraria o máximo. Botão que não responde é o defeito que a 4.23
   * mandou varrer — e "quero começar 5 segundos antes" é um pedido claro. Agora
   * a seleção **desliza**: o início recua e o fim vem junto, mantendo o
   * comprimento. É o que os cortadores de áudio fazem, e pela mesma razão.
   */
  function mover(qual: "inicio" | "fim", alvo: number) {
    if (qual === "inicio") {
      const novoInicio = Math.max(janela.comeco, Math.min(alvo, fim - MIN_CITACAO_SEC));
      const novoFim = Math.min(fimDaJanela, Math.max(fim, novoInicio + MIN_CITACAO_SEC));
      /* Estourou o teto: o fim vem junto, e a seleção desliza. */
      onChange(novoInicio, Math.min(novoFim, novoInicio + MAX_CITACAO_SEC));
      return;
    }
    const novoFim = Math.min(fimDaJanela, Math.max(alvo, inicio + MIN_CITACAO_SEC));
    const novoInicio = Math.max(janela.comeco, Math.min(inicio, novoFim - MIN_CITACAO_SEC));
    onChange(Math.max(novoInicio, novoFim - MAX_CITACAO_SEC), novoFim);
  }

  /* ---------------- arraste ---------------- */

  useEffect(() => {
    if (!arrastando) return;

    const aoArrastar = (evento: PointerEvent) => {
      const trilho = trilhoRef.current;
      if (!trilho) return;
      const caixa = trilho.getBoundingClientRect();
      const fracao = Math.min(1, Math.max(0, (evento.clientX - caixa.left) / caixa.width));
      const sec = Math.round(janela.comeco + fracao * janela.duracao);

      mover(arrastando, sec);
    };

    const soltar = () => setArrastando(null);
    window.addEventListener("pointermove", aoArrastar);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", aoArrastar);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  }, [arrastando, inicio, fim, janela, onChange]);

  /* ---------------- prévia ---------------- */

  useEffect(() => {
    if (cursor === null) return;
    const relogio = setInterval(() => {
      setCursor((atual) => {
        if (atual === null) return null;
        if (atual + 1 >= fim) return null; // acabou o trecho: pára sozinho
        return atual + 1;
      });
    }, 1000);
    return () => clearInterval(relogio);
  }, [cursor, fim]);

  const duracao = fim - inicio;



  return (
    <div className="rounded-xl bg-white/[0.04] p-3" data-testid="cortador-de-trecho">
      {/* ---- a faixa ---- */}
      <div
        ref={trilhoRef}
        className="relative h-16 touch-none select-none overflow-hidden rounded-lg bg-background/60"
      >
        {/*
          As barrinhas são desenhadas, não medidas — não existe forma de onda
          para ler enquanto não houver áudio. Elas dão a leitura de "isto é uma
          faixa de som" e servem de régua visual para o arraste; a altura vem de
          uma conta fixa sobre o índice, então ela não muda a cada desenho e não
          finge representar este trecho.
        */}
        <div className="absolute inset-0 flex items-center gap-[3px] px-1">
          {Array.from({ length: 56 }, (_, i) => {
            const sec = janela.comeco + (i / 56) * janela.duracao;
            const dentro = sec >= inicio && sec <= fim;
            const altura = 14 + ((i * 37) % 29);
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  dentro ? "bg-primary/80" : "bg-white/12"
                }`}
                style={{ height: altura }}
              />
            );
          })}
        </div>

        {/* Fora da seleção escurece: o corte se lê antes de qualquer número. */}
        <div
          className="absolute inset-y-0 left-0 bg-black/55"
          style={{ width: `${pct(inicio)}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-black/55"
          style={{ width: `${100 - pct(fim)}%` }}
        />

        {/* Cursor da prévia. */}
        {cursor !== null && (
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,.8)]"
            style={{ left: `${pct(cursor)}%` }}
          />
        )}

        {(["inicio", "fim"] as const).map((qual) => (
          <button
            key={qual}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setArrastando(qual);
            }}
            style={{ left: `${pct(qual === "inicio" ? inicio : fim)}%` }}
            className="absolute inset-y-0 -ml-3 flex w-6 cursor-ew-resize items-center justify-center"
            aria-label={qual === "inicio" ? "Arrastar o início" : "Arrastar o fim"}
            data-testid={`alca-${qual}`}
          >
            <span className="h-full w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" />
          </button>
        ))}
      </div>

      {/* ---- números e ajuste fino ---- */}
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-white/70">{formatarPosicao(inicio)}</span>
        <span className="font-semibold text-primary">{duracao}s</span>
        <span className="font-semibold text-white/70">{formatarPosicao(fim)}</span>
      </div>

      <div className="mt-2 space-y-1.5">
        <LinhaDeAjuste rotulo="Início" onEmpurrar={(passo) => mover("inicio", inicio + passo)} />
        <LinhaDeAjuste rotulo="Fim" onEmpurrar={(passo) => mover("fim", fim + passo)} />
      </div>

      <button
        type="button"
        onClick={() => setCursor((atual) => (atual === null ? inicio : null))}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.07] py-2.5 text-xs font-bold transition-colors hover:bg-white/12"
        data-testid="ouvir-selecao"
      >
        {cursor === null ? (
          <>
            <Play className="h-3.5 w-3.5 fill-current" />
            Ouvir a seleção
          </>
        ) : (
          <>
            <Pause className="h-3.5 w-3.5 fill-current" />
            {formatarPosicao(cursor)} — parando em {formatarPosicao(fim)}
          </>
        )}
      </button>

      {/*
        **Guardar é o que faz o trecho servir fora daqui** (ROTEIRO 4.45). Sem
        este botão, um corte só valeria no comentário que está sendo escrito
        agora — e o pedido do Matheus era poder citar também no fórum e no clube,
        que são outra tela e outro momento. Cortar é ouvindo; anexar é depois.
      */}
      {permitirGuardar && (
        <button
          type="button"
          onClick={() => {
            guardarTrecho(criarCitacao(bookId, inicio, fim - inicio));
            toast({
              title: "Trecho guardado",
              description: "Dá para anexar em qualquer conversa pelo botão de clipe.",
            });
          }}
          className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/12 py-2.5 text-xs font-bold text-primary ring-1 ring-inset ring-primary/30 transition-colors hover:bg-primary/20"
          data-testid="guardar-trecho"
        >
          <Bookmark className="h-3.5 w-3.5" />
          {jaGuardado(criarCitacao(bookId, inicio, fim - inicio))
            ? "Guardado — usar em outra conversa"
            : "Guardar para usar em outra conversa"}
        </button>
      )}

      <p className="mt-2 text-[10.5px] leading-relaxed text-white/25">
        Arraste as pontas ou use os botões de 1 e 5 segundos. Máximo de{" "}
        {MAX_CITACAO_SEC}s.
      </p>
    </div>
  );
}

/**
 * O ajuste fino de uma ponta.
 *
 * Passos de 1 e 5 segundos, e não de 0,5: meio segundo não se percebe sem ouvir,
 * e daria a impressão de precisão que a tela não tem enquanto não houver áudio.
 */
function LinhaDeAjuste({
  rotulo,
  onEmpurrar,
}: {
  rotulo: string;
  onEmpurrar: (passo: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-11 shrink-0 text-[11px] text-white/40">{rotulo}</span>
      {[-5, -1, 1, 5].map((passo) => (
        <button
          key={passo}
          type="button"
          onClick={() => onEmpurrar(passo)}
          className="flex-1 rounded-md bg-white/[0.06] py-1.5 text-[11px] font-semibold text-white/60 transition-colors hover:bg-white/12 hover:text-white"
          data-testid={`ajuste-${rotulo.toLowerCase()}-${passo}`}
        >
          {passo > 0 ? `+${passo}` : passo}s
        </button>
      ))}
    </div>
  );
}
