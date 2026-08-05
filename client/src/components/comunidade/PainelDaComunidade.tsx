import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  BookOpen,
  Bookmark,
  Compass,
  Download,
  Globe,
  HelpCircle,
  Medal,
  Menu,
  Plus,
  Scissors,
  Settings,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { achievements, unlockedCountFor } from "@/lib/achievements";
import { BOOKMARK_EVENT, totalBookmarks } from "@/lib/bookmarks";
import { meusClubes } from "@/lib/clubes";
import { minhasComunidades } from "@/lib/forum";
import { COMENTARIOS_EVENT, temResposta } from "@/lib/comentariosDePost";
import { readFollowing } from "@/lib/following";
import { GRUPOS_EVENT } from "@/lib/grupos";
import { readDownloads } from "@/lib/library";
import { POSTS_EVENT, todosOsPosts } from "@/lib/posts";
import { meusSeguidores } from "@/lib/seguidores";
import { lerDadosDeConquista, lerResumo } from "@/lib/stats";
import { TRECHOS_EVENT, trechosGuardados } from "@/lib/trechosGuardados";

/**
 * **O painel da Comunidade** — a gaveta lateral que o quadradinho do topo abre
 * (§4.100, corrigida no mesmo dia pelas críticas do Matheus).
 *
 * A referência é o Facebook, e a primeira versão errou nela em três pontos que
 * ele apontou na hora:
 *
 * - **o botão morava na fileira das lentes** — lá, ele fica no `TopNav`, ao
 *   lado da logo e "mais no canto ainda", com o ícone de três quadradinhos
 *   (é o `BotaoDoPainel`, que só aparece na rota da Comunidade);
 * - **o painel cobria a tela inteira** — lá, ele desliza da esquerda e ocupa
 *   ~80%, com o feed aparecendo escurecido atrás ("é como se ele basicamente
 *   minimizasse a janela"); tocar no véu fecha;
 * - **cada ícone tinha uma cor** — "isso deixa uma cara de inteligência
 *   artificial muito grande… não me parece que foi feito por um programador
 *   sério". Todos neutros; a única cor é o vermelho do ao vivo, que é
 *   semântica, não decoração.
 *
 * **Em 05/08 o painel virou o MENU do app** — global, aberto de qualquer tela
 * com topo — e a regra da §4.57 ("só leva ao que é da comunidade") foi revogada
 * pelo Matheus, com a duplicação resolvida NA ORIGEM: "Minhas notas" e "Meus
 * trechos" entraram aqui e **saíram do `/you`** — porta nova não convive com a
 * porta velha. A engrenagem do rodapé leva ao resto (`/you`: conta,
 * notificações, privacidade). O desenho é a gaveta do X: suas coisas + o
 * social + configurações embaixo, idêntica em todas as abas — menu que muda
 * conforme a tela ninguém aprende, e o objetivo original era justamente achar
 * fórum e clube de onde se estiver.
 *
 * **"Trechos da semana" saiu no mesmo dia:** o cartão contava os trechos
 * quentes da comunidade mas navegava para `/trechos` — a prancheta PESSOAL.
 * Destino que mente é pior que destino nenhum; a casa dos trechos quentes é o
 * cartão do feed (`TrechosQuentes`), onde eles continuam.
 *
 * O que continua valendo: cada cartão mostra a contagem real; destino sem nada
 * a mostrar some (a régua da §4.23).
 */
