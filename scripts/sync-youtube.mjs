import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const target = resolve('src/data/youtubeMessages.ts');
export function normalizeVideos(items, channelId, now = Date.now()) {
  return [...new Map(items.filter(v => /^[A-Za-z0-9_-]{11}$/.test(v.id)
    && v.snippet?.channelId === channelId && v.status?.privacyStatus === 'public'
    && v.status?.uploadStatus === 'processed' && v.status?.embeddable === true
    && v.snippet.liveBroadcastContent === 'none'
    && Number.isFinite(Date.parse(v.snippet.publishedAt)) && Date.parse(v.snippet.publishedAt) <= now
    && typeof v.snippet.title === 'string').map(v => {
      const description = String(v.snippet.description ?? '').replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ').trim();
      const excerpt = description.length > 320 ? description.slice(0, 317).replace(/\s+\S*$/, '') + '…' : description;
      return [v.id, {
        slug: 'video-' + Buffer.from(v.id).toString('hex'),
        title: v.snippet.title.slice(0, 150),
        description: excerpt || 'Assista à mensagem no canal da igreja. Descrição não informada no YouTube.',
        date: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(v.snippet.publishedAt)),
        dateTime: v.snippet.publishedAt,
        image: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, imageAlt: v.snippet.title.slice(0, 150),
        youtubeId: v.id, source: `https://www.youtube.com/watch?v=${v.id}`,
        topics: ['Canal da igreja'], relatedStudies: [],
      }];
    })).values()].sort((a, b) => b.dateTime.localeCompare(a.dateTime) || a.youtubeId.localeCompare(b.youtubeId)).slice(0, 20);
}

export async function requestYouTube(resource, params, key) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  url.search = new URLSearchParams({ ...params, key }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (!response.ok) { await response.body?.cancel(); throw new Error('API indisponível'); }
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 1024 * 1024) throw new Error('Resposta excedeu orçamento');
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!Array.isArray(data.items)) throw new Error('Resposta inválida');
    return data.items;
  } catch {
    // Não registrar URL, chave ou corpo da resposta da API.
    throw new Error(`Falha ao consultar YouTube (${resource}); conteúdo anterior preservado.`);
  }
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('Configure o secret YOUTUBE_API_KEY no GitHub.');
  const channels = await requestYouTube('channels', { part: 'contentDetails', forHandle: '@mbdareconciliacao' }, key);
  const channel = channels[0];
  const playlist = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!channel?.id || !playlist) throw new Error('Canal oficial não encontrado.');
  const uploads = await requestYouTube('playlistItems', { part: 'contentDetails', playlistId: playlist, maxResults: '50' }, key);
  const ids = uploads.map(item => item.contentDetails?.videoId).filter(id => /^[A-Za-z0-9_-]{11}$/.test(id));
  if (!ids.length) return;
  const videos = normalizeVideos(await requestYouTube('videos', { part: 'snippet,status', id: ids.join(',') }, key), channel.id);
  if (!videos.length) { console.log('Nenhum vídeo elegível; conteúdo preservado.'); return; }
  const source = '// Atualizado exclusivamente por scripts/sync-youtube.mjs.\n'
    + "import type { Message } from './contentCatalog.ts';\n"
    + `export const youtubeMessages: Message[] = ${JSON.stringify(videos, null, 2)};\n`;
  if (await readFile(target, 'utf8') === source) { console.log('Sem alterações no canal.'); return; }
  await writeFile(target + '.tmp', source, 'utf8');
  await rename(target + '.tmp', target);
  console.log(`Catálogo atualizado: ${videos.length} vídeos. Nenhuma IA utilizada.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
