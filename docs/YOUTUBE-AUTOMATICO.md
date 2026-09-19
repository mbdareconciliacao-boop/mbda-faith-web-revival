# Mensagens do canal

Preparação local: ainda exige revisão humana e publicação na branch main para ativar.

A rotina consulta @mbdareconciliacao diariamente às 10h de Brasília. O agendamento do GitHub não garante execução pontual. Também permite execução manual pelo Actions. Sem mudança no canal, não executa a bateria de build, não cria commit e permanece silenciosa.

Configure no repositório o secret `YOUTUBE_API_KEY`, com uma chave de projeto Google Cloud que tenha YouTube Data API v3 habilitada. Restrinja a chave a essa API. Configure também `DISCORD_WEBHOOK_URL` como secret do Actions. Nunca use prefixo VITE_, não coloque essas credenciais no frontend e não publique .env.local. Não precisa de senha PostgreSQL ou alteração no Supabase.

São três consultas por execução, até 50 uploads examinados e 20 vídeos públicos/processados/incorporáveis no catálogo. Lives em andamento e agendadas ficam de fora. O texto é um trecho de até 320 caracteres da descrição, sem URLs e sem IA; não é resumo interpretativo. O responsável pelo canal deve colocar a apresentação da mensagem no início da descrição.

O catálogo atualiza o destaque e /mensagens no próximo build. O link antigo do batismo é preservado. Falhas de consulta ou nenhum vídeo elegível preservam o arquivo anterior. Sem mudança nos dados, não há commit. Descrições corrigidas também são atualizadas. Depois de um push bem-sucedido, o Discord recebe os vídeos realmente novos; falhas da rotina também geram alerta. O webhook não é exibido em logs ou payloads.

Após revisão, publique o workflow e configure o secret. Execute manualmente uma vez e confira Actions, commit do catálogo e deployment da Vercel: um push do GITHUB_TOKEN não dispara outros workflows GitHub; por isso os testes e o build são feitos nesta rotina. Confirme que a integração Git da Vercel aceita o commit do bot e que o deployment ficou Ready. Não considere a integração ativada só porque o arquivo existe. Branch protection ou um push concorrente podem bloquear a publicação; a rotina falha sem forçar nem sobrescrever histórico.

As consultas não acontecem por visitante. Miniaturas vêm do YouTube e o player continua carregando apenas após clique. Não há gasto com IA; os limites das plataformas continuam aplicáveis. Monitore falhas no Actions. Workflows agendados em repositórios públicos podem ser desativados pelo GitHub após período de inatividade.

## Limite desta automação

O YouTube e o Google Drive são sistemas diferentes. `DISCORD_WEBHOOK_URL` permite enviar mensagens, mas não concede leitura dos arquivos privados do Drive. O monitor de recebimento dos brutos exige uma pasta específica compartilhada com uma conta de serviço do Google e os secrets `GOOGLE_DRIVE_FOLDER_ID` e `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`, ou uma automação Google Apps Script autorizada pela conta da igreja. Não tente usar a chave da API do YouTube para ler o Drive privado.
