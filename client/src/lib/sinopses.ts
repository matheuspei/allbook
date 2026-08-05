/**
 * As sinopses curadas do catálogo, em português — uma por livro, escritas à mão
 * (§4.104, decisão dele na folha da averiguação).
 *
 * Por que existe: a ficha mostrava a `synopsis` importada da Open Library, que
 * vem **em inglês** e com texto de divulgação — o único bloco de texto longo do
 * app estava noutro idioma. A regra agora é: a sinopse curada daqui **vence** a
 * importada; a importada vira reserva para livro recém-acrescentado que ainda
 * não ganhou a sua. (Rejeitado na folha: traduzir no script do catálogo — sai
 * texto com cara de tradução e mexe em arquivo gerado.)
 *
 * O tom é de vitrine: 2 a 3 frases, o gancho da história sem estragar nada.
 * Livro novo no `books.ts`? Escreva a sinopse dele aqui no mesmo passo.
 */
export const sinopsesCuradas: Record<number, string> = {
  // ---------------------------------------------------------- Ficção Científica
  7: "No planeta deserto de Arrakis, o jovem Paul Atreides herda um mundo hostil onde só uma coisa vale a pena: a especiaria melange, a substância mais cobiçada do universo. Quando sua família é traída, Paul foge para o deserto — e começa a virar a lenda que os povos de Arrakis esperavam. Política, ecologia e destino na maior epopeia da ficção científica.",
  8: "O matemático Hari Seldon prevê o que ninguém quer ouvir: o Império Galáctico vai ruir, e trinta mil anos de barbárie virão. Seu plano para encurtar a escuridão — uma fundação de cientistas no fim da galáxia — atravessa gerações nesta série que redefiniu a ficção científica.",
  109: "Durante a Revolução Cultural chinesa, uma cientista aponta um sinal para o espaço — e alguém responde. Décadas depois, físicos começam a morrer e um estranho jogo de realidade virtual esconde a chave de tudo. O primeiro contato como você nunca ouviu.",
  129: "Um anel esquecido, um mal que desperta e uma jornada que atravessa a Terra-média inteira. Frodo e a Sociedade do Anel carregam nos ombros o destino de todos os povos livres, na fantasia que fundou o gênero.",
  130: "Winston Smith trabalha reescrevendo o passado para o Partido, sob os olhos do Grande Irmão. Quando ousa pensar por conta própria — e amar —, descobre o preço da liberdade num mundo onde até a linguagem foi aprisionada.",
  131: "Num futuro de felicidade obrigatória, bebês nascem em fábricas e a angústia se resolve com uma pílula. Bernard Marx sente que falta alguma coisa — e um 'selvagem' criado fora do sistema vai expor o custo desse paraíso.",
  132: "O rei está fraco, o inverno se aproxima e as grandes casas de Westeros jogam um jogo em que se vence ou se morre. Intriga, honra e gelo e fogo na saga que redesenhou a fantasia moderna.",
  301: "Bilbo Bolseiro tinha tudo para uma vida quieta — até um mago e treze anões baterem à sua porta com um mapa e um dragão no fim do caminho. A aventura que apresentou a Terra-média ao mundo.",
  302: "A criação do mundo, a revolta de Morgoth, os Silmarils e as guerras que moldaram a Terra-média milênios antes do Anel. A mitologia completa de Tolkien, narrada como as lendas antigas.",
  303: "Nove histórias entrelaçadas sobre robôs que seguem três leis perfeitas — e sobre os dilemas humanos que nenhuma lei prevê. O livro que ensinou a ficção científica a pensar sobre máquinas.",
  304: "Os animais da Granja do Solar expulsam o fazendeiro e fundam uma sociedade de iguais. Aos poucos, os porcos descobrem que alguns são mais iguais que os outros. A fábula política mais afiada do século XX.",

  // ------------------------------------------------------------------- Romance
  140: "Elizabeth Bennet tem opinião demais para o gosto da época; o Sr. Darcy, orgulho demais para o gosto dela. Entre bailes, mal-entendidos e farpas afiadas, os dois travam o duelo amoroso mais querido da literatura.",
  141: "Louisa Clark aceita um emprego que ninguém quer: cuidar de Will Traynor, um homem brilhante que perdeu o gosto pela vida. Ela decide devolvê-lo — e os seis meses seguintes mudam os dois para sempre.",
  142: "Lily Bloom construiu a vida com que sonhava e conheceu o homem perfeito. Mas quando o passado bate à porta, ela precisa encarar uma pergunta difícil: o que fazer quando quem a gente ama é quem machuca?",
  143: "Landon é obrigado a contracenar com Jamie, a filha discreta do pastor, na peça da escola. O que começa como castigo vira o amor da vida dele — com um segredo que Jamie guarda até não poder mais.",
  307: "Expulsas da casa da família, as irmãs Dashwood aprendem a recomeçar com pouco. Elinor sente com a razão, Marianne com o coração inteiro — e o amor vai testar as duas do seu jeito.",
  308: "Emma Woodhouse, rica, bonita e convencida do próprio talento para juntar casais, arranja a vida amorosa de todo mundo — menos a dela. A comédia de erros mais elegante de Jane Austen.",
  309: "Quinn e Graham se conhecem na pior noite da vida dos dois. Anos depois, o casamento que nasceu dali enfrenta a distância silenciosa que nenhum amor grande imagina um dia sentir.",
  310: "Numa casa de repouso, um homem lê para uma mulher a história de Noah e Allie, um amor de verão interrompido pela guerra e pela família. Ela não se lembra de nada — e ele lê assim mesmo, todos os dias.",

  // -------------------------------------------------------------------- Terror
  104: "Em Derry, crianças somem — e algo que veste a forma de um palhaço espera nos bueiros. Vinte e sete anos depois, os amigos que o enfrentaram na infância precisam voltar e terminar o que começaram.",
  105: "Jack Torrance aceita cuidar de um hotel isolado durante o inverno, com a mulher e o filho pequeno. O Overlook, porém, não fica vazio de verdade — e o que mora lá conhece as fraquezas de Jack pelo nome.",
  144: "Um jovem advogado viaja a um castelo nos Cárpatos para fechar um negócio imobiliário e descobre, tarde demais, o que o conde Drácula pretende comprar em Londres. O romance que definiu o vampiro para sempre.",
  145: "A filha de uma atriz começa a mudar — a voz, a força, o que sabe sem poder saber. Quando a medicina desiste, dois padres muito diferentes enfrentam, num quarto de menina, uma batalha antiga.",
  305: "Humilhada na escola e sufocada em casa, Carrie White descobre um poder que cresce com a raiva. Na noite do baile, a cidade inteira aprende o nome dela. O primeiro romance de Stephen King.",
  306: "O escritor Paul Sheldon acorda de um acidente na casa da sua 'fã número um'. Annie Wilkes o salvou, o medica — e não pretende deixá-lo sair até ele reescrever o destino da personagem que ela ama.",

  // ------------------------------------------------------------------ Mistério
  1: "Vinte anos atrás, a família Hope foi assassinada na mansão do lago, e só a filha caçula sobreviveu. Agora ela volta à casa pela primeira vez — e as versões daquela noite começam a desmoronar uma a uma.",
  2: "Millie aceita um emprego de empregada numa casa perfeita demais. Atrás das portas trancadas dos Winchester, ela descobre que a patroa esconde segredos — e que ela mesma também tem os seus.",
  3: "No quinto aniversário de casamento, Amy Dunne desaparece e todas as pistas apontam para o marido. Mas em 'Garota Exemplar' ninguém é o que parece — muito menos a vítima.",
  106: "Alicia Berenson atirou cinco vezes no marido e nunca mais disse uma palavra. Um psicoterapeuta obcecado pelo caso decide fazê-la falar — e descobre por que o silêncio dela é a parte mais perigosa da história.",
  119: "Um curador do Louvre é morto e deixa um rastro de códigos no próprio corpo. O simbologista Robert Langdon segue as pistas por Paris e Londres, atrás de um segredo guardado há dois mil anos.",
  120: "Todos os dias, do trem, Rachel observa um casal perfeito na varanda. Um dia a mulher desaparece — e Rachel, que bebeu demais para confiar na própria memória, pode ter visto o que não devia.",
  311: "Um físico do CERN aparece morto com um símbolo em brasa no peito, e uma bomba de antimatéria some. Robert Langdon mergulha na Roma dos Illuminati numa corrida contra o relógio do conclave.",
  312: "Langdon acorda num hospital de Florença sem lembrar dos últimos dias, com meio mundo atrás dele e um enigma inspirado no Inferno de Dante — a peça que faltava para impedir uma ameaça de escala planetária.",
  313: "A repórter Camille Preaker volta à cidade natal para cobrir o assassinato de duas meninas. Entre a mãe controladora e a irmã adolescente, ela percebe que a história que veio contar sempre foi a dela.",
  314: "Uma mãe solteira aparece afogada no rio da cidade — o mesmo trecho de água que já levou outras mulheres. A irmã que ela deixou volta para o lugar de onde fugiu, onde ninguém conta a história inteira.",

  // ------------------------------------------------------------------ Negócios
  101: "Saber de dinheiro não é saber matemática — é saber se comportar. Em vinte histórias curtas, Morgan Housel mostra por que gente brilhante quebra, gente comum enriquece e o que a sorte e o medo fazem com as nossas decisões.",
  108: "Adam Grant defende a habilidade que ninguém treina: mudar de ideia. Repensar o que sabemos, largar opiniões velhas e ouvir quem discorda — o manual científico da mente flexível.",
  125: "Dois pais, duas escolas: um acumulava diplomas e contas; o outro, ativos. Kiyosaki transforma a diferença entre eles nas lições de educação financeira mais discutidas do mundo.",
  320: "Empregado, autônomo, dono de negócio ou investidor: cada um ganha dinheiro de um quadrante diferente. Kiyosaki explica o que muda de um lado para o outro — e o caminho de quem quer atravessar.",

  // ----------------------------------------------------------------- Biografia
  103: "Do improvável começo em Honolulu à noite da eleição, Barack Obama narra os bastidores dos anos de Casa Branca: as decisões, as dúvidas e o peso real de sentar na cadeira mais vigiada do mundo.",
  111: "Da casa pequena no South Side de Chicago aos salões da Casa Branca, Michelle Obama conta a própria história com franqueza rara — as origens, as escolhas e o preço de se tornar um símbolo sem deixar de ser gente.",
  112: "Com acesso total a Jobs — e liberdade para publicar o que quisesse —, Isaacson montou o retrato definitivo do criador da Apple: genial, impossível, obcecado pela perfeição e incapaz de separar vida e produto.",
  113: "Antes da marca no tênis do mundo inteiro, houve um recém-formado vendendo tênis japoneses pelo porta-malas do carro. Phil Knight conta, sem retoque, a história improvável e quase falida da Nike.",
  135: "Ela tinha quinze anos quando o Talibã a alvejou por defender escola para meninas. Malala sobreviveu — e transformou a própria voz na arma que eles mais temiam. A mais jovem Nobel da Paz da história.",
  136: "Escondida num sótão de Amsterdã com a família, Anne Frank registrou dois anos de medo, humor e uma esperança teimosa. O diário dela virou o testemunho mais lido do século.",
  137: "Psiquiatra e sobrevivente dos campos de concentração, Viktor Frankl escreveu sobre o que viu — e sobre a descoberta que o manteve vivo: quem tem um porquê suporta quase qualquer como.",
  315: "O funcionário do escritório de patentes que reinventou o universo. Isaacson mostra o Einstein inteiro: o físico, o rebelde, o pai imperfeito e o ícone que fugia do próprio mito.",
  316: "O homem que pintou a Mona Lisa dissecava cadáveres, projetava máquinas voadoras e deixava quase tudo inacabado. Isaacson percorre os cadernos de Leonardo atrás do segredo da curiosidade sem dono.",
  317: "No mundo que mudou depois de 2020, Michelle Obama abre a caixa de ferramentas que usa quando o medo e a dúvida chegam — a luz que há em nós, e como mantê-la acesa nos outros.",

  // ----------------------------------------------------------------- Autoajuda
  4: "Um bilionário excêntrico ensina a um artista e a uma empreendedora o hábito que mudou sua vida: acordar às cinco da manhã e proteger a primeira hora do dia. Uma fábula sobre rotina, foco e o poder do começo do dia.",
  201: "Mark Manson desmonta o pensamento positivo de vitrine: a vida é limitada, e a liberdade está em escolher com o que vale a pena se importar. Direto, engraçado e mais profundo do que o título sugere.",
  203: "O pastor Santiago sonha duas vezes com um tesouro nas pirâmides e larga tudo para procurá-lo. No caminho, aprende a ler os sinais — e descobre que a jornada era o próprio tesouro. O livro brasileiro mais lido do mundo.",
  318: "E se a esperança fácil for parte do problema? Manson encara o desconforto de frente: viver bem não é eliminar a dor, é escolher uma dor que valha a pena. A continuação à altura da Sutil Arte.",
  319: "Antes do Alquimista, houve Brida: uma jovem irlandesa dividida entre o dom, o medo e dois amores, procurando quem a ensine sobre magia — e sobre si mesma.",

  // ------------------------------------------------------------- Produtividade
  5: "Um método direto para destravar a bagunça: esvaziar a cabeça, decidir rápido e fazer da organização um hábito diário — sem planilhas hercúleas nem sistemas que não sobrevivem à segunda-feira.",
  102: "Melhorar 1% ao dia parece pouco — até compor. James Clear mostra a mecânica dos hábitos: deixar o óbvio atraente, o fácil automático e a identidade fazer o resto. O manual moderno da mudança que dura.",
  107: "Menos, porém melhor. McKeown ensina a discernir o vital do barulho, dizer não sem culpa e trocar a agenda cheia por progresso no que de fato importa.",
  124: "Antes das técnicas, o caráter. Covey organiza em sete hábitos o caminho da eficácia: sair da dependência, chegar à interdependência e afiar o machado no percurso. Um clássico que não envelheceu.",
  321: "Se Essencialismo pergunta 'o quê', Sem Esforço pergunta 'como': tornar leve o trabalho importante, tirar a complicação do caminho e produzir sem se destruir no processo.",
};
