import { useEffect } from "react";
import { X } from "lucide-react";

import AjustesDoPerfil from "@/components/perfil/AjustesDoPerfil";

/**
 * **O que o lápis do perfil abre** (§4.95).
 *
 * ---
 *
 * **A queixa** (01/08): *"tem recomendações, comentários, clubes, acompanhando.
 * Como é que eu faço pra editar isso aqui? Isso deveria estar no botão do
 * lapisinho… Hoje o lápis só abre a questão de você modificar o nome e a bio.
 * Não faz sentido isso."*
 *
 * Ele estava certo em duas coisas ao mesmo tempo: o lápis entregava **um terço**
 * do que promete (foto, nome e bio, com meia tela em branco embaixo), e o resto
 * — o que aparece na sua página — morava a **três toques** dali.
 *
 * **Por que folha, e não outra tela.** Editar o perfil é olhar para ele — uma
 * tela cheia esconde justamente o que se está ajustando. A folha sobe por cima,
 * e o que se liga aqui muda ali atrás (é o `SETTINGS_EVENT` que faz a página
 * reler sem recarregar). Mesma razão pela qual a caixa de compartilhar abre no
 * lugar (§4.58) e a lista de membros do clube não vira página (§4.59).
 *
 * ⚠️ **A folha não tem mais lista própria** (§4.105, 05/08). O conteúdo é
 * `AjustesDoPerfil`, a **mesma peça** que a tela `/privacidade` mostra — antes
 * cada lado tinha metade dos ajustes e uma placa apontando para o outro, e o
 * Matheus mandou juntar tudo numa lista só. Some daqui, por isso, a porta "Quem
 * pode me seguir": o interruptor de conta privada está na lista, logo abaixo.
 */
export default function FolhaDeEditarPerfil({ onFechar }: { onFechar: () => void }) {
  /* Esc fecha, como em todo painel do app. */
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" data-testid="folha-editar-perfil">
      <button
        onClick={onFechar}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Fechar"
      />

      <div className="relative max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-card pb-8">
        {/* O puxador, e o X para quem não arrasta. */}
        <div className="sticky top-0 z-10 bg-card px-5 pb-2 pt-2.5">
          <span className="mx-auto block h-1 w-9 rounded-full bg-white/20" />
          <div className="mt-2.5 flex items-center justify-between">
            <h2 className="font-display text-[17px] font-extrabold tracking-tight">
              Editar o seu perfil
            </h2>
            <button
              onClick={onFechar}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/50 transition-colors hover:text-white"
              aria-label="Fechar"
              data-testid="fechar-folha-perfil"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5">
          <AjustesDoPerfil />
        </div>
      </div>
    </div>
  );
}
