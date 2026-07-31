import { useEffect, useState } from "react";
import { Link } from "wouter";

import { AvatarDoForum, Bloco, BotaoDoForum, CAMPO, LinkDoForum } from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import {
  EU,
  clubeCheio,
  clubePorId,
  dataCurta,
  entrarNoClube,
  estaComecando,
  meusClubes,
  souMembro,
  todosOsClubes,
} from "@/lib/clubes";
import { findMember } from "@/lib/community";
import {
  convidarParaEvento,
  podeConvidarParaEvento,
  quemPossoConvidar,
} from "@/lib/convitesDeEvento";
import { possoCriar, souModerador } from "@/lib/forum";
import { GRUPOS_EVENT } from "@/lib/grupos";
import {
  MAX_OPCAO,
  MAX_OPCOES,
  MAX_PERGUNTA,
  alternarEnqueteFechada,
  apagarEnquete,
  apagarEvento,
  criarEnquete,
  criarEvento,
  enquetesDe,
  eventosDe,
  meuVoto,
  minhaPresenca,
  presencasDe,
  responderPresenca,
  votar,
  votosDe,
  type Enquete,
  type Evento,
  type Presenca,
} from "@/lib/forumConteudo";

/**
 * **As enquetes e os eventos de uma comunidade** — as duas outras abas do Orkut,
 * com a pele do AllBook.
 *
 * A mecânica é a de lá e não mudou na troca de aparência (§4.74): um voto por
 * pessoa que **muda de ideia**, barra com porcentagem, encerrar; e evento com
 * **vou · talvez · não vou**. O que mudou é o desenho — barra laranja, cartão
 * escuro, botões de pílula.
 *
 * A trava de quem pode criar (`possoCriar`) vive em `forum.ts` e é o que a tela
 * de gerenciar controla.
 */

/* ------------------------------------------------------------------ *
 * Enquetes
 * ------------------------------------------------------------------ */

export function Enquetes({ grupoId }: { grupoId: string }) {
  const [criando, setCriando] = useState(false);
  const lista = enquetesDe(grupoId);
  const podeCriar = possoCriar(grupoId, "enquetes");

  if (lista.length === 0 && !podeCriar) return null;

  return (
    <Bloco
      titulo="Enquetes"
      testid="caixa-enquetes"
      acao={
        podeCriar ? (
          <LinkDoForum onClick={() => setCriando((v) => !v)} testid="criar-enquete">
            Criar enquete
          </LinkDoForum>
        ) : undefined
      }
    >
      {criando && <NovaEnquete grupoId={grupoId} onPronto={() => setCriando(false)} />}

      {lista.length === 0 ? (
        <p className="text-[13px] text-white/40">Nenhuma enquete nesta comunidade.</p>
      ) : (
        <div className="space-y-4">
          {lista.map((enquete) => (
            <UmaEnquete key={enquete.id} enquete={enquete} grupoId={grupoId} />
          ))}
        </div>
      )}
    </Bloco>
  );
}

