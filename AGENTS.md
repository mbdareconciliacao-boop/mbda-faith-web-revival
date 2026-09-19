# AGENTS.md — Guia para IAs que forem trabalhar neste repositório

Site institucional do **Ministério Bíblico da Reconciliação** (Guarujá/SP) + **painel editorial**.
Leia este arquivo antes de qualquer alteração. Ele é o contrato de como mexer com segurança.

## 1. O que é o projeto

- Site público (React SPA com prerender) com: home, mensagens (YouTube), estudos, livros,
  notícias (ReconNews), igreja, agenda, blog de estudo.
- Painel privado em `/painel` para a igreja editar o conteúdo sem programar.
- Automações no GitHub Actions para: catálogo do YouTube, notícias, manter o Supabase ativo,
  publicar agendamentos, backup e monitor de disponibilidade.

## 2. Stack e ambiente

- **Frontend:** React 18, TypeScript, Vite 8, react-router, Tailwind + tokens CSS (`src/index.css`).
- **Renderização:** SPA + **prerender** (`src/entry-server.tsx` + `scripts/prerender.mjs`) → 36 páginas estáticas.
- **Backend de conteúdo:** Supabase (Postgres + Auth + Storage). O navegador usa **apenas a chave anônima**.
- **Hospedagem:** Vercel (build `npm run build`, saída `dist`).
- **Automações:** GitHub Actions (`.github/workflows/*`).

### Comandos
```
npm ci
npm run dev
npm test          # testes Node (tests/*.test.mjs)
npm run typecheck
npm run lint
npm run build     # vite + SSG + prerender
npm run test:build
python -m unittest discover -s tests -p "test_*.py"
```

## 3. Regra de ouro (segurança)

- **Nunca** comitar `.env.local`, chaves, `DATABASE_URL` ou `service_role`.
- Segredos vivem em: `.env.local` (local), **GitHub Secrets** e **Vercel → Environment Variables**.
- Nunca usar `service_role` no código do navegador; a chave anônima é pública por natureza.
- Toda escrita no banco passa por **RLS** e por `public.is_admin()`.
- Nunca criar editor de **HTML/CSS/JS livre** (porta de XSS). Editor só com tokens/campos tipados.

### Variáveis e segredos (nomes — nunca valores)
- Frontend (Vercel/`.env.local`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.
- Actions (GitHub Secrets): `YOUTUBE_API_KEY`, `DISCORD_WEBHOOK_URL`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SNYK_TOKEN`, etc.
- Administração local (segredo): `DATABASE_URL` (Session pooler) em `.env.local`.

## 4. Onde fica cada coisa

| Área | Caminho |
|---|---|
| Rotas | `src/SiteRoutes.tsx`, `src/pages/*` |
| Componentes do site | `src/components/site/*` |
| Dados públicos (fallback) | `src/data/*` |
| Painel (UI) | `src/pages/Panel.tsx`, `src/components/panel/*` |
| Tema/conteúdo + tipos | `src/data/siteSettings.ts` |
| Estado global de conteúdo | `src/components/site/SiteSettingsProvider.tsx`, `src/context/siteSettingsContext.ts`, `src/hooks/useSiteSettings.ts` |
| Automações | `scripts/*.mjs`, `scripts/*.py`, `.github/workflows/*` |
| Banco (migrações/rollback/testes) | `supabase/migrations`, `supabase/rollback`, `supabase/tests` |
| Testes | `tests/*.test.mjs`, `tests/test_*.py` |
| Docs | `docs/*` |

## 5. Conteúdo: painel vs código

- **Editável pelo painel:** aparência (cores/fontes/imagem de fundo), textos, contato, rodapé,
  agenda, igreja (inclui doutrina), livros, estudo da vez (metadados + arte) e vídeo em destaque.
  Modelo: entidades `tema, textos, agenda, igreja, livros` na tabela `site_entities`
  (rascunho / publicado / agendado) + `featured_studies` (estudo da vez).
- **Ainda em código:** roteiro lição a lição de `/blog` (`src/data/tessalonians.ts`), coleta de
  notícias, catálogo do YouTube (gerado por `scripts/sync-youtube.mjs`).
- Detalhes do painel: **`docs/PAINEL-EDITORIAL.md`**. Operação: **`docs/OPERACAO.md`**.

## 6. Banco e migrações

- Funções-chave: `public.is_admin()`, `public.publish_entity(...)`, `public.publish_due_entities()`,
  `public.publish_site_settings(...)`, `public.rollback_site_settings(...)`.
- Segurança: RLS ligado; leitura pública só do publicado; funções `SECURITY DEFINER` com `search_path=''`.
- **Processo de migração (obrigatório):** `pg_dump` (backup) → **ensaio transacional**
  (aplica + asserções + idempotência + rollback) → apply. Rollback versionado em `supabase/rollback`.
- Binários PostgreSQL ficam em `_local_backups/postgres-tools/pgsql/bin` (ignorado pelo git).

## 7. Fluxo de trabalho

- Alterações entram por **PR**. Não auto-mesclar sem autorização explícita do responsável.
- Antes de abrir PR: `npm test`, `typecheck`, `lint`, `build`, `test:build`.
- Migrações: sempre com backup + ensaio + asserções.
- Mensagens de commit claras, em português, no padrão do repositório.

## 8. Pendências conhecidas

- Editor das **seções lição a lição** do estudo (e `/blog` lendo do banco).
- **SEO estruturado** (schema.org) e Search Console.
- Testes **E2E (Playwright)** do painel (login+MFA, publicar, rollback, prévia).

## 9. Documentos que importam

`AI_PROJECT_BRIEF.md`, `PRODUCT.md`, `DESIGN.md`, `docs/PAINEL-EDITORIAL.md`,
`docs/OPERACAO.md`, `docs/YOUTUBE-AUTOMATICO.md`, `docs/SECURITY-AND-EDITORIAL-FOUNDATION.md`,
`docs/HANDOFF-IA.md`.
