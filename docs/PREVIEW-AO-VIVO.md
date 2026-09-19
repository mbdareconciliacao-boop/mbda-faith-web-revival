# Prévia ao vivo no painel

O `/painel` agora mostra o **site real** num iframe e aplica suas edições **em tempo real**,
antes de publicar.

## Como funciona

- O painel carrega o site no iframe da página correspondente à aba:
  Aparência/Textos → home; Agenda → `/agenda`; Igreja → `/igreja`; Livros → `/livros`.
- A cada edição (cor, fonte, texto, livro…), o painel envia o rascunho ao iframe por
  `postMessage`; o `SiteSettingsProvider` valida com `normalizeSiteSettings` e aplica na hora.
- Botão **Mostrar/Ocultar** recolhe a prévia.

## Segurança

- O iframe só aceita mensagens da **mesma origem** e com o marcador `mbdar-panel`.
- O receptor só age quando a página está **dentro de um iframe** (`window.self !== window.top`),
  então o site normal ignora qualquer mensagem.
- O CSP passou de `frame-ancestors 'none'` para `'self'` e o `X-Frame-Options` de `DENY` para
  `SAMEORIGIN` — permitindo **apenas** que o próprio site se incorpore. Nada de terceiros.

## Verificação

- `node --test` (inclui `tests/preview.test.mjs`), typecheck, lint (0 erros), build e `test:build`.
