import ContentLayout, { Breadcrumbs } from "../components/content/ContentLayout";
import { AboutChurch, FaithDeclaration, FamilySpace } from "../components/site/ChurchSections";
import ContactSection from "../components/site/ContactSection";
import MediaArchive from "../components/site/MediaArchive";
import { contentSEO } from "../data/contentCatalog";
import { useSEO } from "../hooks/useSEO";

export default function Church() {
  useSEO(contentSEO("A igreja", "Conheça o Ministério Bíblico da Reconciliação em Guarujá: nossa história, declaração de fé e contato.", "/igreja"));
  return <ContentLayout><header className="catalog-header compact-header dark-section"><div className="content-width"><Breadcrumbs items={[{ label: "A igreja" }]} /><h1>Conheça a Reconciliação.</h1><nav className="section-index" aria-label="Nesta página"><a href="#quem-somos">Quem somos</a><a href="#declaracao-de-fe">Nossa fé</a><a href="/#comunidade">Fotos dos eventos</a><a href="#contato">Contato</a></nav></div></header><AboutChurch /><FaithDeclaration /><FamilySpace /><MediaArchive /><ContactSection /></ContentLayout>;
}
