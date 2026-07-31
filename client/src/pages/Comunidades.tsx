import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

import {
  Bloco,
  BotaoDoForum,
  CAMPO,
  CapaDaComunidade,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORIAS,
  capaDaComunidade,
  configDo,
  forunsVisiveis,
  membrosDo,
  salvarConfig,
  situacaoDe,
} from "@/lib/forum";
import { GRUPOS_EVENT, criarGrupo, topicosDa, type Grupo } from "@/lib/grupos";

/** O Orkut paginava a busca de comunidades. */
const POR_PAGINA = 10;

/** Onde procurar o termo — a roleta "buscar em" do Orkut. */
type Onde = "nome" | "descricao" | "ambos";

/**
 * **Comunidades** (`/forum`) — a busca de comunidades do Orkut.
 *
 * ---
 *
 * ⚠️ **Refeita em 31/07, e o motivo importa.** Eu tinha montado a tela inteira
 * como **grade de quadradinhos**, e o Matheus cobrou: *"quando você clica em
 * Comunidade tem só uns quadradinhos, e eu acho que não era assim no Orkut… não
 * era bem assim que era para você pesquisar na aba de comunidade"*.
 *
 * Ele tem razão, e a confusão foi minha: no Orkut **eram duas coisas diferentes**.
 *
 * - **A grade de miniaturas** era a caixa *"minhas comunidades"* — aquelas de que
 *   você já participa, que você reconhece pela imagem e não precisa ler.
 * - **A busca** devolvia **uma lista**, em linhas: miniatura pequena à esquerda,
 *   **nome em link**, a descrição e *"N membros"*. Porque ali você **não** conhece
 *   as comunidades — precisa ler para escolher, e num quadradinho de 68px não cabe
 *   descrição nenhuma.
 *
 * Por isso esta tela tem as duas formas, cada uma no seu lugar: grade em cima
 * para as suas, **lista** embaixo para descobrir e para o resultado da busca.
 *
 * Do Orkut vêm também: **"buscar em"** (nome · descrição · ambos), o filtro de
 * categoria, a **contagem de resultados** e a **paginação**.
 */
