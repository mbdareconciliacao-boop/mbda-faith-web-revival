import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SiteHeader from "../site/SiteHeader";
import SiteFooter from "../site/SiteFooter";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="breadcrumbs" aria-label="Você está aqui"><ol>
    <li><a href="/">Início</a></li>
    {items.map(item => <li key={item.label}><ChevronRight aria-hidden="true" />{item.href
      ? <a href={item.href}>{item.label}</a>
      : <span aria-current="page">{item.label}</span>}</li>)}
  </ol></nav>;
}

export function ContentTabs() {
  return <nav className="content-tabs" aria-label="Biblioteca da Reconciliação">
    <NavLink to="/mensagens">Mensagens</NavLink>
    <NavLink to="/estudos">Estudos</NavLink>
    <NavLink to="/livros">Livros recomendados</NavLink>
  </nav>;
}

export default function ContentLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main id="conteudo" className="content-page">{children}</main><SiteFooter /></>;
}
