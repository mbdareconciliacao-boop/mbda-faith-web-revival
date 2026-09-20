# Operação do site — rotina do responsável

Guia para a pessoa (ou IA) que cuida do site no dia a dia.

> Antes de novas publicações, consulte [a revisão de 19/09/2026](REVISAO-PAINEL-2026-09-19.md).
> O agendamento está impedido por uma constraint do banco e requer migração revisada.
> Não considerar o painel plenamente validado apenas porque os workflows estão verdes.

## Acesso ao painel

1. Abra `https://www.igrejadarecon.com.br/painel` (ou o endereço da Vercel).
2. E-mail: `mbdareconciliacao@gmail.com` (precisa estar na lista `app_admins`).
3. Confirme o código do autenticador (MFA). Na primeira vez, cadastre o QR no
   Google Authenticator/Authy.

> Se perder o autenticador, acione o responsável técnico para recuperação controlada
> de identidade e fator. Não desative globalmente a exigência de MFA como rotina.

## Editar conteúdo (fluxo)

1. Escolha a aba (Aparência, Textos, Agenda, Igreja, Livros, Estudo da vez).
2. Edite olhando a **prévia ao vivo**. Em telas largas ela fica ao lado; nas menores,
   depois dos campos. Use **Ocultar prévia** para concentrar-se na edição.
3. **Salvar rascunho** (não publica).
4. **Publicar agora** altera somente a entidade da aba. O agendamento aguarda a
   correção de banco documentada na auditoria; não conte com ele para um evento.
5. Em **Histórico**, use **Recuperar rascunho**. Isso substitui o rascunho da entidade
   e cancela seu agendamento, mas não muda o site publicado. Abra a aba, revise e publique.

Entidades: `tema`, `textos`, `agenda`, `igreja`, `livros`. O "Estudo da vez" publica direto.

## Rotina diária

- Conferir o Discord: os workflows avisam quando falham (notícias, YouTube, keepalive/agendador,
  backup) e o **healthcheck** avisa se o site cair.
- Ver se há **novo vídeo** no canal (o catálogo da home atualiza sozinho 1x/dia).
- Conferir a aba **Histórico** do painel se algo mudou sem intenção.

## Rotina semanal

- Conferir se o **backup do repositório** rodou (Actions → Automated Backup).
  Ele não contém o banco nem os arquivos do Supabase Storage.
- Revisar o que foi publicado/agendado na semana.
- Conferir o **Supabase** ativo (o workflow `supabase-keepalive` mantém de hora em hora).
- Olhar o **Google Search Console** (após configurado) para erros e buscas.

## Automações (GitHub Actions)

| Workflow | Quando | O que faz |
|---|---|---|
| `youtube-sync.yml` | diário (10h BRT) | Atualiza o catálogo do canal; a home usa o mais recente |
| `news-scraper.yml` | 2x/dia | Coleta notícias para JSON estático |
| `supabase-keepalive.yml` | de hora em hora | Mantém o Supabase ativo e publica agendamentos |
| `site-healthcheck.yml` | a cada 30 min | Confere a home e avisa se cair |
| `backup.yml` | semanal | Backup do repositório |
| `security.yml` | push/agenda | Testes, build, auditoria |

Em falha, cada workflow tenta avisar no **Discord**.

## Segredos (nomes, nunca valores)

- Vercel/.env.local: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EMAILJS_*`.
- GitHub Secrets: `YOUTUBE_API_KEY`, `DISCORD_WEBHOOK_URL`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `SNYK_TOKEN`. Antes de aplicar a migração corretiva,
  adicionar `SUPABASE_SERVICE_ROLE_KEY` somente ao GitHub Actions.
- Local (admin): `DATABASE_URL` (Session pooler).

Nunca usar `service_role` em `VITE_*`, no navegador ou em arquivo versionado.
`.env.local` não é versionado.

## Problemas comuns

- **Site fora do ar** → o healthcheck avisa; conferir Vercel (Deployments).
- **Supabase pausado** → restaurar no dashboard; o keepalive evita novas pausas.
- **Login do painel falha** → checar e-mail confirmado e, se necessário, a lista `app_admins`.
- **Publicação não aparece** → ver se foi **Publicada** (não só rascunho) e recarregar a página.

## Onde está a documentação

- `AGENTS.md` — contrato para agentes/IA.
- `docs/PAINEL-EDITORIAL.md` — como o painel foi construído.
- `docs/EDITOR-*.md`, `docs/ADMIN-MFA.md`, `docs/PREVIEW-AO-VIVO.md` — fases.
- `docs/YOUTUBE-AUTOMATICO.md` — catálogo do canal.
