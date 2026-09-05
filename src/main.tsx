import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/content.css'

const root = document.getElementById("root")!;
// Query-filtered catalogs differ from the static, unfiltered document.
const path = window.location.pathname.replace(/\/$/, '') || '/';
if (root.hasChildNodes() && root.dataset.route === path && !window.location.search) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