function UmaEnquete({ enquete, grupoId }: { enquete: Enquete; grupoId: string }) {
  const { toast } = useToast();
  const votos = votosDe(enquete);
  const meu = meuVoto(enquete.id);
  const total = votos.reduce((soma, n) => soma + n, 0);
  const minha = enquete.autorSlug === undefined;
  const posso = minha || souModerador(grupoId);

  return (
    <div
      className="border-b border-white/[0.06] pb-4 last:border-0 last:pb-0"
      data-testid={`enquete-${enquete.id}`}
    >
      <p className="text-[14px] font-semibold leading-snug">{enquete.pergunta}</p>
      <p className="mt-0.5 text-[11px] text-white/35">
        {minha ? "Você" : (findMember(enquete.autorSlug ?? "")?.name ?? "Alguém")} · {total}{" "}
        {total === 1 ? "voto" : "votos"}
        {enquete.fechada && " · encerrada"}
      </p>

      <div className="mt-2.5 space-y-2">
        {enquete.opcoes.map((opcao, indice) => {
          const porcento = total === 0 ? 0 : Math.round((votos[indice] / total) * 100);
          const escolhida = meu === indice;
          return (
            <button
              key={indice}
              type="button"
              onClick={() => {
                if (!enquete.fechada) votar(enquete.id, indice);
              }}
              disabled={enquete.fechada}
              className="block w-full text-left"
              data-testid={`opcao-${enquete.id}-${indice}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-[12.5px] ${escolhida ? "font-semibold text-white" : "text-white/70"}`}
                >
                  {opcao}
                </span>
                <span className="shrink-0 text-[11px] text-white/35">
                  {votos[indice]} · {porcento}%
                </span>
              </span>
              {/* A barra: laranja na sua escolha, branca apagada nas outras. */}
              <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <span
                  className={`block h-full rounded-full transition-all ${
                    escolhida ? "bg-primary" : "bg-white/25"
                  }`}
                  style={{ width: `${porcento}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {meu !== undefined && !enquete.fechada && (
        <p className="mt-1.5 text-[10.5px] text-white/30">
          Você votou — tocar de novo na mesma opção desfaz.
        </p>
      )}

      {posso && (
        <div className="mt-2 flex gap-3">
          <LinkDoForum
            onClick={() => {
              alternarEnqueteFechada(enquete.id);
              toast({ title: enquete.fechada ? "Enquete reaberta" : "Enquete encerrada" });
            }}
            className="text-[10.5px] text-white/35 hover:text-white/70"
            testid={`fechar-enquete-${enquete.id}`}
          >
            {enquete.fechada ? "reabrir" : "encerrar"}
          </LinkDoForum>
          {minha && (
            <LinkDoForum
              onClick={() => {
                apagarEnquete(enquete.id);
                toast({ title: "Enquete apagada" });
              }}
              className="text-[10.5px] text-white/35 hover:text-red-300"
              testid={`apagar-enquete-${enquete.id}`}
            >
              apagar
            </LinkDoForum>
          )}
        </div>
      )}
    </div>
  );
}

function NovaEnquete({ grupoId, onPronto }: { grupoId: string; onPronto: () => void }) {
  const { toast } = useToast();
  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState<string[]>(["", ""]);

  return (
    <div
      className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
      data-testid="form-enquete"
    >
      <input
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value.slice(0, MAX_PERGUNTA))}
        placeholder="A pergunta da enquete…"
        autoFocus
        className={CAMPO}
        data-testid="enquete-pergunta"
      />

      <div className="mt-2 space-y-1.5">
        {opcoes.map((opcao, indice) => (
          <input
            key={indice}
            value={opcao}
            onChange={(e) => {
              const copia = [...opcoes];
              copia[indice] = e.target.value.slice(0, MAX_OPCAO);
              setOpcoes(copia);
            }}
            placeholder={`Opção ${indice + 1}`}
            className={CAMPO}
            data-testid={`enquete-opcao-${indice}`}
          />
        ))}
      </div>

      {opcoes.length < MAX_OPCOES && (
        <div className="mt-2">
          <LinkDoForum onClick={() => setOpcoes([...opcoes, ""])} testid="mais-uma-opcao">
            + mais uma opção
          </LinkDoForum>
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <BotaoDoForum onClick={onPronto}>Cancelar</BotaoDoForum>
        <BotaoDoForum
          primario
          disabled={pergunta.trim().length === 0 || opcoes.filter((o) => o.trim()).length < 2}
          onClick={() => {
            if (criarEnquete(grupoId, pergunta, opcoes)) {
              onPronto();
              toast({ title: "Enquete criada" });
            }
          }}
          testid="publicar-enquete"
        >
          Criar enquete
        </BotaoDoForum>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Eventos
 * ------------------------------------------------------------------ */

export function Eventos({ grupoId }: { grupoId: string }) {
  const [criando, setCriando] = useState(false);
  /* A resposta de quem você convidou chega **segundos depois**, de fora do
     React (`convitesDeEvento.ts`). Sem escutar o evento, a contagem de "vou" só
     mudaria ao recarregar a página. */
  const [, setVersao] = useState(0);
  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const lista = eventosDe(grupoId);
  const podeCriar = possoCriar(grupoId, "eventos");

  if (lista.length === 0 && !podeCriar) return null;

  return (
    <Bloco
      titulo="Eventos"
      testid="caixa-eventos"
      acao={
        podeCriar ? (
          <LinkDoForum onClick={() => setCriando((v) => !v)} testid="criar-evento">
            Criar evento
          </LinkDoForum>
        ) : undefined
      }
    >
      {criando && <NovoEvento grupoId={grupoId} onPronto={() => setCriando(false)} />}

      {lista.length === 0 ? (
        <p className="text-[13px] text-white/40">Nenhum evento marcado.</p>
      ) : (
        <div className="space-y-4">
          {lista.map((evento) => (
            <UmEvento key={evento.id} evento={evento} grupoId={grupoId} />
          ))}
        </div>
      )}
    </Bloco>
  );
}

const RESPOSTAS: { valor: Presenca; rotulo: string }[] = [
  { valor: "vou", rotulo: "Vou" },
  { valor: "talvez", rotulo: "Talvez" },
  { valor: "nao", rotulo: "Não vou" },
];

function UmEvento({ evento, grupoId }: { evento: Evento; grupoId: string }) {
  const { toast } = useToast();
  const [convidando, setConvidando] = useState(false);
  const presencas = presencasDe(evento);
  const minhaResposta = minhaPresenca(evento.id);
  const meu = evento.autorSlug === undefined;
  const posso = meu || souModerador(grupoId);
  const quando = new Date(`${evento.data}T12:00:00`);
  const passou = quando.getTime() < Date.now() - 86_400_000;

  return (
    <div
      className="border-b border-white/[0.06] pb-4 last:border-0 last:pb-0"
      data-testid={`evento-${evento.id}`}
    >
      <div className="flex gap-3">
        {/* O bloco de data — a mesma peça do Orkut, com a cor da casa. */}
        <div
          className={`w-[46px] shrink-0 overflow-hidden rounded-xl text-center ring-1 ring-inset ${
            passou ? "opacity-40 ring-white/10" : "ring-primary/25"
          }`}
        >
          <span className="block bg-primary/15 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-primary">
            {quando.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
          </span>
          <span className="block py-1 font-display text-[18px] font-bold leading-none">
            {quando.getDate()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-[14px] font-semibold leading-snug ${passou ? "text-white/45" : ""}`}>
            {evento.titulo}
            {passou && <span className="ml-1.5 text-[10.5px] font-normal">já passou</span>}
          </p>
          <p className="mt-0.5 text-[11px] text-white/35">
            {quando.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            {evento.hora && ` · ${evento.hora}`}
            {evento.local && ` · ${evento.local}`}
          </p>
          {evento.descricao && (
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{evento.descricao}</p>
          )}

          {/* A ponte com o clube (31/07) — o evento chama para uma turma. */}
          {evento.clubeId && <ClubeDoEvento clubeId={evento.clubeId} />}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {RESPOSTAS.map(({ valor, rotulo }) => {
              const marcada = minhaResposta === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => responderPresenca(evento.id, valor)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    marcada
                      ? "bg-primary text-black"
                      : "border border-white/15 text-white/55 hover:text-white/85"
                  }`}
                  data-testid={`presenca-${evento.id}-${valor}`}
                >
                  {rotulo} · {presencas[valor].length}
                </button>
              );
            })}
          </div>

          {presencas.vou.length > 0 && (
            <p className="mt-1.5 text-[10.5px] text-white/30" data-testid={`quem-vai-${evento.id}`}>
              vão:{" "}
              {presencas.vou
                .slice(0, 4)
                .map((slug) => (slug === EU ? "Você" : (findMember(slug)?.name ?? "Alguém")))
                .join(", ")}
              {presencas.vou.length > 4 && ` e mais ${presencas.vou.length - 4}`}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap gap-3">
            {!passou && (
              <LinkDoForum
                onClick={() => setConvidando((v) => !v)}
                className="text-[10.5px] text-white/35 hover:text-primary"
                testid={`convidar-evento-${evento.id}`}
              >
                convidar alguém »
              </LinkDoForum>
            )}
            {posso && meu && (
              <LinkDoForum
                onClick={() => {
                  apagarEvento(evento.id);
                  toast({ title: "Evento cancelado" });
                }}
                className="text-[10.5px] text-white/35 hover:text-red-300"
                testid={`apagar-evento-${evento.id}`}
              >
                cancelar evento
              </LinkDoForum>
            )}
          </div>

          {convidando && <ConvidarParaEvento evento={evento} />}
        </div>
      </div>
    </div>
  );
}

/**
 * **O clube dentro do evento** — a ponte que o Matheus pediu em 31/07.
 *
 * Uma linha só: a capa do livro que a turma lê, o nome do clube e a saída certa
 * para cada caso. **Nenhuma delas é beco sem saída** (§4.23): quem já está
 * dentro vê que está; quem não está e cabe, entra dali mesmo; e quando o clube
 * está cheio o link leva à página do clube, onde existe a fila de espera — o
 * que não pode é um botão "entrar" que só sabe dizer não.
 */
function ClubeDoEvento({ clubeId }: { clubeId: string }) {
  const { toast } = useToast();
  const [versao, setVersao] = useState(0);
  /* `versao` só existe para reler depois de entrar — o dado mora no
     localStorage, não no estado. */
  const clube = versao >= 0 ? clubePorId(clubeId) : undefined;
  if (!clube) return null;

  const membro = souMembro(clube);
  const cheio = clubeCheio(clube);
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);

  return (
    <div
      className="mt-2 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] p-2"
      data-testid={`clube-do-evento-${clubeId}`}
    >
      {livro && (
        <img src={livro.cover} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/clube/${clube.id}`}
          className="block truncate text-[12.5px] font-semibold text-primary"
        >
          {clube.nome}
        </Link>
        <p className="truncate text-[10.5px] text-white/35">
          {clube.membros.length} {clube.membros.length === 1 ? "pessoa" : "pessoas"}
          {estaComecando(clube)
            ? ` · começa em ${dataCurta(clube.ciclo.inicio)}`
            : livro
              ? ` · lendo ${livro.title}`
              : ""}
        </p>
      </div>

      {membro ? (
        <span className="shrink-0 text-[10.5px] text-white/30">você está dentro</span>
      ) : cheio ? (
        <Link
          href={`/clube/${clube.id}`}
          className="shrink-0 text-[11px] font-semibold text-primary"
          data-testid={`ver-clube-${clubeId}`}
        >
          ver o clube ›
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            entrarNoClube(clube.id);
            setVersao((n) => n + 1);
            toast({
              title: `Você entrou no ${clube.nome}`,
              description: estaComecando(clube)
                ? `A conversa começa em ${dataCurta(clube.ciclo.inicio)} — todo mundo do mesmo ponto.`
                : "O combinado da roda passa a valer para você.",
            });
          }}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-black transition-colors hover:bg-primary/90"
          data-testid={`entrar-clube-${clubeId}`}
        >
          Entrar no clube
        </button>
      )}
    </div>
  );
}

/**
 * **Convidar alguém para o evento** (31/07).
 *
 * A lista e as regras vivem em `convitesDeEvento.ts`; aqui só a folha. Quem não
 * pode ser convidado **continua na lista com o motivo ao lado** — sumir com a
 * pessoa faria parecer que o app esqueceu dela.
 */
function ConvidarParaEvento({ evento }: { evento: Evento }) {
  const { toast } = useToast();
  const [versao, setVersao] = useState(0);
  const pessoas = versao >= 0 ? quemPossoConvidar(evento) : [];

  return (
    <div
      className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
      data-testid={`lista-convidar-${evento.id}`}
    >
      <p className="mb-1.5 text-[11px] font-semibold text-white/60">
        chamar para {evento.clubeId ? "o encontro do clube" : "o evento"}
      </p>

      {pessoas.length === 0 ? (
        <p className="text-[11.5px] leading-relaxed text-white/40">
          Não há ninguém para chamar ainda — entre na comunidade ou siga alguém, e essas pessoas
          aparecem aqui.
        </p>
      ) : (
        <div className="max-h-[210px] space-y-1 overflow-y-auto pr-1">
          {pessoas.map((slug) => {
            const pessoa = findMember(slug);
            const veredito = podeConvidarParaEvento(evento.id, slug);

            return (
              <div key={slug} className="flex items-center gap-2 py-1">
                <AvatarDoForum
                  nome={pessoa?.name ?? "Alguém"}
                  slug={slug}
                  cor={pessoa?.color}
                  tamanho={28}
                />
                <span className="min-w-0 flex-1 truncate text-[12px]">
                  {pessoa?.name ?? "Alguém"}
                </span>

                {veredito.pode ? (
                  <BotaoDoForum
                    onClick={() => {
                      if (!convidarParaEvento(evento.id, slug)) return;
                      setVersao((n) => n + 1);
                      toast({
                        title: `Convite enviado a ${pessoa?.name.split(" ")[0] ?? "alguém"}`,
                        description: "A resposta aparece aqui e no sino.",
                      });
                    }}
                    testid={`convidar-${evento.id}-${slug}`}
                  >
                    Convidar
                  </BotaoDoForum>
                ) : (
                  <span className="shrink-0 text-[10.5px] text-white/30">{veredito.motivo}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NovoEvento({ grupoId, onPronto }: { grupoId: string; onPronto: () => void }) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clubeId, setClubeId] = useState("");

  const meus = meusClubes();
  const outros = todosOsClubes().filter((clube) => !meus.some((meu) => meu.id === clube.id));

  return (
    <div
      className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
      data-testid="form-evento"
    >
      <div className="space-y-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value.slice(0, 120))}
          placeholder="O que vai acontecer?"
          autoFocus
          className={CAMPO}
          data-testid="evento-titulo"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className={`${CAMPO} flex-1`}
            data-testid="evento-data"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={`${CAMPO} w-[104px]`}
            data-testid="evento-hora"
          />
        </div>
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value.slice(0, 120))}
          placeholder="Onde? (online, ou o endereço)"
          className={CAMPO}
          data-testid="evento-local"
        />
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value.slice(0, 500))}
          placeholder="Detalhes (opcional)"
          rows={2}
          className={`${CAMPO} resize-none`}
          data-testid="evento-descricao"
        />

        {/* O anexo do clube — mesmo espírito do trecho que se anexa num post. */}
        <label className="block">
          <span className="mb-1 block text-[10px] text-white/35">
            este evento é sobre um clube? (opcional)
          </span>
          <select
            value={clubeId}
            onChange={(e) => setClubeId(e.target.value)}
            className={CAMPO}
            data-testid="evento-clube"
          >
            <option value="">— nenhum clube —</option>
            {meus.length > 0 && (
              <optgroup label="meus clubes">
                {meus.map((clube) => (
                  <option key={clube.id} value={clube.id}>
                    {clube.nome}
                  </option>
                ))}
              </optgroup>
            )}
            {outros.length > 0 && (
              <optgroup label="outros clubes">
                {outros.map((clube) => (
                  <option key={clube.id} value={clube.id}>
                    {clube.nome}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {clubeId && (
            <span className="mt-1 block text-[10.5px] leading-relaxed text-white/35">
              O clube aparece dentro do evento, com o botão de entrar — e este evento passa a
              aparecer na página do clube.
            </span>
          )}
        </label>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <BotaoDoForum onClick={onPronto}>Cancelar</BotaoDoForum>
        <BotaoDoForum
          primario
          disabled={titulo.trim().length === 0 || !data}
          onClick={() => {
            if (criarEvento({ grupoId, titulo, data, hora, local, descricao, clubeId })) {
              onPronto();
              toast({ title: "Evento criado" });
            }
          }}
          testid="publicar-evento"
        >
          Criar evento
        </BotaoDoForum>
      </div>
    </div>
  );
}
