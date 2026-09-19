# Painel editorial — documento mestre

Este é o documento de referência do painel `/painel`. Ele reúne **o que foi construído, por quê,
como** e **até onde avançou**. Detalhes por fase estão em `docs/EDITOR-*.md`.

## 1. Objetivo

Permitir que a igreja edite o site **sem programar**, com segurança: textos, identidade visual,
agenda, igreja, livros, estudo da vez e vídeo em destaque. A administração é restrita a um
e-mail autorizado, com verificação em duas etapas (MFA).

## 2. Como foi construído (linha do tempo)

| Fase | Entrega | Doc |
|---|---|---|
| Base | Estudo/livro da vez + upload de arte (tabela `featured_studies`, bucket `estudos-artes`) | `docs/PAINEL-LIVRO-DA-VEZ.md` |
| Segurança 1 | Escrita restrita a `app_admins` via `is_admin()` | `docs/EDITOR-*.md` |
| Fase 1 | Aparência: cores e fontes por **tokens CSS** | `docs/EDITOR-APARENCIA.md` |
| Fase 2 | Textos e mídia (marca, home, contato, rodapé) + bucket `site-media` | `docs/EDITOR-CONTEUDO.md` |
| Fase 3 | Agenda, igreja, livros e vídeo em destaque | `docs/EDITOR-CATALOGOS.md` |
| Fase 4 | **Rascunho/publicação/agendamento por entidade** + histórico/rollback | `docs/EDITOR-REVISOES.md` |
| Extras | Imagem de fundo + doutrina editável | `docs/EDITOR-EXTRA.md` |
| MFA | TOTP do administrador (sem lockout) | `docs/ADMIN-MFA.md` |
| Prévia | Site real em iframe, lado a lado e em tempo real | `docs/PREVIEW-AO-VIVO.md` |

## 3. Arquitetura

```
src/pages/Panel.tsx              # casca: login, MFA, abas, prévia, publicar/agendar
src/components/panel/*           # editores por aba (Agenda, Igreja, Livros)
src/data/siteSettings.ts         # tipos, padrões, normalização, applyTheme, entidades
src/components/site/SiteSettingsProvider.tsx  # lê o publicado e distribui (contexto)
src/hooks/useSiteSettings.ts     # consumo do contexto (tema + conteúdo)
supabase/migrations/*            # schema, RLS, funções, buckets
```

- O **site público** nunca fala com a área de escrita: lê apenas o estado **published**.
- O **painel** lê rascunhos e publica; a prévia recebe o rascunho por `postMessage`.

## 4. Modelo de dados

- `public.site_entities` — uma linha por `(entity, state)`:
  - `entity`: `tema`, `textos`, `agenda`, `igreja`, `livros`.
  - `state`: `draft` ou `published`.
  - `content` (jsonb), `publish_at`, `published_at`, `updated_at`, `updated_by`.
- `public.featured_studies` — o "estudo da vez" (metadados, arte, livro, `sections`).
- `public.content_revisions` — histórico (entidade, ação, snapshot, autor, data).
- `public.app_admins` — lista de administradores (privada, sem acesso via API).
- Buckets `estudos-artes` e `site-media` (leitura pública; escrita admin).

## 5. Funções e RLS

- `public.is_admin()` (SECURITY DEFINER, `search_path=''`): e-mail em `app_admins` **e**
  `aal2` quando existir fator TOTP verificado. É a base de toda a escrita.
- `public.publish_entity(entity, note, publish_at)` — publica agora ou agenda.
- `public.publish_due_entities()` — publica o que venceu (chamada pelo workflow horário).
- `public.publish_site_settings(...)` / `public.rollback_site_settings(...)` — legado (fase anterior).
- RLS: leitura pública **apenas** `state='published'`; rascunhos e histórico só para admin.

## 6. Segurança (resumo)

- Sem HTML/CSS/JS livre: só campos tipados, hex validado e fontes de lista fixa.
- Upload com limite de 5 MB e tipos `webp/jpeg/png`.
- CSP em `vercel.json`: `connect-src` com o domínio do Supabase; `frame-ancestors 'self'`
  (a prévia incorpora o próprio site); `X-Frame-Options: SAMEORIGIN`.
- MFA TOTP para o administrador.
- Alertas no Discord para falhas de automação + healthcheck do site.

## 7. Como operar (resumo)

1. Entrar em `/painel` (e-mail `mbdareconciliacao@gmail.com`).
2. Confirmar o código do autenticador (MFA).
3. Escolher a aba, editar vendo a **prévia ao vivo** ao lado.
4. **Salvar rascunho** → **Publicar agora** ou **Agendar**.
5. **Histórico** → **Restaurar** para voltar atrás.

Passo a passo completo: `docs/OPERACAO.md`.

## 8. Limites desta versão

- O roteiro **lição a lição** de `/blog` continua vindo de `src/data/tessalonians.ts`
  (o campo `featured_studies.sections` já existe, pronto para a próxima fase).
- Revisões antigas gravadas como `site_settings` não são restauráveis pelo botão do painel.
- A prévia precisa que o navegador permita o iframe do próprio site (CSP `'self'`).

## 9. Como outro agente deve continuar

Leia `AGENTS.md` (contrato geral) e `docs/OPERACAO.md` (rotina). Próximos passos sugeridos:
editor das seções do estudo, SEO estruturado (schema.org) e testes E2E (Playwright).
