import { useState } from "react";

import { BotaoOrkut, Caixa, LinkOrkut } from "@/components/forum/Orkut";
import { useToast } from "@/hooks/use-toast";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import { possoCriar, souModerador } from "@/lib/forum";
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
 * **As enquetes e os eventos de uma comunidade** — as duas outras abas do Orkut.
 *
 * Ficam na página da comunidade, embaixo dos fóruns e na ordem de lá. A trava de
 * quem pode criar cada uma (`possoCriar`) já existia em `forum.ts` desde a
 * primeira etapa, e é aqui que ela passa a ter efeito visível.
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
    <Caixa
      titulo="enquetes"
      testid="caixa-enquetes"
      acao={
        podeCriar ? (
          <LinkOrkut onClick={() => setCriando((v) => !v)} testid="criar-enquete">
            criar enquete »
          </LinkOrkut>
        ) : undefined
      }
    >
      {criando && <NovaEnquete grupoId={grupoId} onPronto={() => setCriando(false)} />}

      {lista.length === 0 ? (
        <p className="text-[#666]">Nenhuma enquete nesta comunidade.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((enquete) => (
            <UmaEnquete key={enquete.id} enquete={enquete} grupoId={grupoId} />
          ))}
        </div>
      )}
    </Caixa>
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
    <div className="border-b border-[#eee] pb-3 last:border-0 last:pb-0" data-testid={`enquete-${enquete.id}`}>
      <p className="font-bold text-[#2b4a80]">{enquete.pergunta}</p>
      <p className="text-[10px] text-[#999]">
        por {minha ? "Você" : (findMember(enquete.autorSlug ?? "")?.name ?? "Alguém")} ·{" "}
        {total} {total === 1 ? "voto" : "votos"}
        {enquete.fechada && " · encerrada"}
      </p>

      <div className="mt-1.5 space-y-1">
        {enquete.opcoes.map((opcao, indice) => {
          const porcento = total === 0 ? 0 : Math.round((votos[indice] / total) * 100);
          const escolhida = meu === indice;
          return (
            <button
              key={indice}
              type="button"
              onClick={() => {
                if (enquete.fechada) return;
                votar(enquete.id, indice);
              }}
              disabled={enquete.fechada}
              className="block w-full text-left"
              data-testid={`opcao-${enquete.id}-${indice}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className={`text-[11px] ${escolhida ? "font-bold text-[#2b4a80]" : "text-[#333]"}`}>
                  {escolhida ? "● " : "○ "}
                  {opcao}
                </span>
                <span className="shrink-0 text-[10px] text-[#888]">
                  {votos[indice]} ({porcento}%)
                </span>
              </span>
              {/* A barra de resultado do Orkut: fina, azul, sem gradiente. */}
              <span className="mt-0.5 block h-[7px] w-full border border-[#c9d7e8] bg-white">
                <span
                  className={`block h-full ${escolhida ? "bg-[#5b7ab5]" : "bg-[#aac0dd]"}`}
                  style={{ width: `${porcento}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {meu !== undefined && !enquete.fechada && (
        <p className="mt-1 text-[10px] text-[#888]">
          Você votou — tocar de novo na mesma opção desfaz.
        </p>
      )}

      {posso && (
        <p className="mt-1 flex gap-2.5 text-[10px]">
          <LinkOrkut
            onClick={() => {
              alternarEnqueteFechada(enquete.id);
              toast({ title: enquete.fechada ? "Enquete reaberta" : "Enquete encerrada" });
            }}
            testid={`fechar-enquete-${enquete.id}`}
          >
            {enquete.fechada ? "reabrir" : "encerrar"}
          </LinkOrkut>
          {minha && (
            <LinkOrkut
              onClick={() => {
                apagarEnquete(enquete.id);
                toast({ title: "Enquete apagada" });
              }}
              testid={`apagar-enquete-${enquete.id}`}
            >
              apagar
            </LinkOrkut>
          )}
        </p>
      )}
    </div>
  );
}

function NovaEnquete({ grupoId, onPronto }: { grupoId: string; onPronto: () => void }) {
  const { toast } = useToast();
  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState<string[]>(["", ""]);

  return (
    <div className="mb-3 border border-[#dcdcdc] bg-[#f8f8f8] p-2" data-testid="form-enquete">
      <p className="mb-1 text-[10px] text-[#666]">pergunta:</p>
      <input
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value.slice(0, MAX_PERGUNTA))}
        autoFocus
        className="w-full border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] focus:border-[#5b7ab5] focus:outline-none"
        data-testid="enquete-pergunta"
      />

      <p className="mb-1 mt-2 text-[10px] text-[#666]">opções:</p>
      <div className="space-y-1">
        {opcoes.map((opcao, indice) => (
          <input
            key={indice}
            value={opcao}
            onChange={(e) => {
              const copia = [...opcoes];
              copia[indice] = e.target.value.slice(0, MAX_OPCAO);
              setOpcoes(copia);
            }}
            placeholder={`opção ${indice + 1}`}
            className="w-full border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] focus:border-[#5b7ab5] focus:outline-none"
            data-testid={`enquete-opcao-${indice}`}
          />
        ))}
      </div>

      {opcoes.length < MAX_OPCOES && (
        <p className="mt-1 text-[10px]">
          <LinkOrkut onClick={() => setOpcoes([...opcoes, ""])} testid="mais-uma-opcao">
            + mais uma opção
          </LinkOrkut>
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <BotaoOrkut
          primario
          disabled={pergunta.trim().length === 0 || opcoes.filter((o) => o.trim()).length < 2}
          onClick={() => {
            const nova = criarEnquete(grupoId, pergunta, opcoes);
            if (!nova) return;
            onPronto();
            toast({ title: "Enquete criada" });
          }}
          testid="publicar-enquete"
        >
          criar enquete
        </BotaoOrkut>
        <BotaoOrkut onClick={onPronto}>cancelar</BotaoOrkut>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Eventos
 * ------------------------------------------------------------------ */

export function Eventos({ grupoId }: { grupoId: string }) {
  const [criando, setCriando] = useState(false);
  const lista = eventosDe(grupoId);
  const podeCriar = possoCriar(grupoId, "eventos");

  if (lista.length === 0 && !podeCriar) return null;

  return (
    <Caixa
      titulo="eventos"
      testid="caixa-eventos"
      acao={
        podeCriar ? (
          <LinkOrkut onClick={() => setCriando((v) => !v)} testid="criar-evento">
            criar evento »
          </LinkOrkut>
        ) : undefined
      }
    >
      {criando && <NovoEvento grupoId={grupoId} onPronto={() => setCriando(false)} />}

      {lista.length === 0 ? (
        <p className="text-[#666]">Nenhum evento marcado.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((evento) => (
            <UmEvento key={evento.id} evento={evento} grupoId={grupoId} />
          ))}
        </div>
      )}
    </Caixa>
  );
}

const RESPOSTAS: { valor: Presenca; rotulo: string }[] = [
  { valor: "vou", rotulo: "vou" },
  { valor: "talvez", rotulo: "talvez" },
  { valor: "nao", rotulo: "não vou" },
];

function UmEvento({ evento, grupoId }: { evento: Evento; grupoId: string }) {
  const { toast } = useToast();
  const presencas = presencasDe(evento);
  const minhaResposta = minhaPresenca(evento.id);
  const meu = evento.autorSlug === undefined;
  const posso = meu || souModerador(grupoId);
  const quando = new Date(`${evento.data}T12:00:00`);
  const passou = quando.getTime() < Date.now() - 86_400_000;

  return (
    <div className="border-b border-[#eee] pb-3 last:border-0 last:pb-0" data-testid={`evento-${evento.id}`}>
      <div className="flex gap-2.5">
        {/* O bloco de data — o Orkut mostrava dia e mês num quadrado. */}
        <div className="w-[42px] shrink-0 border border-[#c9d7e8] text-center">
          <span className="block bg-[#e8eef7] text-[9px] uppercase text-[#2b4a80]">
            {quando.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
          </span>
          <span className="block py-0.5 text-[16px] font-bold leading-none text-[#333]">
            {quando.getDate()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`font-bold ${passou ? "text-[#888]" : "text-[#2b4a80]"}`}>
            {evento.titulo}
            {passou && <span className="ml-1 text-[10px] font-normal">(já passou)</span>}
          </p>
          <p className="text-[10px] text-[#888]">
            {quando.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            {evento.hora && ` · ${evento.hora}`}
            {evento.local && ` · ${evento.local}`}
          </p>
          {evento.descricao && (
            <p className="mt-1 leading-[1.6] text-[#444]">{evento.descricao}</p>
          )}

          {/* As três respostas do Orkut, com a contagem ao lado. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {RESPOSTAS.map(({ valor, rotulo }) => {
              const marcada = minhaResposta === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => responderPresenca(evento.id, valor)}
                  className={`rounded-[3px] border px-2 py-0.5 text-[10px] transition-colors ${
                    marcada
                      ? "border-[#2b4a80] bg-[#5b7ab5] font-bold text-white"
                      : "border-[#a8a8a8] bg-[#f0f0f0] text-[#333] hover:bg-[#e4e4e4]"
                  }`}
                  data-testid={`presenca-${evento.id}-${valor}`}
                >
                  {rotulo} ({presencas[valor].length})
                </button>
              );
            })}
          </div>

          {presencas.vou.length > 0 && (
            <p className="mt-1 text-[10px] text-[#888]" data-testid={`quem-vai-${evento.id}`}>
              vão:{" "}
              {presencas.vou
                .slice(0, 4)
                .map((slug) => (slug === EU ? "Você" : (findMember(slug)?.name ?? "Alguém")))
                .join(", ")}
              {presencas.vou.length > 4 && ` e mais ${presencas.vou.length - 4}`}
            </p>
          )}

          {posso && meu && (
            <p className="mt-1 text-[10px]">
              <LinkOrkut
                onClick={() => {
                  apagarEvento(evento.id);
                  toast({ title: "Evento cancelado" });
                }}
                testid={`apagar-evento-${evento.id}`}
              >
                cancelar evento
              </LinkOrkut>
            </p>
          )}
        </div>
      </div>
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

  const campo =
    "w-full border border-[#b5b5b5] bg-white px-1.5 py-1 text-[11px] focus:border-[#5b7ab5] focus:outline-none";

  return (
    <div className="mb-3 border border-[#dcdcdc] bg-[#f8f8f8] p-2" data-testid="form-evento">
      <div className="space-y-1.5">
        <label className="block">
          <span className="mb-0.5 block text-[10px] text-[#666]">título do evento</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value.slice(0, 120))}
            autoFocus
            className={campo}
            data-testid="evento-titulo"
          />
        </label>
        <div className="flex gap-1.5">
          <label className="flex-1">
            <span className="mb-0.5 block text-[10px] text-[#666]">data</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={campo}
              data-testid="evento-data"
            />
          </label>
          <label className="w-[88px]">
            <span className="mb-0.5 block text-[10px] text-[#666]">hora</span>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={campo}
              data-testid="evento-hora"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-0.5 block text-[10px] text-[#666]">local</span>
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value.slice(0, 120))}
            placeholder="online, ou o endereço"
            className={campo}
            data-testid="evento-local"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] text-[#666]">descrição</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, 500))}
            rows={2}
            className={`${campo} resize-none`}
            data-testid="evento-descricao"
          />
        </label>
      </div>

      <div className="mt-2 flex gap-2">
        <BotaoOrkut
          primario
          disabled={titulo.trim().length === 0 || !data}
          onClick={() => {
            const novo = criarEvento({ grupoId, titulo, data, hora, local, descricao });
            if (!novo) return;
            onPronto();
            toast({ title: "Evento criado" });
          }}
          testid="publicar-evento"
        >
          criar evento
        </BotaoOrkut>
        <BotaoOrkut onClick={onPronto}>cancelar</BotaoOrkut>
      </div>
    </div>
  );
}
