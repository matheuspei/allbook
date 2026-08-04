import { useEffect, useState } from "react";
import { Compass, Sparkles, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import {
  CartaoDeEstreia,
  CartaoDoSeuClube,
  CartaoParaDescobrir,
  ConviteParaCriar,
  Pastilha,
} from "@/components/clube/CartoesDaTelaDeClubes";
import {
  CLUBES_EVENT,
  clubesParaDescobrir,
  estaComecando,
  estreiasParaDescobrir,
  meusClubes,
  type Clube,
} from "@/lib/clubes";

/**
 * As três páginas atrás das portas da tela de clubes (§4.99).
 *
 * Nasceram juntas com a reforma escolhida pelo Matheus na folha
 * `_clubes-B2.html`: *"esses quadradinhos em cima ajudam muito a organizar…
 * você sabe exatamente onde você está e para onde aquilo vai te levar"* — e
 * ele confirmou as três: *"a página dos meus, a página de estreia, a página
 * em aberto"*. Porta sem página atrás é o botão morto que a §4.23 varre.
 *
 * Moram num arquivo só pelo mesmo motivo de `RedeDaPessoa.tsx` (§4.94):
 * são páginas irmãs — a mesma estrutura, três recortes.
 */

/** Página irmã: cabeçalho + lista, com o evento de clubes mantendo tudo vivo. */
function usarClubes<T>(calcular: () => T): T {
  const [valor, setValor] = useState<T>(calcular);
  useEffect(() => {
    const atualizar = () => setValor(calcular());
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    return () => window.removeEventListener(CLUBES_EVENT, atualizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return valor;
}

/**
 * `/clubes/meus` — os seus, TODOS, pelo próximo compromisso.
 *
 * É a resposta ao defeito medido: dos 8 clubes dele, a tela antiga mostrava 3 e
 * escondia 5 atrás de "ver os outros". Aqui não há botão nenhum — a lista é
 * inteira, e a ordem é a data que importa (estreia usa o início, clube andando
 * usa o encontro).
 */
export default function MeusClubes() {
  const meus = usarClubes(meusClubes);

  const dataRelevante = (clube: Clube) =>
    estaComecando(clube) ? clube.ciclo.inicio : clube.ciclo.encontro;
  const ordenados = [...meus].sort((a, b) =>
    dataRelevante(a).localeCompare(dataRelevante(b)),
  );

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="meus-clubes-page">
      <PageHeader title={`Meus clubes · ${meus.length}`} fallback="/clubes" />

      <div className="space-y-3 px-5 pt-4">
        {ordenados.length === 0 ? (
          <div className="pt-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.06]">
              <Users className="h-7 w-7 text-white/40" />
            </div>
            <p className="mx-auto mt-4 max-w-[300px] text-sm leading-relaxed text-white/45">
              Você ainda não está em nenhum clube. Encontre um aberto ou crie o seu.
            </p>
          </div>
        ) : (
          ordenados.map((clube) => <CartaoDoSeuClube key={clube.id} clube={clube} />)
        )}

        <div className="pt-2">
          <ConviteParaCriar temClube={meus.length > 0} />
        </div>
      </div>
    </div>
  );
}

/**
 * `/clubes/estreias` — o que ainda vai começar e **não é seu**.
 *
 * A regra veio da primeira folha: estreia sua mora entre os seus, com a
 * etiqueta; esta vitrine é só onde dá para você entrar antes de todo mundo.
 * Grade, e não carrossel: numa página dedicada há espaço para ver todas.
 */
export function EstreiasDeClubes() {
  const estreias = usarClubes(estreiasParaDescobrir);

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="estreias-page">
      <PageHeader title={`Estreiam em breve · ${estreias.length}`} fallback="/clubes" />

      {estreias.length === 0 ? (
        <div className="pt-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.06]">
            <Sparkles className="h-7 w-7 text-white/40" />
          </div>
          <p className="mx-auto mt-4 max-w-[300px] text-sm leading-relaxed text-white/45">
            Nenhuma estreia por vir — por enquanto. Que tal criar a próxima?
          </p>
          <div className="px-5 pt-6 text-left">
            <ConviteParaCriar temClube />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 px-5 pt-4">
          {estreias.map((clube) => (
            <CartaoDeEstreia key={clube.id} clube={clube} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * `/clubes/abertos` — os clubes em andamento em que dá para entrar.
 *
 * As pastilhas de assunto vieram junto da tela antiga, mas **contadas sobre
 * esta lista** — uma pastilha que promete 6 e a página mostra 4 é porta que
 * mente (§4.23).
 */
export function ClubesAbertos() {
  const abertos = usarClubes(clubesParaDescobrir);
  const [topico, setTopico] = useState<string | undefined>(undefined);

  const topicos = Array.from(
    abertos.reduce((mapa, clube) => {
      mapa.set(clube.genero, (mapa.get(clube.genero) ?? 0) + 1);
      return mapa;
    }, new Map<string, number>()),
  )
    .map(([genero, total]) => ({ genero, total }))
    .sort((a, b) => b.total - a.total || a.genero.localeCompare(b.genero));

  const filtrados = topico ? abertos.filter((clube) => clube.genero === topico) : abertos;

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="abertos-page">
      <PageHeader title={`Clubes abertos · ${abertos.length}`} fallback="/clubes" />

      <div className="space-y-3 pt-4">
        {topicos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
            <Pastilha ligada={topico === undefined} onClick={() => setTopico(undefined)}>
              Todos
            </Pastilha>
            {topicos.map((item) => (
              <Pastilha
                key={item.genero}
                ligada={topico === item.genero}
                onClick={() => setTopico(topico === item.genero ? undefined : item.genero)}
              >
                {item.genero} · {item.total}
              </Pastilha>
            ))}
          </div>
        )}

        <div className="space-y-3 px-5">
          {filtrados.length === 0 ? (
            <div className="pt-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.06]">
                <Compass className="h-7 w-7 text-white/40" />
              </div>
              <p className="mx-auto mt-4 max-w-[300px] text-sm leading-relaxed text-white/45">
                Você já está em todos os clubes que existem. Que tal criar o próximo?
              </p>
            </div>
          ) : (
            filtrados.map((clube) => <CartaoParaDescobrir key={clube.id} clube={clube} />)
          )}

          <div className="pt-2">
            <ConviteParaCriar temClube />
          </div>
        </div>
      </div>
    </div>
  );
}
