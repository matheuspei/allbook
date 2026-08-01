import { useEffect, useState } from "react";
import { Headphones, Lock, MessageSquare, Radio, ThumbsUp, UsersRound } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { readSettings, saveSettings, type Settings } from "@/lib/settings";

/**
 * Privacidade (`/privacidade`) — tela própria, com o que os outros podem ver.
 *
 * **Por que virou tela** (ROTEIRO 4.55). Estes interruptores viviam
 * **expandidos dentro do painel "Você"**, e o Matheus apontou a inconsistência:
 * *"essa aba de privacidade está muito grande… nas outras, notificações e
 * configurações, ela não está expandida"*. Ele tem razão — todas as outras
 * entradas do painel são **uma linha com seta** que abre outra tela; só a
 * privacidade estava aberta ali no meio, empurrando o resto para baixo. Agora
 * ela é uma linha como as outras, e o conteúdo mora aqui.
 *
 * **A ordem tem lógica:** a tranca da conta vem primeiro, porque governa *quem*
 * pode ver; os três de baixo governam *o quê* aparece na sua página, e por isso
 * ficam sob um segundo título.
 *
 * **Não existe interruptor para "o que eu recomendo"**, por decisão do Matheus:
 * *"já que ela está recomendando, ela quer que as pessoas vejam"*. Recomendar é
 * um ato deliberadamente público — um botão para escondê-lo desfaria o gesto.
 */
export default function Privacidade() {
  const { toast } = useToast();
  const [ajustes, setAjustes] = useState<Settings>(readSettings);

  useEffect(() => {
    setAjustes(readSettings());
  }, []);

  /*
   * Grava a partir do que está no armazenamento, e não do estado da tela: dois
   * toques no mesmo instante com base no estado antigo faziam o segundo desfazer
   * o primeiro. Mesmo cuidado que o painel "Você" já tinha.
   */
  function alternar(chave: keyof Settings, ligado: boolean) {
    const proximo = { ...readSettings(), [chave]: ligado };
    setAjustes(proximo);
    saveSettings(proximo);
  }

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="privacidade-page">
      <PageHeader title="Privacidade" fallback="/you" />

      <main className="px-5">
        <h2 className="pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Quem pode te seguir
        </h2>
        <div className="border-b border-white/10">
          <Linha
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
            testid="switch-conta-privada"
          />
        </div>

        <h2 className="pt-6 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          O que aparece na sua página
        </h2>
        <div className="border-b border-white/10">
          <Linha
            icone={Headphones}
            titulo="O que estou ouvindo"
            apoio="O livro do momento, com o capítulo, para quem te visita."
            ligado={ajustes.mostrarOuvindoAgora}
            onMudar={(ligado) => alternar("mostrarOuvindoAgora", ligado)}
            testid="switch-ouvindo-agora"
          />
          <Linha
            icone={MessageSquare}
            titulo="O que eu disse"
            apoio="Seus comentários e posts reunidos. Dentro do livro, eles continuam lá."
            ligado={ajustes.mostrarMeusComentarios}
            onMudar={(ligado) => alternar("mostrarMeusComentarios", ligado)}
            testid="switch-meus-comentarios"
          />
          {/*
            **A única que nasce desligada** (§4.58, item 8). O apoio explica a
            reciprocidade em uma frase, porque é ela que decide o sim: ligar não
            é só "mostrar", é **passar a ver** — e não ligar é ficar cego para
            quem também mostra. Dizer isso no interruptor evita a descoberta
            depois, que é quando a pessoa se sente enganada.
          */}
          <Linha
            icone={Radio}
            titulo="Em que capítulo eu estou"
            apoio="Só para quem você segue e te segue de volta — e é troca: quem não mostra, não vê. Nunca aparece a hora, só o capítulo."
            ligado={ajustes.mostrarMeuCapitulo}
            onMudar={(ligado) => alternar("mostrarMeuCapitulo", ligado)}
            testid="switch-meu-capitulo"
          />
          <Linha
            icone={UsersRound}
            titulo="Meus clubes"
            apoio="A lista de clubes na sua página. Dentro deles, a turma sempre te vê."
            ligado={ajustes.mostrarMeusClubes}
            onMudar={(ligado) => alternar("mostrarMeusClubes", ligado)}
            testid="switch-meus-clubes"
          />
        </div>

        {/*
          **Quando o sino toca** (§4.92) — escolhido pelo Matheus na folha de
          01/08. Não é privacidade e sim barulho, mas mora aqui pelo mesmo motivo
          que o resto: é uma escolha sua sobre a sua conta, e criar uma quarta
          tela de ajustes para dois interruptores seria pior.

          **Curtida é o aviso mais frequente que existe** — mesmo agrupado, um por
          post —, e é o primeiro que alguém quer desligar. Os dois nascem ligados.
        */}
        <h2 className="pt-6 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Quando me avisar
        </h2>
        <div className="border-b border-white/10">
          <Linha
            icone={ThumbsUp}
            titulo="Curtidas no que eu escrevi"
            apoio="Chega agrupado — “Ana e mais 3 curtiram seu post”, nunca um aviso por curtida. Descurtir nunca avisa."
            ligado={ajustes.avisarCurtidas}
            onMudar={(ligado) => alternar("avisarCurtidas", ligado)}
            testid="switch-avisar-curtidas"
          />
          <Linha
            icone={MessageSquare}
            titulo="Comentários no que eu escrevi"
            apoio="Com o trecho do que a pessoa disse, para você saber se vale abrir."
            ligado={ajustes.avisarComentarios}
            onMudar={(ligado) => alternar("avisarComentarios", ligado)}
            testid="switch-avisar-comentarios"
          />
        </div>

        {/* Dito uma vez, no fim: é a regra que explica por que não há um
            interruptor para cada coisa. */}
        <p className="pt-4 text-[11.5px] leading-relaxed text-white/30">
          O que você <b className="text-white/50">escreve</b> é público — post no feed, comentário
          num livro, fala num clube. Estes botões governam o que a sua{" "}
          <b className="text-white/50">página</b> reúne, e quem enxerga a sua atividade.
        </p>
      </main>
    </div>
  );
}

function Linha({
  icone: Icone,
  titulo,
  apoio,
  ligado,
  onMudar,
  testid,
}: {
  icone: typeof Lock;
  titulo: string;
  apoio: string;
  ligado: boolean;
  onMudar: (ligado: boolean) => void;
  testid: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
        <Icone className="h-[18px] w-[18px] text-white/80" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{titulo}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/35">{apoio}</p>
      </div>
      <Switch checked={ligado} onCheckedChange={onMudar} aria-label={titulo} data-testid={testid} />
    </div>
  );
}
