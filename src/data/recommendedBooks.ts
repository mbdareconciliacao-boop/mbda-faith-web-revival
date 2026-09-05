export interface RecommendedBook {
  slug: string;
  title: string;
  author: string;
  description: string;
  image: string;
  imageSrcSet?: string;
  href?: string;
  linkLabel?: string;
  purchaseNote?: string;
}

export const recommendedBooks: RecommendedBook[] = [
  {
    slug: "tessalonicenses-visao-de-uma-igreja-local",
    title: "Tessalonicenses — visão de uma igreja local",
    author: "Editora Cristã Evangélica",
    description:
      "A revista que orienta a série atual da Escola Bíblica, percorrendo as duas cartas de Paulo e a esperança da volta de Cristo.",
    image: "/images/site/blog/tessalonicenses-evento-480.webp",
    imageSrcSet:
      "/images/site/blog/tessalonicenses-evento-480.webp 480w, /images/site/blog/tessalonicenses-evento-900.webp 900w",
    href: "https://loja.editoracristaevangelica.com.br/cartas-aos-tessalonicenses-revista-do-aluno.html",
    linkLabel: "Conhecer na editora",
  },
  {
    slug: "pequeno-manual-de-doutrinas-basicas",
    title: "Pequeno Manual de Doutrinas Básicas",
    author: "Marcos Granconato",
    description: "Uma introdução acessível aos principais temas da doutrina cristã, indicada para estudo pessoal, discipulado e Escola Bíblica.",
    image: "/images/site/livros/pequeno-manual-doutrinas-480.webp",
    href: "https://www.amazon.com.br/s?k=Pequeno+Manual+de+Doutrinas+B%C3%A1sicas+Marcos+Granconato",
    linkLabel: "Buscar edição na Amazon",
    purchaseNote: "Busca por título e autor. Confira a edição e o vendedor; não há oferta específica confirmada.",
  },
  {
    slug: "as-duas-naturezas-do-redentor",
    title: "As Duas Naturezas do Redentor",
    author: "Heber Carlos de Campos",
    description: "Uma leitura de cristologia dedicada à pessoa de Cristo e à compreensão de suas naturezas divina e humana.",
    image: "/images/site/livros/duas-naturezas-redentor-480.webp",
    href: "https://shekinahdistribuidora.com.br/produtos/as-duas-naturezas-do-redentor-heber-carlos-de-campos/",
    linkLabel: "Ver na Shekinah Distribuidora",
  },
  {
    slug: "o-plano-de-deus-para-o-mundo",
    title: "O Plano de Deus para o Mundo",
    author: "Heber Carlos de Campos",
    description: "Estudo sobre o propósito de Deus para a criação e sua realização no curso da história.",
    image: "/images/site/livros/plano-de-deus-mundo-480.webp",
    href: "https://www.editoraculturacrista.com.br/o-plano-de-deus-para-o-mundo",
    linkLabel: "Ver na Cultura Cristã",
  },
  {
    slug: "conhecendo-as-doutrinas-da-biblia",
    title: "Conhecendo as Doutrinas da Bíblia",
    author: "Myer Pearlman",
    description: "Uma apresentação organizada de doutrinas bíblicas fundamentais para quem deseja consolidar sua base de estudo.",
    image: "/images/site/livros/doutrinas-da-biblia-480.webp",
    href: "https://www.livrariagospel.com.br/produtos/conhecendo-as-doutrinas-da-biblia/",
    linkLabel: "Ver na Livraria Gospel",
  },
  {
    slug: "colecao-comentario-do-novo-testamento",
    title: "Coleção Comentário do Novo Testamento",
    author: "William Hendriksen e Simon Kistemaker",
    description: "Coleção de referência para acompanhar o texto do Novo Testamento com contexto, exposição e aprofundamento teológico.",
    image: "/images/site/livros/comentario-novo-testamento-480.webp",
    href: "https://www.editoraculturacrista.com.br/livros/comentarios-do-nt",
    linkLabel: "Consultar volumes na editora",
    purchaseNote: "Catálogo de comentários do Novo Testamento. Procure os volumes de Hendriksen e Kistemaker; não é um kit único.",
  },
  {
    slug: "serie-cultura-biblica-antigo-testamento",
    title: "Série Cultura Bíblica — Antigo Testamento",
    author: "Diversos autores · Edições Vida Nova",
    description: "Conjunto de introduções e comentários para percorrer os livros do Antigo Testamento com apoio histórico e exegético.",
    image: "/images/site/livros/cultura-biblica-antigo-testamento-480.webp",
    href: "https://www.vidanova.com.br/livros/colecao-introducao-e-comentario-antigo-testamento-25-livros-serie-cultura-biblica",
    linkLabel: "Ver coleção na Vida Nova",
  },
  {
    slug: "principios-de-interpretacao-biblica",
    title: "Princípios de Interpretação Bíblica",
    author: "Louis Berkhof",
    description: "Uma obra de hermenêutica voltada aos princípios que orientam uma leitura cuidadosa e responsável das Escrituras.",
    image: "/images/site/livros/principios-interpretacao-biblica-480.webp",
    href: "https://www.editoraculturacrista.com.br/principios-de-interpretacao-biblica-5a-edicao",
    linkLabel: "Ver na Cultura Cristã",
  },
  {
    slug: "o-ser-de-deus-e-suas-obras",
    title: "O Ser de Deus e Suas Obras",
    author: "Heber Carlos de Campos",
    description: "Estudo teológico sobre a providência divina e sua realização histórica.",
    image: "/images/site/livros/ser-de-deus-e-suas-obras-480.webp",
    href: "https://www.editoraculturacrista.com.br/ser-de-deus-e-suas-obras-o",
    linkLabel: "Ver na Cultura Cristã",
  },
  {
    slug: "a-biblia-e-seus-interpretes",
    title: "A Bíblia e Seus Intérpretes",
    author: "Augustus Nicodemus Lopes",
    description: "Uma breve história da interpretação bíblica e das abordagens que marcaram a leitura das Escrituras.",
    image: "/images/site/livros/biblia-e-seus-interpretes-480.webp",
    href: "https://www.editoraculturacrista.com.br/biblia-e-seus-interpretes-a-3a-edicao",
    linkLabel: "Consultar na Cultura Cristã",
    purchaseNote: "A editora indicava esgotado na conferência de 05/09/2026. Consulte a disponibilidade atual.",
  },
  {
    slug: "geografia-historica-do-mundo-biblico",
    title: "Geografia Histórica do Mundo Bíblico",
    author: "Netta Kemp de Money",
    description: "Referência para situar acontecimentos e lugares bíblicos em seu contexto geográfico e histórico.",
    image: "/images/site/livros/geografia-historica-mundo-biblico-480.webp",
    href: "https://www.estantevirtual.com.br/busca/geografia-hist%C3%B3rica-do-mundo-b%C3%ADblico",
    linkLabel: "Buscar na Estante Virtual",
    purchaseNote: "Busca em livrarias e sebos. Confira autoria, edição e estado do exemplar.",
  },
];
