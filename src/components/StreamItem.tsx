import { Pencil, Trash2, Play } from 'lucide-react';
import type { Stream } from '@/lib/streamStore';

interface StreamItemProps {
  stream: Stream;
  onPlay: (stream: Stream) => void;
  onEdit: (stream: Stream) => void;
  onDelete: (stream: Stream) => void;
}

export default function StreamItem({ stream, onPlay, onEdit, onDelete }: StreamItemProps) {
  return (
    <div className="group flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
      <button
        onClick={() => onPlay(stream)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 text-primary" />
        </div>
        <span className="text-foreground font-medium truncate">{stream.name}</span>
      </button>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(stream)}
          className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(stream)}
          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
