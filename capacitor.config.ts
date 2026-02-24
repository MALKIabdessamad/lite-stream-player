import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iplay.app',
  appName: 'IPLAY',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    ScreenOrientation: {},
  },
};

export default config;
