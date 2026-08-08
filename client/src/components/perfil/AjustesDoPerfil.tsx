import { useEffect, useState } from "react";
import {
  Bell,
  BookHeart,
  Headphones,
  Lock,
  MessageSquare,
  Radio,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Cartao, Interruptor, Porta, Titulo } from "@/components/perfil/PecasDeAjuste";
import { useToast } from "@/hooks/use-toast";
import { readSettings, saveSettings, type Settings } from "@/lib/settings";

/**
 * **Todos os ajustes do seu perfil, numa lista só** (§4.105).
 *
 * ---
 *
 * **A queixa** (05/08): *"quando a gente clica nas configurações e vê na
 * privacidade, a gente tem conta privada, e aqui tem um problema: o que aparece
 * na sua página — a gente clica e a gente vai para outro menu, para outra
 * página, para outra coisa. Isso não faz muito sentido. O que poderia ser feito
 * é colocar todo esse botão do editar perfil nas configurações normais… ele
 * passa para o botão de privacidade e a gente faz uma única lista, descendo de
 * cima até embaixo, de todas essas coisas."*
 *
 * Ele está certo, e o defeito era **circular**: a tela de Privacidade tinha uma
 * placa que mandava para o lápis do perfil, e o lápis tinha uma porta que
 * mandava de volta para a Privacidade. Quem procurava um interruptor pingava de
 * um lado para o outro sem nunca ver a lista inteira.
 *
 * **Por que não foi só "trazer os interruptores de volta".** Seria desfazer a
 * §4.95, que é decisão dele de 01/08: *"como é que eu faço pra editar isso
 * aqui? Isso deveria estar no botão do lapisinho"*. O lápis voltaria a entregar
 * um terço do que promete — exatamente o que ele reprovou.
 *
 * **A saída: uma peça só, em dois pontos de entrada.** Este arquivo é a lista
 * inteira; a tela `/privacidade` a mostra por inteiro, e a folha do lápis mostra
 * a mesma. Não é controle duplicado — é o **mesmo** controle, lendo e gravando
 * no mesmo `settings`. Placa apontando para o outro lado não existe mais em
 * lugar nenhum.
 *
 * **A ordem da lista tem razão:** quem você é (o que se escreve, e por isso abre
 * página) → o que a sua página mostra → quem pode te seguir. Vai do mais visível
 * ao mais silencioso.
 *
 * **O que liga/desliga fica aqui; o que se escreve abre página** (regra da
 * §4.95, mantida). Interruptor é um toque de efeito imediato; foto, bio e
 * recomendação são formulários, e formulário quer tela.
 *
 * ⚠️ **"Quando me avisar" saiu daqui em 08/08** (§4.117) e virou a tela
 * `/avisos`, aberta pela linha **Notificações** das Configurações. O comentário
 * que morava neste arquivo já admitia o desconforto — *"não é privacidade e sim
 * barulho"* —, e a linha "Notificações" precisava de um destino que fosse
 * ajuste, não a caixa do sino. **Não traga os dois interruptores de volta:**
 * copiar controle em dois lugares é a redundância que a §4.105 varreu.
 */
