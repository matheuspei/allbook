import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkPlus, Car, Timer } from "lucide-react";

/**
 * A barra de ações do tocador — velocidade, modo carro, temporizador, marcar e
 * a lista de marcações.
 *
 * **Por que ela virou um componente (26/07).** Do jeito anterior o Matheus não
 * achava o botão de marcação, e com razão. Três defeitos somados:
 *
 * 1. **Contraste**: ícone a 50% de branco e rótulo de 9px a 40% sobre o preto
 *    `#141414`. Numa captura de tela os três primeiros botões praticamente
 *    sumiam — só o quarto era legível, e por acaso.
 * 2. **Alvo pequeno**: ícone de 20px sem área de toque própria. Bom mouse,
 *    péssimo polegar.
 * 3. **A lista escondida**: as marcações só abriam pelo menu de "…", ou por um
 *    **toque longo** que ninguém adivinha. Guardar sem poder rever é guardar no
 *    lixo.
 *
 * Agora cada ação é um alvo de verdade (44px de altura, o mínimo de toque),
 * legível, e **"Marcações" ganha lugar próprio na barra assim que existe a
 * primeira** — o acesso nasce junto com o conteúdo, em vez de ficar atrás de um
 * gesto secreto.
 */

function Acao({
  icone,
  rotulo,
  onClick,
  destaque,
  contador,
  testid,
}: {
  icone: React.ReactNode;
  rotulo: string;
  onClick: () => void;
  /** Ação em curso (temporizador ligado) ou principal — fica na cor da marca. */
  destaque?: boolean;
  contador?: number;
  testid: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors active:bg-white/10 ${
        destaque ? "text-primary" : "text-white/75 hover:bg-white/[0.06] hover:text-white"
      }`}
      data-testid={testid}
    >
      <span className="relative grid h-6 w-6 place-items-center">
        {icone}
        {contador !== undefined && contador > 0 && (
          <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-black">
            {contador}
          </span>
        )}
      </span>
      {/*
        10px em vez de 9, e branco a 60% em vez de 40%: o rótulo antigo era
        legível no desenho e invisível no telefone.
      */}
      <span className="w-full truncate text-center text-[10px] font-semibold uppercase tracking-tight text-white/60">
        {rotulo}
      </span>
    </button>
  );
}

export default function BarraDeAcoesDoPlayer({
  velocidade,
  temporizadorLigado,
  totalDeMarcacoes,
  onVelocidade,
  onModoCarro,
  onTemporizador,
  onMarcar,
  onVerMarcacoes,
}: {
  velocidade: number;
  temporizadorLigado: boolean;
  totalDeMarcacoes: number;
  onVelocidade: () => void;
  onModoCarro: () => void;
  onTemporizador: () => void;
  /** Guarda o ponto atual. Devolve se a marcação era nova. */
  onMarcar: () => boolean;
  onVerMarcacoes: () => void;
}) {
  /*
   * O pulo do ícone ao salvar. O aviso de toast já existia, mas ele nasce no
   * topo da tela, longe do dedo — a pessoa tocava aqui embaixo e nada mudava
   * *aqui embaixo*. Este é o retorno no lugar onde o toque aconteceu.
   */
  const [pulou, setPulou] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function marcar() {
    const nova = onMarcar();
    if (!nova) return;
    setPulou(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPulou(false), 450);
  }

  /*
   * `relative z-10` não é enfeite — **sem isso a barra inteira fica invisível**.
   *
   * O player pinta um degradê sobre a capa de fundo (`absolute inset-0`, que
   * termina em `#141414` opaco) e esse degradê cobre a tela toda. Pela ordem de
   * pintura do navegador, um elemento **posicionado** vai por cima de todo
   * conteúdo não posicionado — mesmo do que vem depois no HTML. Resultado: os
   * rótulos e ícones daqui eram desenhados **por baixo** do degradê.
   *
   * Foi exatamente o defeito que o Matheus relatou como "o botão está escondido"
   * (26/07). A pista estava à vista: das quatro ações antigas, só a de marcação
   * aparecia — e era a única que tinha ganhado um `relative` solto, por acaso,
   * na mudança anterior.
   */
  return (
    <footer className="relative z-10 flex shrink-0 items-stretch gap-1 px-3 pb-6 pt-2">
      <Acao
        testid="action-speed"
        icone={
          <span className="text-[13px] font-bold leading-none">
            {velocidade.toFixed(2).replace(".", ",")}x
          </span>
        }
        rotulo="Velocidade"
        onClick={onVelocidade}
      />
      <Acao testid="action-car" icone={<Car className="h-5 w-5" />} rotulo="Carro" onClick={onModoCarro} />
      <Acao
        testid="action-timer"
        icone={<Timer className="h-5 w-5" />}
        rotulo="Soneca"
        onClick={onTemporizador}
        destaque={temporizadorLigado}
      />

      {/* Marcar é a ação principal da barra: ícone com o "+" explícito. */}
      <Acao
        testid="button-add-bookmark"
        icone={
          <BookmarkPlus
            className={`h-5 w-5 transition-transform duration-200 ${pulou ? "scale-125" : "scale-100"}`}
          />
        }
        rotulo="Marcar"
        onClick={marcar}
        destaque={pulou}
      />

      {/*
        Só aparece quando há o que ver. Um botão "Marcações (0)" seria um beco
        sem saída, e some da barra o espaço que os outros quatro precisam.
      */}
      {totalDeMarcacoes > 0 && (
        <Acao
          testid="action-bookmarks"
          icone={<Bookmark className="h-5 w-5 fill-current" />}
          rotulo="Minhas"
          onClick={onVerMarcacoes}
          contador={totalDeMarcacoes}
        />
      )}
    </footer>
  );
}
