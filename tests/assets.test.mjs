import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyPublicAssets, PUBLIC_FILES } from '../scripts/public-assets.mjs';
test('publication copies only approved derivatives, never archives or source videos',async()=>{
  const root=await mkdtemp(join(tmpdir(),'recon-assets-test-'));
  try {
    for(const file of [...PUBLIC_FILES,'blog/index.html','images/site/example.webp','images/site/example.webp.json','videos/aobrigatoriedade-de-evangelizar.mp4','images/reunião-de-casais/album.zip']) {
      const destination=join(root,'public',file);await mkdir(join(destination,'..'),{recursive:true});await writeFile(destination,'fixture');
    }
    await copyPublicAssets(root,join(root,'output'));
    assert.equal(await readFile(join(root,'output/images/site/example.webp'),'utf8'),'fixture');
    for(const file of ['blog/index.html','images/site/example.webp.json','videos/aobrigatoriedade-de-evangelizar.mp4','images/reunião-de-casais/album.zip']) await assert.rejects(access(join(root,'output',file)));
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('event gallery uses the approved event path, couples and solo pastor curation',async()=>{
  const galleryData=await readFile(new URL('../src/data/church.ts',import.meta.url),'utf8');
  assert.doesNotMatch(galleryData,/id:\s*["']088["']/);
  assert.match(galleryData,/id:\s*["']045["'],\s*kind:\s*["']pastor["']/);
  assert.match(galleryData,/\/images\/site\/eventos\/evento-/);
  assert.doesNotMatch(galleryData,/\/images\/site\/casais\//);
  for(const id of ['005','020','027','034','052']) assert.match(galleryData,new RegExp(`id:\\s*["']${id}["'],\\s*kind:\\s*["']couple["']`));
});

test('baptism gallery starts with the featured celebration and uses responsive local derivatives',async()=>{
  const [galleryData,galleryView]=await Promise.all([
    readFile(new URL('../src/data/church.ts',import.meta.url),'utf8'),
    readFile(new URL('../src/components/site/EventGallery.tsx',import.meta.url),'utf8'),
  ]);
  const photos=galleryData.slice(galleryData.indexOf('export const EVENT_PHOTOS'),galleryData.indexOf('export const eventPhoto'));
  assert.match(photos,/EVENT_PHOTOS\s*=\s*\[\s*\{ id: "batismo-01"/);
  assert.equal((photos.match(/kind: "baptism"/g)??[]).length,6);
  assert.match(galleryData,/26 de agosto de 2026/);
  assert.match(galleryData,/youtube\.com\/watch\?v=lyla5Gl2oBI/);
  assert.match(galleryView,/srcSet=/);
  for(let index=1;index<=6;index++) {
    const id=String(index).padStart(2,'0');
    await Promise.all([
      access(new URL(`../public/images/site/eventos/batismo-${id}-480.webp`,import.meta.url)),
      access(new URL(`../public/images/site/eventos/batismo-${id}-720.webp`,import.meta.url)),
    ]);
  }
});

test('weekly schedule exposes only the confirmed Sunday and Wednesday services',async()=>{
  const scheduleData=await readFile(new URL('../src/data/church.ts',import.meta.url),'utf8');
  const activeSchedule=scheduleData.slice(scheduleData.indexOf('export const WEEKLY_SCHEDULE'),scheduleData.indexOf('export type EventPhoto'));
  assert.equal((activeSchedule.match(/day: "Domingo"/g)??[]).length,3);
  assert.equal((activeSchedule.match(/day: "Quarta-feira"/g)??[]).length,1);
  assert.doesNotMatch(activeSchedule,/Sexta-feira|Sábado/);
  const scheduleView=await readFile(new URL('../src/components/site/ChurchSections.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(scheduleView,/agenda-semanal\.webp/);
});

test('monthly gatherings and the official YouTube channel are exposed from shared data',async()=>{
  const [churchData,scheduleView,studyView]=await Promise.all([
    readFile(new URL('../src/data/church.ts',import.meta.url),'utf8'),
    readFile(new URL('../src/components/site/ChurchSections.tsx',import.meta.url),'utf8'),
    readFile(new URL('../src/components/site/StudySection.tsx',import.meta.url),'utf8'),
  ]);
  assert.match(churchData,/1º domingo de cada mês/);
  assert.match(churchData,/Ceia do Senhor/);
  assert.match(churchData,/Último domingo de cada mês/);
  assert.match(churchData,/Culto da Família/);
  assert.match(scheduleView,/content\.agenda\.monthly/);
  const settingsSource=await readFile(new URL('../src/data/siteSettings.ts',import.meta.url),'utf8');
  assert.match(settingsSource,/MONTHLY_GATHERINGS/);
  assert.match(churchData,/https:\/\/www\.youtube\.com\/@mbdareconciliacao/);
  assert.match(studyView,/CHURCH\.youtube/);
  assert.doesNotMatch(churchData,/@ministeriobiblicodareconcilia/);
});
