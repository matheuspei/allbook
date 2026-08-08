import { useEffect, useState } from "react";
import { Bell, MessageSquare, ThumbsUp } from "lucide-react";

import { Cartao, Interruptor, Porta, Titulo } from "@/components/perfil/PecasDeAjuste";
import { readSettings, saveSettings, type Settings } from "@/lib/settings";

/**
 * **Quando o sino toca** — os ajustes de notificação, e só eles.
 *
 * ---
 *
 * **Por que saiu de "Perfil e privacidade"** (08/08). A linha "Notificações"
 * das Configurações abria a **lista de avisos** — o mesmo destino do sino do
 * topo. O Matheus pegou: *"não faz sentido ela estar em configurações. Em
 * configurações, ela só valeria a pena se fosse configuração de notificação.
 * Como está, não pode ficar."*
 *
 * **E a configuração já existia** — estes dois interruptores estavam prontos e
 * funcionando desde a §4.92, escondidos no fim da lista de Perfil e
 * privacidade, onde ninguém procura barulho. O próprio comentário de lá já
 * admitia o desconforto: *"não é privacidade e sim barulho"*. Então não foi
 * preciso escolher entre **pôr** e **tirar** a linha: bastou mandá-la para o
 * lugar que sempre foi dela.
 *
 * **O que NÃO mudou:** o sino do topo continua sendo a única porta da lista de
 * avisos, que é o que ele já era. Cada palavra passou a significar uma coisa
 * só — "Notificações" nas Configurações é ajuste; o sino é a caixa.
 *
 * **A porta no fim existe para não virar beco:** quem toca em "Notificações"
 * procurando os avisos, e não os botões, tem para onde ir sem voltar.
 */
export default function AjustesDeAviso() {
  const [ajustes, setAjustes] = useState<Settings>(readSettings);

  useEffect(() => {
    setAjustes(readSettings());
  }, []);

  /*
   * Grava a partir do armazenamento, e não do estado da tela: dois toques no
   * mesmo instante com base no estado antigo faziam o segundo desfazer o
   * primeiro. Cuidado herdado da lista de onde estes dois vieram.
   */
  function alternar(chave: keyof Settings, ligado: boolean) {
    const proximo = { ...readSettings(), [chave]: ligado };
    setAjustes(proximo);
    saveSettings(proximo);
  }

  return (
    <>
      {/* **Curtida é o aviso mais frequente que existe** — mesmo agrupado, um
          por post —, e é o primeiro que alguém quer desligar. Os dois nascem
          ligados. */}
      <Titulo>Quando me avisar</Titulo>
      <Cartao>
        <Interruptor
          icone={ThumbsUp}
          titulo="Curtidas no que eu escrevi"
          apoio="Chega agrupado — “Ana e mais 3 curtiram seu post”, nunca um aviso por curtida."
          ligado={ajustes.avisarCurtidas}
          onMudar={(v) => alternar("avisarCurtidas", v)}
          testid="switch-avisar-curtidas"
        />
        <Interruptor
          icone={MessageSquare}
          titulo="Comentários no que eu escrevi"
          apoio="Com o trecho do que a pessoa disse, para você saber se vale abrir."
          ligado={ajustes.avisarComentarios}
          onMudar={(v) => alternar("avisarComentarios", v)}
          ultimo
          testid="switch-avisar-comentarios"
        />
      </Cartao>

      <Titulo>Os avisos que já chegaram</Titulo>
      <Porta
        icone={Bell}
        titulo="Ver meus avisos"
        apoio="A mesma caixa que o sino do topo abre"
        href="/notifications"
        testid="porta-ver-avisos"
      />

      <p className="pt-4 text-[11.5px] leading-relaxed text-white/30">
        Estes botões governam <b className="text-white/50">quando</b> o sino toca. O que aparece na
        sua página e quem pode te seguir ficam em{" "}
        <b className="text-white/50">Perfil e privacidade</b>.
      </p>
    </>
  );
}
