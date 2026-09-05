import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import SiteRoutes from "./SiteRoutes";
export { publicPages } from "./data/pageMetadata";

export function render(path: string) {
  return renderToString(<StaticRouter location={path}><SiteRoutes /></StaticRouter>);
}
