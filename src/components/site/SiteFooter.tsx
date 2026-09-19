import { ArrowUp, ArrowUpRight, Instagram, Facebook, Youtube } from "lucide-react";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export default function SiteFooter() {
  const { content } = useSiteSettings();
  const { contact, footer, brand } = content;
  return <footer className="site-footer dark-section">
    <div className="content-width footer-layout">
      <div><a className="brand" href="/"><img src={brand.logo} width="64" height="64" alt="" /><span>{brand.name}</span></a><p>{footer.aboutLines.map((line, index) => <span key={line + index}>{index > 0 ? <br /> : null}{line}</span>)}</p></div>
      <nav aria-label="Mais caminhos"><h2>Encontre no site</h2><a href="/mensagens">Mensagens</a><a href="/estudos">Estudos bíblicos</a><a href="/livros">Livros recomendados</a><a href="/noticias">Notícias · ReconNews</a><a href="/igreja">A igreja e nossa fé</a><a href="/agenda">Cultos e visita</a><a href="/#comunidade">Fotos dos eventos</a><a href="/igreja#contato">Contato</a></nav>
      <div><h2>Estamos em Guarujá</h2><address>{contact.address}<br />{contact.neighborhood}<br />{contact.city}</address><a className="inline-link" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">{contact.phone}<ArrowUpRight aria-hidden="true" /></a><div className="social-links"><a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a><a href={contact.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook /></a><a href={contact.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube /></a></div></div>
    </div>
    <div className="content-width footer-bottom"><span>© {new Date().getFullYear()} {footer.copyright}</span><a className="footer-back" href="/#conteudo">Voltar ao início <ArrowUp aria-hidden="true" /></a></div>
    <details className="content-width privacy-note"><summary>Privacidade e serviços externos</summary><p>{footer.privacy}</p></details>
  </footer>;
}
