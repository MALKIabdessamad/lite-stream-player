import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import type { Stream } from '@/lib/streamStore';

interface VideoPlayerProps {
  stream: Stream;
  onBack: () => void;
}

export default function VideoPlayer({ stream, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const url = stream.url;
    const isHls = url.includes('.m3u8') || url.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          if (stream.userAgent) {
            // Note: User-Agent can't be set via XHR in browsers, but works in native
            // We set custom headers that servers may accept
          }
          if (stream.referrer) {
            xhr.setRequestHeader('Referer', stream.referrer);
          }
        },
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = url;
      video.play().catch(() => {});
    } else {
      // MP4 / TS direct
      video.src = url;
      video.play().catch(() => {});
    }

    // Try landscape on mobile
    try {
      (screen.orientation as any)?.lock?.('landscape').catch(() => {});
    } catch {}

    return () => {
      hlsRef.current?.destroy();
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {}
    };
  }, [stream]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleBack = () => {
    hlsRef.current?.destroy();
    try {
      (screen.orientation as any)?.unlock?.();
    } catch {}
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onBack();
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-background/80 to-transparent">
        <button onClick={handleBack} className="p-2 rounded-full bg-secondary/60 text-foreground hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-foreground font-mono text-sm truncate mx-4">{stream.name}</span>
        <button onClick={toggleFullscreen} className="p-2 rounded-full bg-secondary/60 text-foreground hover:bg-secondary transition-colors">
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-background"
        controls
        playsInline
        autoPlay
      />
    </div>
  );
}
