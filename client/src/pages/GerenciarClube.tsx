import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CalendarRange, Eye, MessageCircleQuestion, Plus, Shield, Trash2, Undo2, UserMinus, Users, Vote, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog } from "@/lib/books";
import EditorDeMarcos from "@/components/clube/EditorDeMarcos";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CLUBES_EVENT,
  EU,
  clubePorId,
  corDoMembro,
  dataCurta,
  definirLimite,
  editarCiclo,
  estaComecando,
  membrosRemovidos,
  nomeDoMembro,
  readmitirMembro,
  prazoEmTexto,
  removerMembro,
  renomearClube,
  sairDoClube,
  souDono,
  vagasRestantes,
  type Clube as ClubeTipo,
  type Marco,
} from "@/lib/clubes";
import {
  MAX_OPCAO,
  MAX_OPCOES,
  MAX_PERGUNTA,
  MIN_OPCOES,
  PAUTAS_EVENT,
  PAUTAS_SUGERIDAS,
  abrirPauta,
  apuracaoDaPauta,
  encerrarPauta,
  pautaAberta,
} from "@/lib/pautas";
import {
  MAX_OPCOES_VOTACAO,
  MIN_OPCOES_VOTACAO,
  OPCOES_SUGERIDAS,
  PERGUNTAS_SUGERIDAS,
  RODADAS_EVENT,
  abrirRodada,
  abrirVotacao,
  encerrarRodada,
  janelaEmTexto,
  rodadaAberta,
  votacaoDoClube,
} from "@/lib/rodadas";
import { MURAL_EVENT, desfazerModeracao, escondidasDoClube } from "@/lib/muralDoClube";

/**
 * Gerenciar o clube — onde moram os poderes do dono.
 *
 * **Por que é uma tela separada** (ROTEIRO 4.40): a tela do clube foi enxugada
 * para caber numa tela só, e moderação **não é uso diário** — é o que se faz
 * quando algo precisa mudar. Empilhar os poderes junto da conversa era parte do
 * que fazia o clube parecer um formulário comprido. Aqui embaixo eles cabem
 * inteiros, com espaço para explicar o que cada um faz.
 *
 * **Os três poderes que o Matheus pediu em 28/07** — *"esse cara tem que ter
 * muita autonomia"* — são as três primeiras seções: **vagas** (quantas pessoas
 * cabem), **membros** (tirar quem quiser, e devolver), **pauta** (pôr qualquer
 * assunto em votação). Rodada, mensagens escondidas e apagar o clube vêm depois,
 * na ordem do que se mexe menos.
 */
export default function GerenciarClube({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [, navegar] = useLocation();
  const [clube, setClube] = useState<ClubeTipo | undefined>(() => clubePorId(params.id));
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      setClube(clubePorId(params.id));
      setVersao((v) => v + 1);
    };
    atualizar();
    for (const evento of [CLUBES_EVENT, PAUTAS_EVENT, RODADAS_EVENT, MURAL_EVENT]) {
      window.addEventListener(evento, atualizar);
    }
    return () => {
      for (const evento of [CLUBES_EVENT, PAUTAS_EVENT, RODADAS_EVENT, MURAL_EVENT]) {
        window.removeEventListener(evento, atualizar);
      }
    };
  }, [params.id]);

  /*
   * Quem não modera não tem o que fazer aqui. A checagem é de verdade (a
   * biblioteca recusa a ação mesmo se a tela for burlada), mas mandar a pessoa
   * de volta é o que evita uma tela cheia de botões que não obedecem.
   */
  if (!clube || !souDono(clube)) {
    return (
      <div className="min-h-screen bg-[#141414] px-6 pb-24 text-white">
        <PageHeader title="Gerenciar" fallback="/clubes" />
        <div className="flex flex-col items-center justify-center gap-3 pt-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5">
            <Shield className="h-8 w-8 text-white/20" />
          </div>
          <p className="font-display text-lg font-bold">
            {clube ? "Você não modera este clube" : "Este clube não existe mais"}
          </p>
          <Link href="/clubes" className="mt-1 text-sm font-semibold text-primary">
            Ver os clubes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="gerenciar-clube-page">
      <PageHeader title="Gerenciar" fallback={`/clube/${clube.id}`} />

      <div className="space-y-7 px-5 pt-4">
        <p className="flex items-start gap-2.5 rounded-xl bg-primary/[0.08] px-3.5 py-3 text-[11.5px] leading-relaxed text-white/60">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            <b className="text-white/85">{clube.nome} é seu.</b> Aqui você decide quantas pessoas
            cabem, quem fica, e o que a turma vota. Nada disto pede a opinião de ninguém.
          </span>
        </p>

        <NomeDoClube key={`n-${versao}`} clube={clube} />
        <Vagas clube={clube} />
        <RitmoDoCiclo key={`c-${versao}`} clube={clube} />
        <Membros key={`m-${versao}`} clube={clube} />
        <VotacaoDoModerador key={`v-${versao}`} clube={clube} />
        <PautaDoModerador key={`p-${versao}`} clube={clube} />
        <RodadaDoModerador key={`r-${versao}`} clube={clube} />
        <Escondidas key={`e-${versao}`} clube={clube} />

        <ApagarOClube
          clube={clube}
          onApagar={() => {
            sairDoClube(clube.id);
            toast({
              title: `${clube.nome} foi apagado`,
              description: "O mural e as pautas do clube foram junto.",
            });
            navegar("/clubes");
          }}
        />
      </div>
    </div>
  );
}

