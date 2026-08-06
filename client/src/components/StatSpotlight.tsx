import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { formatarDuracao } from "@/lib/listening";
import type { ResumoDeAudicao } from "@/lib/stats";

/**
 * Painel que abre quando se toca num número do Perfil ou das Estatísticas.
 *
 * A ideia é que o número não fique parado: ele sobe contando do zero, e cada
 * métrica traz uma visualização própria — a barra rumo às 100 horas (que é a
 * conquista "Centenário"), os 21 dias da sequência acendendo em cascata, e
 * assim por diante. A animação serve para explicar o número, não para enfeitar.
 *
 * **Os números vêm de fora, e são reais.** Até 25/07 cada detalhe daqui tinha
 * o próprio valor escrito no código (47 horas, 3 semanas, 5 títulos, 2
 * concluídos) — e eles não batiam nem com o Perfil nem com a Biblioteca. Agora
 * quem abre o painel passa o `resumo` calculado por `lib/stats.ts`, a mesma
 * fonte das duas telas.
 */

export type StatKey = "horas" | "titulos" | "sequencia" | "concluidos";

/**
 * Conta de 0 até `to` enquanto o painel abre.
 *
 * Feito com requestAnimationFrame em vez do `animate` do framer-motion: a
 * primeira versão usava aquela API e o número ficava parado no zero.
 */
function useCountUp(to: number, duration = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Quem pediu menos movimento no sistema vê o número direto.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Aba oculta congela o requestAnimationFrame: sem isto o número ficaria
    // preso no zero até a pessoa voltar para a aba.
    if (prefersReducedMotion || document.visibilityState === "hidden") {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();

    // easeOutQuint — sobe rápido e desacelera no fim.
    const ease = (t: number) => 1 - Math.pow(1 - t, 5);

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setValue(to * ease(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    // Rede de segurança: se os quadros pararem no meio do caminho (a pessoa
    // trocou de aba), o número ainda termina no valor certo.
    const safety = window.setTimeout(() => setValue(to), duration + 250);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(safety);
    };
  }, [to, duration]);

  return Math.round(value);
}

function BigNumber({ value, suffix, caption }: { value: number; suffix?: string; caption: string }) {
  const counted = useCountUp(value);

  return (
    <div className="text-center">
      <p className="font-display font-bold text-6xl tracking-tight text-white leading-none">
        {counted}
        {suffix && <span className="text-3xl text-white/50 ml-1">{suffix}</span>}
      </p>
      <p className="text-sm text-white/40 mt-3">{caption}</p>
    </div>
  );
}

