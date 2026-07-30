import { useEffect, useMemo, useState } from "react";
import { AtSign, HelpCircle, Send, UsersRound, X } from "lucide-react";

import AnexarTrecho from "@/components/AnexarTrecho";
import CampoComMencao from "@/components/comunidade/CampoComMencao";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { type Citacao } from "@/lib/citacoes";
import { clubePorId } from "@/lib/clubes";
import { initialOf, readProfile } from "@/lib/profile";
import {
  MAX_POST,
  objetoDaPrimeiraMencao,
  publicarPost,
  type Mencao,
  type ObjetoDoPost,
} from "@/lib/posts";

/**
 * A caixa de escrever um post — **o compositor** (ROTEIRO §4.58, item 2 da ordem
 * de construção).
 *
 * *("Compositor" era jargão meu; o Matheus pediu para explicar. É esta caixa: o
 * lugar onde você escreve e anexa antes de publicar.)*
 *
 * **Fica no topo do feed, e nasce fechada.** Uma linha só, com o seu avatar e o
 * convite; toca e ela abre no lugar. As duas alternativas foram descartadas com
 * motivo: **botão flutuante** tapa conteúdo (§4.58 já dizia "sem botão
 * flutuante"), e a caixa **sempre aberta** empurraria o primeiro post para baixo
 * da dobra — quem entra na Comunidade quer ler antes de escrever.
 *
 * ---
 *
 * **Os botões "Livro" e "Clube" saíram em 30/07** — crítica do Matheus, e ele
 * estava certo: *"se você já pode marcar com @, eu fico me perguntando qual é o
 * sentido de ter isso aqui"*. Eram dois caminhos para a mesma coisa, e o `@` é o
 * melhor dos dois, porque cita **dentro da frase** em vez de pendurar um anexo ao
 * lado dela.
 *
 * A consequência é que a menção passou a **virar o cartão**: a primeira de livro ou
 * clube ganha capa (`objetoDaPrimeiraMencao`). Sem isso a remoção teria tirado uma
 * função em vez de simplificar.
 *
 * **O "Trecho" ficou, e a razão é dele:** não há como digitar um trecho de áudio
 * dentro de uma frase. Trecho se escolhe de uma lista; livro e clube têm nome.
 *
 * **O que se perdeu, dito na cara:** não dá mais para pôr a capa **sem nomear o
 * livro no texto**. "Isso me quebrou" + capa virou "@Duna me quebrou". Julguei o
 * preço baixo — quem escreve sobre um livro costuma dizer qual — e o ganho é não
 * ter dois mecanismos para a mesma coisa.
 *
 * **A dica do `@` ficou fixa embaixo do campo**, e não só no placeholder: o
 * placeholder desaparece na primeira letra, e aí o único caminho de citar ficaria
 * invisível. Era o risco real de tirar os botões.
 *
 * **A trava antiga caiu, de propósito.** O mural exigia âncora em todo post
 * (`lib/mural.ts`: *"não existe caixa de texto sem capa ao lado"*). A §4.58
 * derrubou isso — *"terminei meu quinto livro do ano"* é post legítimo e não tem
 * objeto nenhum.
 */
