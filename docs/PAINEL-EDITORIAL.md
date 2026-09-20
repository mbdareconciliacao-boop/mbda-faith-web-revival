# Painel editorial — documento mestre

> Estado em 20/09/2026: as migrações `20260920000000_editorial_security_repairs.sql`
> e `20260920010000_editorial_roles_and_approval.sql` foram aplicadas após backup,
> ensaio transacional, validação do rollback e testes do fluxo completo. Consulte
> também [a auditoria anterior](REVISAO-PAINEL-2026-09-19.md).

## Revisão de usabilidade e proteção de edição

- Abas fora dos formulários; prévia em coluna própria apenas a partir de 1200 px,
  no fluxo em telas menores, com opção de ocultar. Paleta de trabalho clara,
  controles de 44 px e identidade navy preservada (Impeccable, modo operacional).
- Autorização e função da pessoa consultadas após MFA; falha ao carregar dados bloqueia o editor.
- Colaborador/editor prepara o rascunho; revisor ou administrador decide; somente
  administrador publica. Quem envia uma revisão não pode aprová-la.
- Rascunhos de outras abas sobrevivem à publicação de uma entidade.
- Histórico recupera **somente rascunho**, cancela seu agendamento e exige
  publicação explícita posterior. Não restaura automaticamente o site público.
- Prévia de estudo ainda mostra o destaque publicado; isso é indicado na interface.
- `npm run test:e2e` executa os testes locais com Supabase simulado, sem gravar em produção.

Este é o documento de referência do painel `/painel`. Ele reúne **o que foi construído, por quê,
como** e **até onde avançou**. Detalhes por fase estão em `docs/EDITOR-*.md`.

## 1. Objetivo

Permitir que a igreja edite o site **sem programar**, com segurança: textos, identidade visual,
agenda, igreja, livros, estudo da vez e vídeo em destaque. Cada integrante possui função,
seções autorizadas e verificação em duas etapas (MFA). Toda publicação passa por aprovação.

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
| Equipe | Papéis, seções permitidas e aprovação obrigatória por revisão | esta revisão |

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
- O **painel** lê a fila editorial e chama somente funções protegidas; a prévia recebe
  o rascunho por `postMessage`.

## 4. Modelo de dados

- `public.site_entities` — uma linha por `(entity, state)`:
  - `entity`: `tema`, `textos`, `agenda`, `igreja`, `livros`.
  - `state`: `draft` ou `published`.
  - `content` (jsonb), `publish_at`, `published_at`, `updated_at`, `updated_by`.
- `public.featured_studies` — o "estudo da vez" (metadados, arte, livro, `sections`).
- `public.content_revisions` — histórico (entidade, ação, snapshot, autor, data).
- `public.app_admins` — equipe privada: `role`, `entities`, `display_name`, `active`.
- `public.editorial_workflow` — payload em trabalho, revisão, responsáveis, decisão,
  revisão aprovada/publicada e eventual agendamento por entidade.
- Buckets `estudos-artes` e `site-media` (leitura pública; escrita admin).

## 5. Funções e RLS

- `public.get_editorial_profile()` devolve ao usuário autenticado apenas seu próprio papel e escopo.
- `public.can_edit_editorial(entity)` e `public.can_review_editorial()` aplicam papel,
  entidade autorizada e MFA `aal2` no banco.
- `save_editorial_draft`, `submit_editorial`, `request_editorial_changes`,
  `approve_editorial` e `restore_editorial_revision` são as únicas portas de edição.
- `public.publish_entity(entity, note, publish_at)` — publica agora ou agenda.
- `public.publish_featured_study()` — publica o estudo aprovado, sem payload livre do navegador.
- `public.publish_due_entities()` — publica o que venceu; somente `service_role` executa.
- `public.publish_site_settings(...)` / `public.rollback_site_settings(...)` — legado (fase anterior).
- RLS: leitura pública **apenas** `state='published'`; equipe lê a fila e o histórico;
  escritas diretas do navegador são revogadas e passam pelas funções acima.

## 6. Segurança (resumo)

- Sem HTML/CSS/JS livre: só campos tipados, hex validado e fontes de lista fixa.
- Upload com limite de 5 MB e tipos `webp/jpeg/png`.
- CSP em `vercel.json`: `connect-src` com o domínio do Supabase; `frame-ancestors 'self'`
  (a prévia incorpora o próprio site); `X-Frame-Options: SAMEORIGIN`.
- MFA TOTP para o administrador.
- Alertas no Discord para falhas de automação + healthcheck do site.

## 7. Como operar (resumo)

1. Entrar em `/painel` com uma conta cadastrada pela igreja.
2. Confirmar o código do autenticador (MFA).
3. Escolher a aba, editar vendo a **prévia ao vivo** ao lado.
4. **Salvar rascunho** → **Enviar para aprovação**.
5. Outro revisor aprova ou solicita ajustes; o administrador publica ou agenda.
6. **Histórico** → **Recuperar rascunho** para voltar atrás sem alterar o site imediatamente.

Passo a passo completo: `docs/OPERACAO.md`.

## 8. Limites desta versão

- O roteiro **lição a lição** de `/blog` continua vindo de `src/data/tessalonians.ts`
  (o campo `featured_studies.sections` já existe, pronto para a próxima fase).
- Revisões antigas gravadas como `site_settings` não são restauráveis pelo botão do painel.
- A prévia precisa que o navegador permita o iframe do próprio site (CSP `'self'`).
- A inclusão de uma pessoa na equipe ainda é técnica: criar/confirmar a conta no Supabase Auth
  e cadastrar seu e-mail, papel e seções em `app_admins`. A gestão visual da equipe é a próxima fase.

## 9. Como outro agente deve continuar

Leia `AGENTS.md` (contrato geral) e `docs/OPERACAO.md` (rotina). Próximos passos sugeridos:
editor das seções do estudo, SEO estruturado (schema.org) e testes E2E (Playwright).
