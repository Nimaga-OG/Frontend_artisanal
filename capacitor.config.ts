import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Frontend-artisanat',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Durée d'affichage en ms
      autoHide: true,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;