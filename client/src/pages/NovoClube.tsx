import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Check, Search } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import EditorDeMarcos from "@/components/clube/EditorDeMarcos";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import {
  criarClube,
  dataCurta,
  diasEntre,
  hojeIso,
  marcosSugeridos,
  somarDiasIso,
  type Marco,
} from "@/lib/clubes";

/** Atalhos de tamanho de turma. O campo ao lado aceita qualquer número. */
const VAGAS: (number | undefined)[] = [undefined, 6, 12, 20];

/** Atalhos de duração. O campo de data ao lado aceita qualquer dia. */
const SEMANAS = [2, 3, 4, 6];

/** Atalhos de estreia. O campo de data ao lado aceita qualquer dia. */
const ESTREIAS = [
  { dias: 0, rotulo: "Hoje" },
  { dias: 3, rotulo: "Em 3 dias" },
  { dias: 7, rotulo: "Em 1 semana" },
];

/**
 * Criar um clube — e, com ele, virar moderador.
 *
 * **A tela mostra os marcos antes de criar, e agora deixa editá-los.** Ver "até
 * o capítulo 3 em 03/08, até o 6 em 10/08…" já dizia se o ritmo era exagerado
 * para o tamanho do livro; faltava poder consertar ali mesmo.
 *
 * **Nada aqui é mais uma lista fechada** (ROTEIRO 4.42). Estreia, tamanho da
 * turma, data do encontro e cada marco aceitam qualquer valor — os botõezinhos
 * viraram **atalhos** que preenchem os campos, não as únicas opções. O pedido do
 * Matheus foi direto: *"o moderador é a chave principal disso aqui, ele tem que
 * ter muita autonomia de como ele quer gerir o clube dele"*. E não custa nada:
 * uma data continua sendo uma data para qualquer servidor futuro.
 *
 * **Não há campo de convidar ninguém**, e isso é honesto: sem contas e sem
 * servidor não existe para quem mandar convite. O clube nasce com você dentro,
 * e a tela diz isso.
 */
