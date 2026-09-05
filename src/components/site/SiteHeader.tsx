import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";

const links = [["/mensagens", "Mensagens"], ["/estudos", "Estudos"], ["/livros", "Livros"], ["/noticias", "Notícias"], ["/igreja", "A igreja"]] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  return <header className="site-header">
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <div className="site-nav">
      <a href="/" className="brand" aria-label="Reconciliação — início">
        <img src="/images/site/logo-evergreen.webp" alt="" width="64" height="64" />
        <span>Reconciliação</span>
      </a>
      <button ref={trigger} type="button" className="menu-toggle" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="main-navigation" aria-label="Navegação principal" className={open ? "main-navigation is-open" : "main-navigation"}>
        {links.map(([href, label]) => <a key={href} href={href} aria-current={pathname.startsWith(href) || (href === "/estudos" && pathname === "/blog") ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>)}
        <a className="visit-link" href="/agenda" aria-current={pathname === "/agenda" ? "page" : undefined} onClick={() => setOpen(false)}>Cultos e visita</a>
      </nav>
    </div>
  </header>;
}
