import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { copyPublicAssets } from "./scripts/public-assets.mjs";

const previewHeaders = Object.fromEntries(JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8")).headers[0].headers.map((header: {key:string;value:string})=>[header.key,header.value]));
const blogRouting = (request: IncomingMessage, _response: ServerResponse, next: () => void) => {
  if (/^\/blog(?:\/.*)?(?:\?.*)?$/.test(request.url ?? "")) request.url = "/index.html";
  next();
};

// https://vite.dev/config/
export default defineConfig(({ command, isSsrBuild }) => ({
  publicDir: command === "build" ? false : "public",
  preview: { host: "127.0.0.1", port: 4173, headers: previewHeaders },
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [react(), { name: "blog-route", configureServer(server) { server.middlewares.use(blogRouting); } }, { name: "approved-public-assets", apply: "build", async closeBundle() { if (!isSsrBuild) await copyPublicAssets(process.cwd(), resolve("dist")); } }],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Vite 8 requires manualChunks as a function when using rolldown output validation.
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
