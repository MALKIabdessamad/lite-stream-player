import { useState, useCallback } from 'react';
import { Plus, Play, Zap } from 'lucide-react';
import { getStreams, addStream, updateStream, deleteStream, type Stream } from '@/lib/streamStore';
import StreamModal from '@/components/StreamModal';
import StreamItem from '@/components/StreamItem';
import VideoPlayer from '@/components/VideoPlayer';

const Index = () => {
  const [streams, setStreams] = useState<Stream[]>(getStreams);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStream, setEditStream] = useState<Stream | null>(null);
  const [playingStream, setPlayingStream] = useState<Stream | null>(null);

  const refresh = useCallback(() => setStreams(getStreams()), []);

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

  const handlePlay = (stream: Stream) => {
    // In production, interstitial ad would show here before playing
    setPlayingStream(stream);
  };

  if (playingStream) {
    return <VideoPlayer stream={playingStream} onBack={() => setPlayingStream(null)} />;
  }

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

      {/* FAB */}
      <button
        onClick={() => { setEditStream(null); setModalOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Banner ad placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border flex items-center justify-center z-30">
        <span className="text-muted-foreground/40 text-xs font-mono">AD SPACE</span>
      </div>

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
