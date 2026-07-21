import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Painel que abre quando se toca num número do Perfil.
 *
 * A ideia é que o número não fique parado: ele sobe contando do zero, e cada
 * métrica traz uma visualização própria — a barra rumo às 100 horas (que é a
 * conquista "Centenário"), os 21 dias da sequência acendendo em cascata, e
 * assim por diante. A animação serve para explicar o número, não para enfeitar.
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
function HorasDetail() {
  const goal = 100;
  const current = 47;

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
            animate={{ width: `${(current / goal) * 100}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Faltam <span className="text-white/70 font-medium">{goal - current} horas</span> para
          destravar a conquista.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "≈ 2 dias", label: "ouvindo sem parar" },
          { value: "≈ 9", label: "audiolivros inteiros" },
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
function SequenciaDetail() {
  const days = 21;
  // Os dias em que houve audição — o resto fica apagado.
  const listened = new Set([0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20]);

  return (
    <div className="space-y-8">
      <BigNumber value={3} caption="semanas seguidas sem falhar" />

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
        Ouça <span className="text-white/70 font-medium">15 minutos hoje</span> para manter a
        sequência viva.
      </motion.p>
    </div>
  );
}

/** Títulos: progresso rumo à meta do ano. */
function TitulosDetail() {
  const goal = 12;
  const current = 5;

  return (
    <div className="space-y-8">
      <BigNumber value={current} caption="títulos começados este ano" />

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
          No ritmo atual você fecha o ano com{" "}
          <span className="text-white/70 font-medium">cerca de 10 títulos</span>.
        </p>
      </div>
    </div>
  );
}

/** Concluídos: anel de progresso desenhando. */
function ConcluidosDetail() {
  const started = 5;
  const finished = 2;
  const ratio = finished / started;

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
        Você termina{" "}
        <span className="text-white/70 font-medium">{Math.round(ratio * 100)}%</span> do que começa.
      </p>

      <p className="text-xs text-white/40 leading-relaxed text-center">
        Três títulos ficaram pelo caminho. Que tal retomar um deles?
      </p>
    </div>
  );
}

const details: Record<StatKey, { title: string; render: () => ReactNode }> = {
  horas: { title: "Horas ouvidas", render: () => <HorasDetail /> },
  titulos: { title: "Títulos", render: () => <TitulosDetail /> },
  sequencia: { title: "Sequência", render: () => <SequenciaDetail /> },
  concluidos: { title: "Concluídos", render: () => <ConcluidosDetail /> },
};

export default function StatSpotlight({
  stat,
  onClose,
}: {
  stat: StatKey | null;
  onClose: () => void;
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
            className="relative w-full max-w-md bg-[#1c1c1c] rounded-t-2xl border-t border-white/10 px-6 pt-5 pb-10"
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

            {detail.render()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
