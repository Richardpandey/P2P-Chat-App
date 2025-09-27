import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.02fa0d0701744e2f8b5a09618c658134',
  appName: 'ChatFlow',
  webDir: 'dist',
  server: {
    url: 'https://02fa0d07-0174-4e2f-8b5a-09618c658134.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#ef4444'
    }
  }
};

export default config;