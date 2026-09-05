import { ArrowUp, ArrowUpRight, Instagram, Facebook, Youtube } from "lucide-react";
import { CHURCH } from "../../data/church";
export default function SiteFooter() {
  return <footer className="site-footer dark-section">
    <div className="content-width footer-layout">
      <div><a className="brand" href="/"><img src="/images/site/logo-evergreen.webp" width="64" height="64" alt="" /><span>Reconciliação</span></a><p>Ensino da Palavra, comunhão familiar<br />e edificação espiritual.</p></div>
      <nav aria-label="Mais caminhos"><h2>Encontre no site</h2><a href="/mensagens">Mensagens</a><a href="/estudos">Estudos bíblicos</a><a href="/livros">Livros recomendados</a><a href="/noticias">Notícias · ReconNews</a><a href="/igreja">A igreja e nossa fé</a><a href="/agenda">Cultos e visita</a><a href="/#comunidade">Fotos dos eventos</a><a href="/igreja#contato">Contato</a></nav>
      <div><h2>Estamos em Guarujá</h2><address>{CHURCH.address}<br />{CHURCH.neighborhood}<br />{CHURCH.city}</address><a className="inline-link" href={CHURCH.whatsapp} target="_blank" rel="noopener noreferrer">{CHURCH.phone}<ArrowUpRight aria-hidden="true" /></a><div className="social-links"><a href={CHURCH.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a><a href={CHURCH.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook /></a><a href={CHURCH.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube /></a></div></div>
    </div>
    <div className="content-width footer-bottom"><span>© {new Date().getFullYear()} Ministério Bíblico da Reconciliação</span><a className="footer-back" href="/#conteudo">Voltar ao início <ArrowUp aria-hidden="true" /></a></div>
    <details className="content-width privacy-note"><summary>Privacidade e serviços externos</summary><p>Este site não carrega ferramentas de publicidade ou análise de visitas. As fotos da igreja são servidas pelo próprio site. Miniaturas de estudos vêm do YouTube; o player só abre ao solicitar a reprodução. O envio do formulário utiliza o EmailJS. WhatsApp, mapas e redes sociais abrem serviços externos sujeitos às suas próprias políticas. Não inclua informações sensíveis no formulário.</p></details>
  </footer>;
}
