import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Search } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import { criarClube, marcosSemanais, hojeIso, dataCurta, somarDiasIso } from "@/lib/clubes";

/**
 * Quantas pessoas cabem. Para em 20 pelo mesmo motivo que a tela de gerenciar:
 * acima disso a régua da roda deixa de descrever alguém, e o clube passa a
 * precisar de outra ferramenta em vez de um número maior.
 */
const VAGAS: (number | undefined)[] = [undefined, 6, 12, 20];

/** Quantas semanas o ciclo pode ter. Quatro é o padrão de clube de leitura. */
const SEMANAS = [2, 3, 4, 6];

/** Quando o clube estreia. Uma semana é o teto: mais que isso, a turma esquece. */
const ESTREIAS = [
  { dias: 0, rotulo: "Hoje" },
  { dias: 3, rotulo: "Em 3 dias" },
  { dias: 7, rotulo: "Em 1 semana" },
];

/**
 * Criar um clube — e, com ele, virar moderador.
 *
 * **A tela mostra os marcos antes de criar.** Escolher "4 semanas" não diz
 * nada; ver "até o capítulo 3 em 03/08, até o 6 em 10/08…" diz tudo — inclusive
 * se o ritmo é exagerado para o tamanho do livro. É a diferença entre um
 * formulário e uma decisão informada.
 *
 * **Não há campo de convidar ninguém**, e isso é honesto: sem contas e sem
 * servidor não existe para quem mandar convite. O clube nasce com você dentro,
 * e a tela diz isso.
 */
