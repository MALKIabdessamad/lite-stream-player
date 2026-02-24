import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Stream } from '@/lib/streamStore';

interface StreamModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, url: string, userAgent: string, referrer: string) => void;
  editStream?: Stream | null;
}

export default function StreamModal({ open, onClose, onSave, editStream }: StreamModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [referrer, setReferrer] = useState('');

  useEffect(() => {
    if (editStream) {
      setName(editStream.name);
      setUrl(editStream.url);
      setUserAgent(editStream.userAgent);
      setReferrer(editStream.referrer);
    } else {
      setName('');
      setUrl('');
      setUserAgent('');
      setReferrer('');
    }
  }, [editStream, open]);

  const handleSave = () => {
    if (!name.trim() || !url.trim()) return;
    onSave(name.trim(), url.trim(), userAgent.trim(), referrer.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-foreground">
            {editStream ? 'Edit Stream' : 'Add Stream'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Stream"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">URL *</Label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/stream.m3u8"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">User Agent</Label>
            <Input
              value={userAgent}
              onChange={e => setUserAgent(e.target.value)}
              placeholder="Default browser UA"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Referrer</Label>
            <Input
              value={referrer}
              onChange={e => setReferrer(e.target.value)}
              placeholder="https://example.com"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
              Save
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 border-border text-foreground hover:bg-secondary font-mono">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