export default function PainelDaComunidade({ onFechar }: { onFechar: () => void }) {
  const [, navegar] = useLocation();
  const [dados, setDados] = useState(() => contar());

  useEffect(() => {
    const atualizar = () => setDados(contar());
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    window.addEventListener(POSTS_EVENT, atualizar);
    window.addEventListener(COMENTARIOS_EVENT, atualizar);
    // Notas e trechos mudam com o app aberto (o corte acontece no player).
    window.addEventListener(BOOKMARK_EVENT, atualizar);
    window.addEventListener(TRECHOS_EVENT, atualizar);
    return () => {
      window.removeEventListener(GRUPOS_EVENT, atualizar);
      window.removeEventListener(POSTS_EVENT, atualizar);
      window.removeEventListener(COMENTARIOS_EVENT, atualizar);
      window.removeEventListener(BOOKMARK_EVENT, atualizar);
      window.removeEventListener(TRECHOS_EVENT, atualizar);
    };
  }, []);

  useEffect(() => {
    const esc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onFechar]);

  function ir(rota: string) {
    onFechar();
    navegar(rota);
  }

  return (
    <div className="fixed inset-0 z-[70]" data-testid="painel-da-comunidade-aberto">
      {/* O véu: os ~20% de tela que continuam à vista — tocar fora fecha,
          como no Facebook. */}
      <button
        onClick={onFechar}
        aria-label="Fechar o painel"
        className="absolute inset-0 w-full bg-black/60 animate-in fade-in duration-200"
        data-testid="painel-veu"
      />

      <aside className="absolute inset-y-0 left-0 flex w-[80%] max-w-[340px] flex-col border-r border-white/[0.07] bg-[#141414] shadow-2xl animate-in slide-in-from-left duration-200">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
          <h2 className="font-display text-lg font-bold tracking-tight">Menu</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar o painel"
            className="grid h-8 w-8 place-items-center rounded-full text-white/50 transition-colors hover:text-white"
            data-testid="fechar-painel"
          >
            <X className="h-[17px] w-[17px]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/*
            **O cartão vermelho "Salas ao vivo agora" saiu (05/08, ordem dele):**
            *"não acho que esse botão vermelho, altamente destacado, possa fazer
            sentido"*. E o argumento por trás é bom: **menu é feito de lugares
            fixos; sala ao vivo é notícia**, e notícia mora no feed — onde ela já
            está, nos stories do topo do Feed (§4.100). A bolinha vermelha
            do hambúrguer saiu junto: ela apontava para este cartão, e marca que
            aponta para nada é promessa vazia.
          */}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Comunidade
          </p>
          <Grade>
            <Cartao icone={<Users />} rotulo="Minhas comunidades" conta={dados.comunidades} onClick={() => ir("/forum/minhas")} testid="painel-minhas-comunidades" />
            <Cartao icone={<Globe />} rotulo="Todas as comunidades" onClick={() => ir("/forum")} testid="painel-todas-comunidades" />
            <Cartao icone={<BookOpen />} rotulo="Meus clubes" conta={dados.clubes} onClick={() => ir("/clubes/meus")} testid="painel-meus-clubes" />
            <Cartao icone={<Compass />} rotulo="Todos os clubes" onClick={() => ir("/clubes")} testid="painel-todos-clubes" />
            <Cartao icone={<UserPlus />} rotulo="Quem eu sigo" conta={dados.sigo} onClick={() => ir("/seguidores")} testid="painel-quem-eu-sigo" />
            <Cartao icone={<Users />} rotulo="Quem me segue" conta={dados.meSeguem} onClick={() => ir("/seguidores")} testid="painel-quem-me-segue" />
            {dados.perguntas > 0 && (
              <Cartao icone={<HelpCircle />} rotulo="Perguntas sem resposta" conta={dados.perguntas} onClick={() => ir("/perguntas")} testid="painel-perguntas" />
            )}
          </Grade>

          {/*
            **O painel "Você" inteiro veio para cá (05/08, 2ª ordem dele):**
            *"a gente deveria colocar lá também estatística, conquista e
            downloads… ele está um pouco escondido hoje"*. Estava mesmo: eram
            três toques (avatar → perfil → engrenagem) para chegar às suas
            próprias coisas. Aqui são dois, de qualquer tela.

            **A linha de corte entre o que veio e o que ficou:** vieram os
            **lugares** (páginas suas que se visita para ver algo); ficaram os
            **ajustes** (privacidade, aparelho, ajuda, sair), atrás da
            engrenagem do rodapé. Menu leva a lugar; ajuste se configura.

            "Minhas notas", "Downloads", "Estatísticas" e "Conquistas" ficam
            sempre — são permanentes desde o antigo menu do Perfil. "Meus
            trechos" só quando existe algum (§4.23), como era lá.
          */}
          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Seu conteúdo
          </p>
          <Grade>
            <Cartao icone={<Bookmark />} rotulo="Minhas notas" conta={dados.notas} onClick={() => ir("/bookmarks")} testid="painel-minhas-notas" />
            {dados.trechos > 0 && (
              <Cartao icone={<Scissors />} rotulo="Meus trechos" conta={dados.trechos} onClick={() => ir("/trechos")} testid="painel-meus-trechos" />
            )}
            <Cartao icone={<Download />} rotulo="Downloads" conta={dados.downloads} onClick={() => ir("/downloads")} testid="painel-downloads" />
            <Cartao icone={<BarChart3 />} rotulo="Estatísticas" onClick={() => ir("/statistics")} testid="painel-estatisticas" />
            {/* A única contagem que não é "quantos você tem", e sim "quantas de
                quantas" — por isso vai por `etiqueta`, não por `conta`. */}
            <Cartao icone={<Medal />} rotulo="Conquistas" etiqueta={`${dados.ganhas} de ${dados.totalConquistas}`} onClick={() => ir("/achievements")} testid="painel-conquistas" />
          </Grade>

          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Criar
          </p>
          <Grade>
            <Cartao icone={<Plus />} rotulo="Criar comunidade" onClick={() => ir("/forum?criar=1")} testid="painel-criar-comunidade" />
            <Cartao icone={<Plus />} rotulo="Criar clube" onClick={() => ir("/clubes/novo")} testid="painel-criar-clube" />
          </Grade>
        </div>

        {/* A engrenagem que ele pediu — fixa no rodapé, como no X, e visível sem
            rolar por mais que a grade cresça. Leva ao `/you`, que depois desta
            rodada é só ajuste: conta, notificações, privacidade, aparelho,
            ajuda e sair. */}
        <footer className="border-t border-white/[0.07] px-4 py-2">
          <button
            onClick={() => ir("/you")}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            data-testid="painel-conta-e-configuracoes"
          >
            <Settings className="h-[18px] w-[18px] text-white/65" />
            <span className="text-[13.5px] font-semibold">Configurações</span>
          </button>
        </footer>
      </aside>
    </div>
  );
}

