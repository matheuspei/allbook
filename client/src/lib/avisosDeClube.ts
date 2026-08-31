/**
 * Os avisos de clube — prazo de marco, encontro, rodada e votação.
 *
 * **São calculados, não guardados.** Um aviso de prazo não é um acontecimento
 * ("fulano respondeu você"), é um **estado**: "faltam dois dias para o capítulo
 * 6 e você está no 4". Guardar isso no `localStorage` exigiria um agendador
 * para criar e apagar cada linha, e produziria aviso velho — "faltam 3 dias"
 * mostrado uma semana depois. Derivar na hora nunca mente.
 *
 * **Por isso eles não acendem o sino.** O contador do TopNav conta o que tem
 * estado de *lido*; um aviso derivado não tem — ficaria aceso o ciclo inteiro,
 * e sino sempre aceso deixa de ser sinal. Eles aparecem na tela de
 * notificações, no topo, onde a pessoa vai justamente ver o que precisa da
 * atenção dela.
 *
 * A régua do que **merece** virar aviso é curta de propósito: só o que tem
 * prazo e ainda dá para resolver.
 */

import { livroPorId } from "@/lib/books";
import {
  capituloDaRoda,
  diasAte,
  marcoAtual,
  meuCapitulo,
  meusClubes,
  type Clube,
} from "@/lib/clubes";
import { meuVoto, minhaResposta, rodadaAberta, votacaoDoClube } from "@/lib/rodadas";

export interface AvisoDeClube {
  id: string;
  clubeId: string;
  clube: string;
  texto: string;
  /** Quanto falta, em dias — usado para ordenar do mais urgente ao menos. */
  dias: number;
  tipo: "marco" | "encontro" | "rodada" | "votacao";
}

/** A janela em que um prazo passa a merecer aviso. Antes disso é ansiedade. */
const JANELA_DE_AVISO = 3;

export function avisosDeClube(): AvisoDeClube[] {
  const avisos: AvisoDeClube[] = [];

  for (const clube of meusClubes()) {
    avisos.push(...avisosDoClube(clube));
  }

  return avisos.sort((a, b) => a.dias - b.dias);
}

function avisosDoClube(clube: Clube): AvisoDeClube[] {
  const avisos: AvisoDeClube[] = [];
  const livro = livroPorId(clube.ciclo.bookId);

  /*
   * Marco: só avisa quem está **atrasado**. Quem já passou do capítulo
   * combinado não precisa de lembrete — receberia uma cobrança sem motivo, que
   * é o caminho mais curto para desligar as notificações do app.
   */
  const marco = marcoAtual(clube);
  if (marco) {
    const faltam = diasAte(marco.prazo);
    const meu = meuCapitulo(clube);
    if (faltam >= 0 && faltam <= JANELA_DE_AVISO && meu < marco.chapter) {
      avisos.push({
        id: `${clube.id}-marco-${marco.id}`,
        clubeId: clube.id,
        clube: clube.nome,
        dias: faltam,
        tipo: "marco",
        texto:
          faltam === 0
            ? `Hoje é o prazo do capítulo ${marco.chapter}${
                livro ? ` de ${livro.title}` : ""
              } — você está no ${meu || 1}.`
            : `Faltam ${faltam} ${faltam === 1 ? "dia" : "dias"} para o capítulo ${
                marco.chapter
              } — você está no ${meu || 1}, e a roda no ${capituloDaRoda(clube)}.`,
      });
    }
  }

  const paraOEncontro = diasAte(clube.ciclo.encontro);
  if (paraOEncontro >= 0 && paraOEncontro <= JANELA_DE_AVISO) {
    avisos.push({
      id: `${clube.id}-encontro`,
      clubeId: clube.id,
      clube: clube.nome,
      dias: paraOEncontro,
      tipo: "encontro",
      texto:
        paraOEncontro === 0
          ? "O encontro do ciclo é hoje."
          : `O encontro do ciclo é ${paraOEncontro === 1 ? "amanhã" : `em ${paraOEncontro} dias`}.`,
    });
  }

  // Rodada: só se você ainda não respondeu — quem respondeu já fez a parte dele.
  const rodada = rodadaAberta(clube.id);
  if (rodada && !minhaResposta(rodada.id)) {
    const faltam = diasAte(rodada.fecha);
    if (faltam >= 0 && faltam <= JANELA_DE_AVISO) {
      avisos.push({
        id: `${clube.id}-rodada-${rodada.id}`,
        clubeId: clube.id,
        clube: clube.nome,
        dias: faltam,
        tipo: "rodada",
        texto: `A rodada "${
          rodada.pergunta.length > 60 ? `${rodada.pergunta.slice(0, 60)}…` : rodada.pergunta
        }" ${faltam === 0 ? "fecha hoje" : faltam === 1 ? "fecha amanhã" : `fecha em ${faltam} dias`} e você não respondeu.`,
      });
    }
  }

  // Votação: idem — só para quem ainda não votou.
  const votacao = votacaoDoClube(clube.id);
  if (votacao && meuVoto(clube.id) === undefined) {
    const faltam = diasAte(votacao.fecha);
    if (faltam >= 0 && faltam <= JANELA_DE_AVISO) {
      avisos.push({
        id: `${clube.id}-votacao`,
        clubeId: clube.id,
        clube: clube.nome,
        dias: faltam,
        tipo: "votacao",
        texto: `A votação do próximo livro ${
          faltam === 0 ? "fecha hoje" : `fecha em ${faltam} ${faltam === 1 ? "dia" : "dias"}`
        } e você ainda não votou.`,
      });
    }
  }

  return avisos;
}
