import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.23d8d712510442e080710dcc68dd7795',
  appName: 'mediz',
  webDir: 'dist',
  server: {
    url: 'https://23d8d712-5104-42e0-8071-0dcc68dd7795.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    Camera: {
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;