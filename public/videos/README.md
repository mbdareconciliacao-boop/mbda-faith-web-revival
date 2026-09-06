# Política de vídeos

O site publica somente players incorporados do canal oficial no YouTube. Não
adicione MP4, WebM ou OGG ao catálogo nem à lista de arquivos públicos.

A rotina `scripts/sync-youtube.mjs` valida o canal, atualiza os metadados e
mantém os arquivos de vídeo fora do deployment da Vercel.

Arquivos legados ainda preservados nesta pasta são material-fonte e estão
explicitamente excluídos do deployment. Eles não devem voltar a ser ligados às
páginas públicas.