export default function AjustesDoPerfil() {
  const { toast } = useToast();
  const [ajustes, setAjustes] = useState<Settings>(readSettings);

  useEffect(() => {
    setAjustes(readSettings());
  }, []);

  /*
   * Grava a partir do armazenamento, e não do estado da tela: dois toques no
   * mesmo instante com base no estado antigo faziam o segundo desfazer o
   * primeiro. Cuidado herdado das duas telas que esta peça substituiu.
   */
  function alternar(chave: keyof Settings, ligado: boolean) {
    const proximo = { ...readSettings(), [chave]: ligado };
    setAjustes(proximo);
    saveSettings(proximo);
  }

  return (
    <>
      <Titulo>Quem você é</Titulo>
      <Porta
        icone={UserRound}
        titulo="Foto, nome e bio"
        apoio="O que abre a sua página"
        href="/profile/edit"
        testid="porta-foto-nome-bio"
      />
      {/* **"O que eu recomendo" não tem interruptor**, e é decisão dele (§4.55):
          *"já que ela está recomendando, ela quer que as pessoas vejam"*.
          Recomendar é ato deliberadamente público — esconder desfaria o gesto.
          Por isso a recomendação está aqui como **conteúdo para editar**, e não
          como algo para apagar. */}
      <Porta
        icone={BookHeart}
        titulo="Minhas recomendações"
        apoio="Os livros que você indica, com o motivo"
        href="/profile/recommendations"
        testid="porta-editar-recomendacoes"
      />

      <Titulo>O que aparece na sua página</Titulo>
      <Cartao>
        <Interruptor
          icone={Headphones}
          titulo="O que estou ouvindo"
          apoio="O livro do momento, com o capítulo."
          ligado={ajustes.mostrarOuvindoAgora}
          onMudar={(v) => alternar("mostrarOuvindoAgora", v)}
          testid="switch-ouvindo-agora"
        />
        <Interruptor
          icone={MessageSquare}
          titulo="O que eu disse"
          apoio="A porta dos seus comentários e posts."
          ligado={ajustes.mostrarMeusComentarios}
          onMudar={(v) => alternar("mostrarMeusComentarios", v)}
          testid="switch-meus-comentarios"
        />
        <Interruptor
          icone={UsersRound}
          titulo="Meus clubes"
          apoio="Dentro deles, a turma sempre te vê."
          ligado={ajustes.mostrarMeusClubes}
          onMudar={(v) => alternar("mostrarMeusClubes", v)}
          testid="switch-meus-clubes"
        />
        <Interruptor
          icone={Bell}
          titulo="Quem eu acompanho"
          apoio="Autores, narradores e editoras que você segue."
          ligado={ajustes.mostrarQuemAcompanho}
          onMudar={(v) => alternar("mostrarQuemAcompanho", v)}
          testid="switch-quem-acompanho"
        />
        <Interruptor
          icone={Radio}
          titulo="Em que capítulo eu estou"
          apoio="Só para quem você segue e te segue de volta — e é troca: quem não mostra, não vê."
          ligado={ajustes.mostrarMeuCapitulo}
          onMudar={(v) => alternar("mostrarMeuCapitulo", v)}
          ultimo
          testid="switch-meu-capitulo"
        />
      </Cartao>

      {/* Conta privada ganha aviso na tela porque **muda um contrato com outras
          pessoas**, não só a sua vitrine: quem já te segue continua, os novos
          passam por você. Os outros interruptores só escondem ou mostram um
          bloco, e para esses o efeito na página já é a resposta. */}
      <Titulo>Quem pode te seguir</Titulo>
      <Cartao>
        <Interruptor
          icone={Lock}
          titulo="Conta privada"
          apoio="Você aprova quem te segue. Seus posts continuam no feed de todos."
          ligado={ajustes.contaPrivada}
          onMudar={(ligado) => {
            alternar("contaPrivada", ligado);
            toast({
              title: ligado ? "Conta privada" : "Conta pública",
              description: ligado
                ? "Novos seguidores passam pela sua aprovação. Quem já te segue continua."
                : "Qualquer pessoa pode te seguir a partir de agora.",
            });
          }}
          ultimo
          testid="switch-conta-privada"
        />
      </Cartao>

      {/* Dito uma vez, no fim: é a regra que explica por que não há um
          interruptor para cada coisa. */}
      <p className="pt-4 text-[11.5px] leading-relaxed text-white/30">
        O que você <b className="text-white/50">escreve</b> é público — post no feed, comentário num
        livro, fala num clube. Estes botões governam o que a sua{" "}
        <b className="text-white/50">página</b> reúne e <b className="text-white/50">quem</b> te
        acompanha. <b className="text-white/50">Quando</b> o sino toca fica em Notificações.
      </p>
    </>
  );
}
