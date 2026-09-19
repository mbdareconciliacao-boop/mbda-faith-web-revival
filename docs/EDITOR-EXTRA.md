# Editor — extras (fundo e doutrina)

Extensões das Fases anteriores, sem migração (tudo em `site_entities` / `site-media`).

## Imagem de fundo

- Aba **Aparência** → envie a imagem (ou informe a URL) e publique a entidade `tema`.
- A imagem é aplicada como camada fixa atrás do conteúdo (`--site-background-image`).
- Remover é um clique.

## Pontos da declaração de fé

- Aba **Igreja** → a lista de pontos doutrinários agora é editável: título, conteúdo,
  adicionar, remover, subir e descer.
- O site (`/igreja`) mostra os pontos publicados da entidade `igreja`.
- Antes, os pontos vinham fixos de `src/data/doctrine.ts`; agora são o conteúdo padrão
  (fallback) e podem ser alterados pelo painel.

## Segurança

- Continua sem HTML/CSS/JS livre: campos de texto e upload de imagem por buckets com limite.
- Escrita restrita a `public.is_admin()`; leitura pública só do publicado.

## Verificação

- `node --test` 67/67, typecheck, lint (0 erros), build e `test:build` (36 páginas, 907 links).

## Ainda pendente

- Editor das **seções lição a lição** do estudo (campo `featured_studies.sections` já existe).
- **MFA (TOTP)** na conta administradora.
