# Revisões por entidade e agendamento (Fase 4)

O rascunho/publicação deixou de ser único do site. Agora cada **entidade** tem o próprio
rascunho, publicado, histórico e agendamento.

## Entidades

- `tema` → aba Aparência.
- `textos` → aba Textos (marca, home, contato, rodapé, vídeo em destaque).
- `agenda` → aba Agenda.
- `igreja` → aba Igreja.
- `livros` → aba Livros.

O **Estudo da vez** continua na própria tabela (`featured_studies`) e publica direto.

## Como usar

- Em cada aba, edite e clique em **Salvar rascunho**. Nada muda no site ainda.
- **Publicar agora** aplica a entidade publicada; **Agendar publicação** guarda para a
  data/hora escolhida.
- A aba **Histórico** lista as revisões (com a entidade) e permite **Restaurar** um estado
  anterior.

## Banco

- `public.site_entities`: uma linha por `(entidade, estado)` com `content`, `publish_at` e
  `published_at`. RLS expõe **apenas** `state = 'published'`; escrita restrita a `is_admin()`.
- `public.publish_entity(entity, note, publish_at)`: publica agora ou agenda.
- `public.publish_due_entities()`: publica o que venceu; chamada de hora em hora pelo workflow.
- `public.content_revisions` guarda o histórico por entidade.

## Agendador

O workflow `supabase-keepalive.yml` ficou **horário**: consulta o banco (mantém o Supabase
ativo) e chama `publish_due_entities`. É o mesmo mecanismo que evita a pausa do projeto.

## Segurança

- Leitura pública só do estado publicado; rascunhos e histórico invisíveis ao público.
- Escrita e publicação restritas a `public.is_admin()` (funções `SECURITY DEFINER`).
- Sem novo bucket; reutiliza `estudos-artes` e `site-media`.

## Verificação

- `node --test` 66/66, typecheck, lint (0 erros), build e `test:build` (36 páginas, 907 links).
- Migração aplicada com backup + ensaio + apply, com rollback e asserções.
