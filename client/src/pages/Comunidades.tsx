import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Plus, Search } from "lucide-react";

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

/**
 * **Comunidades** (`/forum`) — a lista.
 *
 * A organização é a do Orkut e continua igual: **grade de imagens quadradas** com
 * o nome embaixo, busca por nome, filtro por categoria, as suas primeiro. O que
 * mudou é a pele (§4.74, virada do fim do dia): fundo escuro, cantos
 * arredondados, laranja no que é ação.
 *
 * **A imagem é o item**, e isso não é decoração: era o que fazia a página do
 * Orkut parecer cheia com dez comunidades. Sem imagem enviada, entra o emoji num
 * quadrado, no mesmo tamanho.
 */
export default function Comunidades() {
  const { toast } = useToast();
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const atualizar = () => setVersao((n) => n + 1);
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, []);

  const todas = useMemo(() => forunsVisiveis(), [versao]);
  const minhas = todas.filter((grupo) => situacaoDe(grupo.id) === "dentro");
  const outras = todas.filter((grupo) => situacaoDe(grupo.id) !== "dentro");

  function filtrar(lista: Grupo[]) {
    const termo = busca.trim().toLowerCase();
    return lista.filter((grupo) => {
      const config = configDo(grupo.id);
      if (categoria && config.categoria !== categoria) return false;
      if (!termo) return true;
      return (
        grupo.nome.toLowerCase().includes(termo) || grupo.descricao.toLowerCase().includes(termo)
      );
    });
  }

  return (
    <PaginaDoForum titulo="Comunidades" voltarPara="/community" testid="comunidades-page">
      <div className="px-5 pt-4" key={versao}>
        {/* Busca e filtro, no desenho da Biblioteca. */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar comunidade…"
            className={`${CAMPO} pl-9`}
            data-testid="campo-busca"
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[11.5px] font-semibold text-white/60 focus:outline-none"
            data-testid="filtro-categoria"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <BotaoDoForum primario onClick={() => setCriando((v) => !v)} testid="criar-comunidade">
            <Plus className="mr-0.5 inline h-3.5 w-3.5 align-[-2px]" />
            Criar
          </BotaoDoForum>
        </div>

        {criando && <FormularioDeCriacao onPronto={() => setCriando(false)} />}

        <div className="mt-4">
          <Bloco titulo={`Suas comunidades · ${minhas.length}`} testid="minhas-comunidades">
            {filtrar(minhas).length === 0 ? (
              <p className="text-[13px] text-white/40">
                Você ainda não participa de nenhuma comunidade
                {busca || categoria ? " que bata com a busca" : ""}.
              </p>
            ) : (
              <Grade lista={filtrar(minhas)} />
            )}
          </Bloco>

          <Bloco titulo="Descobrir" testid="outras-comunidades">
            {filtrar(outras).length === 0 ? (
              <p className="text-[13px] text-white/40">Nenhuma comunidade encontrada.</p>
            ) : (
              <Grade lista={filtrar(outras)} comFicha />
            )}
          </Bloco>
        </div>
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
        className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
        data-testid="form-criar"
      >
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
            placeholder="Nome da comunidade"
            autoFocus
            className={CAMPO}
            data-testid="novo-nome"
          />
        </div>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value.slice(0, 400))}
          placeholder="Sobre o que é?"
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

        <div className="mt-3 flex justify-end gap-2">
          <BotaoDoForum onClick={onPronto}>Cancelar</BotaoDoForum>
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
                description: "Você é o dono — o resto se ajusta em Gerenciar.",
              });
            }}
            testid="confirmar-criar"
          >
            Criar comunidade
          </BotaoDoForum>
        </div>
      </div>
    );
  }
}

/** A grade — imagem quadrada e nome embaixo, três por linha. */
function Grade({ lista, comFicha }: { lista: Grupo[]; comFicha?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3" data-testid="grade-de-comunidades">
      {lista.map((grupo) => {
        const config = configDo(grupo.id);
        return (
          <Link
            key={grupo.id}
            href={`/forum/${grupo.id}`}
            className="text-center"
            data-testid={`comunidade-${grupo.id}`}
          >
            <CapaDaComunidade
              imagem={config.imagem}
              foto={capaDaComunidade(grupo.id)}
              emoji={grupo.emoji}
              className="transition-transform hover:scale-[1.03]"
            />
            <span className="mt-1.5 block text-[11px] font-medium leading-tight text-white/75">
              {grupo.nome}
            </span>
            {comFicha && <FichaCurta grupo={grupo} />}
          </Link>
        );
      })}
    </div>
  );
}

/** Quantas pessoas e quantos tópicos — o que decide se vale entrar. */
function FichaCurta({ grupo }: { grupo: Grupo }) {
  const pessoas = membrosDo(grupo.id).length;
  const topicos = topicosDa(grupo.id).length;
  return (
    <span className="mt-0.5 block text-[10px] text-white/30">
      {pessoas} {pessoas === 1 ? "pessoa" : "pessoas"} · {topicos}{" "}
      {topicos === 1 ? "tópico" : "tópicos"}
    </span>
  );
}