/* ================================================================== *
 * 0. Nome e descrição — o clube que muda de assunto muda de nome.
 * ================================================================== */

/**
 * Renomear o clube — **o que faltava para o ciclo fechar de verdade** (§4.58).
 *
 * O Matheus descreveu a continuidade numa frase: *"muda o nome, escolhe o
 * próximo livro"*. A segunda metade já existia (a votação); a primeira, não — o
 * nome era fixo desde a criação. E ele mente rápido: um clube nasce "Duna nas
 * quintas" e, três livros depois, o nome não descreve mais nada do que aquela
 * turma faz.
 *
 * **Só o dono renomeia**, como tudo nesta tela. E o nome vazio não passa: clube
 * sem nome não tem como ser citado com `@` nem achado na busca.
 */
function NomeDoClube({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const [nome, setNome] = useState(clube.nome);
  const [descricao, setDescricao] = useState(clube.descricao);
  const mudou = nome.trim() !== clube.nome || descricao.trim() !== clube.descricao;

  return (
    <section data-testid="secao-nome-do-clube">
      <h2 className="mb-1 font-display text-base font-bold">Nome do clube</h2>
      <p className="mb-3 text-[11.5px] leading-relaxed text-white/40">
        Trocou de livro e o nome ficou velho? Troque também — quem já está dentro continua
        dentro.
      </p>

      <input
        value={nome}
        onChange={(evento) => setNome(evento.target.value.slice(0, 40))}
        placeholder="Nome do clube"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
        data-testid="input-nome-do-clube"
      />
      <textarea
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value.slice(0, 200))}
        placeholder="Sobre o que é este clube?"
        rows={2}
        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] leading-relaxed focus:border-primary/50 focus:outline-none"
        data-testid="input-descricao-do-clube"
      />

      <div className="mt-2.5 flex justify-end">
        <button
          onClick={() => {
            if (!renomearClube(clube.id, nome, descricao)) return;
            toast({
              title: "Clube renomeado",
              description: "O nome novo vale em toda parte: feed, busca e menção com @.",
            });
          }}
          disabled={!mudou || nome.trim().length === 0}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-black disabled:opacity-30"
          data-testid="button-salvar-nome"
        >
          Salvar
        </button>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 0.5 Votação do próximo livro — de 2 a 5 opções.
 * ================================================================== */

