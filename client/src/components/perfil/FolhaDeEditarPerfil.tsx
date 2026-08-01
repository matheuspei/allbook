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
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { readSettings, saveSettings, type Settings } from "@/lib/settings";

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
 * — o que aparece na sua página — morava a **três toques** dali, dentro de
 * Configurações → Você → Privacidade. Ajustar o próprio perfil exigia sair dele.
 *
 * **A forma é escolha dele, numa folha de quatro propostas desenhadas**: *"uma
 * mescla de A com C. Eu prefiro da forma como está o C… porém tem coisas aqui no
 * A que não tem no C. Então a gente vai colocar todas as opções que tem no A para
 * o C"*. Ou seja: **a folha do C** (que não tira você da página e abre portas),
 * **com o conteúdo do A** (todos os interruptores).
 *
 * **Por que folha, e não outra tela.** Editar o perfil é olhar para ele — uma
 * tela cheia esconde justamente o que se está ajustando. A folha sobe por cima,
 * e o que se liga aqui muda ali atrás. É a mesma razão pela qual a caixa de
 * compartilhar abre no lugar (§4.58) e a lista de membros do clube não vira
 * página (§4.59).
 *
 * **O que liga/desliga fica aqui; o que se escreve abre página.** Um interruptor
 * é um toque e o efeito é imediato — mandar para outra tela por causa dele seria
 * o "um toque a mais para tudo" que derrubou a proposta C pura. Já recomendação
 * e conta são formulários, e formulário quer tela.
 */
export default function FolhaDeEditarPerfil({ onFechar }: { onFechar: () => void }) {
  const [ajustes, setAjustes] = useState<Settings>(readSettings);

  useEffect(() => {
    setAjustes(readSettings());
  }, []);

  /* Grava a partir do armazenamento, e não do estado da tela: dois toques no
     mesmo instante com base no estado antigo faziam o segundo desfazer o
     primeiro. O mesmo cuidado que a tela de Privacidade já tinha. */
  function alternar(chave: keyof Settings, ligado: boolean) {
    const proximo = { ...readSettings(), [chave]: ligado };
    setAjustes(proximo);
    saveSettings(proximo);
  }

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

      <div className="relative max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#1c1c1c] pb-8">
        {/* O puxador, e o X para quem não arrasta. */}
        <div className="sticky top-0 z-10 bg-[#1c1c1c] px-5 pb-2 pt-2.5">
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
          <Titulo>Quem você é</Titulo>
          <Porta
            icone={UserRound}
            titulo="Foto, nome e bio"
            apoio="O que abre a sua página"
            href="/profile/edit"
            onIr={onFechar}
            testid="porta-foto-nome-bio"
          />

          {/*
            **Os cinco interruptores, vindos da Privacidade.** Eles não estão
            duplicados: **saíram** de lá. Um controle em dois lugares é a
            redundância que ele mesmo mandou varrer do compositor (§4.58) e da
            caixa de comentário (§4.93) — e aqui seria pior, porque os dois
            mostrariam o mesmo estado e ninguém saberia qual é o de verdade.

            A tela de Privacidade ficou com o que é **da conta** (quem pode te
            seguir) e com **o barulho** (quando o sino toca).
          */}
          <Titulo>O que aparece na sua página</Titulo>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5">
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
          </div>

          {/* **"O que eu recomendo" não tem interruptor**, e é decisão dele
              (§4.55): *"já que ela está recomendando, ela quer que as pessoas
              vejam"*. Recomendar é ato deliberadamente público — esconder
              desfaria o gesto. Por isso a recomendação aparece aqui embaixo
              como **conteúdo para editar**, e não como algo para apagar. */}
          <Titulo>Editar o conteúdo</Titulo>
          <Porta
            icone={BookHeart}
            titulo="Minhas recomendações"
            apoio="Os livros que você indica, com o motivo"
            href="/profile/recommendations"
            onIr={onFechar}
            testid="porta-editar-recomendacoes"
          />
          <Porta
            icone={Lock}
            titulo="Quem pode me seguir"
            apoio={ajustes.contaPrivada ? "Conta privada — você aprova" : "Conta pública"}
            href="/privacidade"
            onIr={onFechar}
            testid="porta-quem-pode-seguir"
          />

          <p className="pt-4 text-[11.5px] leading-relaxed text-white/30">
            O que você <b className="text-white/50">escreve</b> é público — post no feed, comentário
            num livro, fala num clube. Estes botões governam o que a sua{" "}
            <b className="text-white/50">página</b> reúne.
          </p>
        </div>
      </div>
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 pb-2 pt-5 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
      {children}
    </h3>
  );
}

function Porta({
  icone: Icone,
  titulo,
  apoio,
  href,
  onIr,
  testid,
}: {
  icone: typeof UserRound;
  titulo: string;
  apoio: string;
  href: string;
  onIr: () => void;
  testid: string;
}) {
  return (
    <Link
      href={href}
      onClick={onIr}
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
      <Switch checked={ligado} onCheckedChange={onMudar} data-testid={testid} />
    </div>
  );
}
