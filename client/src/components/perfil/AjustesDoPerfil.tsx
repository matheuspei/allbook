import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Bell,
  BookHeart,
  ChevronRight,
  Headphones,
  Lock,
  MessageSquare,
  Radio,
  ThumbsUp,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
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
 * página) → o que a sua página mostra → quem pode te seguir → quando o sino
 * toca. Vai do mais visível ao mais silencioso.
 *
 * **O que liga/desliga fica aqui; o que se escreve abre página** (regra da
 * §4.95, mantida). Interruptor é um toque de efeito imediato; foto, bio e
 * recomendação são formulários, e formulário quer tela.
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

      {/*
        **Quando o sino toca** (§4.92) — escolhido pelo Matheus na folha de
        01/08. Não é privacidade e sim barulho, mas mora na mesma lista pelo
        mesmo motivo que o resto: é uma escolha sua sobre a sua conta.

        **Curtida é o aviso mais frequente que existe** — mesmo agrupado, um por
        post —, e é o primeiro que alguém quer desligar. Os dois nascem ligados.
      */}
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

      {/* Dito uma vez, no fim: é a regra que explica por que não há um
          interruptor para cada coisa. */}
      <p className="pt-4 text-[11.5px] leading-relaxed text-white/30">
        O que você <b className="text-white/50">escreve</b> é público — post no feed, comentário num
        livro, fala num clube. Estes botões governam o que a sua{" "}
        <b className="text-white/50">página</b> reúne, <b className="text-white/50">quem</b> te
        acompanha e <b className="text-white/50">quando</b> o sino toca.
      </p>
    </>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 pb-2 pt-5 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
      {children}
    </h3>
  );
}

/** A moldura dos interruptores — um grupo por assunto, para a lista longa ter degraus. */
function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5">{children}</div>
  );
}

function Porta({
  icone: Icone,
  titulo,
  apoio,
  href,
  testid,
}: {
  icone: typeof UserRound;
  titulo: string;
  apoio: string;
  href: string;
  testid: string;
}) {
  return (
    /*
      ⚠️ A porta **não fecha a folha** ao navegar — conserto de 04/08. Fechava, e
      fechar desfaz a entrada `?editar` do histórico: quem tocava em "voltar" na
      tela seguinte caía no perfil com a folha morta. Navegar já desmonta a folha
      sozinho; a entrada fica no histórico, e o voltar devolve a pessoa para ela.
    */
    <Link
      href={href}
      className="mb-2 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 transition-colors hover:bg-white/[0.07]"
      data-testid={testid}
    >
      <Icone className="h-[17px] w-[17px] shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{titulo}</span>
        <span className="mt-0.5 block truncate text-[10.5px] text-white/35">{apoio}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
    </Link>
  );
}

function Interruptor({
  icone: Icone,
  titulo,
  apoio,
  ligado,
  onMudar,
  ultimo,
  testid,
}: {
  icone: typeof UserRound;
  titulo: string;
  apoio: string;
  ligado: boolean;
  onMudar: (ligado: boolean) => void;
  ultimo?: boolean;
  testid: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 ${ultimo ? "" : "border-b border-white/[0.06]"}`}
    >
      <Icone className="h-[17px] w-[17px] shrink-0 text-white/45" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight">{titulo}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-white/35">{apoio}</span>
      </span>
      <Switch checked={ligado} onCheckedChange={onMudar} aria-label={titulo} data-testid={testid} />
    </div>
  );
}
