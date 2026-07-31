import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, X } from "lucide-react";

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
  categoriaDe,
  configDo,
  forunsVisiveis,
  iconeDaCategoria,
  membrosDo,
  salvarConfig,
  situacaoDe,
} from "@/lib/forum";
import {
  acontecendoAgora,
  emAlta,
  haQuantoTempo,
  numerosDoForum,
  porCategoria,
  sugestoes,
} from "@/lib/forumVitrine";
import { GRUPOS_EVENT, criarGrupo, topicosDa, type Grupo } from "@/lib/grupos";

/** O Orkut paginava a busca de comunidades. */
const POR_PAGINA = 10;

/** Quantas das suas a grade mostra antes do "ver todas" (§4.92). */
const RESUMO_DE_MINHAS = 6;

/**
 * **Comunidades** (`/forum`) — a porta de entrada dos fóruns.
 *
 * ---
 *
 * ⚠️ **Refeita duas vezes, e os dois motivos ficam registrados.**
 *
 * **31/07, manhã (§4.78):** a tela era só grade de quadradinhos. Virou grade
 * para *minhas comunidades* (você reconhece pela imagem) e **lista** para a
 * busca (você precisa ler a descrição para escolher).
 *
 * **31/07, tarde (§4.82):** o Matheus voltou: *"eu acho essa primeira janela
 * muito crua… sem vida nenhuma"*. E estava: campo de busca, grade, lista — nada
 * dizendo que existe gente do outro lado. A tela agora tem **dois estados**:
 *
 * - **sem busca — a vitrine**: o que está acontecendo agora, quem está em alta
 *   esta semana, as suas, as sugeridas com motivo, as categorias com contagem,
 *   todas as comunidades e os números do fórum;
 * - **com busca (ou categoria escolhida) — o resultado**: só a lista, com a
 *   contagem e a paginação, e um jeito claro de limpar.
 *
 * **Saiu o "buscar em" (nome · descrição · ambos)**, que era fidelidade ao
 * Orkut sem serventia aqui: ninguém sabe de antemão se a palavra que lembra
 * está no nome ou na descrição, e a roleta era parte do que ele chamou de cru.
 * A busca olha os dois, sempre.
 */
