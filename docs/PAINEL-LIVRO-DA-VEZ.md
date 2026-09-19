# Painel — estudo/livro da vez

O site destaca, na home, em `/estudos`, em `/blog` e em `/livros`, o estudo que a igreja está
usando no momento. A página interna `/painel` permite trocar arte, título, subtítulo,
descrição geral, livro recomendado e links de apoio sem mexer em código.

## Acesso

- Autenticação por e-mail e senha do Supabase Auth. O cadastro público está desabilitado:
  só entra quem for criado no painel do Supabase.
- Usuário previsto: `mbdareconciliacao@gmail.com`. Crie-o em
  **Supabase → Authentication → Users → Add user** (defina a senha e marque o e-mail como
  confirmado).
- `/painel` não aparece no menu e responde `noindex, nofollow`.

## Como usar

1. Acesse `/painel` e entre com a conta da igreja.
2. Preencha título, subtítulo e a descrição geral.
3. Envie a arte em duas versões (480 e 900 px de largura). O envio é imediato.
4. Ajuste o livro recomendado e os links de apoio (um por linha, no formato `Rótulo | https://…`).
5. Clique em **Publicar destaque**. Apenas um destaque fica ativo; o anterior é desativado.

## Modelo de dados

- Tabela `public.featured_studies` (uma linha ativa por vez, garantida por índice parcial).
- Bucket `estudos-artes` para as artes. Leitura pública; escrita apenas autenticada.
- Leitura pública restrita ao destaque ativo; escrita apenas para `authenticated`.
- Campo `sections` já existe para a próxima fase (roteiro lição a lição).

## Aplicar a migração

A migração é `supabase/migrations/20260919000000_featured_studies.sql`, com rollback em
`supabase/rollback/` e asserções em `supabase/tests/`. Use o processo já adotado
(`scripts/supabase_admin.py` ou `psql`), com backup e ensaio de restauração antes do apply.

## Limite desta versão

- O roteiro lição a lição de `/blog` continua sendo o conteúdo atual de Tessalonicenses.
- O destaque muda arte, títulos, descrição geral, livro e links. As seções em preparação
  entram na próxima fase do painel.
- O HTML pré-renderizado usa o fallback estático; a troca aparece quando o visitante carrega
  a página (a hidratação lê o Supabase). Para refletir no HTML/SEO estático, é preciso um
  novo deploy (um build novo já usa os dados atuais).
