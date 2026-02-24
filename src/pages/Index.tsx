import { useState, useCallback, useEffect } from 'react';
import { Plus, Play, Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getStreams, addStream, updateStream, deleteStream, type Stream } from '@/lib/streamStore';
import { initializeAdMob, showBannerAd, showInterstitialAd, prepareInterstitial, hideBannerAd } from '@/lib/admob';
import StreamModal from '@/components/StreamModal';
import StreamItem from '@/components/StreamItem';
import VideoPlayer from '@/components/VideoPlayer';

const Index = () => {
  const [streams, setStreams] = useState<Stream[]>(getStreams);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStream, setEditStream] = useState<Stream | null>(null);
  const [playingStream, setPlayingStream] = useState<Stream | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  const refresh = useCallback(() => setStreams(getStreams()), []);

  // Initialize AdMob on mount
  useEffect(() => {
    const setupAds = async () => {
      await initializeAdMob();
      await showBannerAd();
      await prepareInterstitial();
    };
    setupAds();
  }, []);

  const handleSave = (name: string, url: string, userAgent: string, referrer: string) => {
    if (editStream) {
      updateStream(editStream.id, name, url, userAgent, referrer);
    } else {
      addStream(name, url, userAgent, referrer);
    }
    setEditStream(null);
    refresh();
  };

  const handleEdit = (stream: Stream) => {
    setEditStream(stream);
    setModalOpen(true);
  };

  const handleDelete = (stream: Stream) => {
    deleteStream(stream.id);
    refresh();
  };

  const handlePlay = async (stream: Stream) => {
    // Show interstitial ad first, then play
    setAdLoading(true);
    try {
      await hideBannerAd();
      await showInterstitialAd();
    } catch {
      // Ad failed, continue to play anyway
    }
    setAdLoading(false);
    setPlayingStream(stream);
  };

  const handleBackFromPlayer = async () => {
    setPlayingStream(null);
    // Re-show banner ad
    await showBannerAd();
    await prepareInterstitial();
  };

  if (playingStream) {
    return <VideoPlayer stream={playingStream} onBack={handleBackFromPlayer} />;
  }

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="flex items-center gap-3 py-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono text-foreground text-glow tracking-tight">
              IPLAY
            </h1>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Lite Media Player
            </p>
          </div>
        </div>
      </header>

      {/* Loading overlay for ad */}
      {adLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-mono">Loading...</p>
          </div>
        </div>
      )}

      {/* Stream list */}
      <main className="flex-1 px-5 pb-24">
        {streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Play className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-mono text-sm">No streams yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Tap + to add your first stream</p>
          </div>
        ) : (
          <div className="space-y-2">
            {streams.map(stream => (
              <StreamItem
                key={stream.id}
                stream={stream}
                onPlay={handlePlay}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB - positioned above banner ad */}
      <button
        onClick={() => { setEditStream(null); setModalOpen(true); }}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Web-only banner ad placeholder (native uses real AdMob) */}
      {!isNative && (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border flex items-center justify-center z-30">
          <span className="text-muted-foreground/40 text-xs font-mono">ADMOB BANNER</span>
        </div>
      )}

      <StreamModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditStream(null); }}
        onSave={handleSave}
        editStream={editStream}
      />
    </div>
  );
};

export default Index;
