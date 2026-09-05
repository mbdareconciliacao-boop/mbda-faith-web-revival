import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFeed, safeHttpsUrl, selectNews } from '../src/domain/news.ts';
import { NewsClient } from '../src/api/newsApi.ts';
import { validateContact, escapeTemplateText } from '../src/domain/contact.ts';
import { renderFeeds } from '../scripts/generate-feeds.mjs';
const now=Date.UTC(2026,8,3,15);
const row={title:'Fé e igreja na comunidade',summary:'Um texto de referência.',url:'https://guiame.com.br/noticias/exemplo',source:'Guiame',date:'2026-09-03T12:00:00Z',category:'Igreja',publication_date_verified:true};
const data={schema_version:2,last_updated:'2026-09-03T13:00:00Z',articles:[row]};
test('untrusted protocols, hosts and credentials are rejected',()=>{
  for(const url of ['javascript:alert(1)','http://guiame.com.br/a','https://127.0.0.1/a','https://localhost/a','https://guiame.com.br.attacker.com/a','https://x:secret@guiame.com.br/a','https://guiame.com.br:8080/a','https://guiame.com.br/a\n']) assert.equal(safeHttpsUrl(url,true),undefined,url);
});
test('normalize sanitizes and deduplicates, preserving verified dates',()=>{
  const feed=normalizeFeed({...data,articles:[{...row,title:'<b>Fé e igreja na comunidade</b>'},{...row,url:row.url+'?utm_source=x'}]},now);
  assert.equal(feed.articles.length,1);assert.equal(feed.rejected,1);assert.equal(feed.articles[0].title,row.title);assert.equal(feed.articles[0].dateVerified,true);
});
test('legacy dates are never promoted to verified publication dates',()=>{
  const feed=normalizeFeed({...data,schema_version:undefined,last_updated:'2026-06-18T12:00:00'},now);
  assert.equal(feed.articles[0].dateVerified,false);assert.equal(feed.stale,true);assert.equal(feed.updatedAt,'2026-06-18T12:00:00.000Z');
});

test('damaged legacy RSS markup is omitted without fabricating replacement prose',()=>{
  const feed=normalizeFeed({...data,articles:[{...row,summary:'a href"https:news.google.comrssarticlesEncoded" target"_blank" Título'}]},now);
  assert.equal(feed.articles.length,1);
  assert.equal(feed.articles[0].summary,'');
  assert.equal(feed.articles[0].title,row.title);
  assert.equal(normalizeFeed(data,now).articles[0].summary,row.summary);
});
test('future, undated and synthetic articles are excluded',()=>{
  const feed=normalizeFeed({...data,articles:[{...row,date:'2026-09-04T12:00:00Z'},{...row,date:null},{...row,title:'Reconciliação: O Ministério da Igreja no Mundo'}]},now);
  assert.equal(feed.articles.length,0);
});
test('article count and filter pagination stay bounded',()=>{
  const feed=normalizeFeed({...data,articles:Array.from({length:100},(_,i)=>({...row,title:row.title+' '+i,url:row.url+i}))},now);
  assert.equal(feed.articles.length,60);
  const result=selectNews(feed.articles,'fe comunidade','Igreja','Guiame',99);
  assert.equal(result.page,9);assert.equal(result.items.length,6);
  assert.equal(selectNews(feed.articles,'nãoexiste','','',99).page,0);
});
test('concurrent visitors in one page share the pending read and refresh cooldown',async()=>{
  let calls=0;let clock=now;
  const client=new NewsClient(async()=>{calls++;return new Response(JSON.stringify(data));},()=>clock);
  await Promise.all([client.loadFeed(),client.loadFeed(),client.loadFeed(true)]);
  assert.equal(calls,1);await client.loadFeed(true);assert.equal(calls,1);
  clock+=60_001;await client.loadFeed(true);assert.equal(calls,2);
});
test('network failure preserves last good edition and its stale state',async()=>{
  let fail=false;let clock=now;
  const client=new NewsClient(async()=>{if(fail)throw Error('offline');return new Response(JSON.stringify(data));},()=>clock);
  await client.loadFeed();fail=true;clock+=60_001;
  const fallback=await client.loadFeed(true);assert.equal(fallback.articles.length,1);assert.equal(fallback.unavailable,true);assert.equal(fallback.stale,true);
  assert.equal((await client.loadFeed()).stale,true);
});
test('oversized stream and malformed JSON safely return unavailable',async()=>{
  for(const payload of ['x'.repeat(1_000_001),'{bad']) {
    const client=new NewsClient(async()=>new Response(payload),()=>now);
    const feed=await client.loadFeed();assert.equal(feed.unavailable,true);assert.equal(feed.articles.length,0);
  }
});
test('native fetch is not invoked with the NewsClient as its receiver',async()=>{
  const client=new NewsClient(function(){ assert.equal(this,undefined); return Promise.resolve(new Response(JSON.stringify(data))); },()=>now);
  assert.equal((await client.loadFeed()).unavailable,false);
});
test('RSS escapes XML and omits unverified publication dates',()=>{
  const output=renderFeeds({...data,schema_version:undefined,articles:[{...row,summary:']]> & <xml>'}]},now);
  assert.ok(!output.rss.includes('<pubDate>'));assert.ok(!output.rss.includes(']]>'));assert.ok(output.rss.includes('&amp;'));
  assert.equal(JSON.parse(output.json).items[0].date_published,undefined);
});
test('contact requires valid bounded fields and escapes template HTML',()=>{
  assert.ok(validateContact({name:'A',email:'bad',message:'short',honeypot:''}));
  assert.equal(validateContact({name:'Pessoa Teste',email:'teste@example.com',message:'Mensagem de teste local.',honeypot:''}),null);
  assert.ok(validateContact({name:'Pessoa Teste',email:'teste@example.com',message:'x'.repeat(3001),honeypot:''}));
  assert.equal(escapeTemplateText('<script> & "'), '&lt;script&gt; &amp; &quot;');
});
