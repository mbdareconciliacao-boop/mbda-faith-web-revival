# Handoff para outra IA

Prompt pronto para enviar a outra IA que for assumir o site. Ajuste o que quiser.

---

## PROMPT (copie daqui para baixo)

Você vai assumir a manutenção do site do **Ministério Bíblico da Reconciliação** (igreja em
Guarujá/SP) e do seu **painel editorial**. Antes de fazer qualquer coisa, leia, nesta ordem:

1. `AGENTS.md` — contrato de como mexer no repositório (stack, comandos, segurança, mapa de arquivos).
2. `docs/PAINEL-EDITORIAL.md` — o que é o painel, como foi construído, arquitetura, banco e limites.
3. `docs/OPERACAO.md` — rotina de operação e problemas comuns.
4. `docs/YOUTUBE-AUTOMATICO.md` e `docs/SECURITY-AND-EDITORIAL-FOUNDATION.md`.
5. `AI_PROJECT_BRIEF.md`, `PRODUCT.md`, `DESIGN.md` — contexto de produto e design.

### Regras inegociáveis
- Segredos **nunca** no repositório: use `.env.local`, GitHub Secrets e Vercel Env Vars.
  Nunca exponha `service_role` no cliente; a chave anônima é pública.
- Não crie editor de **HTML/CSS/JS livre** (XSS). O editor trabalha com **tokens e campos tipados**.
- Toda escrita no banco passa por **RLS** + `public.is_admin()` (lista `app_admins` + MFA aal2).
- Alterações entram por **PR**; rode antes: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build`, `npm run test:build`.
- Migrações: `pg_dump` (backup) → **ensaio transacional** (aplica + asserções + idempotência +
  rollback) → apply. Rollback versionado em `supabase/rollback`. Binários em
  `_local_backups/postgres-tools/pgsql/bin`; `DATABASE_URL` (Session pooler) no `.env.local`.

### Estado atual
- Painel `/painel` com entidades `tema, textos, agenda, igreja, livros` (rascunho/publicado/agendado),
  histórico com rollback, MFA TOTP, e **prévia ao vivo** em coluna fixa.
- Automações: YouTube diário, notícias 2x/dia, keepalive+publicação horária, healthcheck 30 min,
  backup semanal, security.
- Stack: React 18 + TS + Vite (prerender), Supabase, Vercel.

### Pendências prioritárias
1. **Testes E2E com Playwright** (login+MFA, publicar, rollback, prévia).
2. **Editor das seções lição a lição** do estudo e `/blog` lendo do banco.
3. **SEO estruturado** (schema.org) e Search Console.

### Como você trabalha
- Explique primeiro o plano, depois execute em passos pequenos e verificáveis.
- Sempre rode os testes e valide o build antes de propor merge.
- Deixe claro o que você não conseguiu testar (ex.: navegador real) e peça confirmação.
- Ao terminar, atualize `docs/PAINEL-EDITORIAL.md`/`docs/OPERACAO.md` se o comportamento mudar.

Comece confirmando que leu `AGENTS.md` e `docs/PAINEL-EDITORIAL.md`, resuma o que entendeu e
proponha o próximo passo.

## (fim do prompt)
