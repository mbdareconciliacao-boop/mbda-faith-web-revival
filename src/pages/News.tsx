import ContentLayout, { Breadcrumbs } from "../components/content/ContentLayout";
import ReconNewsFeed from "../components/ReconNewsFeed";
import { contentSEO } from "../data/contentCatalog";
import { useSEO } from "../hooks/useSEO";

export default function News() {
  useSEO(contentSEO("Notícias · ReconNews", "Notícias sobre fé, igreja e história, com fontes identificadas. Consulte o acervo ReconNews.", "/noticias"));
  return <ContentLayout><header className="catalog-header compact-header dark-section"><div className="content-width"><Breadcrumbs items={[{ label: "Notícias" }]} /><h1>Notícias</h1><p>ReconNews reúne notícias de veículos externos. Estudos e mensagens da igreja ficam nas suas próprias seções.</p></div></header><ReconNewsFeed /></ContentLayout>;
}