export default function Compositor({ aoPublicar }: { aoPublicar?: () => void }) {
  const { toast } = useToast();
  const perfil = useMemo(readProfile, []);

  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [mencoes, setMencoes] = useState<Mencao[]>([]);
  /** O trecho — o único anexo que sobrou, porque é o único que não se digita. */
  const [trecho, setTrecho] = useState<Citacao | undefined>();
  const [pergunta, setPergunta] = useState(false);
  /** Quem tirou o cartão da menção com o X. Ver `semCartao` em `publicarPost`. */
  const [semCartao, setSemCartao] = useState(false);

  /**
   * O cartão que vai sair. **O trecho manda**, se houver; senão, a primeira
   * menção de livro ou clube. É o preview do que os outros vão ver — e a razão de
   * ele existir aqui é que, sem preview, tirar os botões deixaria a pessoa
   * publicando às cegas.
   */
  const objeto: ObjetoDoPost | undefined = trecho
    ? { tipo: "trecho", citacao: trecho }
    : semCartao
      ? undefined
      : objetoDaPrimeiraMencao(mencoes, texto);

  /* O X volta a valer sozinho quando a menção que gerava o cartão sai do texto —
     senão a pessoa tira um cartão, cita outro livro, e o novo não aparece. */
  useEffect(() => {
    if (semCartao && objetoDaPrimeiraMencao(mencoes, texto) === undefined) setSemCartao(false);
  }, [semCartao, mencoes, texto]);

  function limpar() {
    setTexto("");
    setMencoes([]);
    setTrecho(undefined);
    setPergunta(false);
    setSemCartao(false);
    setAberto(false);
  }

  function publicar() {
    const post = publicarPost({
      texto,
      objeto: trecho ? { tipo: "trecho", citacao: trecho } : undefined,
      pergunta,
      mencoes,
      semCartao,
    });
    if (!post) return;
    limpar();
    toast({
      title: pergunta ? "Pergunta publicada" : "Publicado",
      description: "Seu post está no topo do feed.",
    });
    aoPublicar?.();
  }

  const podePublicar = texto.trim().length > 0 || objeto !== undefined;

  if (!aberto) {
    return (
      <button
        /* O foco é do `autoFocus` do campo, que só existe depois de abrir. */
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.06]"
        data-testid="abrir-compositor"
      >
        <Avatar perfil={perfil} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-white/35">
          O que você está ouvindo?
        </span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Send className="h-3.5 w-3.5" />
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl border border-white/12 bg-white/[0.045] p-3.5"
      data-testid="compositor"
    >
      <div className="flex items-start gap-3">
        <Avatar perfil={perfil} />
        <CampoComMencao
          texto={texto}
          mencoes={mencoes}
          onMudar={(novoTexto, novasMencoes) => {
            setTexto(novoTexto);
            setMencoes(novasMencoes);
          }}
          placeholder="Fale com a comunidade…"
          autoFocus
        />
      </div>

      <div className="mt-2">
        {objeto?.tipo === "trecho" ? (
          /* O mesmo `AnexarTrecho` que o clube e o fórum usam: ele já mostra o
             cartão do trecho com o X para tirar. Uma peça, muitos campos. */
          <AnexarTrecho citacao={objeto.citacao} onEscolher={(citacao) => setTrecho(citacao)} />
        ) : objeto?.tipo === "livro" ? (
          <AnexoDeLivro bookId={objeto.bookId} onTirar={() => setSemCartao(true)} />
        ) : objeto?.tipo === "clube" ? (
          <AnexoDeClube clubeId={objeto.clubeId} onTirar={() => setSemCartao(true)} />
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sem citação: o próprio `AnexarTrecho` desenha o botão "Trecho". */}
            <AnexarTrecho onEscolher={(citacao) => setTrecho(citacao)} />
            {/*
              **A dica fixa, e não só no placeholder.** O placeholder desaparece na
              primeira letra — e como o `@` é agora o **único** caminho de citar um
              livro ou um clube (os botões saíram em 30/07), deixá-lo invisível
              seria esconder metade do compositor.
            */}
            <span className="flex items-center gap-1.5 text-[11.5px] text-white/30">
              <AtSign className="h-3 w-3" />
              digite <span className="font-mono font-bold text-white/50">@</span> para citar um
              livro, um clube ou um narrador
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-2.5">
        {/*
          **"Pergunta" é um tipo de post, não uma aba** (§4.58): aba dividiria a
          comunidade em duas plateias. O que ela tinha de bom — juntar as que
          ninguém respondeu — virou o filtro que fica ao lado do feed.
        */}
        <button
          onClick={() => setPergunta((valor) => !valor)}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
            pergunta
              ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
              : "text-white/40 hover:text-white/75"
          }`}
          aria-pressed={pergunta}
          data-testid="compositor-pergunta"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Pergunta
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          {/* O contador só aparece perto do fim: número sempre visível vira
              cobrança, e ninguém precisa saber que sobram 240 caracteres. */}
          {texto.length > MAX_POST * 0.8 && (
            <span
              className={`font-mono text-[11px] ${
                texto.length >= MAX_POST ? "text-red-400" : "text-white/35"
              }`}
              data-testid="compositor-contador"
            >
              {MAX_POST - texto.length}
            </span>
          )}
          <button
            onClick={limpar}
            className="rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold text-white/35 transition-colors hover:text-white/70"
            data-testid="compositor-cancelar"
          >
            Cancelar
          </button>
          <button
            onClick={publicar}
            disabled={!podePublicar}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-bold text-black transition-opacity disabled:opacity-30"
            data-testid="compositor-publicar"
          >
            <Send className="h-3 w-3" />
            Publicar
          </button>
        </div>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Peças
 * ------------------------------------------------------------------ */

function Avatar({ perfil }: { perfil: { name: string; photo?: string } }) {
  if (perfil.photo) {
    return (
      <img src={perfil.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-600 font-display text-sm font-bold">
      {initialOf(perfil.name)}
    </span>
  );
}

/**
 * O cartão que vai sair — **o preview da menção**, com o X para desligá-lo.
 *
 * Ele existe porque tirar os botões de anexo (30/07) tirava também a certeza:
 * sem preview, a pessoa cita `@Duna` e só descobre que virou capa depois de
 * publicar. O X não apaga a menção do texto — ela continua sendo palavra
 * clicável; só o cartão sai.
 */
function AnexoDeLivro({ bookId, onTirar }: { bookId: number; onTirar: () => void }) {
  const livro = catalog.find((item) => item.id === bookId);
  if (!livro) return null;

  return (
    <div className="relative" data-testid="anexo-de-livro">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 pr-9 ring-1 ring-inset ring-white/8">
        <img src={livro.cover} alt="" className="h-16 w-11 shrink-0 rounded-md object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
            Livro
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-semibold">{livro.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-white/40">{livro.author}</span>
        </span>
      </div>
      <BotaoDeTirar onClick={onTirar} rotulo="Tirar o livro" />
    </div>
  );
}

function AnexoDeClube({ clubeId, onTirar }: { clubeId: string; onTirar: () => void }) {
  const clube = clubePorId(clubeId);
  if (!clube) return null;
  const daVez = catalog.find((item) => item.id === clube.ciclo.bookId);

  return (
    <div className="relative" data-testid="anexo-de-clube">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 pr-9 ring-1 ring-inset ring-white/8">
        {daVez && (
          <img src={daVez.cover} alt="" className="h-16 w-11 shrink-0 rounded-md object-cover" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary">
            Clube de leitura
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-semibold">{clube.nome}</span>
          {daVez && (
            <span className="mt-0.5 block truncate text-[11px] text-white/40">
              lendo {daVez.title}
            </span>
          )}
        </span>
      </div>
      <BotaoDeTirar onClick={onTirar} rotulo="Tirar o clube" />
    </div>
  );
}

function BotaoDeTirar({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#2a2a2a] text-white/60 ring-1 ring-white/15 transition-colors hover:text-white"
      aria-label={rotulo}
      data-testid="tirar-anexo"
    >
      <X className="h-3 w-3" />
    </button>
  );
}