export default function NovoClube() {
  const { toast } = useToast();
  const [, navegar] = useLocation();

  /*
    **`?livro=<id>` chega preenchido** (30/07). Quem perde a votação do próximo
    livro é convidado a fundar o clube daquele livro (§4.58), e mandar a pessoa
    para um formulário em branco depois de ela dizer "sim, quero" era perder o
    impulso — ela teria de procurar de novo o livro que acabou de ver na tela.
    O nome também nasce sugerido, porque "Clube de Duna" é melhor ponto de
    partida do que um campo vazio.
  */
  const busca_url = new URLSearchParams(useSearch());
  const livroDaUrl = catalog.find((item) => item.id === Number(busca_url.get("livro")));

  const [nome, setNome] = useState(livroDaUrl ? `Clube de ${livroDaUrl.title}` : "");
  const [descricao, setDescricao] = useState("");
  const [busca, setBusca] = useState("");
  const [bookId, setBookId] = useState<number | null>(livroDaUrl?.id ?? null);
  const [inicio, setInicio] = useState(hojeIso());
  const [fim, setFim] = useState(somarDiasIso(hojeIso(), 28));
  const [limite, setLimite] = useState<number | undefined>(undefined);
  const [privado, setPrivado] = useState(false);
  const [aoVivo, setAoVivo] = useState(false);
  const [marcos, setMarcos] = useState<Marco[]>([]);

  const encontrados = busca.trim()
    ? catalog
        .filter((livro) =>
          `${livro.title} ${livro.author}`.toLowerCase().includes(busca.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const escolhido = bookId !== null ? catalog.find((livro) => livro.id === bookId) : undefined;
  const totalCapitulos = bookId !== null ? getChapters(bookId).length : 0;
  const duracaoEmDias = diasEntre(inicio, fim);

  /*
   * A sugestão se refaz quando muda o livro ou as datas — mas **não** quando o
   * moderador edita um marco à mão: `marcos` não entra nas dependências, senão a
   * edição dele seria desfeita no próximo desenho. Trocar de livro ou de data é
   * mudar a premissa; aí refazer é o certo, e o botão "refazer sugestão" está lá
   * para quem quiser voltar depois de editar.
   */
  useEffect(() => {
    if (bookId === null || duracaoEmDias <= 0) return;
    setMarcos(marcosSugeridos(bookId, inicio, fim));
  }, [bookId, inicio, fim, duracaoEmDias]);

  const podeCriar = nome.trim().length >= 3 && bookId !== null && duracaoEmDias > 0;

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
                  placeholder="Busque pelo título ou pelo autor"
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
                onClick={() => setInicio(somarDiasIso(hojeIso(), opcao.dias))}
                className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${
                  inicio === somarDiasIso(hojeIso(), opcao.dias)
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                }`}
                data-testid={`clube-estreia-${opcao.dias}`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>

          {/*
            **O campo de data livre** (ROTEIRO 4.42). Os três botões continuam
            como atalho — são as escolhas de nove em cada dez clubes —, mas
            deixaram de ser as únicas: quem quer estrear no dia 14 escolhe o dia
            14. Era o próprio Matheus quem apontava a camisa de força: *"ele não
            tem muita autonomia para dizer quando é que o clube começa"*.
          */}
          <input
            type="date"
            min={hojeIso()}
            value={inicio}
            onChange={(e) => e.target.value && setInicio(e.target.value)}
            className="mt-2 w-full rounded-lg bg-white/[0.06] px-3 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/8 [color-scheme:dark] focus:ring-primary/50"
            data-testid="clube-estreia-data"
          />

          {diasEntre(hojeIso(), inicio) > 0 && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              Estreia em {dataCurta(inicio)} — o clube fica na vitrine até lá, e quem entrar antes
              começa junto com você.
            </p>
          )}
        </Campo>

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

          {/* Qualquer número (ROTEIRO 4.42): *"se ele quiser colocar 14 pessoas,
              ele também não consegue"*. Agora consegue. */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11.5px] text-white/45">Ou o número exato:</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={limite ?? ""}
              placeholder="—"
              onChange={(e) => {
                const numero = Number(e.target.value);
                setLimite(e.target.value === "" || numero < 1 ? undefined : Math.round(numero));
              }}
              className="w-20 rounded-lg bg-white/[0.06] px-3 py-2 text-center text-sm font-semibold outline-none ring-1 ring-inset ring-white/8 placeholder:text-white/20 focus:ring-primary/50"
              data-testid="clube-vagas-exato"
            />
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            {limite === undefined
              ? "Qualquer pessoa com o link pode entrar. Dá para pôr um limite depois."
              : `Com ${limite}, todo mundo ainda responde a todo mundo. Dá para mudar depois em Gerenciar.`}
          </p>
        </Campo>

        {/*
          **Como o clube se encontra** (§4.81) e **quem entra**. Os dois nasceram
          da mesma conversa: o Matheus pediu o clube ao vivo e, para defender a
          privacidade da sala, citou um poder de fechar o clube que ainda não
          existia. Ficam aqui, na criação, porque as duas coisas mudam o que a
          turma espera antes de a primeira pessoa entrar.
        */}
        <Campo titulo="Como a turma se encontra">
          <div className="space-y-2">
            <Escolha
              escolhida={!aoVivo}
              onEscolher={() => setAoVivo(false)}
              nome="No ritmo de cada um"
              detalhe="a rodada fica aberta por dias — cada um responde quando der"
              testid="clube-ritmo-livre"
            />
            <Escolha
              escolhida={aoVivo}
              onEscolher={() => setAoVivo(true)}
              nome="Ao vivo, com hora marcada"
              detalhe="a turma ouve junto em sessões marcadas, no mesmo segundo"
              testid="clube-ritmo-ao-vivo"
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            {aoVivo
              ? "A rodada continua existindo e continua sem hora — o ao vivo é um extra, não o substituto."
              : "Dá para marcar uma sessão ao vivo depois, mesmo assim. Isto só escolhe o que o clube oferece primeiro."}
          </p>
        </Campo>

        <Campo titulo="Quem pode entrar">
          <div className="space-y-2">
            <Escolha
              escolhida={!privado}
              onEscolher={() => setPrivado(false)}
              nome="Aberto"
              detalhe="qualquer pessoa entra pelo botão da página do clube"
              testid="clube-porta-aberto"
            />
            <Escolha
              escolhida={privado}
              onEscolher={() => setPrivado(true)}
              nome="Fechado"
              detalhe="entrar vira um pedido, e você aprova um a um"
              testid="clube-porta-fechado"
            />
          </div>
        </Campo>

        {/*
          **Quando acaba virou uma data, não um número de semanas** (ROTEIRO
          4.42). O Matheus: *"nas semanas também, ele não consegue dizer qual é o
          dia que ele quer que acabe"*. Os atalhos de 2/4/6 semanas continuam,
          porque quase todo clube usa um deles — mas agora eles só **preenchem** o
          campo de data, que é quem manda.
        */}
        <Campo titulo="Quando é o encontro">
          <div className="flex gap-2">
            {SEMANAS.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFim(somarDiasIso(inicio, valor * 7))}
                className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${
                  fim === somarDiasIso(inicio, valor * 7)
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                }`}
                data-testid={`clube-semanas-${valor}`}
              >
                {valor} sem.
              </button>
            ))}
          </div>

          <input
            type="date"
            min={inicio}
            value={fim}
            onChange={(e) => e.target.value && setFim(e.target.value)}
            className="mt-2 w-full rounded-lg bg-white/[0.06] px-3 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/8 [color-scheme:dark] focus:ring-primary/50"
            data-testid="clube-encontro-data"
          />

          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            {duracaoEmDias > 0
              ? `${duracaoEmDias} dias de ciclo${escolhido ? ` para ${totalCapitulos} capítulos` : ""}.`
              : "O encontro precisa ser depois da estreia."}
          </p>
        </Campo>

        {bookId !== null && marcos.length > 0 && (
          <Campo titulo="O ritmo, etapa a etapa">
            <EditorDeMarcos
              bookId={bookId}
              inicio={inicio}
              fim={fim}
              marcos={marcos}
              onChange={setMarcos}
            />
          </Campo>
        )}

        <button
          onClick={() => {
            if (!podeCriar || bookId === null) return;
            const estreiaHoje = diasEntre(hojeIso(), inicio) <= 0;
            const clube = criarClube({
              nome,
              descricao,
              bookId,
              inicio,
              encontro: fim,
              marcos,
              limite,
              privado,
              aoVivo,
            });
            toast({
              title: estreiaHoje ? "Clube criado" : "Clube criado — estreia marcada",
              description: estreiaHoje
                ? "Você é o moderador: pode abrir rodadas e cuidar do combinado."
                : `Estreia em ${dataCurta(inicio)} e já aparece em "Começando em breve".`,
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

/** Uma escolha entre poucas — o mesmo desenho da folha de abrir sala. */
function Escolha({
  escolhida,
  onEscolher,
  nome,
  detalhe,
  testid,
}: {
  escolhida: boolean;
  onEscolher: () => void;
  nome: string;
  detalhe: string;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onEscolher}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
        escolhida
          ? "bg-primary/10 ring-1 ring-inset ring-primary/45"
          : "bg-white/[0.035] ring-1 ring-inset ring-white/10 hover:bg-white/[0.06]"
      }`}
      data-testid={testid}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">{nome}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-white/35">{detalhe}</span>
      </span>
      <span
        className={`h-4 w-4 shrink-0 rounded-full ${
          escolhida ? "border-[5px] border-primary" : "border-2 border-white/20"
        }`}
      />
    </button>
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
