import { useState } from "react";
import { Play } from "lucide-react";
import type { Message } from "../../data/contentCatalog";

export default function MessagePlayer({ message }: { message: Message }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div>
    <div className="message-player">
      {!playing ? <button className="message-poster" type="button" onClick={() => setPlaying(true)} aria-label={`Reproduzir ${message.title}`}>
        <img src={message.image} alt={message.imageAlt} width="720" height="405" />
        <span className="play-symbol"><Play aria-hidden="true" /></span>
        <span className="poster-action">Reproduzir vídeo</span>
      </button> : message.youtubeId ? <iframe src={`https://www.youtube-nocookie.com/embed/${message.youtubeId}?autoplay=1&rel=0`} title={message.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        : <video controls autoPlay preload="none" title={message.title} src={message.video} onError={() => setFailed(true)} />}
    </div>
    {failed && <p role="alert">O vídeo não carregou. <button type="button" className="inline-link" onClick={() => { setFailed(false); setPlaying(false); }}>Tentar novamente</button></p>}
    <p className="player-note">{message.youtubeId ? <>O YouTube só é carregado ao reproduzir. Se o player estiver indisponível, <a href={message.source} target="_blank" rel="noopener noreferrer">assista no canal</a>.</> : "O vídeo só é carregado ao reproduzir. Em conexão móvel, prefira Wi-Fi."}</p>
  </div>;
}
