import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Três propostas de **abertura do app** — a vinheta visual da marca, no espírito
 * do "ta-dum" da Netflix e da abertura da HBO/Disney (pedido do Matheus, 26/07).
 *
 * Elas vivem juntas neste arquivo **de propósito**: é material de escolha. Assim
 * que ele escolher uma, as outras duas somem e a vencedora vira componente
 * próprio. Ver a tela de comparação em `pages/AberturaTeste.tsx`.
 *
 * Regras que as três seguem:
 * - Fundo `#141414` e laranja da marca — nada de cor nova.
 * - Fonte `font-display` (Outfit), a mesma do logotipo do TopNav.
 * - **Curtas.** Abertura que se assiste todo dia tem de durar ~2s; passar disso
 *   vira pedágio. Todas cabem em 2,2s.
 * - `onFim` avisa quando terminou, para o app seguir sozinho.
 */

const DURACAO_LOGO = 0.5;

/** O logotipo, igual ao do TopNav — as três aberturas terminam nele. */
function Logotipo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      <span className="text-primary">All</span>
      <span className="text-white">Book</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* A — A onda vira palavra                                             */
/* ------------------------------------------------------------------ */

/**
 * Barras de equalizador tocam, depois colapsam numa linha e o logotipo nasce
 * dela. É a que mais fala do produto: som virando livro.
 */
export function AberturaOnda({ onFim }: { onFim?: () => void }) {
  const [fase, setFase] = useState<"onda" | "logo">("onda");

  useEffect(() => {
    const t1 = setTimeout(() => setFase("logo"), 1000);
    const t2 = setTimeout(() => onFim?.(), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFim]);

  // Alturas fixas por barra: aleatório aqui deixaria a abertura diferente a cada
  // vez, e vinheta de marca tem de ser sempre igual.
  const barras = [26, 48, 72, 96, 72, 48, 26];

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#141414] overflow-hidden">
      {fase === "onda" ? (
        <div className="flex items-center gap-[6px]" aria-hidden="true">
          {barras.map((alturaBase, i) => (
            <motion.span
              key={i}
              /* `block` é obrigatório: `span` é inline, e em elemento inline o
                 navegador ignora width/height — a barra existia com 0 de altura
                 e a animação inteira ficava invisível (pego no teste, 26/07). */
              className="block w-[6px] rounded-full bg-gradient-to-b from-primary to-[#f59e0b]"
              initial={{ height: 8, opacity: 0 }}
              animate={{
                height: [8, alturaBase, alturaBase * 0.45, alturaBase * 0.95, 4],
                opacity: [0, 1, 1, 1, 0.9],
              }}
              transition={{
                duration: 1,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: "easeInOut",
                delay: i * 0.04,
              }}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURACAO_LOGO, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Logotipo className="text-4xl" />
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* B — A varredura de luz                                              */
/* ------------------------------------------------------------------ */

/**
 * O logotipo já está lá, apagado; uma faixa de luz o atravessa e ele acende por
 * onde ela passa. É a mais próxima da linguagem Netflix — e a mais discreta.
 */
export function AberturaVarredura({ onFim }: { onFim?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onFim?.(), 2200);
    return () => clearTimeout(t);
  }, [onFim]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#141414] overflow-hidden">
      <motion.div
        className="relative"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Camada apagada: o logo existe desde o primeiro quadro, só sem luz. */}
        <Logotipo className="text-4xl opacity-100 [&>span]:!text-white/[0.08]" />

        {/* Camada acesa, revelada da esquerda para a direita. */}
        <motion.div
          className="absolute inset-0 flex items-center"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <Logotipo className="text-4xl whitespace-nowrap" />
        </motion.div>

        {/* A faixa de luz que viaja junto com a borda da revelação. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-6 w-16 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-md"
          initial={{ left: "-20%", opacity: 0 }}
          animate={{ left: ["-20%", "105%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.05, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* C — O marcador de página                                            */
/* ------------------------------------------------------------------ */

/**
 * Um marcador de página desce, pousa, e a palavra se abre a partir dele. É a que
 * fala de livro — e o marcador já é o símbolo da Biblioteca no menu de baixo,
 * então a abertura estreia um desenho que a pessoa vai reencontrar dentro do app.
 */
export function AberturaMarcador({ onFim }: { onFim?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onFim?.(), 2200);
    return () => clearTimeout(t);
  }, [onFim]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#141414] overflow-hidden">
      <div className="flex items-center gap-3">
        {/* O marcador: retângulo com o V recortado embaixo, em CSS puro. */}
        <motion.span
          aria-hidden="true"
          className="block h-12 w-8 shrink-0 bg-gradient-to-b from-primary to-[#f59e0b]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)" }}
          initial={{ y: -140, opacity: 0, rotate: -8 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />

        {/* A palavra sai de trás do marcador, empurrada por ele. */}
        <motion.div
          className="overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logotipo className="block whitespace-nowrap text-4xl" />
        </motion.div>
      </div>
    </div>
  );
}
