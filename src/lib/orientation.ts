import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export async function lockLandscape(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } catch (e) {
      console.warn('[IPLAY] Failed to lock landscape:', e);
    }
  } else {
    // Web fallback
    try {
      await (screen.orientation as any)?.lock?.('landscape');
    } catch {}
  }
}

export async function lockPortrait(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch (e) {
      console.warn('[IPLAY] Failed to lock portrait:', e);
    }
  } else {
    try {
      (screen.orientation as any)?.unlock?.();
    } catch {}
  }
}
