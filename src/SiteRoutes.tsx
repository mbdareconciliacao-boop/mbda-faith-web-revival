import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Blog from "./components/Blog";
import Messages from "./pages/Messages";
import MessageDetail from "./pages/MessageDetail";
import Studies from "./pages/Studies";
import Books from "./pages/Books";
import Church from "./pages/Church";
import Agenda from "./pages/Agenda";
import News from "./pages/News";
import { legacyDestinations } from "./data/contentCatalog";

const EditorialDesk = import.meta.env.DEV ? lazy(() => import("./pages/EditorialDesk")) : null;

function RoutePosition() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const legacy = pathname === "/" ? legacyDestinations[hash] : pathname === "/blog" && hash === "#livros" ? "/livros" : undefined;
    if (legacy) { navigate(legacy, { replace: true }); return; }
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start", behavior: "instant" });
    } else window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash, navigate]);
  return null;
}

export default function SiteRoutes() {
  return <><RoutePosition /><Routes>
    <Route path="/" element={<Index />} />
    <Route path="/blog" element={<Blog />} />
    <Route path="/estudos" element={<Studies />} />
    <Route path="/estudos/tessalonicenses/:sectionSlug" element={<Blog />} />
    <Route path="/mensagens" element={<Messages />} />
    <Route path="/mensagens/:slug" element={<MessageDetail />} />
    <Route path="/livros" element={<Books />} />
    <Route path="/igreja" element={<Church />} />
    <Route path="/agenda" element={<Agenda />} />
    <Route path="/noticias" element={<News />} />
    {EditorialDesk && <Route path="/gestao" element={<Suspense fallback={<div role="status">Abrindo painel editorial…</div>}><EditorialDesk /></Suspense>} />}
    <Route path="*" element={<NotFound />} />
  </Routes></>;
}
