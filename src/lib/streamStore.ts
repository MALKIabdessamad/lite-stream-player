export interface Stream {
  id: string;
  name: string;
  url: string;
  userAgent: string;
  referrer: string;
}

const STORAGE_KEY = 'iplay_streams';
const DEFAULT_UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export function getStreams(): Stream[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStreams(streams: Stream[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(streams));
}

export function addStream(name: string, url: string, userAgent?: string, referrer?: string): Stream {
  const streams = getStreams();
  const stream: Stream = {
    id: crypto.randomUUID(),
    name,
    url,
    userAgent: userAgent || DEFAULT_UA,
    referrer: referrer || '',
  };
  streams.push(stream);
  saveStreams(streams);
  return stream;
}

export function updateStream(id: string, name: string, url: string, userAgent?: string, referrer?: string) {
  const streams = getStreams();
  const idx = streams.findIndex(s => s.id === id);
  if (idx !== -1) {
    streams[idx] = { ...streams[idx], name, url, userAgent: userAgent || DEFAULT_UA, referrer: referrer || '' };
    saveStreams(streams);
  }
}

export function deleteStream(id: string) {
  const streams = getStreams().filter(s => s.id !== id);
  saveStreams(streams);
}
