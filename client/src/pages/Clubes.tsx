import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import PortasDoPerfil from "@/components/PortasDoPerfil";
import {
  CartaoComMotivo,
  CartaoParaDescobrir,
  ConviteParaCriar,
  LinhaDeAgenda,
  Secao,
} from "@/components/clube/CartoesDaTelaDeClubes";
import {
  CLUBES_EVENT,
  buscarClubes,
  clubesParaDescobrir,
  clubesParaVoce,
  estaComecando,
  estreiasParaDescobrir,
  meusClubes,
  todosOsClubes,
  type Clube,
  type ClubeComMotivo,
} from "@/lib/clubes";
import { MURAL_EVENT } from "@/lib/muralDoClube";

/**
 * A tela dos clubes — **reformada em 04/08 pela escolha do Matheus** (§4.99).
 *
 * **A queixa que derrubou a versão anterior:** *"eu estou em 8 clubes e ele
 * está muito confuso: o que é meus clubes, o que é encontrar um clube"*. A
 * medição deu razão — 3 telas de rolagem numa lista só, 5 dos 8 clubes dele
 * escondidos atrás de "ver os outros", e dois clubes seus aparecendo DUAS
 * VEZES (entre os seus e no carrossel de estreias).
 *
 * **O desenho é o M3 da folha `_clubes-B2.html`, escolhido por ele:** as
 * portas com número do perfil, trazidas para cá — *"esses quadradinhos aqui em
 * cima ajudam muito a organizar… você sabe exatamente onde você está e para
 * onde aquilo vai te levar"*. Cada porta abre a sua página
 * (`/clubes/meus`, `/clubes/estreias`, `/clubes/abertos`).
 *
 * **As regras da primeira folha, todas dele:**
 * - **a busca no topo** — *"não existe botão de busca em canto inferior"*;
 * - a estreia sua mora **entre os seus**, com etiqueta; a vitrine de estreias
 *   exclui os seus (mata a duplicata);
 * - **"Para você"**: clubes abertos com o motivo escrito;
 * - nada de "ver os outros 5": os 8 inteiros moram na página da porta.
 *
 * A tela principal ficou com o **agora**: os encontros mais próximos e as
 * sugestões — o resto tem casa própria atrás de cada número.
 */
export default function Clubes() {
  const [meus, setMeus] = useState<Clube[]>(() => meusClubes());
  const [estreias, setEstreias] = useState<Clube[]>(() => estreiasParaDescobrir());
  const [abertos, setAbertos] = useState<Clube[]>(() => clubesParaDescobrir());
  const [paraVoce, setParaVoce] = useState<ClubeComMotivo[]>(() => clubesParaVoce());
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const atualizar = () => {
      setMeus(meusClubes());
      setEstreias(estreiasParaDescobrir());
      setAbertos(clubesParaDescobrir());
      setParaVoce(clubesParaVoce());
    };
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(CLUBES_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, []);

  const procurando = busca.trim().length > 0;
  /* Procurando, a busca varre TUDO — os seus, as estreias, os abertos. Quem
     digita "Duna" quer o clube de Duna, não quer saber em que gaveta ele está. */
  const resultados = procurando ? buscarClubes(todosOsClubes(), busca) : [];

  /**
   * "Próximos encontros": os 5 clubes seus que precisam de você antes, em
   * **linhas finas de agenda** — a correção do Matheus em 04/08, resgatando a
   * proposta B da folha 1: *"tinha uma fileirinha dos próximos encontros… o dia
   * estava bem mais bonito"*. A linha fina é o que deixa 5 caberem onde 3
   * cartões gordos estufavam. A data que conta é a **relevante** — estreia usa
   * o início (é quando ela vira compromisso), clube andando usa o encontro.
   */
  const dataRelevante = (clube: Clube) =>
    estaComecando(clube) ? clube.ciclo.inicio : clube.ciclo.encontro;
  const urgentes = [...meus]
    .sort((a, b) => dataRelevante(a).localeCompare(dataRelevante(b)))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="clubes-page">
      <PageHeader title="Clubes" fallback="/community" />

      <div className="space-y-7 pt-4">
        {/* A busca é a primeira coisa da tela — regra ditada por ele na folha:
            "não existe botão de busca em canto inferior… a busca sempre está
            no topo". */}
        <div className="px-5">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3.5 py-2.5 ring-1 ring-inset ring-white/8 focus-within:ring-primary/40">
            <Search className="h-4 w-4 shrink-0 text-white/30" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome do clube, livro ou autor"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
              data-testid="busca-clubes"
            />
            {busca.length > 0 && (
              <button
                onClick={() => setBusca("")}
                className="shrink-0 rounded-full p-0.5 text-white/30 transition-colors hover:text-white/70"
                aria-label="Limpar a busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {procurando ? (
          <div className="space-y-3 px-5">
            {resultados.length === 0 ? (
              <p className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-5 text-center text-xs leading-relaxed text-white/45">
                Nenhum clube para <b className="text-white/75">{busca.trim()}</b>.
                <br />
                Ninguém está lendo isso junto ainda — dá para você começar.
              </p>
            ) : (
              <>
                <p className="text-[11px] text-white/35" data-testid="contagem-resultados">
                  {resultados.length} {resultados.length === 1 ? "clube" : "clubes"}
                </p>
                {resultados.map((clube) => (
                  <CartaoParaDescobrir key={clube.id} clube={clube} />
                ))}
              </>
            )}
          </div>
        ) : (
          <>
            {/*
              **As portas com número** — o mesmo componente do perfil, e isso é
              decisão: duas cópias divergem (§4.41). Cada número é o que a
              página atrás dele mostra, senão a porta mente (§4.23) — por isso
              "estreias" conta só as que NÃO são suas.
            */}
            <PortasDoPerfil
              portas={[
                {
                  rotulo: meus.length === 1 ? "meu clube" : "meus clubes",
                  total: meus.length,
                  href: "/clubes/meus",
                  testid: "porta-meus-clubes",
                },
                {
                  rotulo: estreias.length === 1 ? "estreia" : "estreias",
                  total: estreias.length,
                  href: "/clubes/estreias",
                  testid: "porta-estreias",
                },
                {
                  rotulo: abertos.length === 1 ? "aberto" : "abertos",
                  total: abertos.length,
                  href: "/clubes/abertos",
                  testid: "porta-abertos",
                },
              ]}
            />

            {/* O agora: os clubes seus que precisam de você antes. Os 8
                inteiros moram na porta — aqui é urgência, não inventário. */}
            {urgentes.length > 0 && (
              <Secao titulo="Próximos encontros">
                <div className="space-y-2 px-5">
                  {urgentes.map((clube) => (
                    <LinhaDeAgenda key={clube.id} clube={clube} />
                  ))}
                </div>
              </Secao>
            )}

            {/* Sugestão com motivo — some quando não há nada a sugerir, em vez
                de título com vazio embaixo (§4.23). */}
            {paraVoce.length > 0 && (
              <Secao titulo="Para você">
                <div className="space-y-2.5 px-5">
                  {paraVoce.map((sugestao) => (
                    <CartaoComMotivo key={sugestao.clube.id} sugestao={sugestao} />
                  ))}
                </div>
              </Secao>
            )}

            <div className="px-5">
              <ConviteParaCriar temClube={meus.length > 0} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
