# Operação do site — rotina do responsável

Guia para a pessoa (ou IA) que cuida do site no dia a dia.

> Estado em 20/09/2026: as correções de MFA, permissões e agendamento da
> [revisão de 19/09/2026](REVISAO-PAINEL-2026-09-19.md) foram aplicadas. O painel
> agora usa uma fila de aprovação; não publique contornando esse fluxo.

## Acesso ao painel

1. Abra `https://mbdareconciliacao.vercel.app/painel`. Use o domínio próprio somente
   depois que seu DNS estiver configurado e testado.
2. Use seu próprio e-mail, previamente cadastrado na equipe editorial (`app_admins`).
3. Confirme o código do autenticador (MFA). Na primeira vez, cadastre o QR no
   Google Authenticator/Authy.

> Se perder o autenticador, acione o responsável técnico para recuperação controlada
> de identidade e fator. Não desative globalmente a exigência de MFA como rotina.

## Editar conteúdo (fluxo)

1. Escolha a aba (Aparência, Textos, Agenda, Igreja, Livros, Estudo da vez).
2. Edite olhando a **prévia ao vivo**. Em telas largas ela fica ao lado; nas menores,
   depois dos campos. Use **Ocultar prévia** para concentrar-se na edição.
3. **Salvar rascunho** (não publica) e **Enviar para aprovação** quando terminar.
4. Um **revisor diferente de quem enviou** escolhe entre **Aprovar revisão** ou
   **Solicitar ajustes**. Uma nota é obrigatória ao devolver o conteúdo.
5. Somente o **administrador**, depois da aprovação, vê **Publicar agora** ou **Agendar**.
6. Em **Histórico**, use **Recuperar rascunho**. Isso substitui o rascunho da entidade
   e cancela seu agendamento, mas não muda o site publicado. Abra a aba, revise e publique.

Entidades: `destaque`, `tema`, `textos`, `agenda`, `igreja`, `livros`.

### Papéis da equipe

- **Colaborador:** edita apenas as seções atribuídas e envia para aprovação.
- **Editor:** mesmo fluxo, com responsabilidade editorial ampliada nas seções atribuídas.
- **Revisor:** lê todas as seções e aprova ou devolve; não edita nem publica.
- **Administrador:** edita, revisa e publica; mesmo assim não pode aprovar o próprio envio.

Para cadastrar uma pessoa nesta versão, o responsável técnico cria/confirma sua conta no
Supabase Auth e registra e-mail, papel e seções em `app_admins`. Não compartilhe a senha da igreja.

## Rotina diária

- Conferir o Discord: os workflows avisam quando falham (notícias, YouTube, keepalive/agendador,
  backup) e o **healthcheck** avisa se o site cair.
- Ver se há **novo vídeo** no canal (o catálogo da home atualiza sozinho 1x/dia).
- Conferir a aba **Histórico** do painel se algo mudou sem intenção.

## Rotina semanal

- Conferir se o **snapshot do código** rodou (Actions → Source recovery snapshot).
  Ele guarda somente o estado atual versionado, por 14 dias, e não contém o banco,
  o histórico Git nem os arquivos do Supabase Storage.
- Revisar o que foi publicado/agendado na semana.
- Conferir o **Supabase** ativo (o workflow `supabase-keepalive` mantém de hora em hora).
- Olhar o **Google Search Console** (após configurado) para erros e buscas.

## Automações (GitHub Actions)

| Workflow | Quando | O que faz |
|---|---|---|
| `youtube-sync.yml` | diário (10h BRT) | Atualiza o catálogo do canal; a home usa o mais recente |
| `news-scraper.yml` | diário (cerca de 7h BRT) | Coleta notícias para JSON estático |
| `supabase-keepalive.yml` | de hora em hora | Mantém o Supabase ativo e publica agendamentos |
| `site-healthcheck.yml` | a cada 3 horas | Confere a home e avisa se cair |
| `backup.yml` | semanal | Snapshot pequeno do código atual |
| `security.yml` | push/agenda | Testes, build, auditoria |

Em falha, cada workflow tenta avisar no **Discord**.

## Segredos (nomes, nunca valores)

- Vercel/.env.local: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EMAILJS_*`.
- GitHub Secrets: `YOUTUBE_API_KEY`, `DISCORD_WEBHOOK_URL`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `SNYK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.
- Local (admin): `DATABASE_URL` (Session pooler).

Nunca usar `service_role` em `VITE_*`, no navegador ou em arquivo versionado.
`.env.local` não é versionado.

## GitHub e recuperação

- O repositório é público para que as automações padrão continuem sem consumir a
  franquia de minutos de repositório privado. Segredos permanecem exclusivamente
  em GitHub Secrets, Vercel e `.env.local`.
- A `main` deve bloquear exclusão e `force push`. Antes de exigir pull request para
  toda alteração, adapte as rotinas de notícias e YouTube, que hoje publicam arquivos
  gerados diretamente na branch.
- O snapshot semanal é uma cópia de recuperação do código atual, não um backup do
  Supabase. Antes de qualquer migração do banco, continue usando `pg_dump`, ensaio de
  restauração e validação conforme `docs/SUPABASE-HARDENING-2026-09-05.md`.

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
