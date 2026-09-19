import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { sendDiscordWebhook } from './discord-webhook.mjs';

const resultPath = resolve(process.env.YOUTUBE_SYNC_RESULT ?? '.youtube-sync-result.json');

export function successMessage(result) {
  const videos = Array.isArray(result?.newVideos) ? result.newVideos.slice(0, 5) : [];
  const lines = videos.map(video => `• **${String(video.title).slice(0, 150)}**\n${video.source}`);
  return {
    title: videos.length === 1 ? 'Novo vídeo publicado no site' : `${videos.length} novos vídeos publicados no site`,
    description: `${lines.join('\n\n')}\n\nO player continua hospedado no YouTube; nenhum vídeo foi enviado à Vercel.`,
    url: videos[0]?.source,
    color: 0x18A558,
  };
}

export function failureMessage(runUrl) {
  return {
    title: 'Falha na atualização dos vídeos da igreja',
    description: 'O catálogo anterior foi preservado. Abra a execução do GitHub Actions para conferir o motivo.',
    url: runUrl,
    color: 0xD83A3A,
  };
}

async function main() {
  const mode = process.argv[2];
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (mode === 'success') {
    const result = JSON.parse(await readFile(resultPath, 'utf8'));
    if (!result.newVideos?.length) return;
    await sendDiscordWebhook({ webhookUrl, ...successMessage(result) });
    console.log('Discord notificado sobre os novos vídeos.');
    return;
  }
  if (mode === 'failure') {
    await sendDiscordWebhook({ webhookUrl, ...failureMessage(process.env.GITHUB_RUN_URL) });
    console.log('Discord notificado sobre a falha do sincronizador.');
    return;
  }
  throw new Error('Modo esperado: success ou failure.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