export default function NovoClube() {
  const { toast } = useToast();
  const [, navegar] = useLocation();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [busca, setBusca] = useState("");
  const [bookId, setBookId] = useState<number | null>(null);
  const [semanas, setSemanas] = useState(4);
  const [comecaEm, setComecaEm] = useState(0);
  const [limite, setLimite] = useState<number | undefined>(undefined);

  const encontrados = busca.trim()
    ? catalog
        .filter((livro) =>
          `${livro.title} ${livro.author}`.toLowerCase().includes(busca.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const escolhido = bookId !== null ? catalog.find((livro) => livro.id === bookId) : undefined;
  // Os marcos saem da data de estreia, não de hoje: marcar "em 1 semana" tem de
  // empurrar todos os prazos junto, senão a prévia mentiria.
  const inicio = comecaEm === 0 ? hojeIso() : somarDiasIso(hojeIso(), comecaEm);
  const marcos = bookId !== null ? marcosSemanais(bookId, semanas, inicio) : [];
  const podeCriar = nome.trim().length >= 3 && bookId !== null;

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="novo-clube-page">
      <PageHeader title="Criar um clube" fallback="/clubes" />

      <div className="space-y-6 px-5 pt-4">
        <Campo titulo="Nome do clube">
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value.slice(0, 40))}
            placeholder="Clube do Mistério de Terça"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
            data-testid="clube-nome"
          />
        </Campo>

        <Campo titulo="Do que é o clube" opcional>
          <textarea
            value={descricao}
            onChange={(event) => setDescricao(event.target.value.slice(0, 200))}
            placeholder="Uma linha que diga a quem serve — e o que a turma combina."
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
            data-testid="clube-descricao"
          />
        </Campo>

        <Campo titulo="O livro do primeiro ciclo">
          {escolhido ? (
            <button
              type="button"
              onClick={() => {
                setBookId(null);
                setBusca("");
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.08] p-3 text-left"
              data-testid="clube-livro-escolhido"
            >
              <img
                src={escolhido.cover}
                alt={escolhido.title}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{escolhido.title}</span>
                <span className="block truncate text-[11px] text-white/45">
                  {escolhido.author} · {getChapters(escolhido.id).length} capítulos
                </span>
              </span>
              <Check className="h-4 w-4 shrink-0 text-primary" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-white/30" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Procure pelo título ou pelo autor"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                  data-testid="clube-busca-livro"
                />
              </div>

              <div className="mt-2 space-y-1.5">
                {encontrados.map((livro) => (
                  <button
                    key={livro.id}
                    type="button"
                    onClick={() => setBookId(livro.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.06]"
                    data-testid={`clube-livro-${livro.id}`}
                  >
                    <img
                      src={livro.cover}
                      alt={livro.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{livro.title}</span>
                      <span className="block truncate text-[11px] text-white/35">
                        {livro.author}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Campo>

        {/*
          **Quando começa** vem antes de "em quantas semanas" de propósito: é a
          decisão que muda o clube de figura. Começar hoje serve a quem já vai
          ouvir; marcar para daqui a alguns dias é o que dá tempo de **juntar
          gente** — o clube aparece em "Começando em breve" e todo mundo entra
          no mesmo ponto, em vez de chegar com a turma no capítulo 6.
        */}
        <Campo titulo="Quando começa">
          <div className="flex gap-2">
            {ESTREIAS.map((opcao) => (
              <button
                key={opcao.dias}
                type="button"
                onClick={() => setComecaEm(opcao.dias)}
                className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${
                  comecaEm === opcao.dias
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                }`}
                data-testid={`clube-estreia-${opcao.dias}`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
          {comecaEm > 0 && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              O clube fica na vitrine de estreias até lá — quem entrar antes começa junto com você.
            </p>
          )}
        </Campo>

        {/*
          **Vagas na criação** (ROTEIRO 4.40, pedido do Matheus em 28/07). Fica
          aqui, e não só em Gerenciar, porque o tamanho do clube é uma decisão de
          intenção: quem quer uma turma de quatro pensa nisso ao fundar, não
          depois de dez pessoas terem entrado. O padrão é sem limite — clube
          nasce querendo gente.
        */}
        <Campo titulo="Quantas pessoas cabem">
          <div className="flex gap-2">
            {VAGAS.map((valor) => (
              <button
                key={valor ?? "livre"}
                type="button"
                onClick={() => setLimite(valor)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  limite === valor
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                }`}
                data-testid={`clube-vagas-${valor ?? "livre"}`}
              >
                {valor ?? "Sem limite"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            {limite === undefined
              ? "Qualquer pessoa com o link pode entrar. Dá para pôr um limite depois."
              : `Com ${limite}, todo mundo ainda responde a todo mundo. Dá para mudar depois em Gerenciar.`}
          </p>
        </Campo>

        <Campo titulo="Em quantas semanas">
          <div className="flex gap-2">
            {SEMANAS.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => setSemanas(valor)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  semanas === valor
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                }`}
                data-testid={`clube-semanas-${valor}`}
              >
                {valor}
              </button>
            ))}
          </div>

          {marcos.length > 0 && (
            <div className="mt-3 rounded-lg bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                O ritmo ficaria assim
              </p>
              <ul className="mt-2 space-y-1">
                {marcos.map((marco) => (
                  <li key={marco.id} className="text-xs text-white/55">
                    Semana {marco.id}: até o capítulo{" "}
                    <b className="text-white/85">{marco.chapter}</b>, em {dataCurta(marco.prazo)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Campo>

        <button
          onClick={() => {
            if (!podeCriar || bookId === null) return;
            const clube = criarClube({ nome, descricao, bookId, semanas, comecaEm, limite });
            toast({
              title: comecaEm === 0 ? "Clube criado" : "Clube criado — estreia marcada",
              description:
                comecaEm === 0
                  ? "Você é o moderador: pode abrir rodadas e cuidar do combinado."
                  : `Ele já aparece em "Começando em breve". Convide gente pelo botão do clube.`,
            });
            navegar(`/clube/${clube.id}`);
          }}
          disabled={!podeCriar}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-black transition-colors hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/25"
          data-testid="button-criar-clube"
        >
          Criar clube
        </button>

        <p className="text-center text-[10.5px] leading-relaxed text-white/25">
          O clube nasce só com você. Convidar gente de verdade só vai existir quando houver contas e
          servidor — até lá, os outros membros do app são leitores fictícios.
        </p>
      </div>
    </div>
  );
}

function Campo({
  titulo,
  opcional,
  children,
}: {
  titulo: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        {titulo}
        {opcional && <span className="ml-1.5 font-normal normal-case text-white/25">opcional</span>}
      </p>
      {children}
    </div>
  );
}