export default function Comunidades() {
  const { toast } = useToast();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [onde, setOnde] = useState<Onde>("ambos");
  const [categoria, setCategoria] = useState("");
  const [criando, setCriando] = useState(false);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const todas = useMemo(() => forunsVisiveis(), [versao]);
  const minhas = todas.filter((grupo) => situacaoDe(grupo.id) === "dentro");

  /** O que a busca devolve — as que você **não** participa, filtradas. */
  const resultados = todas
    .filter((grupo) => situacaoDe(grupo.id) !== "dentro")
    .filter((grupo) => {
      const config = configDo(grupo.id);
      if (categoria && config.categoria !== categoria) return false;
      const termo = busca.trim().toLowerCase();
      if (!termo) return true;
      const noNome = grupo.nome.toLowerCase().includes(termo);
      const naDescricao = grupo.descricao.toLowerCase().includes(termo);
      return onde === "nome" ? noNome : onde === "descricao" ? naDescricao : noNome || naDescricao;
    });

  const paginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA));
  const pagina0 = Math.min(pagina, paginas - 1);
  const visiveis = resultados.slice(pagina0 * POR_PAGINA, pagina0 * POR_PAGINA + POR_PAGINA);

  return (
    <PaginaDoForum titulo="Comunidades" voltarPara="/community" testid="comunidades-page">
      <div className="px-5 pt-4" key={versao}>
        {/* ---------------- a busca ---------------- */}
        <Bloco
          titulo="Buscar comunidades"
          testid="busca-de-comunidades"
          acao={
            <LinkDoForum onClick={() => setCriando((v) => !v)} testid="criar-comunidade">
              criar comunidade »
            </LinkDoForum>
          }
        >
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0);
            }}
            placeholder="nome da comunidade"
            className={CAMPO}
            data-testid="campo-busca"
          />

          {/* "buscar em" — a roleta que o Orkut tinha ao lado do campo. */}
          <div className="mt-2 flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[10px] text-white/35">buscar em</span>
              <select
                value={onde}
                onChange={(e) => setOnde(e.target.value as Onde)}
                className={CAMPO}
                data-testid="buscar-em"
              >
                <option value="ambos">nome e descrição</option>
                <option value="nome">só o nome</option>
                <option value="descricao">só a descrição</option>
              </select>
            </label>
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[10px] text-white/35">categoria</span>
              <select
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setPagina(0);
                }}
                className={CAMPO}
                data-testid="filtro-categoria"
              >
                <option value="">todas</option>
                {CATEGORIAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {criando && <FormularioDeCriacao onPronto={() => setCriando(false)} />}
        </Bloco>

        {/* ---------------- minhas comunidades: a grade ---------------- */}
        {minhas.length > 0 && (
          <Bloco titulo={`Minhas comunidades (${minhas.length})`} testid="minhas-comunidades">
            {/* **Aqui a grade está certa**: são as que você já conhece, e a
                imagem basta para reconhecê-las. */}
            <div className="grid grid-cols-3 gap-3">
              {minhas.map((grupo) => (
                <Link
                  key={grupo.id}
                  href={`/forum/${grupo.id}`}
                  className="text-center"
                  data-testid={`comunidade-${grupo.id}`}
                >
                  <CapaDaComunidade
                    imagem={configDo(grupo.id).imagem}
                    foto={capaDaComunidade(grupo.id)}
                    emoji={grupo.emoji}
                    className="transition-transform hover:scale-[1.03]"
                  />
                  <span className="mt-1.5 block text-[11px] font-medium leading-tight text-white/75">
                    {grupo.nome}
                  </span>
                </Link>
              ))}
            </div>
          </Bloco>
        )}

        {/* ---------------- o resultado: a lista ---------------- */}
        <Bloco
          titulo={busca.trim() || categoria ? "Resultado da busca" : "Comunidades"}
          testid="outras-comunidades"
          acao={
            <span className="text-[10.5px] text-white/35" data-testid="total-de-resultados">
              {resultados.length} {resultados.length === 1 ? "comunidade" : "comunidades"}
            </span>
          }
        >
          {visiveis.length === 0 ? (
            <p className="text-[13px] text-white/40">
              Nenhuma comunidade encontrada
              {busca.trim() && ` para "${busca.trim()}"`}.
            </p>
          ) : (
            <div className="-my-1">
              {visiveis.map((grupo) => (
                <LinhaDaComunidade key={grupo.id} grupo={grupo} />
              ))}
            </div>
          )}

          {paginas > 1 && (
            <p className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
              <span className="text-[10.5px] text-white/35">páginas:</span>
              {Array.from({ length: paginas }, (_, n) => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  className={`text-[11.5px] font-semibold transition-colors ${
                    n === pagina0 ? "text-white" : "text-primary hover:opacity-80"
                  }`}
                  data-testid={`pagina-${n + 1}`}
                >
                  {n + 1}
                </button>
              ))}
            </p>
          )}
        </Bloco>
      </div>
    </PaginaDoForum>
  );

  function FormularioDeCriacao({ onPronto }: { onPronto: () => void }) {
    const [nome, setNome] = useState("");
    const [emoji, setEmoji] = useState("");
    const [descricao, setDescricao] = useState("");
    const [cat, setCat] = useState("");

    return (
      <div
        className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
        data-testid="form-criar"
      >
        <p className="mb-1.5 text-[11px] font-semibold text-white/60">criar uma comunidade</p>
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
            placeholder="💬"
            className={`${CAMPO} w-14 text-center text-[16px]`}
            aria-label="Ícone"
            data-testid="novo-emoji"
          />
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value.slice(0, 60))}
            placeholder="nome da comunidade"
            autoFocus
            className={CAMPO}
            data-testid="novo-nome"
          />
        </div>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value.slice(0, 400))}
          placeholder="sobre o que é esta comunidade?"
          rows={2}
          className={`${CAMPO} mt-2 resize-none`}
          data-testid="nova-descricao"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={`${CAMPO} mt-2`}
          data-testid="nova-categoria"
        >
          <option value="">— categoria —</option>
          {CATEGORIAS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="mt-2.5 flex gap-2">
          <BotaoDoForum
            primario
            disabled={nome.trim().length === 0}
            onClick={() => {
              const novo = criarGrupo(nome, emoji, descricao);
              if (!novo) return;
              if (cat) salvarConfig(novo.id, { categoria: cat });
              onPronto();
              toast({
                title: `"${novo.nome}" criada`,
                description: "Você é o dono — o resto se ajusta em «editar comunidade».",
              });
            }}
            testid="confirmar-criar"
          >
            Criar comunidade
          </BotaoDoForum>
          <BotaoDoForum onClick={onPronto}>Cancelar</BotaoDoForum>
        </div>
      </div>
    );
  }
}

/**
 * Uma comunidade **na lista** — miniatura, nome, descrição e a contagem.
 *
 * É a forma do resultado de busca do Orkut, e ela existe porque **quem procura
 * não conhece**: sem a descrição e sem "N membros", escolher entre dez nomes é
 * chute. A grade de quadradinhos serve para as suas, que você reconhece de
 * relance — é a distinção que a §4.78 registrou.
 */
function LinhaDaComunidade({ grupo }: { grupo: Grupo }) {
  const config = configDo(grupo.id);
  const pessoas = membrosDo(grupo.id).length;
  const topicos = topicosDa(grupo.id).length;

  return (
    <Link
      href={`/forum/${grupo.id}`}
      className="flex gap-3 border-b border-white/[0.06] py-2.5 last:border-0"
      data-testid={`comunidade-${grupo.id}`}
    >
      <CapaDaComunidade
        imagem={config.imagem}
        foto={capaDaComunidade(grupo.id)}
        emoji={grupo.emoji}
        lado={56}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-primary">
          {grupo.nome}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-relaxed text-white/45">
          {grupo.descricao}
        </span>
        <span className="mt-0.5 block text-[10.5px] text-white/30">
          {pessoas} {pessoas === 1 ? "membro" : "membros"} · {topicos}{" "}
          {topicos === 1 ? "tópico" : "tópicos"}
          {config.categoria && ` · ${config.categoria}`}
        </span>
      </span>
    </Link>
  );
}
