import { useState } from "react";
import { ArrowUpRight, Play, Radio } from "lucide-react";
import { CHURCH } from "../../data/church";
import { messages } from "../../data/contentCatalog";

const studies = [
  {id:"u2R0dCZTFfM",title:"Livre-arbítrio",author:"Augustus Nicodemus"},
  {id:"KdfnoeaPMv0",title:"Panorama do Apocalipse",author:"Pr. Hernandes Dias Lopes"},
  {id:"_xEjtLTdcuQ",title:"As Reformas Evangélicas",author:"Luiz Sayão"},
];
export default function StudySection() {
  const [active, setActive] = useState<string|null>(null);
  const [devotional, setDevotional] = useState(false);
  const featured = messages[0];
  return <section id="estudos-biblicos" className="section-space studies-section dark-section" aria-labelledby="studies-title">
    <div className="content-width">
      <div className="section-heading"><div><h2 id="studies-title">Mais perto<br />da Palavra.</h2><span className="gold-rule" aria-hidden="true" /></div><p>Estudos selecionados e reflexões para fortalecer sua caminhada com Deus durante a semana.</p></div>
      <div id="devocional" className="devotional-layout">
        <div className="devotional-player">{devotional ? <iframe src={`https://www.youtube-nocookie.com/embed/${featured.youtubeId}?autoplay=1&rel=0`} title={featured.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <button className="video-cover" onClick={() => setDevotional(true)} type="button"><span className="play-symbol"><Play aria-hidden="true" /></span><span>Assistir à mensagem</span></button>}</div>
        <div><h3>{featured.title}</h3><p>{featured.description}</p><p className="fine-print">O player do YouTube só é carregado ao tocar em assistir.</p><a href={CHURCH.youtube} target="_blank" rel="noopener noreferrer" className="inline-link">Mais mensagens no YouTube <ArrowUpRight aria-hidden="true" /></a><a href="https://www.ipb.org.br/projetos-radio-ipb.php" target="_blank" rel="noopener noreferrer" className="inline-link"><Radio aria-hidden="true" /> Rádio · Hinos Antigos</a></div>
      </div>
      <div className="study-list">{studies.map(study=><article key={study.id}>
        {active === study.id ? <iframe src={`https://www.youtube-nocookie.com/embed/${study.id}?autoplay=1&rel=0`} title={study.title+" — "+study.author} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <button className="study-cover" type="button" onClick={()=>setActive(study.id)} aria-label={"Assistir "+study.title+" — "+study.author}><img src={`https://i.ytimg.com/vi/${study.id}/hqdefault.jpg`} alt="" width="480" height="360" loading="lazy" referrerPolicy="no-referrer" /><span className="play-symbol"><Play aria-hidden="true" /></span></button>}
        <h3>{study.title}</h3><p>{study.author}</p>
      </article>)}</div>
      <p className="fine-print">Ao reproduzir um estudo, você se conecta ao player do YouTube. Os controles ficam disponíveis no próprio vídeo.</p>
    </div>
  </section>;
}
