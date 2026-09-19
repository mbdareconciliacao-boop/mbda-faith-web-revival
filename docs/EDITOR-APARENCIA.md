# Editor de aparência (Fase 1)

O painel `/painel` ganhou a aba **Aparência**: cores e fontes do site, com prévia ao vivo,
rascunho, publicação e histórico com rollback.

## Segurança

- Editar é permitido apenas para e-mails em `public.app_admins` (hoje
  `mbdareconciliacao@gmail.com`), via `public.is_admin()`.
- O site público lê somente `site_settings.published`. O rascunho nunca aparece.
- `content_revisions` só é legível/gravável pelo administrador.
- Publicação e rollback passam por funções `SECURITY DEFINER` com `search_path` vazio.
- O editor trabalha com **tokens** (cores validadas em hex e fontes de uma lista fixa).
  Não há CSS/HTML/JS livre, evitando XSS e mantendo a CSP.

## Como usar

1. Entre em `/painel`.
2. Aba **Aparência**: escolha cores e fontes; a prévia no topo muda na hora.
3. **Salvar rascunho** guarda sem publicar. **Publicar no site** aplica o rascunho.
4. Aba **Histórico**: cada publicação gera uma revisão; **Restaurar** volta o site ao estado
   daquela revisão.

O site aplica o tema publicado ao carregar (variáveis CSS no `<html>`), sem depender de deploy.

## Fontes disponíveis (gratuitas)

- Título: Anton, Oswald, Bebas Neue.
- Condensada: Barlow Condensed, Oswald.
- Texto: sistema, Inter, Roboto, Lora.

Novas fontes entram adicionando o pacote `@fontsource/...` e a opção em `FONT_OPTIONS`
(`src/data/siteSettings.ts`).

## Banco

- `public.site_settings` (linha única): `draft`, `published`, auditoria de atualização.
- `public.content_revisions`: histórico com `action` (`draft`/`publish`/`rollback`).
- `public.publish_site_settings(note)` e `public.rollback_site_settings(revision)`.

## Próximas fases

2. Textos e mídia (hero, seções, rodapé, imagens, logo).
3. Agenda, igreja e catálogos (horários, livros, estudos, vídeo em destaque).
4. Revisões por entidade e agendamento.