/**
 * **O botão que abre o Menu** — vive no `TopNav`, ao lado da logo, em toda
 * tela com topo (global desde 05/08; antes só na Comunidade). O ícone são as
 * **três barrinhas** (hambúrguer), como o Menu do Facebook — a primeira
 * tentativa foram três quadradinhos e ele vetou na hora: *"nem dá para saber
 * que existe alguma coisa aplicável"*. A bolinha vermelha acende quando há
 * **A bolinha vermelha de sala ao vivo saiu em 05/08**, junto com o cartão para
 * onde ela apontava: marca que não leva a nada é promessa vazia. Quem anuncia
 * sala aberta é o story no topo do Feed.
 */
export function BotaoDoPainel({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir o menu"
      className="-ml-2 mr-0.5 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
      data-testid="painel-da-comunidade"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

function Grade({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}

function Cartao({
  icone,
  rotulo,
  conta,
  etiqueta,
  onClick,
  testid,
}: {
  icone: React.ReactNode;
  rotulo: string;
  conta?: number;
  /** Quando o rodapé do cartão não é uma contagem — "3 de 16", por exemplo. */
  etiqueta?: string;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.08]"
      data-testid={testid}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/65 [&>svg]:h-4 [&>svg]:w-4">
        {icone}
      </span>
      <span className="mt-2.5 block text-[13px] font-semibold leading-tight">{rotulo}</span>
      {/* Altura fixa mesmo vazio: sem isso os cartões sem número ficam mais
          baixos e a grade desalinha. */}
      <span className="mt-0.5 block h-[15px] text-[11px] text-white/35">
        {etiqueta ?? (conta !== undefined && conta > 0 ? conta : "")}
      </span>
    </button>
  );
}

/**
 * Os números do painel, todos de dado que já existe — nenhum inventado (§4.92).
 *
 * Roda só com a gaveta aberta (`{painelAberto && <PainelDaComunidade/>}` no
 * `TopNav`), então as contas mais caras — conquistas, que percorrem o resumo de
 * audição — não pesam nas telas do dia a dia.
 */
function contar() {
  const perguntas = todosOsPosts().filter((post) => post.pergunta && !temResposta(post.id));
  return {
    comunidades: minhasComunidades().length,
    clubes: meusClubes().length,
    sigo: readFollowing().length,
    meSeguem: meusSeguidores().length,
    perguntas: perguntas.length,
    notas: totalBookmarks(),
    trechos: trechosGuardados().length,
    downloads: readDownloads().length,
    ganhas: unlockedCountFor(lerDadosDeConquista(lerResumo())),
    totalConquistas: achievements.length,
  };
}
