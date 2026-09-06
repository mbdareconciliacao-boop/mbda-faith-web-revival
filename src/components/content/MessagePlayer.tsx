import { useState } from "react";
import { Play } from "lucide-react";
import type { Message } from "../../data/contentCatalog";

export default function MessagePlayer({ message }: { message: Message }) {
  const [playing, setPlaying] = useState(false);
  return <div>
    <div className="message-player">
      {!playing ? <button className="message-poster" type="button" onClick={() => setPlaying(true)} aria-label={`Reproduzir ${message.title}`}>
        <img src={message.image} alt={message.imageAlt} width="720" height="405" />
        <span className="play-symbol"><Play aria-hidden="true" /></span>
        <span className="poster-action">Reproduzir vídeo</span>
      </button> : <iframe src={`https://www.youtube-nocookie.com/embed/${message.youtubeId}?autoplay=1&rel=0`} title={message.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
    </div>
    <p className="player-note">O YouTube só é carregado ao reproduzir. Se o player estiver indisponível, <a href={message.source} target="_blank" rel="noopener noreferrer">assista no canal</a>.</p>
  </div>;
}
