/**
 * O formato de cada resposta do agente, em JSON Schema.
 *
 * O `claude -p --json-schema` obriga a resposta a seguir este desenho — o
 * agente não consegue devolver texto solto nem esquecer um campo. Cada dado
 * vem dentro de um "campo com prova" (`valor`, `provas`, `nota`): é a prova
 * que separa achado de chute, e foi a falta dela que deixou passar os anos
 * errados de agosto (§4.136, §4.159 do ROTEIRO do AllBook).
 *
 * A lista de prateleiras vem de `prateleiras.json`, que o gerador do pacote
 * escreve a partir do mapa do app — assim o agente só escolhe prateleira que
 * existe.
 */

const prova = {
  type: "object",
  properties: {
    url: { type: "string", description: "Endereço da página onde o valor foi lido." },
    citacao: { type: "string", description: "Frase copiada literalmente da página, contendo o valor." },
  },
  required: ["url", "citacao"],
  additionalProperties: false,
};

/** Um dado com prova. `valor: null` quando não foi possível provar. */
function campo(tipoDoValor, descricao) {
  return {
    type: "object",
    description: descricao,
    properties: {
      valor: tipoDoValor,
      provas: { type: "array", items: prova },
      nota: { type: "string", description: "Dúvidas, divergências, por que ficou vazio. Pode ser vazia." },
    },
    required: ["valor", "provas", "nota"],
    additionalProperties: false,
  };
}

const inteiroOuNulo = { type: ["integer", "null"] };
const textoOuNulo = { type: ["string", "null"] };
const listaOuNula = { type: ["array", "null"], items: { type: "string" } };

const identificacao = {
  type: "object",
  properties: {
    confianca: { type: "string", enum: ["alta", "media", "baixa"] },
    como: { type: "string", description: "O que provou que é este item, com a frase da página." },
  },
  required: ["confianca", "como"],
  additionalProperties: false,
};

const bio = {
  type: "object",
  properties: {
    texto: textoOuNulo,
    provas: { type: "array", items: prova },
  },
  required: ["texto", "provas"],
  additionalProperties: false,
};

const imagem = {
  type: "object",
  properties: {
    url_imagem: textoOuNulo,
    pagina: textoOuNulo,
    prova_de_identidade: textoOuNulo,
  },
  required: ["url_imagem", "pagina", "prova_de_identidade"],
  additionalProperties: false,
};

const links = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tipo: {
        type: "string",
        enum: ["site", "substack", "instagram", "x", "facebook", "youtube", "tiktok", "linkedin", "threads", "podcast",
          "wikipedia", "wikidata", "outro"],
      },
      url: { type: "string" },
    },
    required: ["tipo", "url"],
    additionalProperties: false,
  },
};

const fechamento = {
  procurei: { type: "array", items: { type: "string" }, description: "Buscas feitas e sites consultados." },
  observacoes: { type: "string" },
};

export function formatoDoLivro(prateleiras) {
  return {
    type: "object",
    properties: {
      id: { type: "integer" },
      obra_identificada: { type: "string", description: "Que obra é esta, em uma ou duas frases." },
      tipo: {
        type: "string",
        enum: ["livro", "coletanea", "pregacao_ou_palestra", "curso_ou_aula", "programa_ou_podcast",
          "noticia_ou_documentario", "meditacao_ou_sons", "outro"],
      },
      edicao: { type: "string", enum: ["integral", "adaptada", "resumida", "trecho", "nao_sei"] },
      titulo_corrigido: campo(textoOuNulo, "O título certo, quando o da loja vem sem acento, com erro ou truncado. Vazio se o da loja já está certo."),
      ano_obra: campo(inteiroOuNulo, "Ano da primeira publicação da OBRA."),
      ano_audio: campo(inteiroOuNulo, "Ano de lançamento DESTA gravação."),
      autores: campo(listaOuNula, "Lista completa de autores."),
      narradores: campo(listaOuNula, "Lista completa de narradores."),
      tradutores: campo(listaOuNula, "Quem traduziu o texto lido, se for tradução."),
      titulo_original: campo(textoOuNulo, "Título da obra no idioma original."),
      idioma_original: campo(textoOuNulo, "Código de duas letras: pt, en, es, fr…"),
      serie: campo(
        {
          type: ["object", "null"],
          properties: { nome: { type: "string" }, numero: { type: ["number", "null"] } },
          required: ["nome", "numero"],
          additionalProperties: false,
        },
        "Série com ordem de leitura e o número deste volume.",
      ),
      idade: campo({ type: ["string", "null"], enum: ["0-4", "5-8", "9-12", "13-17", "adulto", null] }, "Faixa de idade de quem ouve."),
      prateleira: {
        type: "object",
        properties: {
          valor: { type: "string", enum: prateleiras },
          motivo: { type: "string" },
        },
        required: ["valor", "motivo"],
        additionalProperties: false,
      },
      ...fechamento,
    },
    required: ["id", "obra_identificada", "tipo", "edicao", "titulo_corrigido", "ano_obra", "ano_audio", "autores", "narradores",
      "tradutores", "titulo_original", "idioma_original", "serie", "idade", "prateleira", "procurei", "observacoes"],
    additionalProperties: false,
  };
}

export function formatoDaPessoa() {
  return {
    type: "object",
    properties: {
      slug: { type: "string" },
      tipo: { type: "string", enum: ["pessoa", "organizacao", "coletivo", "voz_sintetica", "nao_identificado"] },
      identificacao,
      nome_completo: campo(textoOuNulo, "Nome completo, como a pessoa assina."),
      apresentacao: { type: ["string", "null"], description: "Duas frases, até 35 palavras, sem o nome no começo." },
      bio,
      nascimento: campo(inteiroOuNulo, "Ano de nascimento."),
      morte: campo(inteiroOuNulo, "Ano de morte."),
      nacionalidade: campo(textoOuNulo, "Nacionalidade, em português (brasileira, portuguesa…)."),
      foto: imagem,
      links,
      ...fechamento,
    },
    required: ["slug", "tipo", "identificacao", "nome_completo", "apresentacao", "bio", "nascimento", "morte", "nacionalidade",
      "foto", "links", "procurei", "observacoes"],
    additionalProperties: false,
  };
}

export function formatoDaEditora() {
  return {
    type: "object",
    properties: {
      slug: { type: "string" },
      tipo: { type: "string", enum: ["editora", "produtora_de_audio", "loja", "autopublicacao", "nao_identificado"] },
      identificacao,
      nome_oficial: campo(textoOuNulo, "Como a empresa se apresenta."),
      apresentacao: { type: ["string", "null"], description: "A carta de apresentação: 2 ou 3 frases, até 45 palavras." },
      bio,
      fundacao: campo(inteiroOuNulo, "Ano de fundação."),
      sede: campo(textoOuNulo, "Cidade e país."),
      site: campo(textoOuNulo, "Endereço oficial."),
      email_de_contato: campo(textoOuNulo, "E-mail de contato público do site oficial da editora."),
      logo: imagem,
      links,
      ...fechamento,
    },
    required: ["slug", "tipo", "identificacao", "nome_oficial", "apresentacao", "bio", "fundacao", "sede", "site",
      "email_de_contato", "logo", "links",
      "procurei", "observacoes"],
    additionalProperties: false,
  };
}