/**
 * **Abrir a votação do próximo livro** (§4.58, e o que faltava para o ciclo ter
 * continuação de verdade).
 *
 * Até 30/07 só existia a votação de exemplo, semeada: num clube real, acabava o
 * livro e não havia como escolher o próximo — o clube morria no fim do primeiro
 * ciclo, que é exatamente o que a votação existe para evitar.
 *
 * **De 2 a 5, com 3 sugerido.** O argumento que fixou o 3 continua no lugar e é
 * contraintuitivo: *com 5 opções e 8 pessoas, o vencedor sai com 3 votos* — cinco
 * ficam com um livro que não escolheram. O 5 só passou a caber porque quem perde
 * ganhou saída (fundar o clube do livro derrotado).
 */
function VotacaoDoModerador({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const aberta = votacaoDoClube(clube.id);
  const [busca, setBusca] = useState("");
  const [escolhidos, setEscolhidos] = useState<number[]>([]);

  const encontrados = busca.trim()
    ? catalog
        .filter((livro) =>
          `${livro.title} ${livro.author}`.toLowerCase().includes(busca.trim().toLowerCase()),
        )
        .filter((livro) => !escolhidos.includes(livro.id))
        .slice(0, 5)
    : [];

  if (aberta) {
    return (
      <section data-testid="secao-votacao-aberta">
        <h2 className="mb-1 font-display text-base font-bold">Próximo livro</h2>
        <p className="text-[11.5px] leading-relaxed text-white/40">
          Já há uma votação aberta com {aberta.opcoes.length} livros. Ela fecha{" "}
          {prazoEmTexto(aberta.fecha)} — o resultado e o botão de encerrar ficam na página do
          clube.
        </p>
      </section>
    );
  }

  return (
    <section data-testid="secao-abrir-votacao">
      <h2 className="mb-1 font-display text-base font-bold">Próximo livro</h2>
      <p className="mb-3 text-[11.5px] leading-relaxed text-white/40">
        Escolha de {MIN_OPCOES_VOTACAO} a {MAX_OPCOES_VOTACAO} livros para a turma votar.{" "}
        {OPCOES_SUGERIDAS} é o tamanho que costuma funcionar: com muitas opções, o vencedor
        ganha com poucos votos.
      </p>

      {escolhidos.length > 0 && (
        <div className="mb-2.5 space-y-1.5" data-testid="opcoes-escolhidas">
          {escolhidos.map((id) => {
            const livro = catalog.find((item) => item.id === id);
            if (!livro) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2"
              >
                <img src={livro.cover} alt="" className="h-10 w-7 shrink-0 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-[12.5px]">{livro.title}</span>
                <button
                  onClick={() => setEscolhidos((atual) => atual.filter((item) => item !== id))}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/30 hover:text-white"
                  aria-label={`Tirar ${livro.title}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {escolhidos.length < MAX_OPCOES_VOTACAO && (
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar um livro…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
          data-testid="input-busca-votacao"
        />
      )}

      {encontrados.length > 0 && (
        <div className="mt-2 space-y-1">
          {encontrados.map((livro) => (
            <button
              key={livro.id}
              onClick={() => {
                setEscolhidos((atual) => [...atual, livro.id]);
                setBusca("");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.06]"
              data-testid={`opcao-votacao-${livro.id}`}
            >
              <img src={livro.cover} alt="" className="h-10 w-7 shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px]">{livro.title}</span>
                <span className="block truncate text-[10.5px] text-white/35">{livro.author}</span>
              </span>
              <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          onClick={() => {
            if (!abrirVotacao(clube.id, escolhidos)) return;
            setEscolhidos([]);
            toast({
              title: "Votação aberta",
              description: "A turma vota na página do clube. Você encerra quando quiser.",
            });
          }}
          disabled={escolhidos.length < MIN_OPCOES_VOTACAO}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-black disabled:opacity-30"
          data-testid="button-abrir-votacao"
        >
          Abrir votação
        </button>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 1. Vagas — quantas pessoas cabem.
 * ================================================================== */

/**
 * **O limite existe porque clube tem tamanho útil.** Com quatro pessoas todo
 * mundo responde a todo mundo; com quarenta a conversa vira mural de avisos e
 * ninguém se sente responsável por aparecer. Quem escolhe é o dono.
 *
 * As opções param em 20 de propósito: acima disso a régua da roda deixa de
 * significar alguma coisa (a mediana de quarenta pessoas não descreve ninguém) e
 * o clube passa a precisar de outra ferramenta, não de um número maior.
 */
function Vagas({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const opcoes: (number | undefined)[] = [undefined, 4, 6, 8, 12, 20];
  const restantes = vagasRestantes(clube);

  return (
    <section>
      <Titulo icone={<Users className="h-4 w-4 text-primary" />} texto="Quantas pessoas cabem" />
      <p className="mb-3 text-xs leading-relaxed text-white/45">
        {clube.limite === undefined ? (
          <>
            Sem limite. Hoje são {clube.membros.length}
            {clube.membros.length === 1 ? " pessoa" : " pessoas"}.
          </>
        ) : (
          <>
            <b className="text-white/80">
              {clube.membros.length} de {clube.limite} lugares
            </b>{" "}
            ocupados{restantes === 0 ? " — o clube está cheio e ninguém mais consegue entrar" : `, ${restantes} ${restantes === 1 ? "livre" : "livres"}`}.
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-2" data-testid="vagas-opcoes">
        {opcoes.map((opcao) => {
          const ligada = clube.limite === opcao;
          /* Abaixo de quem já está dentro não faz sentido: `definirLimite` já
             sobe o número sozinho, mas oferecer a opção seria prometer o que não
             acontece. */
          const cabe = opcao === undefined || opcao >= clube.membros.length;

          return (
            <button
              key={opcao ?? "livre"}
              disabled={!cabe}
              onClick={() => {
                definirLimite(clube.id, opcao);
                toast({
                  title:
                    opcao === undefined
                      ? "O clube ficou sem limite"
                      : `O clube agora cabe ${opcao} pessoas`,
                });
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                ligada
                  ? "bg-white text-black"
                  : cabe
                    ? "bg-white/[0.06] text-white/70 hover:bg-white/12"
                    : "cursor-not-allowed bg-white/[0.03] text-white/20"
              }`}
              data-testid={`vaga-${opcao ?? "livre"}`}
            >
              {opcao ?? "Sem limite"}
            </button>
          );
        })}
      </div>

      {/*
        **Qualquer número** (ROTEIRO 4.42). Os botões acima são atalhos; quem
        quer 14 escreve 14. O piso é o número de quem já está dentro — diminuir
        o limite nunca expulsa ninguém.
      */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[11.5px] text-white/45">Ou o número exato:</span>
        <input
          type="number"
          inputMode="numeric"
          min={clube.membros.length}
          max={999}
          value={clube.limite ?? ""}
          placeholder="—"
          onChange={(e) => {
            const numero = Number(e.target.value);
            definirLimite(
              clube.id,
              e.target.value === "" || numero < 1 ? undefined : Math.round(numero),
            );
          }}
          className="w-20 rounded-lg bg-white/[0.06] px-3 py-2 text-center text-sm font-semibold outline-none ring-1 ring-inset ring-white/8 placeholder:text-white/20 focus:ring-primary/50"
          data-testid="vagas-exato"
        />
      </div>
    </section>
  );
}

/* ================================================================== *
 * 1b. Ritmo do ciclo — as datas e os marcos, editáveis.
 * ================================================================== */

/**
 * **O combinado muda no meio do caminho, e o app tem de deixar** (ROTEIRO 4.42).
 * Metade da turma atrasou, caiu um feriado, o livro era mais longo do que
 * parecia. Antes disto o moderador só podia refazer o clube do zero — perdendo o
 * mural inteiro —, e o Matheus apontou a falta com todas as letras: *"na questão
 * dos capítulos, ele poderia também editar quando é que cada um começa e acaba;
 * ele também não tem essa autonomia hoje"*.
 *
 * **A estreia não é editável depois que o clube começou.** Mudar o passado não
 * significa nada: quem já ouviu, já ouviu. Enquanto o clube está em formação, ela
 * abre — é justamente aí que adiar para juntar mais gente faz sentido.
 */
function RitmoDoCiclo({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const emFormacao = estaComecando(clube);

  const [inicio, setInicio] = useState(clube.ciclo.inicio);
  const [fim, setFim] = useState(clube.ciclo.encontro);
  const [marcos, setMarcos] = useState<Marco[]>(clube.ciclo.marcos);

  const mudou =
    inicio !== clube.ciclo.inicio ||
    fim !== clube.ciclo.encontro ||
    JSON.stringify(marcos) !== JSON.stringify(clube.ciclo.marcos);

  return (
    <section>
      <Titulo icone={<CalendarRange className="h-4 w-4 text-primary" />} texto="O ritmo do ciclo" />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/30">
            Estreia
          </span>
          <input
            type="date"
            value={inicio}
            disabled={!emFormacao}
            onChange={(e) => e.target.value && setInicio(e.target.value)}
            className={`w-full rounded-lg px-2.5 py-2 text-[13px] outline-none ring-1 ring-inset [color-scheme:dark] ${
              emFormacao
                ? "bg-white/[0.06] ring-white/8 focus:ring-primary/50"
                : "cursor-not-allowed bg-white/[0.02] text-white/30 ring-white/5"
            }`}
            data-testid="ciclo-inicio"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/30">
            Encontro
          </span>
          <input
            type="date"
            min={inicio}
            value={fim}
            onChange={(e) => e.target.value && setFim(e.target.value)}
            className="w-full rounded-lg bg-white/[0.06] px-2.5 py-2 text-[13px] outline-none ring-1 ring-inset ring-white/8 [color-scheme:dark] focus:ring-primary/50"
            data-testid="ciclo-fim"
          />
        </label>
      </div>

      {!emFormacao && (
        <p className="mb-3 text-[10.5px] leading-relaxed text-white/25">
          A estreia foi em {dataCurta(clube.ciclo.inicio)} e não muda mais — quem já ouviu, já
          ouviu. As datas do combinado, sim.
        </p>
      )}

      <EditorDeMarcos
        bookId={clube.ciclo.bookId}
        inicio={inicio}
        fim={fim}
        marcos={marcos}
        onChange={setMarcos}
      />

      {mudou && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setInicio(clube.ciclo.inicio);
              setFim(clube.ciclo.encontro);
              setMarcos(clube.ciclo.marcos);
            }}
            className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white/60 transition-colors hover:bg-white/12"
          >
            Descartar
          </button>
          <button
            onClick={() => {
              editarCiclo(clube.id, { ...clube.ciclo, inicio, encontro: fim, marcos });
              toast({
                title: "Ritmo atualizado",
                description: "A turma vê o combinado novo na tela do clube.",
              });
            }}
            className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-black transition-colors hover:bg-primary/90"
            data-testid="button-salvar-ciclo"
          >
            Salvar o novo combinado
          </button>
        </div>
      )}
    </section>
  );
}

/* ================================================================== *
 * 2. Membros — tirar e devolver.
 * ================================================================== */

/**
 * **Remover é definitivo para quem sai, mas reversível para quem removeu.**
 * Errar o toque numa lista de nomes é fácil demais para a ação não ter volta —
 * por isso quem sai aparece logo abaixo, com "devolver". Sem isso, o moderador
 * distraído perde um membro e não tem como consertar.
 *
 * **Você não aparece na lista com botão.** Dono que quer sair está apagando o
 * clube, e isso é outra ação, com outra confirmação.
 */
function Membros({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const fora = membrosRemovidos(clube.id);
  const outros = clube.membros.filter((slug) => slug !== EU);

  return (
    <section>
      <Titulo icone={<UserMinus className="h-4 w-4 text-primary" />} texto="Quem está no clube" />

      <div className="space-y-1.5" data-testid="lista-membros">
        <LinhaDeMembro slug={EU} legenda="você modera" />

        {outros.length === 0 ? (
          <p className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-xs leading-relaxed text-white/45">
            Ninguém mais entrou ainda. Compartilhe o endereço do clube na tela dele — quem abrir o
            link cai na página e tem o botão de entrar.
          </p>
        ) : (
          outros.map((slug) => (
            <LinhaDeMembro
              key={slug}
              slug={slug}
              acao={
                <button
                  onClick={() => {
                    removerMembro(clube.id, slug);
                    toast({
                      title: `${nomeDoMembro(slug)} saiu do clube`,
                      description: "Dá para devolver logo abaixo, se foi sem querer.",
                    });
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white/40 transition-colors hover:bg-red-500/12 hover:text-red-300"
                  data-testid={`remover-${slug}`}
                >
                  Remover
                </button>
              }
            />
          ))
        )}
      </div>

      {fora.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
            Fora do clube
          </p>
          <div className="space-y-1.5">
            {fora.map((slug) => (
              <LinhaDeMembro
                key={slug}
                slug={slug}
                apagada
                acao={
                  <button
                    onClick={() => {
                      readmitirMembro(clube.id, slug);
                      toast({ title: `${nomeDoMembro(slug)} voltou para o clube` });
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/12"
                    data-testid={`readmitir-${slug}`}
                  >
                    <Undo2 className="h-3 w-3" />
                    Devolver
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10.5px] leading-relaxed text-white/25">
        Os outros membros são leitores fictícios — o poder funciona de verdade, a gente de verdade
        chega com as contas e o servidor.
      </p>
    </section>
  );
}

function LinhaDeMembro({
  slug,
  legenda,
  acao,
  apagada,
}: {
  slug: string;
  legenda?: string;
  acao?: React.ReactNode;
  apagada?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 ${apagada ? "opacity-50" : ""}`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br ${corDoMembro(slug)} font-display text-xs font-bold`}
      >
        {nomeDoMembro(slug).charAt(0)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{nomeDoMembro(slug)}</span>
      {legenda && <span className="shrink-0 text-[11px] text-white/35">{legenda}</span>}
      {acao}
    </div>
  );
}

/* ================================================================== *
 * 3. Pauta — pôr um assunto em votação.
 * ================================================================== */

function PautaDoModerador({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const aberta = pautaAberta(clube.id);

  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState<string[]>(["", ""]);

  const preenchidas = opcoes.filter((opcao) => opcao.trim().length > 0).length;
  const podeAbrir = pergunta.trim().length > 0 && preenchidas >= MIN_OPCOES;

  if (aberta) {
    const apuracao = apuracaoDaPauta(aberta, clube);
    const total = apuracao.reduce((soma, item) => soma + item.votos, 0);

    return (
      <section>
        <Titulo icone={<Vote className="h-4 w-4 text-primary" />} texto="A pauta em votação" />
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
          <p className="font-display text-[15px] font-bold leading-snug">{aberta.pergunta}</p>
          <p className="mt-1 text-[11px] text-white/40">
            {janelaEmTexto(aberta.fecha)} · {total} {total === 1 ? "voto" : "votos"} de{" "}
            {clube.membros.length}
          </p>

          <div className="mt-3 space-y-1.5">
            {apuracao.map((item) => (
              <div key={item.indice} className="relative overflow-hidden rounded-lg bg-white/[0.05]">
                <div
                  className="absolute inset-y-0 left-0 bg-primary/20"
                  style={{ width: total > 0 ? `${(item.votos / total) * 100}%` : "0%" }}
                />
                <div className="relative flex items-center justify-between px-3 py-2">
                  <span className="truncate text-[13px]">{item.opcao}</span>
                  <span className="ml-3 shrink-0 text-[11px] font-semibold text-white/55">
                    {item.votos}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              encerrarPauta(aberta.id);
              toast({ title: "Pauta encerrada", description: "O resultado fica no histórico do clube." });
            }}
            className="mt-3 w-full rounded-xl bg-white/[0.08] py-2.5 text-xs font-bold transition-colors hover:bg-white/15"
            data-testid="button-encerrar-pauta"
          >
            Encerrar a votação agora
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Titulo icone={<Vote className="h-4 w-4 text-primary" />} texto="Pôr um assunto em votação" />
      <p className="mb-3 text-xs leading-relaxed text-white/45">
        Qualquer decisão do grupo: ritmo, vagas, o que fazer com quem atrasou. A turma vê quantos
        votos cada opção teve, nunca quem votou em quê.
      </p>

      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value.slice(0, MAX_PERGUNTA))}
          placeholder="O que a turma vai decidir?"
          className="w-full rounded-lg bg-white/[0.05] px-3 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/8 placeholder:text-white/25 focus:ring-primary/50"
          data-testid="input-pauta-pergunta"
        />

        <div className="mt-2 space-y-2">
          {opcoes.map((opcao, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <input
                value={opcao}
                onChange={(e) => {
                  const copia = [...opcoes];
                  copia[indice] = e.target.value.slice(0, MAX_OPCAO);
                  setOpcoes(copia);
                }}
                placeholder={`Opção ${indice + 1}`}
                className="min-w-0 flex-1 rounded-lg bg-white/[0.05] px-3 py-2 text-[13px] outline-none ring-1 ring-inset ring-white/8 placeholder:text-white/25 focus:ring-primary/50"
                data-testid={`input-pauta-opcao-${indice}`}
              />
              {opcoes.length > MIN_OPCOES && (
                <button
                  onClick={() => setOpcoes(opcoes.filter((_, i) => i !== indice))}
                  className="shrink-0 rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/8 hover:text-white/70"
                  aria-label={`Tirar a opção ${indice + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {opcoes.length < MAX_OPCOES && (
          <button
            onClick={() => setOpcoes([...opcoes, ""])}
            className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-primary"
            data-testid="button-mais-opcao"
          >
            <Plus className="h-3.5 w-3.5" />
            Mais uma opção
          </button>
        )}

        {/* Sugestões prontas: quem trava é sempre na pergunta, não na vontade. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PAUTAS_SUGERIDAS.map((sugerida) => (
            <button
              key={sugerida.pergunta}
              onClick={() => {
                setPergunta(sugerida.pergunta);
                setOpcoes(sugerida.opcoes);
              }}
              className="max-w-full truncate rounded-full bg-white/[0.05] px-2.5 py-1 text-[10.5px] text-white/45 transition-colors hover:bg-white/12 hover:text-white/80"
            >
              {sugerida.pergunta}
            </button>
          ))}
        </div>

        <button
          disabled={!podeAbrir}
          onClick={() => {
            const criada = abrirPauta(clube.id, pergunta, opcoes);
            if (!criada) return;
            setPergunta("");
            setOpcoes(["", ""]);
            toast({
              title: "Pauta aberta",
              description: "A turma tem 3 dias para votar. Aparece na tela do clube.",
            });
          }}
          className={`mt-3 w-full rounded-xl py-3 text-sm font-bold transition-colors ${
            podeAbrir
              ? "bg-primary text-black hover:bg-primary/90"
              : "cursor-not-allowed bg-white/[0.05] text-white/25"
          }`}
          data-testid="button-abrir-pauta"
        >
          Abrir a votação
        </button>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 4. Rodada — a pergunta aberta do encontro.
 * ================================================================== */

/**
 * A rodada saiu da tela do clube e veio para cá **na parte que é do moderador**
 * (abrir e encerrar). Responder continua lá, onde a turma está — quem responde
 * é todo mundo, quem abre é um só.
 */
function RodadaDoModerador({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const aberta = rodadaAberta(clube.id);
  const [pergunta, setPergunta] = useState("");

  return (
    <section>
      <Titulo
        icone={<MessageCircleQuestion className="h-4 w-4 text-primary" />}
        texto="A rodada do encontro"
      />

      {aberta ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="font-display text-[15px] font-bold leading-snug">{aberta.pergunta}</p>
          <p className="mt-1 text-[11px] text-white/40">
            {janelaEmTexto(aberta.fecha)} · {aberta.respostas.length}{" "}
            {aberta.respostas.length === 1 ? "resposta" : "respostas"}
          </p>
          <button
            onClick={() => {
              encerrarRodada(aberta.id);
              toast({ title: "Rodada encerrada", description: "As respostas ficam guardadas." });
            }}
            className="mt-3 w-full rounded-xl bg-white/[0.08] py-2.5 text-xs font-bold transition-colors hover:bg-white/15"
            data-testid="button-encerrar-rodada"
          >
            Encerrar a rodada agora
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="mb-3 text-xs leading-relaxed text-white/45">
            Uma pergunta, três dias para responder. Sem hora marcada — cada um responde quando dá.
          </p>
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value.slice(0, 200))}
            placeholder="Qual é a pergunta desta rodada?"
            rows={2}
            className="w-full resize-none rounded-lg bg-white/[0.05] px-3 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/8 placeholder:text-white/25 focus:ring-primary/50"
            data-testid="input-rodada-pergunta"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PERGUNTAS_SUGERIDAS.slice(0, 3).map((sugerida) => (
              <button
                key={sugerida}
                onClick={() => setPergunta(sugerida)}
                className="max-w-full truncate rounded-full bg-white/[0.05] px-2.5 py-1 text-[10.5px] text-white/45 transition-colors hover:bg-white/12 hover:text-white/80"
              >
                {sugerida}
              </button>
            ))}
          </div>
          <button
            disabled={pergunta.trim().length === 0}
            onClick={() => {
              abrirRodada(clube.id, pergunta);
              setPergunta("");
              toast({ title: "Rodada aberta", description: "A turma tem 3 dias para responder." });
            }}
            className={`mt-3 w-full rounded-xl py-3 text-sm font-bold transition-colors ${
              pergunta.trim().length > 0
                ? "bg-primary text-black hover:bg-primary/90"
                : "cursor-not-allowed bg-white/[0.05] text-white/25"
            }`}
            data-testid="button-abrir-rodada"
          >
            Abrir a rodada
          </button>
        </div>
      )}
    </section>
  );
}

/* ================================================================== *
 * 5. Mensagens escondidas — devolver o que foi moderado.
 * ================================================================== */

function Escondidas({ clube }: { clube: ClubeTipo }) {
  const { toast } = useToast();
  const escondidas = escondidasDoClube(clube.id);
  if (escondidas.length === 0) return null;

  return (
    <section>
      <Titulo icone={<Eye className="h-4 w-4 text-primary" />} texto="Mensagens que você escondeu" />
      <div className="space-y-2">
        {escondidas.map((mensagem) => (
          <div key={mensagem.id} className="rounded-xl bg-white/[0.04] px-3.5 py-3">
            <p className="text-xs leading-relaxed text-white/45 line-clamp-2">{mensagem.texto}</p>
            <button
              onClick={() => {
                desfazerModeracao(mensagem.id);
                toast({ title: "Mensagem devolvida ao mural" });
              }}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary"
            >
              <Undo2 className="h-3 w-3" />
              Devolver ao mural
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================================================================== *
 * 6. Apagar — a única ação sem volta.
 * ================================================================== */

/**
 * **O defeito que isto conserta** (ROTEIRO 4.40): até 28/07 o botão apagava o
 * clube num toque, sem perguntar e sem desfazer — e o aviso ainda dizia *"Você
 * saiu do…"*, quando o clube e o mural inteiro tinham sido destruídos. Ação sem
 * volta pede confirmação que diga o que se perde, e aviso que conte a verdade.
 */
function ApagarOClube({ clube, onApagar }: { clube: ClubeTipo; onApagar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section className="border-t border-white/8 pt-6">
      <button
        onClick={() => setConfirmando(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 py-3 text-xs font-bold text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-200"
        data-testid="button-apagar-clube"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Apagar {clube.nome}
      </button>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent className="border-white/10 bg-[#1c1c1c] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Apagar {clube.nome}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O mural, as pautas e as rodadas do clube vão junto, e isto não tem volta. Os{" "}
              {clube.membros.length === 1 ? "membros" : `${clube.membros.length} membros`} perdem o
              acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white/80 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onApagar}
              className="bg-red-500/90 text-white hover:bg-red-500"
              data-testid="button-confirmar-apagar"
            >
              Apagar o clube
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Titulo({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold tracking-tight">
      {icone}
      {texto}
    </h2>
  );
}
