import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import type { Stream } from '@/lib/streamStore';
import { lockLandscape, lockPortrait } from '@/lib/orientation';

interface VideoPlayerProps {
  stream: Stream;
  onBack: () => void;
}

export default function VideoPlayer({ stream, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force landscape
    lockLandscape();

    const url = stream.url;
    const isHls = /\.m3u8/i.test(url);

    const headers: Record<string, string> = {};
    if (stream.userAgent) headers['User-Agent'] = stream.userAgent;
    if (stream.referrer) headers['Referer'] = stream.referrer;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, _url) => {
          // Set all custom headers
          Object.entries(headers).forEach(([key, value]) => {
            try { xhr.setRequestHeader(key, value); } catch {}
          });
        },
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('[IPLAY] HLS fatal error:', data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      // MP4 / TS direct
      video.src = url;
      video.play().catch(() => {});
    }

    resetControlsTimer();

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      lockPortrait();
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
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
    hlsRef.current = null;
    lockPortrait();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onBack();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-background z-50 flex flex-col"
      onClick={resetControlsTimer}
    >
      {/* Top bar - auto-hide */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-background/80 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
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
