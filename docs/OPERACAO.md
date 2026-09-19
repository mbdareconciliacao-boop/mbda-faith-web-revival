# Operação do site — rotina do responsável

Guia para a pessoa (ou IA) que cuida do site no dia a dia.

## Acesso ao painel

1. Abra `https://www.igrejadarecon.com.br/painel` (ou o endereço da Vercel).
2. E-mail: `mbdareconciliacao@gmail.com` (precisa estar na lista `app_admins`).
3. Confirme o código do autenticador (MFA). Na primeira vez, cadastre o QR no
   Google Authenticator/Authy.

> Se perder o autenticador: o responsável técnico pode aplicar o rollback da migração
> `20260919060000_admin_mfa` para voltar ao modelo só por e-mail.

## Editar conteúdo (fluxo)

1. Escolha a aba (Aparência, Textos, Agenda, Igreja, Livros, Estudo da vez).
2. Edite olhando a **prévia ao vivo** ao lado (ela acompanha o scroll e a aba).
3. **Salvar rascunho** (não publica).
4. **Publicar agora** ou escolher data/hora e **Agendar publicação**.
5. Em **Histórico**, restaure qualquer estado anterior se necessário.

Entidades: `tema`, `textos`, `agenda`, `igreja`, `livros`. O "Estudo da vez" publica direto.

## Rotina diária

- Conferir o Discord: os workflows avisam quando falham (notícias, YouTube, keepalive/agendador,
  backup) e o **healthcheck** avisa se o site cair.
- Ver se há **novo vídeo** no canal (o catálogo da home atualiza sozinho 1x/dia).
- Conferir a aba **Histórico** do painel se algo mudou sem intenção.

## Rotina semanal

- Conferir se o **backup** rodou (Actions → Automated Backup).
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
  `VITE_SUPABASE_ANON_KEY`, `SNYK_TOKEN`.
- Local (admin): `DATABASE_URL` (Session pooler).

Nunca publicar `service_role` no navegador. `.env.local` não é versionado.

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