export default function Comunidades() {
  const { toast } = useToast();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  /* `?criar=1` já abre o formulário: é como o "Criar comunidade" do menu “…” da
     Comunidade chega aqui, sem inventar uma segunda tela de criação (§4.92). */
  const [criando, setCriando] = useState(
    () => new URLSearchParams(window.location.search).get("criar") === "1",
  );
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const todas = useMemo(() => forunsVisiveis(), [versao]);
  const minhas = todas.filter((grupo) => situacaoDe(grupo.id) === "dentro");
  const termo = busca.trim().toLowerCase();
  const procurando = termo.length > 0 || categoria.length > 0;

  /** O resultado da busca — todas as comunidades que casam com o filtro. */
  const resultados = todas.filter((grupo) => {
    if (categoria && categoriaDe(grupo.id) !== categoria) return false;
    if (!termo) return true;
    return (
      grupo.nome.toLowerCase().includes(termo) || grupo.descricao.toLowerCase().includes(termo)
    );
  });

  /** Fora da busca, a lista de baixo mostra as que você **não** participa. */
  const paraDescobrir = todas.filter((grupo) => situacaoDe(grupo.id) !== "dentro");
  const lista = procurando ? resultados : paraDescobrir;

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pagina0 = Math.min(pagina, paginas - 1);
  const visiveis = lista.slice(pagina0 * POR_PAGINA, pagina0 * POR_PAGINA + POR_PAGINA);

  const destaques = procurando ? [] : emAlta(6);
  const agora = procurando ? [] : acontecendoAgora(4);
  const sugeridas = procurando ? [] : sugestoes(3);
  const categorias = porCategoria();
  /* A roleta é para **achar uma categoria que você já tem em mente** — e para
     isso a ordem alfabética ganha da ordem por tamanho, que é a das pastilhas. */
  const categoriasAZ = [...categorias].sort((a, b) => a.categoria.localeCompare(b.categoria));
  const numeros = numerosDoForum();

  function limpar() {
    setBusca("");
    setCategoria("");
    setPagina(0);
  }

  return (
    <PaginaDoForum titulo="Comunidades" voltarPara="/community" testid="comunidades-page">
      <div className="px-5 pt-4">
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(0);
              }}
              placeholder="nome ou assunto da comunidade"
              className={`${CAMPO} pl-8`}
              data-testid="campo-busca"
            />
          </div>

          {/*
            **A roleta de categoria voltou** (31/07, pedido dele: *"eu gostava
            dos ícones que estavam de categoria, de você buscar por categoria"*).
            Ela some do caminho de quem só quer digitar, mas dá o **atalho para
            as 36** — nas pastilhas, achar uma categoria específica exige varrer
            a lista com o olho; aqui é uma rolagem só, em ordem alfabética, com
            o número de comunidades ao lado.
          */}
          <label className="mt-2 block">
            <span className="mb-1 block text-[10px] text-white/35">buscar por categoria</span>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setPagina(0);
              }}
              className={CAMPO}
              data-testid="filtro-categoria"
            >
              <option value="">todas as categorias</option>
              {categoriasAZ.map((item) => (
                <option key={item.categoria} value={item.categoria}>
                  {iconeDaCategoria(item.categoria)} {item.categoria} ({item.total})
                </option>
              ))}
            </select>
          </label>

          {/* O filtro em uso aparece também como pastilha, com o X que o desfaz. */}
          {procurando && (
            <p className="mt-2 flex flex-wrap items-center gap-2">
              {categoria && (
                <button
                  onClick={() => setCategoria("")}
                  className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary"
                  data-testid="limpar-categoria"
                >
                  {categoria}
                  <X className="h-3 w-3" />
                </button>
              )}
              <span className="text-[11px] text-white/35">
                {resultados.length}{" "}
                {resultados.length === 1 ? "comunidade encontrada" : "comunidades encontradas"}
              </span>
              <LinkDoForum
                onClick={limpar}
                className="text-[11px] text-white/35 hover:text-primary"
                testid="limpar-busca"
              >
                limpar
              </LinkDoForum>
            </p>
          )}

          {criando && <FormularioDeCriacao onPronto={() => setCriando(false)} />}
        </Bloco>

        {/* ---------------- acontecendo agora ---------------- */}
        {agora.length > 0 && (
          <Bloco
            titulo="Acontecendo agora"
            testid="acontecendo-agora"
            acao={<span className="text-[10.5px] text-white/35">últimas conversas</span>}
          >
            <div className="-my-1">
              {agora.map(({ grupo, topico }) => (
                <Link
                  key={topico.id}
                  href={`/forum/${grupo.id}/topico/${topico.id}`}
                  className="block border-b border-white/[0.06] py-2 last:border-0"
                  data-testid={`agora-${topico.id}`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {topico.titulo}
                    </span>
                    <span className="shrink-0 text-[10px] text-white/25">
                      {haQuantoTempo(topico.ultimaAtividade)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-white/35">
                    <span className="text-primary">
                      {grupo.emoji} {grupo.nome}
                    </span>
                    {" · "}
                    {topico.totalRespostas}{" "}
                    {topico.totalRespostas === 1 ? "mensagem" : "mensagens"}
                  </span>
                </Link>
              ))}
            </div>
          </Bloco>
        )}

        {/* ---------------- em alta ---------------- */}
        {destaques.length > 0 && (
          <Bloco titulo="Em alta esta semana" testid="em-alta">
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
              {destaques.map(({ grupo, motivo }) => (
                <Link
                  key={grupo.id}
                  href={`/forum/${grupo.id}`}
                  className="w-[104px] shrink-0"
                  data-testid={`alta-${grupo.id}`}
                >
                  <CapaDaComunidade
                    imagem={configDo(grupo.id).imagem}
                    foto={capaDaComunidade(grupo.id)}
                    emoji={grupo.emoji}
                    semente={grupo.id}
                    lado={104}
                    className="transition-transform hover:scale-[1.03]"
                  />
                  <span className="mt-1.5 block text-[11.5px] font-semibold leading-tight">
                    {grupo.nome}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-primary">
                    {motivo}
                  </span>
                </Link>
              ))}
            </div>
          </Bloco>
        )}

        {/* ---------------- minhas comunidades: a grade ---------------- */}
        {!procurando && minhas.length > 0 && (
          <Bloco
            titulo={`Minhas comunidades (${minhas.length})`}
            testid="minhas-comunidades"
            acao={
              <span className="text-[10.5px] text-white/35">
                {minhas.reduce((soma, grupo) => soma + topicosDa(grupo.id).length, 0)} tópicos
              </span>
            }
          >
            {/*
              **Aqui a grade está certa**: são as que você já conhece, e a imagem
              basta para reconhecê-las (§4.78).

              **Mas ela para em seis** desde 01/08 (§4.92), a pedido do Matheus:
              *"deveria ter sempre um link que eu pudesse clicar em Minhas
              comunidades, onde eu abrisse uma página que mostrasse todas"*. É a
              mesma regra que a página de tópicos estreou (§4.91): **conteúdo que
              cresce sem limite não mora na página de entrada** — com 20
              comunidades esta grade empurrava categorias e todo o resto para
              baixo, e não havia para onde ir ver as antigas.
            */}
            <div className="grid grid-cols-3 gap-3">
              {minhas.slice(0, RESUMO_DE_MINHAS).map((grupo) => (
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
                    semente={grupo.id}
                    className="transition-transform hover:scale-[1.03]"
                  />
                  <span className="mt-1.5 block text-[11px] font-medium leading-tight text-white/75">
                    {grupo.nome}
                  </span>
                </Link>
              ))}
            </div>

            {/* A porta para a página. Aparece **sempre** que houver comunidade,
                e o texto muda para não prometer "mais" quando tudo coube — a
                página tem busca e ordenação que a grade não tem. */}
            <p className="mt-3 border-t border-white/[0.06] pt-2.5">
              <LinkDoForum href="/forum/minhas" testid="ver-todas-as-minhas">
                {minhas.length > RESUMO_DE_MINHAS
                  ? `ver todas as minhas (${minhas.length}) »`
                  : "abrir minhas comunidades »"}
              </LinkDoForum>
            </p>
          </Bloco>
        )}

        {/* ---------------- para você ---------------- */}
        {sugeridas.length > 0 && (
          <Bloco titulo="Para você" testid="sugestoes-de-comunidade">
            <div className="-my-1">
              {sugeridas.map(({ grupo, motivo }) => (
                <LinhaDaComunidade key={grupo.id} grupo={grupo} motivo={motivo} />
              ))}
            </div>
          </Bloco>
        )}

        {/* ---------------- categorias ---------------- */}
        {categorias.length > 0 && (
          <Bloco
            titulo="Categorias"
            testid="categorias"
            acao={
              <span className="text-[10.5px] text-white/35">
                {categorias.length} · toque para filtrar
              </span>
            }
          >
            {/*
              ⚠️ **Aparecem TODAS, inclusive as vazias** (31/07). Antes só vinham
              as que já tinham comunidade, e o cabeçalho dizia "36 no total" — a
              tela prometia 36 e mostrava 12. Categoria vazia fica apagada, mas
              **continua clicável**: quem toca vê que o assunto está livre e
              recebe o convite para criar a primeira comunidade dele.
            */}
            <div className="flex flex-wrap gap-1.5">
              {categorias.map((item) => (
                <button
                  key={item.categoria}
                  onClick={() => {
                    setCategoria(item.categoria === categoria ? "" : item.categoria);
                    setPagina(0);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    categoria === item.categoria
                      ? "bg-primary text-black"
                      : item.total === 0
                        ? "border border-white/[0.07] text-white/30 hover:border-primary/30 hover:text-white/60"
                        : "border border-white/12 text-white/70 hover:border-primary/40 hover:text-white"
                  }`}
                  data-testid={`categoria-${item.categoria}`}
                >
                  <span className="mr-1">{iconeDaCategoria(item.categoria)}</span>
                  {item.categoria}
                  {item.total > 0 && <span className="ml-1 font-normal opacity-50">{item.total}</span>}
                </button>
              ))}
            </div>
          </Bloco>
        )}

        {/* ---------------- a lista ---------------- */}
        <Bloco
          titulo={procurando ? "Resultado da busca" : "Comunidades para descobrir"}
          testid="outras-comunidades"
          acao={
            <span className="text-[10.5px] text-white/35" data-testid="total-de-resultados">
              {lista.length} {lista.length === 1 ? "comunidade" : "comunidades"}
            </span>
          }
        >
          {visiveis.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-white/40">
              Nenhuma comunidade encontrada
              {termo && ` para "${busca.trim()}"`}
              {categoria && ` em ${categoria}`}.{" "}
              <LinkDoForum onClick={() => setCriando(true)}>criar esta comunidade »</LinkDoForum>
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

        {/* Os números do fim — o tamanho do lugar, em uma linha. */}
        <p className="pb-2 text-center text-[10.5px] leading-relaxed text-white/25">
          {numeros.comunidades} comunidades · {numeros.topicos} tópicos · {numeros.mensagens}{" "}
          mensagens · {numeros.pessoas} leitores
        </p>
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
              {iconeDaCategoria(item)} {item}
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
 *
 * `motivo` aparece só nas sugeridas ("2 pessoas que você segue estão aqui"):
 * recomendação sem porquê é lista aleatória com nome bonito.
 */
function LinhaDaComunidade({ grupo, motivo }: { grupo: Grupo; motivo?: string }) {
  const pessoas = membrosDo(grupo.id).length;
  const topicos = topicosDa(grupo.id).length;
  const categoria = categoriaDe(grupo.id);

  return (
    <Link
      href={`/forum/${grupo.id}`}
      className="flex gap-3 border-b border-white/[0.06] py-2.5 last:border-0"
      data-testid={`comunidade-${grupo.id}`}
    >
      <CapaDaComunidade
        imagem={configDo(grupo.id).imagem}
        foto={capaDaComunidade(grupo.id)}
        emoji={grupo.emoji}
        semente={grupo.id}
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
          {categoria && ` · ${iconeDaCategoria(categoria)} ${categoria}`}
        </span>
        {motivo && <span className="mt-0.5 block text-[10.5px] text-primary">{motivo}</span>}
      </span>
    </Link>
  );
}
