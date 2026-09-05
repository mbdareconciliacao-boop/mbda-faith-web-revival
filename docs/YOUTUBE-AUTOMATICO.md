# Mensagens do canal

Preparação local: ainda exige revisão humana e publicação na branch main para ativar.

A rotina consulta @mbdareconciliacao às terças-feiras, 10h de Brasília. O agendamento do GitHub não garante execução pontual. Também permite execução manual pelo Actions.

Configure no repositório o secret `YOUTUBE_API_KEY`, com uma chave de projeto Google Cloud que tenha YouTube Data API v3 habilitada. Restrinja a chave a essa API. Nunca use prefixo VITE_, não coloque a chave no frontend e não publique .env.local. Não precisa de senha PostgreSQL ou alteração no Supabase.

São três consultas por execução, até 50 uploads examinados e 20 vídeos públicos/processados/incorporáveis no catálogo. Lives em andamento e agendadas ficam de fora. O texto é um trecho de até 320 caracteres da descrição, sem URLs e sem IA; não é resumo interpretativo. O responsável pelo canal deve colocar a apresentação da mensagem no início da descrição.

O catálogo atualiza o destaque e /mensagens no próximo build. O link antigo do batismo é preservado. Falhas de consulta ou nenhum vídeo elegível preservam o arquivo anterior. Sem mudança nos dados, não há commit. Descrições corrigidas também são atualizadas.

Após revisão, publique o workflow e configure o secret. Execute manualmente uma vez e confira Actions, commit do catálogo e deployment da Vercel: um push do GITHUB_TOKEN não dispara outros workflows GitHub; por isso os testes e o build são feitos nesta rotina. Confirme que a integração Git da Vercel aceita o commit do bot e que o deployment ficou Ready. Não considere a integração ativada só porque o arquivo existe. Branch protection ou um push concorrente podem bloquear a publicação; a rotina falha sem forçar nem sobrescrever histórico.

As consultas não acontecem por visitante. Miniaturas vêm do YouTube e o player continua carregando apenas após clique. Não há gasto com IA; os limites das plataformas continuam aplicáveis. Monitore falhas no Actions. Workflows agendados em repositórios públicos podem ser desativados pelo GitHub após período de inatividade.
