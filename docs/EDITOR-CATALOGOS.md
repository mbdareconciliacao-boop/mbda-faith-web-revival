# Editor de catálogos (Fase 3)

Novas abas no `/painel`: **Agenda**, **Igreja** e **Livros**, além do **vídeo em destaque**.
Tudo usa o mesmo rascunho/publicação/histórico/rollback.

## Agenda

- Cultos semanais (dia, abreviação, hora, título, formato) com adicionar/remover/reordenar por edição.
- Encontros mensais (cadência, abreviação, título).
- Cabeçalho da agenda, descrição, citação e referência do cartaz.
- Reflete em `WeeklyPreview` (home) e na página `/agenda` (`FullSchedule`).

## Igreja

- "Quem somos": título e parágrafos (adicionar/remover), nota de história.
- "Declaração de fé": título e introdução. A lista de pontos doutrinários (`doctrine.ts`)
  continua fixa nesta versão.
- "Espaço Família": título e parágrafos.

## Livros

- Lista editável: título, autor/editora, descrição, imagem (URL ou **upload** para `site-media`),
  link e texto do botão, observação de compra, subir/descer/remover e adicionar.
- Reflete em `/livros`.

## Vídeo em destaque (opcional)

- Campo **YouTube ID**. Se preenchido, a home usa esse vídeo no lugar da mensagem mais recente
  (o link abre no YouTube). Serve para fixar uma mensagem mesmo quando a automação atrasa.

## Segurança e dados

- Todos os campos são estruturados (sem HTML/CSS/JS livre).
- Escrita restrita a `public.is_admin()`; leitura pública só do publicado.
- Sem nova migração: reutiliza `site_settings` e o bucket `site-media`.

## Verificação

- `node --test` 61/61, typecheck, lint (0 erros), build e `test:build` (36 páginas, 907 links).

## Próxima fase

4. Revisões por entidade e **agendamento** de publicação.
