# Revisão do painel e operação — 19/09/2026

## Escopo e decisão

Base: `25613e1`, posterior ao PR #58 (`e96631b`). Trabalho isolado na branch
`codex/painel-review`, sem misturar as alterações locais antigas de `mb-da-recon`.
Nenhuma migração, publicação, disparo de workflow ou alteração de segredo foi executada.

**Decisão: interface corrigida em revisão local; não declarar o painel inteiro pronto
para produção. As pendências de banco abaixo precisam de migração revisada.**

## Correções desta revisão

- Shell deixa de usar o formulário antigo de 860 px. Edição e prévia têm colunas
  próprias em telas largas; abaixo de 1200 px seguem no fluxo, sem sobreposição.
- Abas fora dos campos; superfícies claras de trabalho e cabeçalho institucional.
  Prévia pode ser ocultada; controles de tamanho indicam limites, não fingem
  simular um desktop de 768 px dentro de uma coluna menor.
- ID de vídeo pode ser digitado gradualmente; valor incompleto bloqueia salvar.
- Renovação de sessão não recarrega e apaga os campos em edição. Publicar uma
  entidade não recarrega os rascunhos das outras abas.
- Editor exige confirmação de `is_admin()` após MFA. Falha de carregamento
  bloqueia os campos para evitar salvar os valores padrão sobre dados existentes.
- Tema em edição fica no escopo local do editor e no iframe, não no documento
  público inteiro. Mensagens de prévia exigem origem e janela-pai correspondentes;
  resposta tardia do banco não substitui uma prévia já recebida.
- Recuperar histórico escreve somente rascunho e cancela o agendamento da entidade;
  exige revisão/publicação posterior. Falha ao registrar histórico não é ocultada.
- Links e imagens editoriais passam por validação de protocolo; uploads rejeitam
  MIME não permitido e tamanho acima de 5 MB antes da rede (o bucket continua
  responsável pela restrição no servidor).
- Keepalive passa a falhar se a RPC de agendamento responder erro HTTP.

## Banco: evidência somente leitura

Foi usada a conexão local `DATABASE_URL`, sem exibir valores, com
`default_transaction_read_only=on`, timeout e transação `READ ONLY`.
Consultas restritas a catálogos de políticas, funções, grants e constraints;
nenhuma chamada de publicação nem tentativa de escrita para testar RLS.

As cinco tabelas editoriais têm RLS habilitada. `site_entities` permite leitura
pública somente de `published`; `app_admins` não tem política pública de leitura.
Isso é positivo, mas não elimina os problemas abaixo, confirmados nos catálogos:

| Prioridade | Achado confirmado | Próxima correção |
| --- | --- | --- |
| Alta | `anon` tem SELECT em `site_settings.draft` e a política legada usa `true`. RLS por linha não esconde uma coluna. | Retirar acesso público à tabela legada ou expor apenas colunas publicadas, verificando consumidores antigos. |
| Alta | `is_admin()` aceita administrador sem fator verificado; exceções de permissão/tabela também liberam sem MFA. | Exigir `aal2` incondicionalmente para escrita; cadastro e recuperação de MFA devem ser procedimentos separados. |
| Alta | `publish_entity` registra `action='schedule'`, mas a constraint real aceita apenas `draft`, `publish`, `rollback`. | Migração da constraint e teste transacional do agendamento. Atualmente o agendamento falha e a transação é revertida. |
| Média | `anon` pode executar `publish_due_entities()`. | Restringir chamada a executor de servidor com privilégio mínimo. Não basta revogar: ajustar a autenticação do workflow junto. |
| Alta | Publicar estudo desativa o atual e depois faz upsert em outra requisição. | RPC transacional: erro não pode deixar o site sem estudo ativo. |
| Média | Publicação imediata não limpa o `publish_at` do rascunho; scheduler não bloqueia linhas concorrentes. | Limpar agendamento e usar bloqueio transacional para evitar republicação/histórico duplicado. |

Não afirmar que a leitura de rascunho contém dados pessoais: o conteúdo não foi
extraído nesta auditoria. O problema confirmado é a permissão de acesso.

Papéis de equipe e aprovação independente **não existem neste painel**:
`app_admins` é uma lista de administradores e a publicação é direta. Os testes do
domínio editorial antigo não demonstram que esse fluxo esteja conectado ao `/painel`.

## Automações e notícias

`gh run list` mostrou execuções com evento **schedule**, concluídas com sucesso em
19/09/2026, de YouTube, notícias, keepalive e healthcheck. Não foram disparadas
execuções manuais. Sucesso de job não comprova cada efeito externo: o keepalive
anterior ignorava HTTP de erro na publicação, corrigido nesta revisão.

- Notícias: 2 consultas/dia, até 60 itens, JSON estático e RSS; escrita Supabase
  desativada no workflow. A rotina atual de notícias não depende desse banco.
- YouTube: consulta diária, catálogo só é commitado quando muda; mídia continua
  no YouTube. Esta revisão não alterou o coletor.
- Healthcheck: intenção de 48 execuções/dia; keepalive: 24/dia. Juntos são cerca
  de 2160 jobs em 30 dias antes das outras rotinas. Execuções observadas tiveram
  atrasos; cron do GitHub não deve ser tratado como relógio exato para publicações.
- Backup semanal: é código e histórico Git, **não backup do Supabase**. A migração
  continua exigindo `pg_dump` e teste de restauração. O workflow legado também
  precisa revisão de permissões, retenção e da criação de arquivo dentro da pasta
  que está sendo arquivada; isso não foi executado nesta rodada.
- Workflows de notícias e YouTube fazem push em `main` com grupos de concorrência
  diferentes. Em corrida um push pode ser rejeitado: falha visível, mas sem retry.
- Alertas de indisponibilidade podem repetir a cada execução; não há estado de
  incidente/recuperação. Manter as frequências atuais até decidir o nível de alerta.

## Validação e limites

Playwright usa servidor local com domínio Supabase fictício e intercepta suas
requisições. Cobre tamanhos 390/1024/1440, prévia, ID de vídeo, negação de acesso,
MFA pendente, falha de leitura, preservação entre abas e recuperação de histórico.
Esses testes não comprovam autenticação real, entrega de email, TOTP real ou RLS.
A consulta de catálogos acima é evidência separada do banco real.

Antes de merge: `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run test:build` e testes Python. Os testes existentes de
contrato SQL inspecionam texto; não substituem ensaio transacional.

Migração e rollback foram preparados, mas não executados. Próxima etapa: backup,
ensaio isolado com asserções e idempotência, apresentar resultado e aguardar
aprovação humana para produção. O workflow corrigido exige o novo secret
`SUPABASE_SERVICE_ROLE_KEY`; ele deve existir antes de ativar a migração.
Não usar rollback de MFA como rotina comum de recuperação de conta.

O parser PostgreSQL aceitou a sintaxe da migração e do rollback. Foi tentado um
ensaio em PostgreSQL temporário local, porém o ambiente bloqueou a abertura da
porta TCP; a instância temporária foi removida. Portanto, parser e contratos
passaram, mas o ensaio transacional real permanece obrigatório antes da aplicação.

Em 20/09/2026, a home, `/painel`, `/noticias` e o JSON público responderam HTTP
200 com CSP. O feed público tinha schema 2, uma matéria e atualização informada
em 19/09/2026 10:52:16. As execuções agendadas mais recentes de notícias,
YouTube, keepalive e healthcheck estavam verdes no commit `25613e1`. Isso comprova
disponibilidade observada, não comprova o efeito interno que o keepalive antigo
silenciava. Esta branch ainda não estava implantada durante essa verificação.