/** Horas: barra crescendo rumo às 100h da conquista "Centenário". */
function HorasDetail({ resumo }: { resumo: ResumoDeAudicao }) {
  const goal = 100;
  const current = Math.round(resumo.segundos / 3600);
  // Um audiolivro médio tem umas 8 horas — é a régua para traduzir o total.
  const emLivros = Math.floor(resumo.segundos / (8 * 3600));

  return (
    <div className="space-y-8">
      <BigNumber value={current} suffix="h" caption="ouvidas desde que você começou" />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-white/40">Rumo a "Centenário"</span>
          <span className="text-white/60 font-medium">{current} de {goal}h</span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((current / goal) * 100, 100)}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          {current >= goal ? (
            <>
              Conquista <span className="text-white/70 font-medium">destravada</span> — você passou
              das 100 horas.
            </>
          ) : (
            <>
              Faltam <span className="text-white/70 font-medium">{goal - current} horas</span> para
              destravar a conquista.
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { value: `≈ ${(resumo.segundos / 86400).toFixed(1)} dias`, label: "ouvindo sem parar" },
          { value: `≈ ${emLivros}`, label: "audiolivros de 8h" },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="rounded-xl border border-white/10 p-3 text-center"
          >
            <p className="font-display font-bold text-base">{item.value}</p>
            <p className="text-[11px] text-white/40 mt-1 leading-tight">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Sequência: 21 dias acendendo um a um, em cascata. */
function SequenciaDetail({ resumo }: { resumo: ResumoDeAudicao }) {
  const days = resumo.ultimos21.length;
  // Os dias em que houve audição — o resto fica apagado.
  const listened = new Set(
    resumo.ultimos21.flatMap((ouviu, indice) => (ouviu ? [indice] : []))
  );

  return (
    <div className="space-y-8">
      <BigNumber
        value={resumo.sequenciaDias}
        caption={resumo.sequenciaDias === 1 ? "dia seguido ouvindo" : "dias seguidos ouvindo"}
      />

      <div className="space-y-3">
        <p className="text-xs text-white/40">Últimos 21 dias</p>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: days }, (_, i) => (
            <motion.div
              key={i}
              className={`aspect-square rounded-[4px] ${
                listened.has(i) ? "bg-primary" : "bg-white/[0.07]"
              }`}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: listened.has(i) ? 1 : 0.5, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.035, type: "spring", stiffness: 300, damping: 20 }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/30 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-primary" /> ouviu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-white/[0.07]" /> não ouviu
          </span>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-white/40 leading-relaxed"
      >
        {resumo.melhorSequencia > resumo.sequenciaDias ? (
          <>
            Seu recorde é de{" "}
            <span className="text-white/70 font-medium">{resumo.melhorSequencia} dias</span> — dá
            para bater.
          </>
        ) : (
          <>
            Ouça <span className="text-white/70 font-medium">alguns minutos hoje</span> para manter
            a sequência viva.
          </>
        )}
      </motion.p>
    </div>
  );
}

/** Títulos: progresso rumo à meta do ano. */
function TitulosDetail({ resumo }: { resumo: ResumoDeAudicao }) {
  const goal = 12;
  const current = Math.min(resumo.titulosComecados, goal);

  return (
    <div className="space-y-8">
      <BigNumber value={resumo.titulosComecados} caption="títulos que você começou" />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-white/40">Meta do ano</span>
          <span className="text-white/60 font-medium">{current} de {goal}</span>
        </div>

        <div className="flex gap-1.5">
          {Array.from({ length: goal }, (_, i) => (
            <motion.div
              key={i}
              className={`h-8 flex-1 rounded ${i < current ? "bg-primary" : "bg-white/[0.07]"}`}
              initial={{ scaleY: 0.2, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
            />
          ))}
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Você tem <span className="text-white/70 font-medium">{resumo.naLista}</span> na sua lista e
          já ouviu <span className="text-white/70 font-medium">{formatarDuracao(resumo.segundos)}</span>{" "}
          no total.
        </p>
      </div>
    </div>
  );
}

/** Concluídos: anel de progresso desenhando. */
function ConcluidosDetail({ resumo }: { resumo: ResumoDeAudicao }) {
  const started = resumo.titulosComecados;
  const finished = resumo.concluidos;
  const ratio = started > 0 ? finished / started : 0;

  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - ratio) }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display font-bold text-4xl leading-none">{finished}</p>
            <p className="text-[11px] text-white/40 mt-1">de {started}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/40 text-center">
        {started === 0 ? (
          "Nenhum livro começado ainda."
        ) : (
          <>
            Você termina{" "}
            <span className="text-white/70 font-medium">{Math.round(ratio * 100)}%</span> do que
            começa.
          </>
        )}
      </p>

      {started - finished > 0 && (
        <p className="text-xs text-white/40 leading-relaxed text-center">
          {started - finished === 1
            ? "Um título ficou pelo caminho. Que tal retomar?"
            : `${started - finished} títulos ficaram pelo caminho. Que tal retomar um deles?`}
        </p>
      )}
    </div>
  );
}

const details: Record<StatKey, { title: string; render: (resumo: ResumoDeAudicao) => ReactNode }> = {
  horas: { title: "Horas ouvidas", render: (resumo) => <HorasDetail resumo={resumo} /> },
  titulos: { title: "Títulos", render: (resumo) => <TitulosDetail resumo={resumo} /> },
  sequencia: { title: "Sequência", render: (resumo) => <SequenciaDetail resumo={resumo} /> },
  concluidos: { title: "Concluídos", render: (resumo) => <ConcluidosDetail resumo={resumo} /> },
};

export default function StatSpotlight({
  stat,
  onClose,
  resumo,
}: {
  stat: StatKey | null;
  onClose: () => void;
  /** Os números reais, calculados por `lib/stats.ts`. */
  resumo: ResumoDeAudicao;
}) {
  // Trava a rolagem do fundo enquanto o painel está aberto.
  useEffect(() => {
    if (!stat) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [stat]);

  // Fechar com Esc, para quem estiver no computador.
  useEffect(() => {
    if (!stat) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stat, onClose]);

  // Quem pediu menos movimento no sistema recebe o painel já posicionado, em
  // vez de vê-lo deslizar de baixo.
  const reduceMotion = useReducedMotion();
  const detail = stat ? details[stat] : null;

  return (
    <AnimatePresence>
      {stat && detail && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-testid="stat-spotlight"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-md bg-card rounded-t-2xl border-t border-white/10 px-6 pt-5 pb-10"
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between mb-7">
              <h2 className="font-display font-bold text-base tracking-tight">{detail.title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 text-white/40 hover:text-white transition-colors"
                aria-label="Fechar"
                data-testid="button-close-spotlight"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detail.render(resumo)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
