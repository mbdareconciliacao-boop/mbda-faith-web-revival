// Explicit publication boundary: originals stay in the workspace, outside dist.
import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
// Do not publish the legacy blog/index.html: it shadows the SPA rewrite on Vercel.
export const PUBLIC_FILES = ['favicon.ico','robots.txt','googled68219518b89556b.html',
  'data/christian_news.json','reconnews-feed.json','reconnews-rss.xml'];
export async function copyPublicAssets(root, output) {
  for (const file of PUBLIC_FILES) {
    const destination=join(output,file);
    await mkdir(join(destination,'..'),{recursive:true});
    await cp(join(root,'public',file),destination);
  }
  await cp(join(root,'public/images/site'),join(output,'images/site'),{
    recursive:true,filter:source=>!source.endsWith('.json')
  });
}
